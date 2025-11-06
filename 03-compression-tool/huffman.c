#include "huffman.h"

/* ============================================================================
 * MIN HEAP OPERATIONS
 * ============================================================================ */

/**
 * Create a min heap with given capacity
 */
MinHeap* createMinHeap(unsigned capacity) {
    MinHeap *minHeap = (MinHeap*)malloc(sizeof(MinHeap));
    minHeap->size = 0;
    minHeap->capacity = capacity;
    minHeap->array = (HuffmanNode**)malloc(capacity * sizeof(HuffmanNode*));
    return minHeap;
}

/**
 * Swap two nodes in the heap
 */
void swapNodes(HuffmanNode **a, HuffmanNode **b) {
    HuffmanNode *temp = *a;
    *a = *b;
    *b = temp;
}

/**
 * Heapify a subtree with root at given index
 */
void minHeapify(MinHeap *minHeap, int idx) {
    int smallest = idx;
    int left = 2 * idx + 1;
    int right = 2 * idx + 2;

    if (left < minHeap->size &&
        minHeap->array[left]->frequency < minHeap->array[smallest]->frequency)
        smallest = left;

    if (right < minHeap->size &&
        minHeap->array[right]->frequency < minHeap->array[smallest]->frequency)
        smallest = right;

    if (smallest != idx) {
        swapNodes(&minHeap->array[smallest], &minHeap->array[idx]);
        minHeapify(minHeap, smallest);
    }
}

/**
 * Check if heap has only one element
 */
int isSizeOne(MinHeap *minHeap) {
    return (minHeap->size == 1);
}

/**
 * Extract the minimum value node from heap
 */
HuffmanNode* extractMin(MinHeap *minHeap) {
    HuffmanNode *temp = minHeap->array[0];
    minHeap->array[0] = minHeap->array[minHeap->size - 1];
    --minHeap->size;
    minHeapify(minHeap, 0);
    return temp;
}

/**
 * Insert a new node to the heap
 */
void insertMinHeap(MinHeap *minHeap, HuffmanNode *node) {
    ++minHeap->size;
    int i = minHeap->size - 1;

    while (i && node->frequency < minHeap->array[(i - 1) / 2]->frequency) {
        minHeap->array[i] = minHeap->array[(i - 1) / 2];
        i = (i - 1) / 2;
    }

    minHeap->array[i] = node;
}

/**
 * Build a min heap from array
 */
void buildMinHeap(MinHeap *minHeap) {
    int n = minHeap->size - 1;
    for (int i = (n - 1) / 2; i >= 0; --i)
        minHeapify(minHeap, i);
}

/* ============================================================================
 * HUFFMAN TREE OPERATIONS
 * ============================================================================ */

/**
 * Create a new Huffman tree node
 */
HuffmanNode* createNode(unsigned char data, unsigned long freq) {
    HuffmanNode *node = (HuffmanNode*)malloc(sizeof(HuffmanNode));
    node->data = data;
    node->frequency = freq;
    node->left = node->right = NULL;
    return node;
}

/**
 * Build the Huffman tree from character frequencies
 */
