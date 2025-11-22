/*
 * cccut - A simple implementation of the Unix cut command
 * Part of Coding Challenges (https://codingchallenges.fyi)
 *
 * Supports:
 * - Cutting by fields (-f)
 * - Cutting by bytes (-b)
 * - Cutting by characters (-c)
 * - Custom delimiter (-d)
 * - Suppress lines without delimiter (-s)
 * - Reading from files or stdin
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <ctype.h>
#include <getopt.h>
#include <errno.h>

#define MAX_LINE_LENGTH 65536
#define MAX_RANGES 1024

typedef enum {
    MODE_NONE = 0,
    MODE_FIELDS,
    MODE_BYTES,
    MODE_CHARS
} CutMode;

typedef struct {
    int start;
    int end;  // -1 means to end of line
} Range;

typedef struct {
    CutMode mode;
    char delimiter;
    bool suppress_no_delim;
    Range ranges[MAX_RANGES];
    int num_ranges;
    char *output_delimiter;
} Config;

/* Parse a range specification like "1", "1-3", "1-", "-3" */
static int parse_range(const char *str, Range *range) {
    char *endptr;
    char *dash = strchr(str, '-');

    if (dash == NULL) {
        /* Single number */
        long num = strtol(str, &endptr, 10);
        if (*endptr != '\0' || num < 1) {
            return -1;
        }
        range->start = (int)num;
        range->end = (int)num;
    } else if (dash == str) {
        /* -N format (from beginning to N) */
        long num = strtol(dash + 1, &endptr, 10);
        if (*endptr != '\0' || num < 1) {
            return -1;
        }
        range->start = 1;
        range->end = (int)num;
    } else if (*(dash + 1) == '\0') {
        /* N- format (from N to end) */
        long num = strtol(str, &endptr, 10);
        if (endptr != dash || num < 1) {
            return -1;
        }
        range->start = (int)num;
        range->end = -1;  // -1 means to end
    } else {
        /* N-M format */
        long start = strtol(str, &endptr, 10);
        if (endptr != dash || start < 1) {
            return -1;
        }
        long end = strtol(dash + 1, &endptr, 10);
        if (*endptr != '\0' || end < start) {
            return -1;
        }
        range->start = (int)start;
        range->end = (int)end;
    }

    return 0;
}

/* Parse list of ranges like "1,3,5-7,10-" */
static int parse_range_list(const char *list, Config *config) {
    char *list_copy = strdup(list);
    if (!list_copy) {
        return -1;
    }

    char *token = strtok(list_copy, ",");
    config->num_ranges = 0;

    while (token != NULL && config->num_ranges < MAX_RANGES) {
        Range range;
        if (parse_range(token, &range) < 0) {
            free(list_copy);
            return -1;
        }
        config->ranges[config->num_ranges++] = range;
        token = strtok(NULL, ",");
    }

    free(list_copy);
    return 0;
}

/* Check if a position is within any of the configured ranges */
static bool in_range(const Config *config, int pos) {
    for (int i = 0; i < config->num_ranges; i++) {
        const Range *r = &config->ranges[i];
        if (pos >= r->start && (r->end == -1 || pos <= r->end)) {
            return true;
        }
    }
    return false;
}

/* Cut by bytes */
static void cut_bytes(const char *line, const Config *config) {
    size_t len = strlen(line);
    bool first = true;

    for (size_t i = 0; i < len; i++) {
        if (in_range(config, i + 1)) {
            if (!first && config->output_delimiter) {
                printf("%s", config->output_delimiter);
            }
            putchar(line[i]);
            first = false;
        }
    }
}

/* Cut by characters (same as bytes for ASCII, different for UTF-8) */
static void cut_chars(const char *line, const Config *config) {
    /* For simplicity, treating this the same as bytes */
    /* A full implementation would handle UTF-8 multi-byte characters */
    cut_bytes(line, config);
}

/* Split a line by delimiter and extract specified fields */
static void cut_fields(const char *line, const Config *config) {
    /* Check if line contains delimiter */
    if (config->suppress_no_delim && strchr(line, config->delimiter) == NULL) {
        return;  /* Skip this line */
    }

    /* Split the line by delimiter */
    char *line_copy = strdup(line);
    if (!line_copy) {
        return;
    }

    /* Remove trailing newline if present */
    size_t len = strlen(line_copy);
    if (len > 0 && line_copy[len - 1] == '\n') {
        line_copy[len - 1] = '\0';
    }

    /* Count fields and store them */
    char *fields[MAX_RANGES * 2];
    int field_count = 0;

    char *ptr = line_copy;
    char *field_start = ptr;

    while (*ptr) {
        if (*ptr == config->delimiter) {
            *ptr = '\0';
            fields[field_count++] = field_start;
            field_start = ptr + 1;
        }
        ptr++;
    }
    /* Don't forget the last field */
    fields[field_count++] = field_start;

    /* Output selected fields */
    bool first = true;
    for (int i = 1; i <= field_count; i++) {
        if (in_range(config, i)) {
            if (!first) {
                printf("%c", config->delimiter);
            }
            printf("%s", fields[i - 1]);
            first = false;
        }
    }

    free(line_copy);
}

/* Process a single line according to the configuration */
static void process_line(const char *line, const Config *config) {
    /* Skip empty lines */
    if (line[0] == '\n' || line[0] == '\0') {
        return;
    }

    switch (config->mode) {
        case MODE_BYTES:
            cut_bytes(line, config);
            printf("\n");
            break;
        case MODE_CHARS:
            cut_chars(line, config);
            printf("\n");
            break;
        case MODE_FIELDS:
            cut_fields(line, config);
            printf("\n");
            break;
        default:
            break;
    }
}

