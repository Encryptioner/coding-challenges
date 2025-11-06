#ifndef HUFFMAN_H
#define HUFFMAN_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

/* Constants */
#define MAX_TREE_HT 256
#define ALPHABET_SIZE 256

/* Structure for a node in the Huffman tree */
typedef struct HuffmanNode {
    unsigned char data;          /* Character (only for leaf nodes) */
    unsigned long frequency;     /* Frequency of character/sum of children */
    struct HuffmanNode *left;    /* Left child */
    struct HuffmanNode *right;   /* Right child */
} HuffmanNode;

/* Structure for a min heap */
typedef struct MinHeap {
    unsigned int size;           /* Current size of heap */
    unsigned int capacity;       /* Maximum capacity */
    HuffmanNode **array;         /* Array of node pointers */
} MinHeap;

/* Structure to store Huffman codes */
typedef struct {
    char *code;                  /* Binary code as string */
    int length;                  /* Length of code */
} HuffmanCode;

/* Structure for compression statistics */
typedef struct {
    unsigned long original_size;
    unsigned long compressed_size;
    double compression_ratio;
    double space_saved;
} CompressionStats;

/* Function prototypes */

/* Min Heap operations */
MinHeap* createMinHeap(unsigned capacity);
void swapNodes(HuffmanNode **a, HuffmanNode **b);
void minHeapify(MinHeap *minHeap, int idx);
HuffmanNode* extractMin(MinHeap *minHeap);
void insertMinHeap(MinHeap *minHeap, HuffmanNode *node);
void buildMinHeap(MinHeap *minHeap);
int isSizeOne(MinHeap *minHeap);

/* Huffman tree operations */
HuffmanNode* createNode(unsigned char data, unsigned long freq);
HuffmanNode* buildHuffmanTree(unsigned long freq[]);
void printTree(HuffmanNode *root, int level);
void freeTree(HuffmanNode *root);

/* Huffman coding operations */
void generateCodes(HuffmanNode *root, char *code, int top, HuffmanCode codes[]);
void printCodes(HuffmanCode codes[]);
void freeCodes(HuffmanCode codes[]);

/* File operations */
void calculateFrequency(const char *filename, unsigned long freq[]);
void printFrequency(unsigned long freq[]);
int compressFile(const char *input_filename, const char *output_filename, CompressionStats *stats);
int decompressFile(const char *input_filename, const char *output_filename);

/* Utility functions */
void printHelp(const char *program_name);
void printStats(CompressionStats *stats);

#endif /* HUFFMAN_H */
