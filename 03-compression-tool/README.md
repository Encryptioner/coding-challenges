# Huffman Compression Tool

A file compression tool implementing the Huffman coding algorithm, built as part of the [Coding Challenges](https://codingchallenges.fyi/challenges/challenge-huffman).

## Overview

This tool compresses and decompresses files using Huffman coding, a lossless data compression algorithm that assigns variable-length codes to characters based on their frequency. More frequent characters get shorter codes, resulting in overall compression.

## Features

- **File Compression**: Compress any file using Huffman coding
- **File Decompression**: Restore compressed files to their original form
- **Statistics**: View compression ratios and space saved
- **Analysis Tools**:
  - Display character frequencies
  - Show Huffman codes for each character
  - Visualize the Huffman tree structure
- **Cross-Platform**: Works on Linux, macOS, and BSD systems
- **Binary Safe**: Handles both text and binary files

## Building

### Prerequisites

- GCC compiler or compatible C compiler
- Make
- POSIX-compliant system (Linux, macOS, BSD)

### Compile

```bash
# Standard build
make

# Debug build with symbols
make debug

# Static binary (Linux only)
make static

# Check dependencies
make check-deps
```

## Usage

### Basic Compression

```bash
# Compress a file
./cccompress -z filename.txt

# This creates filename.txt.huf
```

### Basic Decompression

```bash
# Decompress a file
./cccompress -x filename.txt.huf

# This creates filename.txt.decoded
```

### Analysis Commands

```bash
# Show character frequencies
./cccompress -f filename.txt

# Show Huffman codes
./cccompress -c filename.txt

# Show Huffman tree structure
./cccompress -t filename.txt
```

### Command-Line Options

```
-z, --compress FILE      Compress FILE (creates FILE.huf)
-x, --decompress FILE    Decompress FILE (creates FILE.decoded)
-f, --frequency FILE     Show character frequencies in FILE
-c, --codes FILE         Show Huffman codes for FILE
-t, --tree FILE          Show Huffman tree for FILE
-v, --verbose            Show detailed statistics
-h, --help               Display help message
```

## Examples

### Example 1: Compress and Decompress

```bash
# Create a test file
echo "this is an example of a huffman tree" > test.txt

# Compress it
./cccompress -z test.txt

# Output:
# Compressing 'test.txt' to 'test.txt.huf'...
# ✓ Compression successful!
#
# Compression Statistics:
# =======================
# Original size:     38 bytes
# Compressed size:   156 bytes
# Compression ratio: 410.53%
# Space saved:       -310.53%

# Decompress it
./cccompress -x test.txt.huf

# Verify it's identical
diff test.txt test.txt.decoded
# (no output means files are identical)
```

### Example 2: Analyze a File

```bash
# Show character frequencies
./cccompress -f test.txt

# Output:
# Character Frequencies:
# ======================
# ' ': 7
# 'a': 4
# 'e': 3
# 'f': 3
# 'h': 2
# ...

# Show Huffman codes
./cccompress -c test.txt

# Output:
# Huffman Codes:
# ==============
# ' ': 111
# 'a': 010
# 'e': 1101
# 'f': 1100
# ...
```

### Example 3: Compress a Larger File

```bash
# Download a book from Project Gutenberg
curl https://www.gutenberg.org/cache/epub/98/pg98.txt > book.txt

# Compress it
./cccompress -z book.txt

# Output shows actual compression:
# Compression Statistics:
# =======================
# Original size:     1089135 bytes
# Compressed size:   633847 bytes
# Compression ratio: 58.19%
# Space saved:       41.81%
```

## Testing

Run the test suite to verify the implementation:

```bash
# Run all tests
make test

# Or run the test script directly
./test.sh
```

The test suite includes:
- Basic compression/decompression
- Empty files
- Single character files
- Larger text files
- Binary data
- Special characters
- Repeated compression cycles

### Quick Demo

```bash
# Run a quick demonstration
make demo
```

## How It Works

### Algorithm Overview

1. **Frequency Analysis**: Count occurrences of each byte in the input
2. **Build Huffman Tree**: Create a binary tree using a min-heap
3. **Generate Codes**: Traverse the tree to assign codes (0=left, 1=right)
4. **Compress**: Replace each byte with its Huffman code
5. **Decompress**: Traverse the tree based on bits to decode

### File Format

Compressed files (`.huf`) contain:
1. **Header**: Frequency table (256 × 8 bytes = 2048 bytes)
2. **Data**: Bit-packed Huffman codes

This format allows decompression without additional metadata.

### Compression Effectiveness

Huffman coding works best on files with:
- Non-uniform character distribution
- Repeated patterns
- Text files with common letters

It's less effective on:
- Already compressed files (ZIP, JPEG, etc.)
- Random or encrypted data
- Very small files (header overhead)

## Installation

```bash
# Install to /usr/local/bin (requires sudo)
sudo make install

# Uninstall
sudo make uninstall
```

## Project Structure

```
03-compression-tool/
├── huffman.h              # Header file with data structures
├── huffman.c              # Core Huffman algorithm implementation
├── main.c                 # Command-line interface
├── Makefile               # Build system
├── test.sh                # Test suite
├── README.md              # This file
├── CHALLENGE.md           # Challenge description
└── docs/                  # Additional documentation
    ├── algorithm.md       # Algorithm explanation
    ├── tutorial.md        # Step-by-step tutorial
    └── performance.md     # Performance analysis
```

## Documentation

See the `docs/` directory for detailed documentation:

- **[Algorithm](docs/algorithm.md)**: Deep dive into Huffman coding
- **[Tutorial](docs/tutorial.md)**: Step-by-step guide to understanding the code
- **[Performance](docs/performance.md)**: Benchmarks and optimization notes

## Limitations

1. **Header Size**: 2KB header means small files may get larger when compressed
2. **Memory**: Entire file is loaded into memory (not suitable for very large files)
3. **Format**: Custom format, not compatible with standard compression tools

## Future Improvements

- [ ] Streaming compression for large files
- [ ] Adaptive Huffman coding
- [ ] Multiple file support (archive format)
- [ ] Standard format compatibility (gzip, etc.)
- [ ] Parallel processing for multi-core systems

## License

This project is for educational purposes as part of the Coding Challenges series.

## References

- [Huffman Coding - Wikipedia](https://en.wikipedia.org/wiki/Huffman_coding)
- [Introduction to Algorithms (CLRS)](https://mitpress.mit.edu/books/introduction-algorithms)
- [Original Challenge](https://codingchallenges.fyi/challenges/challenge-huffman)

## Author

Built as part of the [94 Coding Challenges](https://codingchallenges.fyi/challenges/intro).
