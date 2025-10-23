/*
 * ccwc - A clone of the Unix wc (word count) tool
 *
 * This implementation follows the Unix philosophy of doing one thing well.
 * It counts bytes, lines, words, and characters in files or standard input.
 *
 * Challenge: https://codingchallenges.fyi/challenges/challenge-wc
 *
 * Features:
 * - Count bytes (-c flag)
 * - Count lines (-l flag)
 * - Count words (-w flag)
 * - Count characters (-m flag, locale-aware)
 * - Default behavior (lines, words, bytes)
 * - Read from stdin when no file specified
 * - Support for multiple files
 *
 * Author: Coding Challenges
 * License: MIT
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <ctype.h>
#include <locale.h>
#include <wchar.h>
#include <errno.h>

/* Version information */
#define VERSION "1.0.0"
#define PROGRAM_NAME "ccwc"

/* Counting statistics structure */
typedef struct {
    long bytes;      /* Total bytes read */
    long lines;      /* Number of newline characters */
    long words;      /* Number of words (sequences of non-whitespace) */
    long chars;      /* Number of characters (locale-aware) */
} counts_t;

/* Command-line flags */
typedef struct {
    bool count_bytes;   /* -c flag */
    bool count_lines;   /* -l flag */
    bool count_words;   /* -w flag */
    bool count_chars;   /* -m flag */
    bool show_help;     /* -h or --help flag */
    bool show_version;  /* -v or --version flag */
} flags_t;

/* Function prototypes */
void print_usage(void);
void print_version(void);
counts_t count_file(FILE *fp, bool count_chars_flag);
void print_counts(const counts_t *counts, const flags_t *flags, const char *filename);
int process_file(const char *filename, const flags_t *flags, counts_t *total);
void parse_arguments(int argc, char *argv[], flags_t *flags, int *file_start_index);

/*
 * Print usage information
 */
void print_usage(void) {
    printf("Usage: %s [OPTION]... [FILE]...\n", PROGRAM_NAME);
    printf("Print newline, word, and byte counts for each FILE, and a total line if\n");
    printf("more than one FILE is specified. With no FILE, or when FILE is -, read\n");
    printf("standard input.\n\n");

    printf("Options:\n");
    printf("  -c        print the byte counts\n");
    printf("  -l        print the newline counts\n");
    printf("  -w        print the word counts\n");
    printf("  -m        print the character counts\n");
    printf("  -h, --help     display this help and exit\n");
    printf("  -v, --version  output version information and exit\n\n");

    printf("If no options are specified, the default is -l -w -c.\n\n");

    printf("Examples:\n");
    printf("  %s file.txt              Count lines, words, and bytes\n", PROGRAM_NAME);
    printf("  %s -l file.txt           Count lines only\n", PROGRAM_NAME);
    printf("  %s -w -c file.txt        Count words and bytes\n", PROGRAM_NAME);
    printf("  cat file.txt | %s -l    Count lines from stdin\n", PROGRAM_NAME);
}

/*
 * Print version information
 */
void print_version(void) {
    printf("%s version %s\n", PROGRAM_NAME, VERSION);
    printf("A clone of the Unix wc tool\n");
    printf("Challenge: https://codingchallenges.fyi/challenges/challenge-wc\n");
}

/*
 * Count statistics from a file stream
 *
 * This is the core counting logic. It reads the file byte by byte and
 * maintains counts for lines, words, bytes, and optionally characters.
 *
 * Word counting logic:
 * - A word is a sequence of non-whitespace characters
 * - We track state transitions from whitespace to non-whitespace
 *
 * Character counting:
 * - When enabled, uses wide character functions for locale-aware counting
 * - Handles multibyte character encodings properly
 */
counts_t count_file(FILE *fp, bool count_chars_flag) {
    counts_t counts = {0, 0, 0, 0};
    int c;
    bool in_word = false;

    if (count_chars_flag) {
        /* Locale-aware character counting using wide characters */
        wint_t wc;
        mbstate_t state;
        memset(&state, 0, sizeof(state));

        while ((wc = fgetwc(fp)) != WEOF) {
            counts.bytes += 1; /* Note: This is approximate for multibyte */
            counts.chars += 1;

            if (wc == L'\n') {
                counts.lines++;
            }

            if (iswspace(wc)) {
                if (in_word) {
                    in_word = false;
                }
            } else {
                if (!in_word) {
                    counts.words++;
                    in_word = true;
                }
            }
        }

        /* Get accurate byte count by checking file position */
        long pos = ftell(fp);
        if (pos != -1) {
            counts.bytes = pos;
        }
    } else {
        /* Byte-based counting (faster, standard approach) */
        while ((c = fgetc(fp)) != EOF) {
            counts.bytes++;

            /* Count newlines */
            if (c == '\n') {
                counts.lines++;
            }

            /* Count words using state machine approach */
            if (isspace(c)) {
                if (in_word) {
                    in_word = false;
                }
            } else {
                if (!in_word) {
                    counts.words++;
                    in_word = true;
                }
            }
        }
    }

    return counts;
}

/*
 * Print counts according to the flags specified
 *
 * Output format matches standard wc:
 * - Right-aligned numbers in 7-character wide fields
 * - Space-separated
 * - Filename at the end (or nothing for stdin)
 */
