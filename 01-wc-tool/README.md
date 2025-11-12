# ccwc - Coding Challenges Word Count Tool

A Unix `wc` command clone implementation that follows the Unix philosophy: do one thing and do it well.

## Overview

`ccwc` is a command-line tool that counts lines, words, characters, and bytes in text files or from standard input. It's designed to be composable with other Unix tools through pipes and follows the same interface as the standard `wc` command.

## Features

- ✅ **Byte counting** (`-c`, `--bytes`) - Count bytes in files
- ✅ **Line counting** (`-l`, `--lines`) - Count newlines in files
- ✅ **Word counting** (`-w`, `--words`) - Count words (whitespace-separated sequences)
- ✅ **Character counting** (`-m`, `--chars`) - Count characters with multibyte support
- ✅ **Default mode** - Show lines, words, and bytes when no options specified
- ✅ **Standard input support** - Read from stdin when no file specified or with `-`
- ✅ **Multiple file support** - Process multiple files in one command
- ✅ **Long options** - Support both short (`-c`) and long (`--bytes`) options
- ✅ **Cross-platform** - Works on Linux, macOS, and BSD systems
- ✅ **Locale-aware** - Handles multibyte characters correctly based on system locale

## Building

### Prerequisites

- GCC compiler (or compatible C compiler)
- Make
- Standard C library with POSIX support

### Build Commands

```bash
# Standard build (optimized)
make

# Debug build (with symbols)
make debug

# Static binary (for distribution)
make static

# Clean build artifacts
make clean

# Check dependencies
make check-deps
```

## Installation

```bash
# Install to /usr/local/bin
make install

# Uninstall
make uninstall
```

## Usage

### Basic Examples

```bash
# Count bytes
ccwc -c file.txt

# Count lines
ccwc -l file.txt

# Count words
ccwc -w file.txt

# Count characters (multibyte aware)
ccwc -m file.txt

# Default output (lines, words, bytes)
ccwc file.txt
```

### Reading from Standard Input

```bash
# From pipe
cat file.txt | ccwc -l

# From here-document
ccwc -w << EOF
This is a test
with multiple lines
EOF

# Using explicit stdin
cat file.txt | ccwc -l -
```

### Multiple Files

```bash
# Process multiple files
ccwc file1.txt file2.txt file3.txt

# Combine with globbing
ccwc *.txt
```

### Combining Flags

```bash
# Lines and words
ccwc -l -w file.txt

# Lines, words, and bytes (same as default)
ccwc -l -w -c file.txt
```

### Long Options

```bash
# Using long option names
ccwc --lines file.txt
ccwc --words file.txt
ccwc --bytes file.txt
ccwc --chars file.txt
```

## Command-Line Options

| Short | Long | Description |
|-------|------|-------------|
| `-c` | `--bytes` | Print the byte counts |
| `-l` | `--lines` | Print the newline counts |
| `-w` | `--words` | Print the word counts |
| `-m` | `--chars` | Print the character counts (multibyte aware) |
| `-h` | `--help` | Display help and exit |

**Note:** A word is defined as a non-zero-length sequence of characters delimited by whitespace.

## Output Format

The output format matches the standard `wc` command:

```
[lines] [words] [chars/bytes] filename
```

Numbers are right-aligned with 8-character width for consistency.

### Examples

```bash
$ ccwc -l file.txt
    7145 file.txt

$ ccwc -w file.txt
   58164 file.txt

$ ccwc file.txt
    7145   58164  342190 file.txt
```

## Implementation Details

### Algorithm

- **Line counting**: Counts newline characters (`\n`)
- **Word counting**: Counts transitions from whitespace to non-whitespace
- **Byte counting**: Counts raw bytes read from file
- **Character counting**: Uses wide character functions (`fgetwc`) for proper multibyte support

### Performance

The implementation uses efficient single-pass algorithms:

- Reads files sequentially without seeking
- Processes input character-by-character without buffering entire file
- Combines multiple counts in a single pass when possible

### Multibyte Character Support

When using `-m` (character count), the tool respects the current locale and properly handles:

- UTF-8 encoded files
- Multi-byte character sequences
- Different character encodings based on `LC_ALL` environment variable

