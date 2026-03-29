# Stream Editor (sed) - Implementation

A functional `sed` (stream editor) implementation built from scratch, demonstrating text processing, regular expression parsing, pattern-action programming, and efficient stream transformation. Built with C.

## Overview

This implementation recreates core `sed` functionality by building a Unix stream editor that parses commands, matches patterns using regular expressions, and transforms text line-by-line in true Unix fashion. It demonstrates how text processing tools work under the hood.

## Features

- ✅ **Stream Processing**: Line-by-line text transformation
- ✅ **Regular Expressions**: Full regex support with capture groups
- ✅ **Substitution**: s/pattern/replacement/ with flags (g, p, i, n)
- ✅ **Addressing**: Line numbers, ranges, pattern matching, negation
- ✅ **Delete/Print/Quit**: d, p, q commands with addresses
- ✅ **Hold Space**: h, H, g, G, x commands for multi-line processing
- ✅ **Insert/Append/Change**: i, a, c commands for text manipulation
- ✅ **Branching**: Labels and conditional jumps (b, t, T)
- ✅ **In-Place Editing**: -i flag for direct file modification
- ✅ **Extended Regex**: -E flag for modern regex syntax
- ✅ **Command Files**: -f flag for script files
- ✅ **Multiple Files**: Process multiple files in sequence
- ✅ **Performance**: Efficient streaming, minimal memory usage

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         sed Architecture                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Input Processing                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │ File 1   │  │ File 2   │  │ File N   │  │  Stdin   │  │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │  │
│  │       └───────────────┴───────────────┴───────────────┘  │  │
│  │                          │                                │  │
│  │                          ▼                                │  │
│  │                   ┌─────────────┐                         │  │
│  │                   │ Line Reader │ (streaming)            │  │
│  │                   └──────┬──────┘                         │  │
│  │                          │                                │  │
│  └──────────────────────────┼────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────┼────────────────────────────────┐  │
│  │                   Processing Loop (per line)              │  │
│  │                          │                                │  │
│  │  ┌───────────────────────▼─────────────────────────┐    │  │
│  │  │              Pattern Space                       │    │  │
│  │  │  (Current line buffer - working area)           │    │  │
│  │  └───────────────────────┬─────────────────────────┘    │  │
│  │                          │                                │  │
│  │  ┌───────────────────────▼─────────────────────────┐    │  │
│  │  │              Hold Space                          │    │  │
│  │  │  (Secondary buffer for multi-line operations)    │    │  │
│  │  └───────────────────────┬─────────────────────────┘    │  │
│  │                          │                                │  │
│  │  ┌───────────────────────▼─────────────────────────┐    │  │
│  │  │              Command Cycle                       │    │  │
│  │  │  For each parsed command:                       │    │  │
│  │  │  1. Check address (line match)                  │    │  │
│  │  │  2. Execute command on pattern space            │    │  │
│  │  │  3. Update flags (substitution, quit, etc.)     │    │  │
│  │  │  4. Continue to next command                    │    │  │
│  │  └───────────────────────┬─────────────────────────┘    │  │
│  │                          │                                │  │
│  └──────────────────────────┼────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────┼────────────────────────────────┐  │
│  │                    Output Processing                      │  │
│  │                          │                                │  │
│  │  ┌───────────────────────▼─────────────────────────┐    │  │
│  │  │         Print Decision (if not suppressed)       │    │  │
│  │  │  -n flag: Only print if 'p' command used        │    │  │
│  │  │  Default: Print pattern space after cycle       │    │  │
│  │  └───────────────────────┬─────────────────────────┘    │  │
│  │                          │                                │  │
│  │  ┌───────────────────────▼─────────────────────────┐    │  │
│  │  │              Output Queue                         │    │  │
│  │  │  (For delayed output from a/c/i commands)       │    │  │
│  │  └───────────────────────┬─────────────────────────┘    │  │
│  │                          │                                │  │
│  │  ┌───────────────────────▼─────────────────────────┐    │  │
│  │  │              Stdout / File                       │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Build and Installation

