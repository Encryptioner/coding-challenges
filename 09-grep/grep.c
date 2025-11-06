/*
 * grep - Pattern matching tool
 *
 * A simplified implementation of the Unix grep utility that searches
 * files for lines matching a pattern (regular expression).
 *
 * Features:
 * - Regular expression pattern matching (POSIX ERE)
 * - Multiple files and stdin support
 * - Case-insensitive search (-i)
 * - Inverted match (-v)
 * - Line numbers (-n)
 * - Count only (-c)
 * - Files with matches (-l)
 * - Recursive search (-r)
 * - Context lines (-A, -B, -C)
 * - Fixed string search (-F)
 * - Extended regex (-E)
 */

#define _POSIX_C_SOURCE 200809L

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <regex.h>
#include <unistd.h>
#include <dirent.h>
#include <sys/stat.h>
#include <errno.h>
#include <ctype.h>

#define MAX_LINE_LENGTH 4096
#define MAX_PATH_LENGTH 1024

/* Options structure */
typedef struct {
    bool case_insensitive;     // -i
    bool invert_match;         // -v
    bool line_numbers;         // -n
    bool count_only;           // -c
    bool files_with_matches;   // -l
    bool files_without_match;  // -L
    bool show_filename;        // -H (default with multiple files)
    bool no_filename;          // -h
    bool recursive;            // -r
    bool fixed_string;         // -F
    bool extended_regex;       // -E
    bool quiet;                // -q
    int after_context;         // -A num
    int before_context;        // -B num
    int context;               // -C num
} GrepOptions;

/* Match context for tracking context lines */
typedef struct {
    char **lines;
    int capacity;
    int count;
    int current;
} LineBuffer;

/* Global options */
GrepOptions opts = {0};

/* Statistics */
typedef struct {
    int matches;
    int lines_printed;
} FileStats;

/* ===== LINE BUFFER (for context lines) ===== */

LineBuffer *linebuf_create(int capacity) {
    LineBuffer *buf = malloc(sizeof(LineBuffer));
    buf->lines = malloc(capacity * sizeof(char*));
    buf->capacity = capacity;
    buf->count = 0;
    buf->current = 0;
    for (int i = 0; i < capacity; i++) {
        buf->lines[i] = NULL;
    }
    return buf;
}

void linebuf_add(LineBuffer *buf, const char *line) {
    if (buf->lines[buf->current]) {
        free(buf->lines[buf->current]);
    }
    buf->lines[buf->current] = strdup(line);
    buf->current = (buf->current + 1) % buf->capacity;
    if (buf->count < buf->capacity) {
        buf->count++;
    }
}

void linebuf_free(LineBuffer *buf) {
    for (int i = 0; i < buf->capacity; i++) {
        free(buf->lines[i]);
    }
    free(buf->lines);
    free(buf);
}

/* ===== PATTERN MATCHING ===== */

/* Fixed string search (no regex) */
bool fixed_string_match(const char *line, const char *pattern, bool case_insensitive) {
    if (case_insensitive) {
        const char *p = line;
        while (*p) {
            const char *l = p;
            const char *pat = pattern;
            while (*l && *pat && tolower(*l) == tolower(*pat)) {
                l++;
                pat++;
            }
            if (*pat == '\0') {
                return true;
            }
            p++;
        }
        return false;
    } else {
        return strstr(line, pattern) != NULL;
    }
}

/* Regex search */
bool regex_match(const char *line, regex_t *regex) {
    return regexec(regex, line, 0, NULL, 0) == 0;
}

/* ===== FILE PROCESSING ===== */

