# Huffman Coding Tutorial

A step-by-step tutorial on understanding and implementing Huffman coding.

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Understanding the Problem](#understanding-the-problem)
4. [Manual Example](#manual-example)
5. [Code Walkthrough](#code-walkthrough)
6. [Building and Testing](#building-and-testing)
7. [Exercises](#exercises)

## Introduction

This tutorial will guide you through understanding how Huffman coding works by:
1. Working through a manual example
2. Understanding the code implementation
3. Building and testing the tool yourself

By the end, you'll understand:
- Why variable-length codes are efficient
- How to build a Huffman tree
- How compression and decompression work

## Prerequisites

### Required Knowledge

- Basic C programming
- Understanding of binary trees
- Familiarity with command-line tools

### Required Tools

- GCC or compatible C compiler
- Make
- Text editor

## Understanding the Problem

### Why Compress?

Imagine you need to send this message:

```
"BEEEEP"
```

Using standard ASCII (8 bits per character):
- B: 01000010
- E: 01000101
- P: 01010000

Total: 6 characters × 8 bits = **48 bits**

Can we do better?

### The Key Insight

Notice that 'E' appears 4 times, while 'B' and 'P' appear once each.

What if we use shorter codes for frequent characters?

```
E: 0     (1 bit)
B: 10    (2 bits)
P: 11    (2 bits)
```

Encoded message: 10 0 0 0 0 11

Total: 2 + 1 + 1 + 1 + 1 + 2 = **8 bits**

We saved 40 bits! (83% compression)

## Manual Example

Let's work through a complete example with the string: **"this is an example"**

### Step 1: Count Frequencies

```
't': 1
'h': 1
'i': 2
's': 2
' ': 3
'a': 2
'n': 1
'e': 2
'x': 1
'm': 1
'p': 1
'l': 1
```

### Step 2: Create Initial Nodes

Create a node for each character with its frequency:

```
[t:1] [h:1] [n:1] [x:1] [m:1] [p:1] [l:1] [i:2] [s:2] [a:2] [e:2] [ :3]
```

### Step 3: Build the Tree

Repeatedly combine the two smallest nodes:

**Iteration 1**: Combine t(1) and h(1)

```
    [2]
   /   \
 [t:1] [h:1]

Remaining: [2], [n:1], [x:1], [m:1], [p:1], [l:1], [i:2], [s:2], [a:2], [e:2], [ :3]
```

**Iteration 2**: Combine n(1) and x(1)

```
    [2]
   /   \
 [n:1] [x:1]

Remaining: [2(t,h)], [2(n,x)], [m:1], [p:1], [l:1], [i:2], [s:2], [a:2], [e:2], [ :3]
```

**Continue this process...**

After all iterations, you get a single tree with all characters as leaves.

### Step 4: Generate Codes

Traverse from root to each leaf, recording 0 for left and 1 for right:

```
Example paths:
' ': 111
'a': 010
'e': 1101
...
```

### Step 5: Encode

Replace each character with its code:

```
't': 00101
'h': 00100
'i': 0111
's': 0110
' ': 111
...

"this" becomes: 00101 00100 0111 0110
```

### Step 6: Decode

Read bits and traverse tree:
- Start at root
- 0 → go left
- 1 → go right
- Reach leaf → output character, return to root

## Code Walkthrough

### Part 1: Data Structures

```c
// A node in the Huffman tree
typedef struct HuffmanNode {
    unsigned char data;          // The character (leaves only)
    unsigned long frequency;     // How often it appears
    struct HuffmanNode *left;    // Left child (code bit 0)
    struct HuffmanNode *right;   // Right child (code bit 1)
} HuffmanNode;
```

**Why this structure?**
- `data`: Stores the character at leaf nodes
- `frequency`: Used to build tree (combine smallest first)
- `left/right`: Form the binary tree structure

### Part 2: Min Heap

```c
typedef struct MinHeap {
    unsigned int size;           // Current number of nodes
    unsigned int capacity;       // Maximum capacity
    HuffmanNode **array;         // Array of node pointers
} MinHeap;
```

**Why a min heap?**
- Efficiently get the two smallest frequency nodes
- O(log n) insertion and extraction
- Critical for building the tree efficiently

### Part 3: Building the Tree

```c
HuffmanNode* buildHuffmanTree(unsigned long freq[]) {
    // Create leaf nodes for each character
    MinHeap *minHeap = createMinHeap(count);
    for (int i = 0; i < ALPHABET_SIZE; i++) {
        if (freq[i] > 0) {
            minHeap->array[minHeap->size++] = createNode(i, freq[i]);
        }
    }

    // Build the tree bottom-up
    while (!isSizeOne(minHeap)) {
        // Get two smallest nodes
        left = extractMin(minHeap);
        right = extractMin(minHeap);

        // Create parent node
        top = createNode('\0', left->frequency + right->frequency);
        top->left = left;
        top->right = right;

        // Add back to heap
        insertMinHeap(minHeap, top);
    }

    return extractMin(minHeap);
}
```

**Step by step:**
1. Put all characters in min heap
2. While more than one node:
   - Take two smallest
   - Combine into new node
   - Put back in heap
3. Last node is the root

### Part 4: Generating Codes

```c
void generateCodes(HuffmanNode *root, char *code, int top, HuffmanCode codes[]) {
    if (root == NULL)
        return;

    // Leaf node? Save the code
    if (root->left == NULL && root->right == NULL) {
        code[top] = '\0';
        codes[root->data].code = strdup(code);
        return;
    }

    // Go left (add '0')
    if (root->left) {
        code[top] = '0';
        generateCodes(root->left, code, top + 1, codes);
    }

    // Go right (add '1')
    if (root->right) {
        code[top] = '1';
        generateCodes(root->right, code, top + 1, codes);
    }
}
```

**How it works:**
- Recursive tree traversal
- Build code string as we go
- Left = append '0', Right = append '1'
- At leaf, save the accumulated code

### Part 5: Compression

```c
int compressFile(const char *input_filename, const char *output_filename, ...) {
    // 1. Count character frequencies
    calculateFrequency(input_filename, freq);

    // 2. Build Huffman tree
    HuffmanNode *root = buildHuffmanTree(freq);

    // 3. Generate codes
    generateCodes(root, code, 0, codes);

    // 4. Write frequency table (header)
    fwrite(freq, sizeof(unsigned long), ALPHABET_SIZE, output);

    // 5. Encode data bit by bit
    while ((c = fgetc(input)) != EOF) {
        char *huffman_code = codes[c].code;
        for (int i = 0; huffman_code[i] != '\0'; i++) {
            writeBit(&writer, huffman_code[i] - '0');
        }
    }
}
```

**Process:**
1. Analyze input (frequencies)
2. Build tree and codes
3. Save metadata (frequency table)
4. Encode actual data

### Part 6: Decompression

```c
int decompressFile(const char *input_filename, const char *output_filename) {
    // 1. Read frequency table
    fread(freq, sizeof(unsigned long), ALPHABET_SIZE, input);

    // 2. Rebuild tree (same as compression)
    HuffmanNode *root = buildHuffmanTree(freq);

    // 3. Decode bit by bit
    HuffmanNode *current = root;
    while (decoded < total_chars) {
        int bit = readBit(&reader);

        // Traverse tree
        current = (bit == 0) ? current->left : current->right;

        // Reached a leaf?
        if (current->left == NULL && current->right == NULL) {
            fputc(current->data, output);
            current = root;  // Reset to root
            decoded++;
        }
    }
}
```

**Process:**
1. Read metadata (same frequency table)
2. Rebuild exact same tree
3. Read bits, traverse tree
4. Output characters as we reach leaves

## Building and Testing

### Step 1: Clone and Build

```bash
cd 03-compression-tool
make
```

### Step 2: Create Test File

```bash
echo "this is an example of a huffman tree" > test.txt
```

### Step 3: Analyze

```bash
# See character frequencies
./cccompress -f test.txt

# See the Huffman codes
./cccompress -c test.txt

# See the tree structure
./cccompress -t test.txt
```

### Step 4: Compress

```bash
./cccompress -z test.txt
ls -lh test.txt*
```

### Step 5: Decompress

```bash
./cccompress -x test.txt.huf
diff test.txt test.txt.decoded
```

If `diff` produces no output, success! Files are identical.

### Step 6: Run Tests

```bash
make test
```

## Exercises

### Beginner

1. **Manual encoding**: Encode "AAB" by hand
   - Count frequencies
   - Draw the tree
   - Assign codes
   - Encode the string

2. **Manual decoding**: Decode "00010" with this tree:
   ```
        *
       / \
      A   *
         / \
        B   C
   ```

3. **Modify test**: Change `test.txt` and observe how codes change

### Intermediate

4. **Add statistics**: Modify the code to count:
   - Number of unique characters
   - Average code length
   - Theoretical entropy

5. **Visualize tree**: Improve `printTree()` to show a better visualization

6. **Add validation**: Check if decompressed file matches original automatically

### Advanced

7. **Streaming**: Modify to compress files larger than RAM (chunk by chunk)

8. **Multiple files**: Add ability to compress multiple files into one archive

9. **Better header**: Reduce header size by encoding the tree structure instead of full frequency table

10. **Comparison**: Implement Run-Length Encoding (RLE) and compare with Huffman on different file types

## Common Pitfalls

### 1. Off-by-One Errors

```c
// Wrong: Missing last character
for (int i = 0; i < length - 1; i++)

// Correct
for (int i = 0; i < length; i++)
```

### 2. Memory Leaks

Always free allocated memory:
```c
freeTree(root);
freeCodes(codes);
```

### 3. Single Character Files

Edge case: Only one unique character
- Normal Huffman tree needs at least 2 nodes
- Handle specially with dummy node

### 4. Empty Files

Always check:
```c
if (total_chars == 0) {
    // Handle empty file
    return -1;
}
```

### 5. Bit Alignment

Don't forget to flush remaining bits:
```c
flushBitWriter(&writer);  // Write partial byte
```

## Next Steps

Now that you understand Huffman coding:

1. **Read the algorithm doc**: [algorithm.md](algorithm.md) for deeper theory
2. **Check performance**: [performance.md](performance.md) for optimization
3. **Try challenges**: Implement the bonus challenges in CHALLENGE.md
4. **Study variants**: Research Adaptive Huffman, Canonical Huffman

## Resources

### Books
- "Introduction to Algorithms" (CLRS) - Chapter on Greedy Algorithms
- "The Art of Computer Programming" Vol 3 (Knuth) - Sorting and Searching

### Online
- [Huffman Coding Visualization](https://www.cs.usfca.edu/~galles/visualization/Huffman.html)
- [Wikipedia: Huffman Coding](https://en.wikipedia.org/wiki/Huffman_coding)

### Related Topics
- Shannon Entropy
- Information Theory
- Lempel-Ziv (LZ77/LZ78)
- Arithmetic Coding

## Summary

You've learned:
- ✓ How Huffman coding compresses data
- ✓ How to build a Huffman tree
- ✓ How to generate optimal codes
- ✓ How to implement compression/decompression
- ✓ How to test and verify the implementation

Congratulations! You now understand one of the fundamental algorithms in data compression.