### Prerequisites

- **C Compiler** (gcc, clang, or any C99-compatible compiler)
- **Make** (optional, for build automation)
- **Regex library** (usually provided by libc)

### Build from Source

```bash
# Navigate to challenge directory
cd 21-sed

# Compile with gcc
gcc -std=c99 -Wall -Wextra -O2 -o sed src/*..c

# Or use Makefile
make

# (Optional) Install to system path
sudo cp sed /usr/local/bin/
```

### Static Linking

```bash
# Build static binary for portability
gcc -std=c99 -static -o sed src/*.c
```

## Usage

### Basic Substitution

```bash
# Simple replacement
echo "foo bar" | ./sed 's/foo/hello/'
# Output: hello bar

# Global replacement
echo "foo foo" | ./sed 's/foo/bar/g'
# Output: bar bar

# Delete lines matching pattern
./sed '/error/d' logfile.txt

# Print only lines matching pattern
./sed -n '/important/p' data.txt
```

### Line Addressing

```bash
# Specific line
./sed '5s/old/new/' file.txt

# Line range
./sed '5,10s/old/new/' file.txt

# From line to end
./sed '10,$s/old/new/' file.txt

# Step addressing (every 5th line)
./sed '0~5s/^/== /' file.txt
```

### Pattern Addressing

```bash
# Lines matching pattern
./sed '/TODO/s/^/# /' file.txt

# Range between patterns
./sed '/START/,/END/d' file.txt

# Negation (all except matching)
./sed '/keep/!d' file.txt
```

### Multiple Commands

```bash
# Semicolon separator
./sed 's/foo/bar/; s/baz/qux/' file.txt

# Multiple -e flags
./sed -e 's/foo/bar/' -e 's/baz/qux/' file.txt

# Script file
echo "s/foo/bar/
s/baz/qux/
/error/d" > script.sed
./sed -f script.sed file.txt
```

### In-Place Editing

```bash
# Edit file in place (creates backup)
./sed -i.bak 's/old/new/' file.txt

# Edit in place without backup
./sed -i '' 's/old/new/' file.txt

# Multiple files in place
./sed -i 's/foo/bar/g' *.txt
```

### Extended Regex

```bash
# Use extended regex (+, ?, {}, | without backslashes)
./sed -E 's/foo|bar/baz/' file.txt

# Quantifiers
./sed -E 's/[0-9]+/NUMBER/' file.txt
./sed -E 's/a{3,5}/X/' file.txt
```

### CLI Options

```
-n              Suppress automatic printing
-e script       Add script to commands
-f script-file  Add script file contents
-i[SUFFIX]      Edit files in place (optional backup suffix)
-r or -E        Use extended regex
-s              Treat files separately (not as single stream)
--version       Show version information
--help          Show help message
```

## Project Structure

```
21-sed/
├── src/
│   ├── main.c                 # CLI entry point
│   ├── sed.c                  # Main sed engine
│   ├── parse.c                # Command parsing
│   ├── regex.c                # Regular expression handling
│   ├── execute.c              # Command execution
│   ├── buffer.c               # Pattern/hold space management
│   ├── addr.c                 # Address parsing and matching
│   ├── file.c                 # File I/O operations
│   └── util.c                 # Utility functions
├── include/
│   ├── sed.h                  # Main data structures
│   ├── proto.h                # Function prototypes
│   └── config.h               # Configuration
├── test/
│   ├── basic_test.sh          # Basic functionality tests
│   ├── regex_test.sh          # Regex tests
│   ├── addr_test.sh           # Addressing tests
│   └── perf_test.sh           # Performance benchmarks
├── docs/
│   ├── implementation.md      # Implementation details
│   ├── examples.md            # Usage examples and recipes
│   └── internals.md           # Deep dive into algorithms
├── CHALLENGE.md               # Challenge requirements
├── README.md                  # This file
├── Makefile
└── Dockerfile
```

## How It Works

### Sed Execution Model