FileStats grep_file(FILE *file, const char *filename, const char *pattern, regex_t *regex, bool show_name) {
    FileStats stats = {0, 0};
    char line[MAX_LINE_LENGTH];
    int line_num = 0;
    bool last_match = false;
    int lines_since_match = 0;

    LineBuffer *before_buf = NULL;
    if (opts.before_context > 0 || opts.context > 0) {
        int before = opts.before_context > 0 ? opts.before_context : opts.context;
        before_buf = linebuf_create(before);
    }

    char **after_lines = NULL;
    int after_count = 0;
    if (opts.after_context > 0 || opts.context > 0) {
        int after = opts.after_context > 0 ? opts.after_context : opts.context;
        after_lines = malloc(after * sizeof(char*));
        for (int i = 0; i < after; i++) {
            after_lines[i] = NULL;
        }
    }

    while (fgets(line, sizeof(line), file)) {
        line_num++;

        /* Remove trailing newline */
        size_t len = strlen(line);
        if (len > 0 && line[len - 1] == '\n') {
            line[len - 1] = '\0';
        }

        /* Check if line matches */
        bool matches;
        if (opts.fixed_string) {
            matches = fixed_string_match(line, pattern, opts.case_insensitive);
        } else {
            matches = regex_match(line, regex);
        }

        /* Apply invert if specified */
        if (opts.invert_match) {
            matches = !matches;
        }

        if (matches) {
            stats.matches++;

            /* If count-only or files-with-matches, just count */
            if (opts.count_only || opts.files_with_matches || opts.files_without_match) {
                /* Don't print, just count */
            } else if (opts.quiet) {
                /* Quiet mode, don't print anything */
                break;  /* Can exit early */
            } else {
                /* Print before context if available */
                if (before_buf && !last_match && lines_since_match > 0) {
                    /* Print separator if needed */
                    if (stats.lines_printed > 0) {
                        printf("--\n");
                    }

                    /* Print buffered before lines */
                    int start = (before_buf->current - before_buf->count + before_buf->capacity) % before_buf->capacity;
                    for (int i = 0; i < before_buf->count; i++) {
                        int idx = (start + i) % before_buf->capacity;
                        if (before_buf->lines[idx]) {
                            if (show_name && !opts.no_filename) {
                                printf("%s-", filename);
                            }
                            if (opts.line_numbers) {
                                printf("%d-", line_num - before_buf->count + i);
                            }
                            printf("%s\n", before_buf->lines[idx]);
                            stats.lines_printed++;
                        }
                    }
                }

                /* Print matching line */
                if (show_name && !opts.no_filename) {
                    printf("%s:", filename);
                }
                if (opts.line_numbers) {
                    printf("%d:", line_num);
                }
                printf("%s\n", line);
                stats.lines_printed++;

                last_match = true;
                lines_since_match = 0;
                after_count = opts.after_context > 0 ? opts.after_context : opts.context;
            }
        } else {
            /* Line doesn't match */
            if (before_buf) {
                linebuf_add(before_buf, line);
            }

            /* Print as after-context if within range */
            if (after_count > 0 && !opts.count_only && !opts.files_with_matches && !opts.quiet) {
                if (show_name && !opts.no_filename) {
                    printf("%s-", filename);
                }
                if (opts.line_numbers) {
                    printf("%d-", line_num);
                }
                printf("%s\n", line);
                stats.lines_printed++;
                after_count--;
            } else {
                last_match = false;
            }

            lines_since_match++;
        }
    }

    /* Print statistics if requested */
    if (opts.count_only) {
        if (show_name && !opts.no_filename) {
            printf("%s:", filename);
        }
        printf("%d\n", stats.matches);
    } else if (opts.files_with_matches && stats.matches > 0) {
        printf("%s\n", filename);
    } else if (opts.files_without_match && stats.matches == 0) {
        printf("%s\n", filename);
    }

    /* Cleanup */
    if (before_buf) {
        linebuf_free(before_buf);
    }
    if (after_lines) {
        for (int i = 0; i < (opts.after_context > 0 ? opts.after_context : opts.context); i++) {
            free(after_lines[i]);
        }
        free(after_lines);
    }

    return stats;
}

/* Process a single file */
int process_file(const char *filename, const char *pattern, regex_t *regex, bool show_name) {
    FILE *file = fopen(filename, "r");
    if (!file) {
        fprintf(stderr, "grep: %s: %s\n", filename, strerror(errno));
        return 1;
    }

    FileStats stats = grep_file(file, filename, pattern, regex, show_name);
    fclose(file);

    /* Return 0 if matches found, 1 otherwise (for -q option) */
    return (stats.matches > 0) ? 0 : 1;
}

/* Recursive directory search */
int process_directory(const char *dirname, const char *pattern, regex_t *regex);

int process_path(const char *path, const char *pattern, regex_t *regex, bool show_name) {
    struct stat st;
    if (stat(path, &st) != 0) {
        fprintf(stderr, "grep: %s: %s\n", path, strerror(errno));
        return 1;
    }

    if (S_ISDIR(st.st_mode)) {
        if (opts.recursive) {
            return process_directory(path, pattern, regex);
        } else {
            fprintf(stderr, "grep: %s: Is a directory\n", path);
            return 1;
        }
    } else {
        return process_file(path, pattern, regex, show_name);
    }
}

int process_directory(const char *dirname, const char *pattern, regex_t *regex) {
    DIR *dir = opendir(dirname);
    if (!dir) {
        fprintf(stderr, "grep: %s: %s\n", dirname, strerror(errno));
        return 1;
    }

    struct dirent *entry;
    int result = 1;  /* No matches yet */

    while ((entry = readdir(dir)) != NULL) {
        /* Skip . and .. */
        if (strcmp(entry->d_name, ".") == 0 || strcmp(entry->d_name, "..") == 0) {
            continue;
        }

        /* Build full path */
        char path[MAX_PATH_LENGTH];
        snprintf(path, sizeof(path), "%s/%s", dirname, entry->d_name);

        /* Process path */
        int ret = process_path(path, pattern, regex, true);
        if (ret == 0) {
            result = 0;  /* Found matches */
        }
    }

    closedir(dir);
    return result;
}