Set locale before running if needed:

```bash
export LC_ALL=en_US.UTF-8
ccwc -m utf8file.txt
```

## Testing

### Run Test Suite

```bash
make test
```

The test suite includes:
- Byte, line, word, and character counting
- Default output format
- Multiple flags combinations
- Standard input reading
- Empty files
- Single vs. multiple line files
- Long option names

### Manual Testing

```bash
# Create test file
echo -e "Line 1\nLine 2\nLine 3" > test.txt

# Test various modes
./ccwc test.txt
./ccwc -l test.txt
./ccwc -w test.txt
./ccwc -c test.txt

# Compare with system wc
diff <(wc test.txt) <(./ccwc test.txt)
```

## Project Structure

```
01-wc-tool/
├── ccwc.c              # Main implementation
├── Makefile            # Build system
├── test.sh             # Test suite
├── challenge.md        # Challenge description
├── README.md           # This file
└── docs/               # Tutorial documentation
    ├── implementation.md  # Design and code walkthrough
    ├── examples.md        # Practical examples
    └── algorithms.md      # Algorithm deep dive
```

## Differences from Standard wc

This implementation aims to match the behavior of GNU `wc`, with some minor differences:

- Output formatting may differ slightly in column width
- Error messages use a simplified format
- Some advanced options from GNU wc are not implemented

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| **Linux** | ✅ Fully supported | Tested on Ubuntu, Debian, CentOS |
| **macOS** | ✅ Fully supported | Tested on macOS 10.15+ |
| **FreeBSD** | ✅ Fully supported | Standard build works |
| **OpenBSD** | ✅ Fully supported | Standard build works |
| **NetBSD** | ✅ Fully supported | Standard build works |
| **Windows** | ⚠️ Limited | Requires POSIX layer (Cygwin, WSL) |

## Examples

### Counting Lines of Code

```bash
# Count lines in all C files
ccwc -l *.c

# Count lines in source directory
find src/ -name "*.c" -exec ccwc -l {} + | tail -1
```

### Finding Largest Files by Word Count

```bash
# Sort files by word count
for f in *.txt; do
    echo "$(ccwc -w "$f" | awk '{print $1}') $f"
done | sort -n
```

### Combining with Other Tools

```bash
# Count unique words
tr ' ' '\n' < file.txt | sort | uniq | ccwc -l

# Count lines in compressed file
gunzip -c file.txt.gz | ccwc -l

# Count words in specific columns
awk '{print $3}' data.csv | ccwc -w
```

## Troubleshooting

### Character Count Doesn't Match Byte Count

This is expected for files with multibyte characters (e.g., UTF-8). Use `-c` for bytes and `-m` for characters.

```bash
# These will differ for UTF-8 files
ccwc -c utf8file.txt  # Byte count
ccwc -m utf8file.txt  # Character count
```

### Incorrect Character Count

Ensure your locale is set correctly:

```bash
locale
export LC_ALL=en_US.UTF-8
ccwc -m file.txt
```

### Build Errors on macOS

If you get compilation errors on macOS, ensure Xcode Command Line Tools are installed:

```bash
xcode-select --install
```

## Contributing

This implementation follows the Unix philosophy and aims for simplicity and correctness. Improvements are welcome, especially:

- Additional test cases
- Performance optimizations
- Better error messages
- Enhanced locale support

## References

- [The Art of Unix Programming](https://www.oreilly.com/library/view/the-art-of/0131429019/)
- [GNU Coreutils wc](https://www.gnu.org/software/coreutils/wc)
- [POSIX wc specification](https://pubs.opengroup.org/onlinepubs/9699919799/utilities/wc.html)
- [Build Your Own wc Tool Challenge](https://codingchallenges.fyi/challenges/challenge-wc)

## License

This is a learning project based on the [Coding Challenges](https://codingchallenges.fyi/) series.

## See Also

- `challenge.md` - Original challenge description and requirements
- `docs/implementation.md` - Detailed implementation walkthrough
- `docs/examples.md` - More practical examples and use cases
- `docs/algorithms.md` - Deep dive into counting algorithms