void print_counts(const counts_t *counts, const flags_t *flags, const char *filename) {
    /* Determine what to print based on flags */
    bool print_lines = flags->count_lines;
    bool print_words = flags->count_words;
    bool print_bytes = flags->count_bytes;
    bool print_chars = flags->count_chars;

    /* If no flags specified, use default: -l -w -c */
    if (!print_lines && !print_words && !print_bytes && !print_chars) {
        print_lines = true;
        print_words = true;
        print_bytes = true;
    }

    /* Print requested counts in standard order: lines, words, chars/bytes */
    if (print_lines) {
        printf("%7ld", counts->lines);
    }

    if (print_words) {
        printf("%8ld", counts->words);
    }

    if (print_chars) {
        printf("%8ld", counts->chars);
    } else if (print_bytes) {
        printf("%8ld", counts->bytes);
    }

    /* Print filename if provided */
    if (filename != NULL) {
        printf(" %s", filename);
    }

    printf("\n");
}

/*
 * Process a single file
 *
 * Returns 0 on success, 1 on error
 * Accumulates counts into total for multi-file support
 */
int process_file(const char *filename, const flags_t *flags, counts_t *total) {
    FILE *fp;
    counts_t counts;

    /* Open file or use stdin */
    if (filename == NULL || strcmp(filename, "-") == 0) {
        fp = stdin;
        filename = NULL; /* Don't print filename for stdin */
    } else {
        fp = fopen(filename, "rb"); /* Binary mode for accurate byte counting */
        if (fp == NULL) {
            fprintf(stderr, "%s: %s: %s\n", PROGRAM_NAME, filename, strerror(errno));
            return 1;
        }
    }

    /* Count statistics */
    counts = count_file(fp, flags->count_chars);

    /* Close file if not stdin */
    if (fp != stdin) {
        fclose(fp);
    }

    /* Print results for this file */
    print_counts(&counts, flags, filename);

    /* Accumulate totals */
    if (total != NULL) {
        total->bytes += counts.bytes;
        total->lines += counts.lines;
        total->words += counts.words;
        total->chars += counts.chars;
    }

    return 0;
}

/*
 * Parse command-line arguments
 *
 * Populates flags structure and sets file_start_index to first filename argument
 */
void parse_arguments(int argc, char *argv[], flags_t *flags, int *file_start_index) {
    int i;

    /* Initialize flags */
    memset(flags, 0, sizeof(flags_t));
    *file_start_index = argc; /* Default: no files */

    /* Parse arguments */
    for (i = 1; i < argc; i++) {
        if (argv[i][0] == '-' && argv[i][1] != '\0') {
            /* Check for long options */
            if (strcmp(argv[i], "--help") == 0) {
                flags->show_help = true;
                return;
            } else if (strcmp(argv[i], "--version") == 0) {
                flags->show_version = true;
                return;
            } else if (strcmp(argv[i], "-") == 0) {
                /* "-" means stdin, treat as filename */
                *file_start_index = i;
                break;
            } else {
                /* Parse short options */
                int j;
                for (j = 1; argv[i][j] != '\0'; j++) {
                    switch (argv[i][j]) {
                        case 'c':
                            flags->count_bytes = true;
                            break;
                        case 'l':
                            flags->count_lines = true;
                            break;
                        case 'w':
                            flags->count_words = true;
                            break;
                        case 'm':
                            flags->count_chars = true;
                            break;
                        case 'h':
                            flags->show_help = true;
                            return;
                        case 'v':
                            flags->show_version = true;
                            return;
                        default:
                            fprintf(stderr, "%s: invalid option -- '%c'\n",
                                    PROGRAM_NAME, argv[i][j]);
                            fprintf(stderr, "Try '%s --help' for more information.\n",
                                    PROGRAM_NAME);
                            exit(1);
                    }
                }
            }
        } else {
            /* First non-option argument is start of filenames */
            *file_start_index = i;
            break;
        }
    }
}

/*
 * Main entry point
 */
int main(int argc, char *argv[]) {
    flags_t flags;
    int file_start_index;
    int i;
    int exit_code = 0;
    counts_t total = {0, 0, 0, 0};
    int file_count = 0;

    /* Set locale for character counting */
    setlocale(LC_ALL, "");

    /* Parse command-line arguments */
    parse_arguments(argc, argv, &flags, &file_start_index);

    /* Handle help and version */
    if (flags.show_help) {
        print_usage();
        return 0;
    }

    if (flags.show_version) {
        print_version();
        return 0;
    }

    /* Check for conflicting flags */
    if (flags.count_chars && flags.count_bytes) {
        fprintf(stderr, "%s: options -c and -m are mutually exclusive\n", PROGRAM_NAME);
        return 1;
    }

    /* Process files */
    if (file_start_index >= argc) {
        /* No files specified, read from stdin */
        exit_code = process_file(NULL, &flags, NULL);
    } else {
        /* Process each file */
        for (i = file_start_index; i < argc; i++) {
            if (process_file(argv[i], &flags, &total) != 0) {
                exit_code = 1;
            }
            file_count++;
        }

        /* Print total if multiple files */
        if (file_count > 1) {
            print_counts(&total, &flags, "total");
        }
    }

    return exit_code;
}