```
Program Flow:
┌─────────────────────────────────────────────────────────────┐
│  1. Initialization                                          │
│     ├─ Parse command-line arguments                         │
│     ├─ Parse sed commands from -e or -f                     │
│     └─ Open input files or stdin                            │
│                                                              │
│  2. Main Loop (per line)                                    │
│     FOR each line in input:                                 │
│       ├─ Read line into pattern space                       │
│       ├─ Increment line number                              │
│       │                                                      │
│       ├─ FOR each command in script:                        │
│       │   ├─ Check address match (line #, pattern, etc.)    │
│       │   │                                                  │
│       │   ├─ IF address matches:                            │
│       │   │   ├─ Execute command on pattern space           │
│       │   │   ├─ Update flags (substituted, quit, etc.)     │
│       │   │   └─ Check for branch/jump                     │
│       │   │                                                  │
│       │   └─ IF quit flag set: break all loops              │
│       │                                                      │
│       ├─ IF not suppressed (-n) and not deleted:             │
│       │   └─ Print pattern space + output queue             │
│       │                                                      │
│       └─ Clear output queue for next line                   │
│                                                              │
│  3. Cleanup                                                  │
│     └─ Close files, free memory                             │
└─────────────────────────────────────────────────────────────┘
```

### Pattern Space and Hold Space

```
Two-Buffer Model:
┌─────────────────────────────────────────────────────────────┐
│  Pattern Space (Current Working Buffer)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ "This is the current line being processed"           │  │
│  └───────────────────────────────────────────────────────┘  │
│                        │                                    │
│                        │ Commands operate here              │
│                        ▼                                    │
│  Hold Space (Secondary Buffer)                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ "Previously saved content for later use"              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Buffer Operations:                                          │
│  h - Copy pattern → hold                                    │
│  H - Append pattern → hold (with \n)                       │
│  g - Copy hold → pattern                                   │
│  G - Append hold → pattern (with \n)                       │
│  x - Exchange pattern and hold                             │
└─────────────────────────────────────────────────────────────┘
```

### Substitute Command Execution

```
s/pattern/replacement/flags Algorithm:
┌─────────────────────────────────────────────────────────────┐
│  1. Parse substitute command                                │
│     ├─ Extract pattern (regex)                              │
│     ├─ Extract replacement text                             │
│     ├─ Parse flags (g, p, i, n)                            │
│     └─ Compile regex pattern                                │
│                                                              │
│  2. Match pattern in current line                           │
│     IF case-insensitive flag (i):                           │
│         Use case-insensitive matching                       │
│     ELSE:                                                   │
│         Use case-sensitive matching                         │
│                                                              │
│  3. Perform replacement                                     │
│     IF global flag (g):                                     │
│         Replace all occurrences                            │
│     ELSE IF numbered flag (n):                             │
│         Replace nth occurrence only                        │
│     ELSE:                                                   │
│         Replace first occurrence only                      │
│                                                              │
│  4. Handle special replacement sequences                    │
│     & → matched string                                      │
│     \1, \2, ... → capture groups                            │
│     \L → lowercase remaining text                           │
│     \U → uppercase remaining text                           │
│     \l, \u → case conversion for next char                  │
│                                                              │
│  5. Update flags                                            │
│     IF substitution made AND print flag (p):                │
│         Set print_flag = true                              │
│     IF substitution made:                                   │
│         Set substituted_flag = true                        │
│     IF print_flag OR (NOT suppressed):                      │
│         Print pattern space                                 │
└─────────────────────────────────────────────────────────────┘
```

### Address Matching