HuffmanNode* buildHuffmanTree(unsigned long freq[]) {
    HuffmanNode *left, *right, *top;

    /* Count number of characters with non-zero frequency */
    int count = 0;
    for (int i = 0; i < ALPHABET_SIZE; i++) {
        if (freq[i] > 0)
            count++;
    }

    /* Handle edge case: empty file or single character */
    if (count == 0)
        return NULL;

    if (count == 1) {
        /* For single character, create a simple tree */
        for (int i = 0; i < ALPHABET_SIZE; i++) {
            if (freq[i] > 0) {
                HuffmanNode *root = createNode('\0', freq[i]);
                root->left = createNode(i, freq[i]);
                return root;
            }
        }
    }

    /* Create a min heap with capacity equal to number of unique characters */
    MinHeap *minHeap = createMinHeap(count);

    /* Create a leaf node for each character and add to min heap */
    for (int i = 0; i < ALPHABET_SIZE; i++) {
        if (freq[i] > 0) {
            minHeap->array[minHeap->size++] = createNode(i, freq[i]);
        }
    }

    /* Build the min heap */
    buildMinHeap(minHeap);

    /* Build Huffman tree */
    while (!isSizeOne(minHeap)) {
        /* Extract two minimum frequency nodes */
        left = extractMin(minHeap);
        right = extractMin(minHeap);

        /* Create new internal node with frequency equal to sum of two nodes */
        top = createNode('\0', left->frequency + right->frequency);
        top->left = left;
        top->right = right;

        /* Add new node to min heap */
        insertMinHeap(minHeap, top);
    }

    /* The remaining node is the root */
    HuffmanNode *root = extractMin(minHeap);
    free(minHeap->array);
    free(minHeap);

    return root;
}

/**
 * Print the Huffman tree structure (for debugging)
 */
void printTree(HuffmanNode *root, int level) {
    if (root == NULL)
        return;

    printTree(root->right, level + 1);

    for (int i = 0; i < level; i++)
        printf("    ");

    if (root->left == NULL && root->right == NULL)
        printf("'%c' (%lu)\n", root->data, root->frequency);
    else
        printf("* (%lu)\n", root->frequency);

    printTree(root->left, level + 1);
}

/**
 * Free the Huffman tree
 */
void freeTree(HuffmanNode *root) {
    if (root == NULL)
        return;
    freeTree(root->left);
    freeTree(root->right);
    free(root);
}

/* ============================================================================
 * HUFFMAN CODING OPERATIONS
 * ============================================================================ */

/**
 * Generate Huffman codes by traversing the tree
 */
void generateCodes(HuffmanNode *root, char *code, int top, HuffmanCode codes[]) {
    if (root == NULL)
        return;

    /* If this is a leaf node, save its code */
    if (root->left == NULL && root->right == NULL) {
        code[top] = '\0';
        codes[(unsigned char)root->data].code = strdup(code);
        codes[(unsigned char)root->data].length = top;
        return;
    }

    /* Traverse left (add '0' to code) */
    if (root->left) {
        code[top] = '0';
        generateCodes(root->left, code, top + 1, codes);
    }

    /* Traverse right (add '1' to code) */
    if (root->right) {
        code[top] = '1';
        generateCodes(root->right, code, top + 1, codes);
    }
}

/**
 * Print the Huffman codes
 */
void printCodes(HuffmanCode codes[]) {
    printf("\nHuffman Codes:\n");
    printf("==============\n");
    for (int i = 0; i < ALPHABET_SIZE; i++) {
        if (codes[i].code != NULL) {
            if (i >= 32 && i < 127) {
                printf("'%c': %s\n", i, codes[i].code);
            } else {
                printf("0x%02X: %s\n", i, codes[i].code);
            }
        }
    }
}

/**
 * Free the Huffman codes
 */
void freeCodes(HuffmanCode codes[]) {
    for (int i = 0; i < ALPHABET_SIZE; i++) {
        if (codes[i].code != NULL) {
            free(codes[i].code);
            codes[i].code = NULL;
        }
    }
}

/* ============================================================================
 * FILE OPERATIONS
 * ============================================================================ */

/**
 * Calculate frequency of each character in the file
 */
void calculateFrequency(const char *filename, unsigned long freq[]) {
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) {
        fprintf(stderr, "Error: Cannot open file '%s'\n", filename);
        return;
    }

    /* Initialize frequency array */
    for (int i = 0; i < ALPHABET_SIZE; i++) {
        freq[i] = 0;
    }

    /* Count each byte */
    int c;
    while ((c = fgetc(fp)) != EOF) {
        freq[c]++;
    }

    fclose(fp);
}

/**
 * Print character frequencies
 */