/* Process a file or stdin */
static int process_file(FILE *fp, const Config *config) {
    char line[MAX_LINE_LENGTH];

    while (fgets(line, sizeof(line), fp) != NULL) {
        process_line(line, config);
    }

    return 0;
}

/* Print usage information */
static void print_usage(const char *progname) {
    fprintf(stderr, "Usage: %s -b LIST | -c LIST | -f LIST [OPTION]... [FILE]...\n", progname);
    fprintf(stderr, "Cut out selected portions of each line from FILE(s) to standard output.\n\n");
    fprintf(stderr, "  -b, --bytes=LIST        select only these bytes\n");
    fprintf(stderr, "  -c, --characters=LIST   select only these characters\n");
    fprintf(stderr, "  -f, --fields=LIST       select only these fields\n");
    fprintf(stderr, "  -d, --delimiter=DELIM   use DELIM instead of TAB for field delimiter\n");
    fprintf(stderr, "  -s, --only-delimited    do not print lines not containing delimiters\n");
    fprintf(stderr, "      --help              display this help and exit\n\n");
    fprintf(stderr, "LIST is made up of one range, or many ranges separated by commas.\n");
    fprintf(stderr, "Each range is one of:\n");
    fprintf(stderr, "  N      N'th byte, character or field, counted from 1\n");
    fprintf(stderr, "  N-     from N'th byte, character or field, to end of line\n");
    fprintf(stderr, "  N-M    from N'th to M'th (included) byte, character or field\n");
    fprintf(stderr, "  -M     from first to M'th (included) byte, character or field\n\n");
    fprintf(stderr, "With no FILE, or when FILE is -, read standard input.\n");
}

int main(int argc, char *argv[]) {
    Config config = {
        .mode = MODE_NONE,
        .delimiter = '\t',
        .suppress_no_delim = false,
        .num_ranges = 0,
        .output_delimiter = NULL
    };

    static struct option long_options[] = {
        {"bytes",          required_argument, 0, 'b'},
        {"characters",     required_argument, 0, 'c'},
        {"fields",         required_argument, 0, 'f'},
        {"delimiter",      required_argument, 0, 'd'},
        {"only-delimited", no_argument,       0, 's'},
        {"help",           no_argument,       0, 'h'},
        {0, 0, 0, 0}
    };

    int opt;
    int option_index = 0;

    while ((opt = getopt_long(argc, argv, "b:c:f:d:s", long_options, &option_index)) != -1) {
        switch (opt) {
            case 'b':
                if (config.mode != MODE_NONE) {
                    fprintf(stderr, "%s: only one type of list may be specified\n", argv[0]);
                    return 1;
                }
                config.mode = MODE_BYTES;
                if (parse_range_list(optarg, &config) < 0) {
                    fprintf(stderr, "%s: invalid byte list: %s\n", argv[0], optarg);
                    return 1;
                }
                break;
            case 'c':
                if (config.mode != MODE_NONE) {
                    fprintf(stderr, "%s: only one type of list may be specified\n", argv[0]);
                    return 1;
                }
                config.mode = MODE_CHARS;
                if (parse_range_list(optarg, &config) < 0) {
                    fprintf(stderr, "%s: invalid character list: %s\n", argv[0], optarg);
                    return 1;
                }
                break;
            case 'f':
                if (config.mode != MODE_NONE) {
                    fprintf(stderr, "%s: only one type of list may be specified\n", argv[0]);
                    return 1;
                }
                config.mode = MODE_FIELDS;
                if (parse_range_list(optarg, &config) < 0) {
                    fprintf(stderr, "%s: invalid field list: %s\n", argv[0], optarg);
                    return 1;
                }
                break;
            case 'd':
                if (strlen(optarg) != 1) {
                    fprintf(stderr, "%s: delimiter must be a single character\n", argv[0]);
                    return 1;
                }
                config.delimiter = optarg[0];
                break;
            case 's':
                config.suppress_no_delim = true;
                break;
            case 'h':
                print_usage(argv[0]);
                return 0;
            default:
                print_usage(argv[0]);
                return 1;
        }
    }

    /* Check that a mode was specified */
    if (config.mode == MODE_NONE) {
        fprintf(stderr, "%s: you must specify a list of bytes, characters, or fields\n", argv[0]);
        print_usage(argv[0]);
        return 1;
    }

    /* Check that delimiter option is only used with fields */
    if (config.delimiter != '\t' && config.mode != MODE_FIELDS) {
        fprintf(stderr, "%s: delimiter may be used only with fields\n", argv[0]);
        return 1;
    }

    /* Check that suppress option is only used with fields */
    if (config.suppress_no_delim && config.mode != MODE_FIELDS) {
        fprintf(stderr, "%s: suppressing non-delimited lines makes sense only with fields\n", argv[0]);
        return 1;
    }

    /* Process files or stdin */
    int status = 0;
    if (optind >= argc) {
        /* No files specified, read from stdin */
        status = process_file(stdin, &config);
    } else {
        /* Process each file */
        for (int i = optind; i < argc; i++) {
            FILE *fp;
            if (strcmp(argv[i], "-") == 0) {
                fp = stdin;
            } else {
                fp = fopen(argv[i], "r");
                if (!fp) {
                    fprintf(stderr, "%s: %s: %s\n", argv[0], argv[i], strerror(errno));
                    status = 1;
                    continue;
                }
            }

            int result = process_file(fp, &config);
            if (result != 0) {
                status = result;
            }

            if (fp != stdin) {
                fclose(fp);
            }
        }
    }

    return status;
}