```
Address Types:
┌─────────────────────────────────────────────────────────────┐
│  Single Line Number: 5                                      │
│     Matches exactly line 5                                  │
│                                                              │
│  Line Range: 5,10                                           │
│     Matches lines 5 through 10                              │
│                                                              │
│  Step: 0~5                                                  │
│     Matches lines 0, 5, 10, 15, ...                         │
│                                                              │
│  Pattern: /foo/                                             │
│     Matches any line containing "foo"                       │
│                                                              │
│  Pattern Range: /foo/,/bar/                                 │
│     Matches from line with "foo" to line with "bar"         │
│     Range stays active once triggered                       │
│                                                              │
│  Negation: 5! or /foo/!                                     │
│     Matches all EXCEPT line 5 or lines with "foo"          │
│                                                              │
│  Special Addresses:                                          │
│     0 or $  - Before first line / after last line          │
│     1      - First line                                     │
│     $      - Last line                                      │
└─────────────────────────────────────────────────────────────┘
```

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| Linux (amd64) | ✅ Full support | Recommended |
| macOS (amd64) | ✅ Full support | Tested |
| macOS (arm64) | ✅ Full support | Apple Silicon |
| Windows | ✅ Full support | WSL or MinGW |

## Testing

### Unit Tests

```bash
# Run basic tests
./test/basic_test.sh

# Run regex tests
./test/regex_test.sh

# Run addressing tests
./test/addr_test.sh

# Run all tests
make test
```

### Performance Benchmarks

```bash
# Test large file processing
./test/perf_test.sh

# Expected results:
# File size: 100MB
# Time: <2 seconds
# Memory: <10MB (streaming)
```

### Manual Testing

```bash
# Test substitution
echo "hello world" | ./sed 's/world/everyone/'
# Output: hello everyone

# Test deletion
printf "line1\nline2\nline3\n" | ./sed '2d'
# Output: line1, line3

# Test hold space
printf "a\nb\nc\n" | ./sed '1h;1d;$G'
# Output: b, c, a
```

## Troubleshooting

### "Unmatched `/'"

**Symptom**: Syntax error in substitute command

**Solutions**:
```bash
# Use different delimiter if pattern contains /
echo "/path/to/file" | ./sed 's#/path/to#/new/path#'

# Or escape the slash
echo "/path/to/file" | ./sed 's/\/path\/to/\/new\/path/'
```

### "No such file or directory"

**Symptom**: Script file not found

**Solutions**:
```bash
# Use absolute path
./sed -f /full/path/to/script.sed file.txt

# Or check current directory
ls -la script.sed
```

### "In-place editing failed"

**Symptom**: Can't write to file (permission denied)

**Solutions**:
```bash
# Check file permissions
ls -l file.txt

# Ensure write permission
chmod +w file.txt

# Or use output redirection
./sed 's/old/new/' file.txt > temp.txt && mv temp.txt file.txt
```

### Pattern not matching

**Symptom**: Substitution not working as expected

**Solutions**:
```bash
# Try case-insensitive flag
./sed 's/pattern/replacement/i' file.txt

# Use extended regex for complex patterns
./sed -E 's/foo|bar/baz/' file.txt

# Debug by printing matching lines
./sed -n '/pattern/p' file.txt
```

## Performance Considerations

- **Memory**: Constant memory usage (~10KB) regardless of file size
- **Speed**: ~50-100 MB/s processing on modern hardware
- **Streaming**: Processes line-by-line, never loads entire file
- **Regex**: Pre-compiles patterns for efficiency
- **Bottleneck**: Usually I/O, not CPU

## Security Considerations

⚠️ **This is an educational implementation, not security-hardened:**

- No input sanitization (don't run on untrusted input)
- No protection against regex denial of service (ReDoS)
- No sandboxing (has full filesystem access)
- In-place editing can destroy data if misused

**For production use, use GNU sed or BSD sed.**

## Further Reading

- [GNU sed Manual](https://www.gnu.org/software/sed/manual/sed.html)
- [sed & awk (O'Reilly)](https://www.oreilly.com/library/view/sed-awk/1565922255/)
- [Regular Expression Info](https://www.regular-expressions.info/)
- [Bruce Barnett's sed Tutorial](https://www.grymoire.com/Unix/Sed.html)
- [The Art of Unix Programming](http://www.catb.org/~esr/writings/taoup/)

## License

MIT License - See LICENSE file for details

## Contributing

This is a coding challenge implementation. For stream processing and Unix philosophy fundamentals, this serves as an educational foundation for understanding text transformation tools.
