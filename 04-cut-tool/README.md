# cccut - A Cut Tool Implementation

A C implementation of the Unix `cut` command-line utility, built as part of the [Coding Challenges](https://codingchallenges.fyi/challenges/challenge-cut).

## Features

- **Field extraction** (`-f`): Extract specific fields from delimited text
- **Byte extraction** (`-b`): Extract specific bytes from each line
- **Character extraction** (`-c`): Extract specific characters from each line
- **Custom delimiters** (`-d`): Support for any single-character delimiter
- **Suppress non-delimited lines** (`-s`): Skip lines without the delimiter
- **Flexible range syntax**: Support for single positions, ranges, and lists
- **Standard input/output**: Read from files or stdin, write to stdout
- **Cross-platform**: Works on Linux, macOS, and BSD systems

## Building

### Prerequisites

- GCC or compatible C compiler
- Make
- POSIX-compliant system (Linux, macOS, BSD)

### Build Commands

```bash
# Standard build
make

# Or explicitly
make all

# Debug build with symbols
make debug

# Static binary (Linux/BSD only)
make static

# Check dependencies and configuration
make check-deps
```

## Installation

```bash
# Install to /usr/local/bin (requires sudo)
sudo make install

# Install to custom location
PREFIX=/opt/local make install

# Uninstall
sudo make uninstall
```

## Usage

### Basic Syntax

```bash
cccut -b LIST [FILE...]
cccut -c LIST [FILE...]
cccut -f LIST [-d DELIM] [-s] [FILE...]
```

### Options

- `-b, --bytes=LIST` - Select only these bytes
- `-c, --characters=LIST` - Select only these characters
- `-f, --fields=LIST` - Select only these fields
- `-d, --delimiter=DELIM` - Use DELIM instead of TAB for field delimiter
- `-s, --only-delimited` - Do not print lines not containing delimiters
- `--help` - Display help message

### List Format

Lists can contain:
- **Single numbers**: `1` (first field/byte/character)
- **Ranges**: `1-3` (fields/bytes 1 through 3)
- **Open-ended ranges**: `3-` (from 3 to end) or `-3` (from start to 3)
- **Lists**: `1,3,5` (fields 1, 3, and 5)
- **Combinations**: `1-3,5,7-9` (multiple ranges and positions)

## Examples

### Field Extraction

```bash
# Create a tab-delimited file
echo -e "one\ttwo\tthree\tfour" > test.txt

# Extract first field
cccut -f 1 test.txt
# Output: one

# Extract multiple fields
cccut -f 1,3 test.txt
# Output: one	three

# Extract field range
cccut -f 2-3 test.txt
# Output: two	three

# Extract from field 2 to end
cccut -f 2- test.txt
# Output: two	three	four
```

### Custom Delimiters

```bash
# Create a CSV file
echo "one,two,three,four" > test.csv

# Extract fields using comma delimiter
cccut -f 1,3 -d , test.csv
# Output: one,three

# Extract field range
cccut -f 2-3 -d , test.csv
# Output: two,three

# Process /etc/passwd (colon-delimited)
cccut -f 1,3 -d : /etc/passwd
# Output: username:uid pairs
```

### Byte and Character Extraction

```bash
# Extract specific bytes
echo "hello world" | cccut -b 1-5
# Output: hello

# Extract non-contiguous bytes
echo "abcdef" | cccut -b 1,3,5
# Output: ace

# Extract characters (same as bytes for ASCII)
echo "hello world" | cccut -c 7-11
# Output: world
```

### Reading from Standard Input

```bash
# From pipe
echo -e "one\ttwo\tthree" | cccut -f 2
# Output: two

# From command substitution
cat data.txt | cccut -f 1,3 -d ,

# Process multiple files
cccut -f 1 file1.txt file2.txt file3.txt
```

### Suppress Non-Delimited Lines

```bash
# Create test files
echo -e "has\ttabs" > with_delim.txt
echo "no tabs here" >> with_delim.txt

# Without -s flag (prints all lines)
cccut -f 1 with_delim.txt
# Output:
# has
# no tabs here

# With -s flag (skips lines without delimiter)
cccut -f 1 -s with_delim.txt
# Output:
# has
```

## Testing

Run the test suite to verify functionality:

```bash
# Build and run tests
make test

# Or run test script directly
./test.sh
```

The test suite covers:
- Field extraction with various delimiters
- Byte and character extraction
- Range specifications
- Standard input processing
- Multiple file handling
- Edge cases

## Implementation Details

### Architecture

- **Single-pass processing**: Reads input line by line for memory efficiency
- **Configurable ranges**: Supports complex range specifications
- **POSIX compliance**: Uses POSIX-standard functions for portability
- **Error handling**: Proper validation and error messages

### Range Parsing

The tool supports flexible range syntax:
- `N`: Single position
- `N-M`: Inclusive range from N to M
- `N-`: From N to end of line
- `-M`: From beginning to M
- Comma-separated combinations of the above

### Performance Characteristics

- **Memory**: O(line length) - processes one line at a time
- **Time**: O(n * m) where n is line length and m is number of ranges
- **Scalability**: Can handle files of any size

## Limitations

- Maximum line length: 65,536 characters
- Maximum number of ranges: 1,024
- Delimiter must be a single byte character
- Character mode treats characters as bytes (full UTF-8 support not implemented)

## Comparison with GNU cut

This implementation aims for compatibility with basic GNU cut functionality:

**Supported:**
- `-b`, `-c`, `-f` options
- `-d` delimiter option
- `-s` suppress option
- Range specifications
- Standard input/output

**Not implemented (yet):**
- `--complement` option
- `--output-delimiter` option
- Full UTF-8 multi-byte character support
- Zero-terminated lines (`-z`)

## Project Structure

```
04-cut-tool/
├── cccut.c          # Main implementation
├── Makefile         # Build configuration
├── test.sh          # Test suite
├── README.md        # This file
└── CHALLENGE.md     # Challenge description
```

## Platform Support

Tested and working on:
- **Linux**: Ubuntu, Debian, CentOS, Fedora, Arch
- **macOS**: 10.15+
- **BSD**: FreeBSD, OpenBSD, NetBSD

## Development

### Code Style

- C99 standard
- POSIX-compliant APIs
- Clear error messages
- Consistent indentation (4 spaces)

### Building for Development

```bash
# Debug build with symbols
make debug

# Check for issues
make clean && make all

# Run tests after changes
make test
```

## Contributing

This is an educational project following the [Coding Challenges](https://codingchallenges.fyi) series. Feel free to:
- Report bugs
- Suggest improvements
- Submit pull requests
- Use as a learning resource

## License

This project is for educational purposes. See repository license for details.

## References

- [Coding Challenges - Cut Tool](https://codingchallenges.fyi/challenges/challenge-cut)
- [GNU cut documentation](https://www.gnu.org/software/coreutils/manual/html_node/cut-invocation.html)
- [cut man page](https://man7.org/linux/man-pages/man1/cut.1.html)
- [The Art of Unix Programming](https://www.oreilly.com/library/view/the-art-of/0131429019/)

## Acknowledgments

Built as part of John Crickett's [Coding Challenges](https://codingchallenges.fyi).
