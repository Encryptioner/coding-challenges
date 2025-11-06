/*
 * cccut - A simple implementation of the Unix cut command
 *
 * This is a Coding Challenge implementation of the cut tool.
 * See: https://codingchallenges.fyi/challenges/challenge-cut
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <ctype.h>
#include <getopt.h>

#define MAX_LINE_LENGTH 4096
#define MAX_FIELDS 1024

typedef struct {
    int start;
    int end;  // -1 means to end of line
} Range;

typedef struct {
    Range ranges[MAX_FIELDS];
    int count;
} RangeList;

typedef enum {
    MODE_NONE,
    MODE_FIELDS,
    MODE_CHARS
} CutMode;

typedef struct {
    CutMode mode;
    char delimiter;
    RangeList ranges;
    bool suppress_no_delim;  // -s flag
} Config;

void print_usage(const char *program_name) {
    fprintf(stderr, "Usage: %s [OPTION]... [FILE]...\n", program_name);
    fprintf(stderr, "Print selected parts of lines from each FILE to standard output.\n\n");
    fprintf(stderr, "Options:\n");
    fprintf(stderr, "  -f LIST       select only these fields\n");
    fprintf(stderr, "  -d DELIM      use DELIM instead of TAB for field delimiter\n");
    fprintf(stderr, "  -c LIST       select only these characters\n");
    fprintf(stderr, "  -s            do not print lines not containing delimiters (with -f)\n");
    fprintf(stderr, "  -h            display this help and exit\n");
    fprintf(stderr, "\nLIST is made up of one range, or many ranges separated by commas.\n");
    fprintf(stderr, "Each range is one of:\n");
    fprintf(stderr, "  N     N'th field or character, counted from 1\n");
    fprintf(stderr, "  N-    from N'th to end of line\n");
    fprintf(stderr, "  N-M   from N'th to M'th (included)\n");
    fprintf(stderr, "  -M    from first to M'th (included)\n");
    fprintf(stderr, "\nWith no FILE, or when FILE is -, read standard input.\n");
}

// Parse a range string like "1", "1-5", "1-", "-5"
bool parse_range(const char *str, Range *range) {
    char *dash = strchr(str, '-');

    if (dash == str) {
        // "-M" format
        range->start = 1;
        range->end = atoi(dash + 1);
        if (range->end < 1) return false;
    } else if (dash == NULL) {
        // "N" format
        range->start = atoi(str);
        range->end = range->start;
        if (range->start < 1) return false;
    } else {
        // "N-" or "N-M" format
        range->start = atoi(str);
        if (range->start < 1) return false;

        if (*(dash + 1) == '\0') {
            // "N-" format (to end)
            range->end = -1;
        } else {
            // "N-M" format
            range->end = atoi(dash + 1);
            if (range->end < range->start) return false;
        }
    }

    return true;
}

// Parse a list of ranges like "1,3,5-7"
bool parse_range_list(const char *list, RangeList *ranges) {
    char *list_copy = strdup(list);
    char *token;
    char *saveptr;

    ranges->count = 0;

    token = strtok_r(list_copy, ",", &saveptr);
    while (token != NULL && ranges->count < MAX_FIELDS) {
        // Trim whitespace
        while (isspace(*token)) token++;

        if (!parse_range(token, &ranges->ranges[ranges->count])) {
            free(list_copy);
            return false;
        }
        ranges->count++;
        token = strtok_r(NULL, ",", &saveptr);
    }

    free(list_copy);
    return ranges->count > 0;
}

// Check if a position is in any of the ranges
bool in_ranges(int pos, const RangeList *ranges) {
    for (int i = 0; i < ranges->count; i++) {
        int start = ranges->ranges[i].start;
        int end = ranges->ranges[i].end;

        if (end == -1) {
            // N- format (to end)
            if (pos >= start) return true;
        } else {
            if (pos >= start && pos <= end) return true;
        }
    }
    return false;
}

// Process line in character mode
void cut_chars(const char *line, const Config *config) {
    int len = strlen(line);
    // Remove trailing newline for processing
    if (len > 0 && line[len - 1] == '\n') {
        len--;
    }

    for (int i = 0; i < len; i++) {
        if (in_ranges(i + 1, &config->ranges)) {
            putchar(line[i]);
        }
    }
    putchar('\n');
}

// Process line in field mode
void cut_fields(const char *line, const Config *config) {
    int len = strlen(line);
    char *line_copy = malloc(len + 1);
    strcpy(line_copy, line);

    // Remove trailing newline
    if (len > 0 && line_copy[len - 1] == '\n') {
        line_copy[len - 1] = '\0';
    }

    // Check if line contains delimiter
    if (strchr(line_copy, config->delimiter) == NULL) {
        if (!config->suppress_no_delim) {
            printf("%s\n", line_copy);
        }
        free(line_copy);
        return;
    }

    // Split into fields
    char *fields[MAX_FIELDS];
    int field_count = 0;
    char *token;
    char *saveptr;
    char delim_str[2] = {config->delimiter, '\0'};

    token = strtok_r(line_copy, delim_str, &saveptr);
    while (token != NULL && field_count < MAX_FIELDS) {
        fields[field_count++] = token;
        token = strtok_r(NULL, delim_str, &saveptr);
    }

    // Output selected fields
    bool first = true;
    for (int i = 1; i <= field_count; i++) {
        if (in_ranges(i, &config->ranges)) {
            if (!first) {
                putchar(config->delimiter);
            }
            printf("%s", fields[i - 1]);
            first = false;
        }
    }

    // Handle ranges that extend beyond field count
    if (!first) {
        putchar('\n');
    }

    free(line_copy);
}

// Process a file according to config
void process_file(FILE *fp, const Config *config) {
    char line[MAX_LINE_LENGTH];

    while (fgets(line, sizeof(line), fp) != NULL) {
        if (config->mode == MODE_CHARS) {
            cut_chars(line, config);
        } else if (config->mode == MODE_FIELDS) {
            cut_fields(line, config);
        }
    }
}

int main(int argc, char *argv[]) {
    Config config = {
        .mode = MODE_NONE,
        .delimiter = '\t',
        .ranges = {.count = 0},
        .suppress_no_delim = false
    };

    int opt;
    char *fields_list = NULL;
    char *chars_list = NULL;

    while ((opt = getopt(argc, argv, "f:d:c:sh")) != -1) {
        switch (opt) {
            case 'f':
                if (config.mode != MODE_NONE) {
                    fprintf(stderr, "Error: only one type of list may be specified\n");
                    return 1;
                }
                config.mode = MODE_FIELDS;
                fields_list = optarg;
                break;
            case 'c':
                if (config.mode != MODE_NONE) {
                    fprintf(stderr, "Error: only one type of list may be specified\n");
                    return 1;
                }
                config.mode = MODE_CHARS;
                chars_list = optarg;
                break;
            case 'd':
                if (strlen(optarg) != 1) {
                    fprintf(stderr, "Error: delimiter must be a single character\n");
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

    // Check if mode was specified
    if (config.mode == MODE_NONE) {
        fprintf(stderr, "Error: you must specify a list of fields or characters\n");
        print_usage(argv[0]);
        return 1;
    }

    // Parse the range list
    const char *list = (config.mode == MODE_FIELDS) ? fields_list : chars_list;
    if (!parse_range_list(list, &config.ranges)) {
        fprintf(stderr, "Error: invalid range list\n");
        return 1;
    }

    // Process files or stdin
    if (optind >= argc) {
        // No files specified, use stdin
        process_file(stdin, &config);
    } else {
        // Process each file
        for (int i = optind; i < argc; i++) {
            FILE *fp;

            if (strcmp(argv[i], "-") == 0) {
                fp = stdin;
            } else {
                fp = fopen(argv[i], "r");
                if (fp == NULL) {
                    fprintf(stderr, "Error: cannot open '%s'\n", argv[i]);
                    continue;
                }
            }

            process_file(fp, &config);

            if (fp != stdin) {
                fclose(fp);
            }
        }
    }

    return 0;
}