void printFrequency(unsigned long freq[]) {
    printf("\nCharacter Frequencies:\n");
    printf("======================\n");
    for (int i = 0; i < ALPHABET_SIZE; i++) {
        if (freq[i] > 0) {
            if (i >= 32 && i < 127) {
                printf("'%c': %lu\n", i, freq[i]);
            } else if (i == '\n') {
                printf("'\\n': %lu\n", freq[i]);
            } else if (i == '\t') {
                printf("'\\t': %lu\n", freq[i]);
            } else if (i == '\r') {
                printf("'\\r': %lu\n", freq[i]);
            } else {
                printf("0x%02X: %lu\n", i, freq[i]);
            }
        }
    }
}

/**
 * Write a bit to the output buffer
 */
typedef struct {
    FILE *file;
    unsigned char buffer;
    int bit_count;
} BitWriter;

void initBitWriter(BitWriter *writer, FILE *file) {
    writer->file = file;
    writer->buffer = 0;
    writer->bit_count = 0;
}

void writeBit(BitWriter *writer, int bit) {
    writer->buffer = (writer->buffer << 1) | (bit & 1);
    writer->bit_count++;

    if (writer->bit_count == 8) {
        fputc(writer->buffer, writer->file);
        writer->buffer = 0;
        writer->bit_count = 0;
    }
}

void flushBitWriter(BitWriter *writer) {
    if (writer->bit_count > 0) {
        writer->buffer <<= (8 - writer->bit_count);
        fputc(writer->buffer, writer->file);
    }
}

/**
 * Read a bit from the input buffer
 */
typedef struct {
    FILE *file;
    unsigned char buffer;
    int bit_count;
    int eof;
} BitReader;

void initBitReader(BitReader *reader, FILE *file) {
    reader->file = file;
    reader->buffer = 0;
    reader->bit_count = 0;
    reader->eof = 0;
}

int readBit(BitReader *reader) {
    if (reader->bit_count == 0) {
        int c = fgetc(reader->file);
        if (c == EOF) {
            reader->eof = 1;
            return -1;
        }
        reader->buffer = c;
        reader->bit_count = 8;
    }

    reader->bit_count--;
    return (reader->buffer >> reader->bit_count) & 1;
}

/**
 * Compress a file using Huffman coding
 */
int compressFile(const char *input_filename, const char *output_filename, CompressionStats *stats) {
    unsigned long freq[ALPHABET_SIZE];
    HuffmanCode codes[ALPHABET_SIZE] = {0};
    char code[MAX_TREE_HT];

    /* Calculate frequencies */
    calculateFrequency(input_filename, freq);

    /* Build Huffman tree */
    HuffmanNode *root = buildHuffmanTree(freq);
    if (root == NULL) {
        fprintf(stderr, "Error: Cannot build Huffman tree (empty file?)\n");
        return -1;
    }

    /* Generate codes */
    generateCodes(root, code, 0, codes);

    /* Open input and output files */
    FILE *input = fopen(input_filename, "rb");
    FILE *output = fopen(output_filename, "wb");

    if (input == NULL || output == NULL) {
        fprintf(stderr, "Error: Cannot open files for compression\n");
        if (input) fclose(input);
        if (output) fclose(output);
        freeTree(root);
        freeCodes(codes);
        return -1;
    }

    /* Write header: frequency table */
    fwrite(freq, sizeof(unsigned long), ALPHABET_SIZE, output);

    /* Compress data */
    BitWriter writer;
    initBitWriter(&writer, output);

    int c;
    while ((c = fgetc(input)) != EOF) {
        char *huffman_code = codes[c].code;
        for (int i = 0; huffman_code[i] != '\0'; i++) {
            writeBit(&writer, huffman_code[i] - '0');
        }
    }

    flushBitWriter(&writer);

    /* Calculate statistics */
    fseek(input, 0, SEEK_END);
    stats->original_size = ftell(input);
    fseek(output, 0, SEEK_END);
    stats->compressed_size = ftell(output);
    stats->compression_ratio = (double)stats->compressed_size / stats->original_size * 100.0;
    stats->space_saved = 100.0 - stats->compression_ratio;

    fclose(input);
    fclose(output);
    freeTree(root);
    freeCodes(codes);

    return 0;
}

