# Build Your Own Compression Tool

This challenge is to build your own file compression tool using Huffman coding!

## Background

Huffman coding is a lossless data compression algorithm that creates variable-length codes for different characters based on their frequency of occurrence. Characters that appear more frequently get shorter codes, while less frequent characters get longer codes. This results in overall compression of the data.

The algorithm was developed by David A. Huffman in 1952 while he was a Ph.D. student at MIT. It's widely used in:
- File compression formats (ZIP, GZIP)
- Image formats (JPEG uses a variant)
- Video compression
- Network protocols

Huffman coding follows these principles:
- **Optimal prefix-free codes** - No code is a prefix of another, ensuring unambiguous decoding
- **Frequency-based encoding** - More frequent symbols get shorter codes
- **Lossless compression** - The original data can be perfectly reconstructed

You can read more about Huffman coding in the classic text [Introduction to Algorithms by CLRS](https://mitpress.mit.edu/books/introduction-algorithms-third-edition).

## The Challenge - Building a Compression Tool

Your compression tool should be able to:
1. Compress files using Huffman coding
2. Decompress files back to their original form
3. Display compression statistics

Let's call our tool `cccompress` (cc for Coding Challenges).

## Step Zero

Like all good software engineering we're zero indexed! In this step you're going to set your environment up ready to begin developing and testing your solution.

Set up your IDE/editor of choice and programming language of choice. After that, here's what you'll need:

**Create a test file** with some sample text to compress. You can use any text file, or create one:

```bash
echo "this is an example of a huffman tree" > test.txt
```

For better testing, download a larger text file like the [Tale of Two Cities from Project Gutenberg](https://www.gutenberg.org/cache/epub/98/pg98.txt).

## Step One - Calculate Character Frequencies

In this step, your goal is to read a file and calculate the frequency of each character (byte) in the file.

Your program should:
- Read the input file
- Count the occurrence of each byte value (0-255)
- Store these frequencies for building the Huffman tree

Test your implementation:
```bash
cccompress -f test.txt
```

Expected output (example):
```
Character frequencies:
' ': 7
'a': 4
'e': 3
'f': 3
'h': 2
...
```

## Step Two - Build the Huffman Tree

In this step, your goal is to build a Huffman tree from the character frequencies.

The algorithm:
1. Create a leaf node for each character with its frequency
2. Put all nodes in a priority queue (min-heap)
3. While there's more than one node in the queue:
   - Remove the two nodes with lowest frequency
   - Create a new internal node with these two as children
   - The frequency of the new node is the sum of the two frequencies
   - Add the new node back to the queue
4. The remaining node is the root of the Huffman tree

Test your implementation by displaying the tree structure.

## Step Three - Generate Huffman Codes

In this step, your goal is to traverse the Huffman tree and generate the binary code for each character.

The algorithm:
- Traverse the tree from root to each leaf
- Assign '0' for left edges and '1' for right edges
- The path from root to leaf gives the code for that character

Your program should display the codes:
```bash
cccompress -c test.txt
```

Expected output (example):
```
Huffman codes:
' ': 111
'a': 010
'e': 1101
'f': 1100
'h': 000
...
```

## Step Four - Compress a File

In this step, your goal is to compress a file using the Huffman codes.

The compressed file should contain:
1. Header with the Huffman tree (or frequency table) for decompression
2. The encoded data using the Huffman codes

Your program should:
```bash
cccompress -z test.txt
```

This should create `test.txt.huf` (or similar extension) and display:
```
Original size: 1024 bytes
Compressed size: 615 bytes
Compression ratio: 60.06%
Space saved: 40.94%
```

## Step Five - Decompress a File

In this step, your goal is to decompress a file back to its original form.

The algorithm:
1. Read the header to reconstruct the Huffman tree
2. Read the encoded bits
3. Traverse the tree based on each bit (0 = left, 1 = right)
4. When reaching a leaf, output that character and return to root
5. Continue until all bits are processed

Your program should:
```bash
cccompress -x test.txt.huf
```

This should create `test.txt.decoded` (or the original filename) and verify:
```bash
diff test.txt test.txt.decoded
```

If there's no output from `diff`, congratulations! Your compression is working correctly.

## Step Six - Handle Edge Cases

In this step, improve your implementation to handle:

1. **Empty files** - Files with no content
2. **Single character files** - Files with only one unique character
3. **Binary files** - Non-text files (images, executables, etc.)
4. **Large files** - Files larger than available RAM (streaming)

## The Final Step - Optimize and Polish

In this final step:

1. **Add command-line options**:
   - `-z` or `--compress`: Compress a file
   - `-x` or `--decompress`: Decompress a file
   - `-f` or `--frequency`: Show character frequencies
   - `-c` or `--codes`: Show Huffman codes
   - `-v` or `--verbose`: Show detailed statistics
   - `-h` or `--help`: Show help message

2. **Support standard input/output**:
   ```bash
   cat test.txt | cccompress -z > compressed.huf
   cat compressed.huf | cccompress -x > decompressed.txt
   ```

3. **Optimize performance**:
   - Use efficient data structures
   - Handle large files with streaming
   - Minimize memory usage

4. **Add error handling**:
   - Check file permissions
   - Handle corrupted compressed files
   - Validate input/output

If you've completed all steps, congratulations! You've built a working Huffman compression tool!

## Bonus Challenges

1. **Compare with other algorithms**: Implement RLE (Run-Length Encoding) or LZ77 and compare compression ratios
2. **Adaptive Huffman coding**: Update the tree dynamically as you compress
3. **Multi-file compression**: Create an archive format like tar+gzip
4. **Compression benchmark**: Test against various file types and measure performance

## References
- [Build Your Own Compression Tool](https://codingchallenges.fyi/challenges/challenge-huffman)
- [Huffman Coding - Wikipedia](https://en.wikipedia.org/wiki/Huffman_coding)
- [Introduction to Algorithms (CLRS)](https://mitpress.mit.edu/books/introduction-algorithms)
