#include "huffman.h"
#include <getopt.h>

int main(int argc, char *argv[]) {
    int opt;
    int verbose = 0;
    char *input_file = NULL;
    enum { NONE, COMPRESS, DECOMPRESS, FREQUENCY, CODES, TREE } mode = NONE;

    static struct option long_options[] = {
        {"compress",    required_argument, 0, 'z'},
        {"decompress",  required_argument, 0, 'x'},
        {"frequency",   required_argument, 0, 'f'},
        {"codes",       required_argument, 0, 'c'},
        {"tree",        required_argument, 0, 't'},
        {"verbose",     no_argument,       0, 'v'},
        {"help",        no_argument,       0, 'h'},
        {0, 0, 0, 0}
    };

    /* Parse command line arguments */
    while ((opt = getopt_long(argc, argv, "z:x:f:c:t:vh", long_options, NULL)) != -1) {
        switch (opt) {
            case 'z':
                mode = COMPRESS;
                input_file = optarg;
                break;
            case 'x':
                mode = DECOMPRESS;
                input_file = optarg;
                break;
            case 'f':
                mode = FREQUENCY;
                input_file = optarg;
                break;
            case 'c':
                mode = CODES;
                input_file = optarg;
                break;
            case 't':
                mode = TREE;
                input_file = optarg;
                break;
            case 'v':
                verbose = 1;
                break;
            case 'h':
                printHelp(argv[0]);
                return 0;
            default:
                printHelp(argv[0]);
                return 1;
        }
    }

    /* Check if a mode was selected */
    if (mode == NONE) {
        fprintf(stderr, "Error: No operation specified\n\n");
        printHelp(argv[0]);
        return 1;
    }

    /* Check if input file was provided */
    if (input_file == NULL) {
        fprintf(stderr, "Error: No input file specified\n\n");
        printHelp(argv[0]);
        return 1;
    }

    /* Execute the selected operation */
    switch (mode) {
        case COMPRESS: {
            /* Generate output filename */
            char output_file[512];
            snprintf(output_file, sizeof(output_file), "%s.huf", input_file);

            printf("Compressing '%s' to '%s'...\n", input_file, output_file);

            CompressionStats stats;
            if (compressFile(input_file, output_file, &stats) == 0) {
                printf("✓ Compression successful!\n");
                printStats(&stats);
            } else {
                fprintf(stderr, "✗ Compression failed!\n");
                return 1;
            }
            break;
        }

        case DECOMPRESS: {
            /* Generate output filename (remove .huf extension if present) */
            char output_file[512];
            const char *huf_ext = strstr(input_file, ".huf");
            if (huf_ext != NULL && huf_ext[4] == '\0') {
                /* Remove .huf extension */
                int len = huf_ext - input_file;
                snprintf(output_file, sizeof(output_file), "%.*s.decoded", len, input_file);
            } else {
                snprintf(output_file, sizeof(output_file), "%s.decoded", input_file);
            }

            printf("Decompressing '%s' to '%s'...\n", input_file, output_file);

            if (decompressFile(input_file, output_file) == 0) {
                printf("✓ Decompression successful!\n");
            } else {
                fprintf(stderr, "✗ Decompression failed!\n");
                return 1;
            }
            break;
        }

        case FREQUENCY: {
            unsigned long freq[ALPHABET_SIZE];
            calculateFrequency(input_file, freq);
            printFrequency(freq);
            break;
        }

        case CODES: {
            unsigned long freq[ALPHABET_SIZE];
            HuffmanCode codes[ALPHABET_SIZE] = {0};
            char code[MAX_TREE_HT];

            calculateFrequency(input_file, freq);
            HuffmanNode *root = buildHuffmanTree(freq);
            if (root == NULL) {
                fprintf(stderr, "Error: Cannot build Huffman tree\n");
                return 1;
            }

            generateCodes(root, code, 0, codes);
            printCodes(codes);

            freeTree(root);
            freeCodes(codes);
            break;
        }

        case TREE: {
            unsigned long freq[ALPHABET_SIZE];
            calculateFrequency(input_file, freq);
            HuffmanNode *root = buildHuffmanTree(freq);
            if (root == NULL) {
                fprintf(stderr, "Error: Cannot build Huffman tree\n");
                return 1;
            }

            printf("\nHuffman Tree Structure:\n");
            printf("=======================\n");
            printf("(Format: character/frequency, * = internal node)\n\n");
            printTree(root, 0);

            freeTree(root);
            break;
        }

        default:
            break;
    }

    return 0;
}