/**
 * Decompress a file using Huffman coding
 */
int decompressFile(const char *input_filename, const char *output_filename) {
    unsigned long freq[ALPHABET_SIZE];

    /* Open input file */
    FILE *input = fopen(input_filename, "rb");
    if (input == NULL) {
        fprintf(stderr, "Error: Cannot open file '%s'\n", input_filename);
        return -1;
    }

    /* Read header: frequency table */
    if (fread(freq, sizeof(unsigned long), ALPHABET_SIZE, input) != ALPHABET_SIZE) {
        fprintf(stderr, "Error: Invalid compressed file format\n");
        fclose(input);
        return -1;
    }

    /* Rebuild Huffman tree */
    HuffmanNode *root = buildHuffmanTree(freq);
    if (root == NULL) {
        fprintf(stderr, "Error: Cannot rebuild Huffman tree\n");
        fclose(input);
        return -1;
    }

    /* Calculate total characters to decode */
    unsigned long total_chars = 0;
    for (int i = 0; i < ALPHABET_SIZE; i++) {
        total_chars += freq[i];
    }

    /* Open output file */
    FILE *output = fopen(output_filename, "wb");
    if (output == NULL) {
        fprintf(stderr, "Error: Cannot create output file '%s'\n", output_filename);
        fclose(input);
        freeTree(root);
        return -1;
    }

    /* Decompress data */
    BitReader reader;
    initBitReader(&reader, input);

    unsigned long decoded = 0;
    HuffmanNode *current = root;

    while (decoded < total_chars) {
        int bit = readBit(&reader);
        if (bit == -1)
            break;

        /* Traverse tree based on bit */
        if (bit == 0)
            current = current->left;
        else
            current = current->right;

        /* If leaf node, output character and reset to root */
        if (current->left == NULL && current->right == NULL) {
            fputc(current->data, output);
            decoded++;
            current = root;
        }
    }

    fclose(input);
    fclose(output);
    freeTree(root);

    return 0;
}

/* ============================================================================
 * UTILITY FUNCTIONS
 * ============================================================================ */

/**
 * Print help message
 */
void printHelp(const char *program_name) {
    printf("Usage: %s [OPTIONS] FILE\n\n", program_name);
    printf("A file compression tool using Huffman coding.\n\n");
    printf("Options:\n");
    printf("  -z, --compress FILE      Compress FILE (creates FILE.huf)\n");
    printf("  -x, --decompress FILE    Decompress FILE (creates FILE.decoded)\n");
    printf("  -f, --frequency FILE     Show character frequencies in FILE\n");
    printf("  -c, --codes FILE         Show Huffman codes for FILE\n");
    printf("  -t, --tree FILE          Show Huffman tree for FILE\n");
    printf("  -v, --verbose            Show detailed statistics\n");
    printf("  -h, --help               Display this help message\n\n");
    printf("Examples:\n");
    printf("  %s -z test.txt              Compress test.txt to test.txt.huf\n", program_name);
    printf("  %s -x test.txt.huf          Decompress test.txt.huf\n", program_name);
    printf("  %s -f test.txt              Show character frequencies\n", program_name);
    printf("  %s -c test.txt              Show Huffman codes\n", program_name);
}

/**
 * Print compression statistics
 */
void printStats(CompressionStats *stats) {
    printf("\nCompression Statistics:\n");
    printf("=======================\n");
    printf("Original size:     %lu bytes\n", stats->original_size);
    printf("Compressed size:   %lu bytes\n", stats->compressed_size);
    printf("Compression ratio: %.2f%%\n", stats->compression_ratio);
    printf("Space saved:       %.2f%%\n", stats->space_saved);
}
