# Huffman Coding Algorithm

A detailed explanation of how Huffman coding works and how it's implemented in this project.

## Table of Contents

1. [Introduction](#introduction)
2. [The Problem](#the-problem)
3. [The Solution](#the-solution)
4. [Building the Huffman Tree](#building-the-huffman-tree)
5. [Generating Codes](#generating-codes)
6. [Compression Process](#compression-process)
7. [Decompression Process](#decompression-process)
8. [Complexity Analysis](#complexity-analysis)

## Introduction

Huffman coding is a lossless data compression algorithm developed by David A. Huffman in 1952. It's based on the frequency of characters in the data being compressed.

### Key Concepts

- **Variable-length codes**: Different characters get codes of different lengths
- **Prefix-free codes**: No code is a prefix of another code
- **Optimal**: Huffman codes are optimal for character-based compression

## The Problem

Given a set of characters and their frequencies, find the most efficient way to encode them using binary codes.

### Example

For the string "this is an example of a huffman tree":

```
Character frequencies:
' ': 7
'a': 4
'e': 3
'f': 3
'h': 2
...
```

If we use fixed-length encoding (8 bits per character), we need:
- 38 characters × 8 bits = 304 bits

Can we do better?

## The Solution

Huffman coding assigns shorter codes to more frequent characters:

```
Frequent characters:    Short codes
' ' (7 times):          111
'a' (4 times):          010

Rare characters:        Longer codes
'x' (1 time):           00101
```

This reduces the total number of bits needed.

## Building the Huffman Tree

The algorithm builds a binary tree bottom-up using a greedy approach.

### Step-by-Step Process

1. **Create leaf nodes**: One for each character with its frequency
2. **Build a min-heap**: Priority queue with frequencies as priorities
3. **Combine nodes**: Repeatedly:
   - Extract two nodes with minimum frequency
   - Create a new internal node with these as children
   - Frequency of new node = sum of children frequencies
   - Insert new node back into heap
4. **Finish**: When one node remains, it's the root

### Visual Example

For "aabbbcccc":

```
Initial frequencies:
a: 2, b: 3, c: 4

Step 1: Create leaf nodes
[a:2] [b:3] [c:4]

Step 2: Combine a and b (smallest two)
      [5]
     /   \
  [a:2] [b:3]

Step 3: Combine [5] and c
        [9]
       /   \
    [5]    [c:4]
   /   \
[a:2] [b:3]

This is the Huffman tree!
```

### Code Representation

```c
typedef struct HuffmanNode {
    unsigned char data;          // Character (leaf nodes only)
    unsigned long frequency;     // Frequency
    struct HuffmanNode *left;    // Left child (0)
    struct HuffmanNode *right;   // Right child (1)
} HuffmanNode;
```

## Generating Codes

Once we have the tree, we generate codes by traversing from root to each leaf:

- **Left edge** = 0
- **Right edge** = 1

### Example from Tree Above

```
        [9]
       /   \
      0     1
     /       \
  [5]        [c:4]
 /   \
0     1
|     |
[a:2] [b:3]

Codes:
a: 00  (left, left)
b: 01  (left, right)
c: 1   (right)
```

### Implementation

```c
void generateCodes(HuffmanNode *root, char *code, int top, HuffmanCode codes[]) {
    if (root == NULL)
        return;

    // If leaf node, save the code
    if (root->left == NULL && root->right == NULL) {
        code[top] = '\0';
        codes[root->data].code = strdup(code);
        codes[root->data].length = top;
        return;
    }

    // Traverse left with '0'
    if (root->left) {
        code[top] = '0';
        generateCodes(root->left, code, top + 1, codes);
    }

    // Traverse right with '1'
    if (root->right) {
        code[top] = '1';
        generateCodes(root->right, code, top + 1, codes);
    }
}
```

## Compression Process

### Steps

1. **Read file**: Calculate character frequencies
2. **Build tree**: Create Huffman tree from frequencies
3. **Generate codes**: Traverse tree to get codes
4. **Write header**: Save frequency table (for decompression)
5. **Encode data**: Replace each character with its Huffman code
6. **Write bits**: Pack bits into bytes and write to file

### Bit Packing

Since Huffman codes are bit sequences, we need to pack them into bytes:

```c
typedef struct {
    FILE *file;
    unsigned char buffer;
    int bit_count;
} BitWriter;

void writeBit(BitWriter *writer, int bit) {
    writer->buffer = (writer->buffer << 1) | (bit & 1);
    writer->bit_count++;

    if (writer->bit_count == 8) {
        fputc(writer->buffer, writer->file);
        writer->buffer = 0;
        writer->bit_count = 0;
    }
}
```

### Example

Compressing "abc":
- a = 00, b = 01, c = 1

Bit sequence: 00 01 1

Packed into byte: 00011000 (padded with zeros)

## Decompression Process

### Steps

1. **Read header**: Get frequency table
2. **Rebuild tree**: Reconstruct the same Huffman tree
3. **Read bits**: One bit at a time
4. **Traverse tree**:
   - Start at root
   - Go left for 0, right for 1
   - When reaching a leaf, output character
   - Return to root
5. **Continue**: Until all characters decoded

### Implementation

```c
int decompressFile(const char *input_filename, const char *output_filename) {
    // Read frequency table
    fread(freq, sizeof(unsigned long), ALPHABET_SIZE, input);

    // Rebuild tree
    HuffmanNode *root = buildHuffmanTree(freq);

    // Decode bit by bit
    HuffmanNode *current = root;
    while (decoded < total_chars) {
        int bit = readBit(&reader);

        // Traverse tree
        if (bit == 0)
            current = current->left;
        else
            current = current->right;

        // If leaf, output and reset
        if (current->left == NULL && current->right == NULL) {
            fputc(current->data, output);
            decoded++;
            current = root;
        }
    }
}
```

### Why This Works

The prefix-free property ensures unambiguous decoding:
- No code is a prefix of another
- When we reach a leaf, we know we have a complete code
- No need for separators between codes

## Complexity Analysis

### Time Complexity

- **Building heap**: O(n) where n = number of unique characters
- **Building tree**: O(n log n) - n-1 heap operations
- **Generating codes**: O(n) - tree traversal
- **Compression**: O(m) where m = file size
- **Decompression**: O(m)

**Overall**: O(m + n log n)

For typical files, n ≤ 256 (ASCII), so effectively O(m).

### Space Complexity

- **Frequency table**: O(n)
- **Huffman tree**: O(n) - max 2n-1 nodes
- **Code table**: O(n)
- **Compressed file**: O(m) in worst case

**Overall**: O(m + n)

### Compression Ratio

Huffman coding achieves optimal compression for symbol-by-symbol encoding.

**Best case**: Highly skewed frequency distribution
- Example: "aaaaaab" → Very good compression

**Worst case**: Uniform distribution
- Example: All characters appear equally → Minimal compression

**Average case**: English text typically achieves 40-60% compression

## Optimality

### Huffman's Theorem

Huffman coding produces optimal prefix-free codes when:
1. Character frequencies are known
2. Symbols are encoded independently

### Proof Sketch

The greedy algorithm always combines the two least frequent nodes:
- This minimizes weighted path length
- Results in optimal expected code length

### Limitations

Huffman coding is optimal for **character-based** encoding but:
- Doesn't consider context (digrams, trigrams)
- Can't beat entropy of the source
- Fixed table size (256 for byte-based)

Better compression possible with:
- Arithmetic coding (fractional bits)
- LZ77/LZ78 (dictionary-based)
- BWT + MTF + Huffman (bzip2)

## Variations

### Adaptive Huffman Coding

- Update tree as data is processed
- No need to store frequency table
- Used in some real-time applications

### Canonical Huffman Coding

- Standardize codes of same length
- More compact representation
- Used in DEFLATE (ZIP, gzip)

### Modified Huffman

- Variations for specific data types
- Example: Modified Huffman for fax images
- Example: JPEG uses Huffman for DC coefficients

## Practical Applications

Huffman coding is used in:

1. **File Compression**: Part of DEFLATE (ZIP, gzip, PNG)
2. **Image Formats**: JPEG uses Huffman for entropy coding
3. **Video Codecs**: H.264, MPEG use variants
4. **Network Protocols**: HTTP/2 HPACK for header compression
5. **Text Compression**: Combined with other techniques in bzip2

## References

- Huffman, D. A. (1952). "A Method for the Construction of Minimum-Redundancy Codes"
- Cormen, et al. "Introduction to Algorithms" (CLRS)
- Wikipedia: [Huffman Coding](https://en.wikipedia.org/wiki/Huffman_coding)
