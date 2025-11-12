/*
 * ccwc - Coding Challenges Word Count
 * A Unix wc clone implementation
 *
 * This implementation follows the Unix philosophy:
 * - Do one thing and do it well
 * - Handle text streams from files or stdin
 * - Be composable with other tools
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <ctype.h>
#include <locale.h>
#include <wchar.h>
#include <wctype.h>
#include <getopt.h>

/* Structure to hold count results */
typedef struct {
    long lines;
    long words;
    long chars;
    long bytes;
} Counts;

/* Function prototypes */
Counts count_file(FILE *fp, bool count_bytes, bool count_lines, bool count_words, bool count_chars);
void print_counts(Counts counts, const char *filename, bool show_lines, bool show_words, bool show_chars, bool show_bytes);
void process_file(const char *filename, bool show_lines, bool show_words, bool show_chars, bool show_bytes);
void usage(const char *program_name);

/**
 * Count lines, words, characters, and bytes in a file
 *
 * @param fp File pointer to count from
 * @param count_bytes Whether to count bytes
 * @param count_lines Whether to count lines
 * @param count_words Whether to count words
 * @param count_chars Whether to count characters (multibyte aware)
 * @return Counts structure with results
 */
Counts count_file(FILE *fp, bool count_bytes, bool count_lines, bool count_words, bool count_chars) {
    Counts counts = {0, 0, 0, 0};
    int c;
    bool in_word = false;
    long byte_count = 0;

    if (count_chars) {
        /* Character counting with multibyte support */
        wint_t wc;
        bool was_space = true;

        while ((wc = fgetwc(fp)) != WEOF) {
            counts.chars++;

            if (count_bytes) {
                /* Get byte position to calculate bytes read */
                long pos = ftell(fp);
                if (pos > byte_count) {
                    byte_count = pos;
                }
            }

            if (count_lines && wc == L'\n') {
                counts.lines++;
            }

            if (count_words) {
                if (iswspace(wc)) {
                    was_space = true;
                } else {
                    if (was_space) {
                        counts.words++;
                    }
                    was_space = false;
                }
            }
        }

        if (count_bytes) {
            counts.bytes = byte_count;
        }
    } else {
        /* Byte-based counting (faster, no multibyte support) */
        while ((c = fgetc(fp)) != EOF) {
            if (count_bytes) {
                counts.bytes++;
            }

            if (count_lines && c == '\n') {
                counts.lines++;
            }

            if (count_words) {
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
    }

    return counts;
}

/**
 * Print counts in wc format
 *
 * @param counts The counts to print
 * @param filename The filename (NULL for stdin)
 * @param show_lines Whether to show line count
 * @param show_words Whether to show word count
 * @param show_chars Whether to show character count
 * @param show_bytes Whether to show byte count
 */
void print_counts(Counts counts, const char *filename, bool show_lines, bool show_words, bool show_chars, bool show_bytes) {
    /* Print counts in the same order as wc: lines, words, chars/bytes */
    if (show_lines) {
        printf("%8ld", counts.lines);
    }

    if (show_words) {
        printf("%8ld", counts.words);
    }

    if (show_chars) {
        printf("%8ld", counts.chars);
    } else if (show_bytes) {
        printf("%8ld", counts.bytes);
    }

    if (filename) {
        printf(" %s", filename);
    }

    printf("\n");
}

/**
 * Process a single file
 *
 * @param filename File to process (NULL for stdin)
 * @param show_lines Whether to show line count
 * @param show_words Whether to show word count
 * @param show_chars Whether to show character count
 * @param show_bytes Whether to show byte count
 */
void process_file(const char *filename, bool show_lines, bool show_words, bool show_chars, bool show_bytes) {
    FILE *fp;
    Counts counts;

    /* Open file or use stdin */
    if (filename) {
        fp = fopen(filename, "r");
        if (!fp) {
            fprintf(stderr, "ccwc: %s: No such file or directory\n", filename);
            return;
        }
    } else {
        fp = stdin;
    }

    /* Count the file */
    counts = count_file(fp, show_bytes, show_lines, show_words, show_chars);

    /* Print results */
    print_counts(counts, filename, show_lines, show_words, show_chars, show_bytes);

    /* Clean up */
    if (filename) {
        fclose(fp);
    }
}

/**
 * Print usage information
 *
 * @param program_name Name of the program
 */
void usage(const char *program_name) {
    fprintf(stderr, "Usage: %s [OPTION]... [FILE]...\n", program_name);
    fprintf(stderr, "Print newline, word, and byte counts for each FILE, and a total line if\n");
    fprintf(stderr, "more than one FILE is specified. With no FILE, or when FILE is -,\n");
    fprintf(stderr, "read standard input.\n");
    fprintf(stderr, "\n");
    fprintf(stderr, "  -c, --bytes            print the byte counts\n");
    fprintf(stderr, "  -m, --chars            print the character counts\n");
    fprintf(stderr, "  -l, --lines            print the newline counts\n");
    fprintf(stderr, "  -w, --words            print the word counts\n");
    fprintf(stderr, "  -h, --help             display this help and exit\n");
    fprintf(stderr, "\n");
    fprintf(stderr, "A word is a non-zero-length sequence of characters delimited by white space.\n");
}

/**
 * Main entry point
 */
int main(int argc, char *argv[]) {
    int opt;
    bool show_lines = false;
    bool show_words = false;
    bool show_chars = false;
    bool show_bytes = false;

    /* Set locale for multibyte character support */
    setlocale(LC_ALL, "");

    /* Long options */
    static struct option long_options[] = {
        {"bytes", no_argument, 0, 'c'},
        {"chars", no_argument, 0, 'm'},
        {"lines", no_argument, 0, 'l'},
        {"words", no_argument, 0, 'w'},
        {"help",  no_argument, 0, 'h'},
        {0, 0, 0, 0}
    };

    /* Parse command line options */
    while ((opt = getopt_long(argc, argv, "cmlwh", long_options, NULL)) != -1) {
        switch (opt) {
            case 'c':
                show_bytes = true;
                break;
            case 'm':
                show_chars = true;
                break;
            case 'l':
                show_lines = true;
                break;
            case 'w':
                show_words = true;
                break;
            case 'h':
                usage(argv[0]);
                return 0;
            default:
                usage(argv[0]);
                return 1;
        }
    }

    /* If no options specified, use default mode (lines, words, bytes) */
    if (!show_lines && !show_words && !show_chars && !show_bytes) {
        show_lines = true;
        show_words = true;
        show_bytes = true;
    }

    /* If -m and -c both specified, -m takes precedence */
    if (show_chars && show_bytes) {
        show_bytes = false;
    }

    /* Process files */
    if (optind >= argc) {
        /* No files specified, read from stdin */
        process_file(NULL, show_lines, show_words, show_chars, show_bytes);
    } else {
        /* Process each file */
        for (int i = optind; i < argc; i++) {
            if (strcmp(argv[i], "-") == 0) {
                /* - means stdin */
                process_file(NULL, show_lines, show_words, show_chars, show_bytes);
            } else {
                process_file(argv[i], show_lines, show_words, show_chars, show_bytes);
            }
        }
    }

    return 0;
}