/* ===== MAIN ===== */

void print_usage(const char *prog) {
    fprintf(stderr, "Usage: %s [OPTION]... PATTERN [FILE]...\n", prog);
    fprintf(stderr, "Search for PATTERN in each FILE.\n");
    fprintf(stderr, "Example: %s -i 'hello world' menu.h main.c\n\n", prog);
    fprintf(stderr, "Pattern selection and interpretation:\n");
    fprintf(stderr, "  -E            use extended regular expressions\n");
    fprintf(stderr, "  -F            PATTERN is a fixed string\n");
    fprintf(stderr, "  -i            ignore case distinctions\n");
    fprintf(stderr, "\nMatching control:\n");
    fprintf(stderr, "  -v            select non-matching lines\n");
    fprintf(stderr, "\nOutput control:\n");
    fprintf(stderr, "  -n            print line numbers\n");
    fprintf(stderr, "  -c            print only a count of matching lines\n");
    fprintf(stderr, "  -l            print only names of files with matches\n");
    fprintf(stderr, "  -L            print only names of files without matches\n");
    fprintf(stderr, "  -H            print filename with matches (default with multiple files)\n");
    fprintf(stderr, "  -h            suppress filename prefix\n");
    fprintf(stderr, "  -q            suppress all normal output\n");
    fprintf(stderr, "\nContext control:\n");
    fprintf(stderr, "  -A NUM        print NUM lines of trailing context\n");
    fprintf(stderr, "  -B NUM        print NUM lines of leading context\n");
    fprintf(stderr, "  -C NUM        print NUM lines of output context\n");
    fprintf(stderr, "\nFile and directory selection:\n");
    fprintf(stderr, "  -r            read all files under each directory, recursively\n");
    fprintf(stderr, "\nWith no FILE, or when FILE is -, read standard input.\n");
}

int main(int argc, char *argv[]) {
    int opt;
    char *pattern = NULL;
    regex_t regex;
    int regex_flags = REG_NOSUB;
    bool regex_compiled = false;

    /* Parse options */
    while ((opt = getopt(argc, argv, "EFivnclLHhqrA:B:C:")) != -1) {
        switch (opt) {
            case 'E':
                opts.extended_regex = true;
                regex_flags |= REG_EXTENDED;
                break;
            case 'F':
                opts.fixed_string = true;
                break;
            case 'i':
                opts.case_insensitive = true;
                regex_flags |= REG_ICASE;
                break;
            case 'v':
                opts.invert_match = true;
                break;
            case 'n':
                opts.line_numbers = true;
                break;
            case 'c':
                opts.count_only = true;
                break;
            case 'l':
                opts.files_with_matches = true;
                break;
            case 'L':
                opts.files_without_match = true;
                break;
            case 'H':
                opts.show_filename = true;
                break;
            case 'h':
                opts.no_filename = true;
                break;
            case 'q':
                opts.quiet = true;
                break;
            case 'r':
                opts.recursive = true;
                break;
            case 'A':
                opts.after_context = atoi(optarg);
                break;
            case 'B':
                opts.before_context = atoi(optarg);
                break;
            case 'C':
                opts.context = atoi(optarg);
                break;
            default:
                print_usage(argv[0]);
                return 2;
        }
    }

    /* Get pattern */
    if (optind >= argc) {
        fprintf(stderr, "grep: missing pattern\n");
        print_usage(argv[0]);
        return 2;
    }
    pattern = argv[optind++];

    /* Compile regex if not using fixed string */
    if (!opts.fixed_string) {
        int ret = regcomp(&regex, pattern, regex_flags);
        if (ret != 0) {
            char errbuf[256];
            regerror(ret, &regex, errbuf, sizeof(errbuf));
            fprintf(stderr, "grep: invalid pattern: %s\n", errbuf);
            return 2;
        }
        regex_compiled = true;
    }

    int result = 1;  /* Default: no matches */

    /* Process files */
    if (optind >= argc) {
        /* No files specified, read from stdin */
        FileStats stats = grep_file(stdin, "(standard input)", pattern, &regex, false);
        result = (stats.matches > 0) ? 0 : 1;
    } else {
        /* Process each file */
        int num_files = argc - optind;
        bool show_name = (num_files > 1) || opts.show_filename;

        for (int i = optind; i < argc; i++) {
            if (strcmp(argv[i], "-") == 0) {
                /* Read from stdin */
                FileStats stats = grep_file(stdin, "(standard input)", pattern, &regex, show_name);
                if (stats.matches > 0) {
                    result = 0;
                }
            } else {
                /* Read from file */
                int ret = process_path(argv[i], pattern, &regex, show_name);
                if (ret == 0) {
                    result = 0;
                }
            }
        }
    }

    /* Cleanup */
    if (regex_compiled) {
        regfree(&regex);
    }

    return result;
}
