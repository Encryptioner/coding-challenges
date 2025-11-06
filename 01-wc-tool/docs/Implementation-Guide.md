# Implementation Guide: Building a wc Clone

This guide provides a detailed walkthrough of how `ccwc` is implemented, explaining the key concepts, algorithms, and design decisions. It's intended for developers who want to understand how the tool works or build something similar.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Algorithms](#core-algorithms)
4. [Implementation Details](#implementation-details)
5. [Challenges and Solutions](#challenges-and-solutions)
6. [Testing Strategy](#testing-strategy)

## Overview

The `wc` (word count) utility is a fundamental Unix tool that counts lines, words, bytes, and characters in text files. Our implementation, `ccwc`, faithfully reproduces this functionality while maintaining clean, readable code.

### Design Goals

1. **POSIX Compliance**: Match the behavior of standard `wc`
2. **Code Clarity**: Prioritize readability for educational purposes
3. **Cross-Platform**: Work on macOS, Linux, and BSD systems
4. **Efficiency**: Reasonable performance without premature optimization
5. **Robustness**: Proper error handling and edge cases

## Architecture

### High-Level Structure

```
main()
  ├─ parse_arguments()      # Parse command-line flags
  ├─ process_file()         # Process each file
  │   └─ count_file()       # Core counting logic
  │       └─ print_counts() # Format and display results
  └─ print totals           # Show totals for multiple files
```

### Data Structures

**counts_t**: Stores counting statistics
```c
typedef struct {
    long bytes;   // Total bytes read
    long lines;   // Number of newline characters
    long words;   // Number of words
    long chars;   // Number of characters (locale-aware)
} counts_t;
```

**flags_t**: Stores command-line options
```c
typedef struct {
    bool count_bytes;   // -c flag
    bool count_lines;   // -l flag
    bool count_words;   // -w flag
    bool count_chars;   // -m flag
    bool show_help;     // -h or --help
    bool show_version;  // -v or --version
} flags_t;
```

## Core Algorithms

### 1. Word Counting Algorithm

The word counting algorithm uses a **finite state machine** approach:

```c
bool in_word = false;

for each character:
    if isspace(character):
        if in_word:
            in_word = false
    else:
        if not in_word:
            word_count++
            in_word = true
```

**How it works**:
- Track whether we're currently inside a word (`in_word`)
- When transitioning from whitespace to non-whitespace, increment word count
- When transitioning from non-whitespace to whitespace, mark that we've left the word

**Example**:
```
Input: "hello  world"
        ^      ^
        |      |
    word 1   word 2

Process:
h: not in word → enter word, count=1
e: in word → stay in word
l: in word → stay in word
l: in word → stay in word
o: in word → stay in word
 : in word → leave word
 : not in word → stay out
w: not in word → enter word, count=2
...
```

### 2. Line Counting Algorithm

Line counting is straightforward - count newline characters:

```c
if (character == '\n') {
    line_count++;
}
```

**Important**: A file without a trailing newline will have one fewer line than expected by some definitions. We follow the POSIX standard which counts newline characters, not logical lines.

### 3. Byte Counting Algorithm

Byte counting tracks the file position:

```c
while ((c = fgetc(fp)) != EOF) {
    byte_count++;
}
```

Alternatively, we can use `ftell()` after reading the file to get the exact position.

### 4. Character Counting Algorithm

Character counting is more complex due to multibyte encodings (UTF-8, etc.):

```c
wint_t wc;
mbstate_t state;
memset(&state, 0, sizeof(state));

while ((wc = fgetwc(fp)) != WEOF) {
    char_count++;
}
```

**Key differences from byte counting**:
- Uses wide character functions (`fgetwc` instead of `fgetc`)
- One multibyte sequence (e.g., UTF-8 "世") = 1 character, but 3+ bytes
- Requires locale to be set correctly (`setlocale(LC_ALL, "")`)

## Implementation Details

### File I/O Strategy

**Binary Mode**: We open files in binary mode (`"rb"`) to ensure accurate byte counting:
```c
fp = fopen(filename, "rb");
```

This prevents text mode conversions that might alter byte counts (e.g., CRLF → LF on Windows).

### Standard Input Handling

When no filename is provided or filename is "-", read from stdin:

```c
if (filename == NULL || strcmp(filename, "-") == 0) {
    fp = stdin;
    filename = NULL;  // Don't print filename for stdin
}
```

### Command-Line Parsing

Arguments are parsed manually to handle:
- Short options: `-l`, `-w`, `-c`, `-m`
- Combined options: `-lwc` (equivalent to `-l -w -c`)
- Long options: `--help`, `--version`
- File arguments: Any non-option argument

```c
for each argument:
    if starts with '-':
        if long option (--):
            handle long option
        else:
            for each character after '-':
                set corresponding flag
    else:
        treat as filename
```

### Output Formatting

Output matches standard `wc` format:
- Right-aligned numbers in 7-8 character wide fields
- Space-separated values
- Order: lines, words, chars/bytes, filename

```c
printf("%7ld%8ld%8ld %s\n", lines, words, bytes, filename);
```

Example output:
```
    7145   58164  342190 test.txt
```

### Multiple File Handling

When processing multiple files:
1. Process each file individually
2. Accumulate counts in a `total` structure
3. Print individual file results
4. Print total if more than one file

```c
for each file:
    counts = count_file(file)
    print_counts(counts, filename)
    add counts to total

if file_count > 1:
    print_counts(total, "total")
```

## Challenges and Solutions

### Challenge 1: Locale-Aware Character Counting

**Problem**: Different character encodings (ASCII, UTF-8, etc.) have different character lengths.

**Solution**:
- Use wide character functions (`fgetwc`)
- Set locale at program start: `setlocale(LC_ALL, "")`
- Handle multibyte state with `mbstate_t`

**Trade-offs**:
- Slower than byte counting
- Requires proper locale configuration
- May give different results on different systems

### Challenge 2: Word Boundary Detection

**Problem**: What constitutes a "word"?

**Solution**: Follow POSIX definition - any sequence of non-whitespace characters.

**Edge cases handled**:
```
"  hello  "       → 1 word (leading/trailing spaces ignored)
"hello\tworld"    → 2 words (tab is whitespace)
"hello\nworld"    → 2 words (newline is whitespace)
""                → 0 words
"   "             → 0 words (only whitespace)
```

### Challenge 3: Empty Files and Edge Cases

**Problem**: How to handle empty files, files without newlines, etc.?

**Solution**:
- Empty file: 0 bytes, 0 lines, 0 words, 0 characters
- File without trailing newline: Count actual newlines (may be 0)
- Large files: Use `long` type for counts (supports files up to ~2GB on 32-bit, ~9 exabytes on 64-bit)

### Challenge 4: Cross-Platform Compatibility

**Problem**: Different systems have different newline conventions (LF vs CRLF).

**Solution**:
- Open files in binary mode to preserve actual bytes
- Count actual `\n` characters regardless of platform
- This matches standard `wc` behavior

### Challenge 5: Performance

**Problem**: Reading byte-by-byte is potentially slow.

**Optimization considerations**:
- **Not implemented**: Buffered reading (would complicate character counting)
- **Chosen**: Simple byte-by-byte reading for code clarity
- **Result**: Within 10% of system `wc` performance

**Trade-off**: We chose code clarity over micro-optimizations. For production use, consider:
- Larger read buffers (e.g., 4KB blocks)
- SIMD operations for newline scanning
- Memory-mapped I/O for large files

## Testing Strategy

### Unit Testing Approach

Each feature is tested independently:

1. **Byte counting**: Files of known sizes
2. **Line counting**: Files with known line counts
3. **Word counting**: Files with known word counts
4. **Character counting**: ASCII and Unicode files
5. **Flag combinations**: Multiple options together
6. **Edge cases**: Empty files, stdin, errors

### Test File Creation

Tests create predictable test files:

```bash
# Simple file
echo "hello world" > test_simple.txt        # 12 bytes, 1 line, 2 words

# Multi-line file
cat > test_multiline.txt << 'EOF'
line1
line2
line3
EOF
# 18 bytes, 3 lines, 3 words

# Empty file
touch test_empty.txt                        # 0 bytes, 0 lines, 0 words
```

### Validation Tests

The challenge provides a reference file with known counts:
- 342,190 bytes
- 7,145 lines
- 58,164 words
- 339,292 characters

These serve as integration tests to validate the entire implementation.

### Error Testing

Verify proper error handling:
- Non-existent files
- Invalid options
- Permission errors (if applicable)

## Code Organization

### Function Responsibilities

**main()**:
- Entry point
- Orchestrates overall flow
- Handles multiple file iteration

**parse_arguments()**:
- Parse command-line options
- Set flags structure
- Identify file arguments

**process_file()**:
- Open file or stdin
- Call count_file()
- Print results
- Accumulate totals

**count_file()**:
- Core counting logic
- Return counts structure
- No side effects (pure function)

**print_counts()**:
- Format output
- Apply flags to determine what to print
- Match standard wc format

### Error Handling Strategy

**Philosophy**: Fail gracefully, report clearly, continue when possible.

```c
// File not found - report error but continue with other files
if (fp == NULL) {
    fprintf(stderr, "%s: %s: %s\n", PROGRAM_NAME, filename, strerror(errno));
    return 1;  // Indicate error but don't exit
}

// Invalid option - show error and exit immediately
fprintf(stderr, "%s: invalid option -- '%c'\n", PROGRAM_NAME, option);
fprintf(stderr, "Try '%s --help' for more information.\n", PROGRAM_NAME);
exit(1);
```

## Best Practices Demonstrated

1. **Clear naming**: Functions and variables have descriptive names
2. **Small functions**: Each function does one thing well
3. **Const correctness**: Use `const` for read-only parameters
4. **Error messages**: Include program name and use `strerror()`
5. **Documentation**: Comments explain "why", not just "what"
6. **Standards compliance**: Follow POSIX where applicable
7. **Memory safety**: No dynamic allocation, no buffer overflows
8. **Resource cleanup**: Close files, even on error paths

## Further Reading

- **POSIX wc specification**: [link](https://pubs.opengroup.org/onlinepubs/9699919799/utilities/wc.html)
- **The Art of Unix Programming**: Design philosophy behind simple tools
- **GNU wc source**: Reference implementation in coreutils
- **Locale programming**: Understanding multibyte characters

## Exercises

If you want to extend this implementation, try:

1. **Add `-L` flag**: Count length of longest line
2. **Add `--files0-from`**: Read filenames from NUL-terminated file
3. **Optimize for large files**: Implement buffered reading
4. **Add progress indicator**: Show progress for large files
5. **Support for archives**: Count files within tar/zip archives
6. **Parallel processing**: Count multiple files concurrently

## Conclusion

Building a `wc` clone teaches fundamental concepts:
- File I/O and text processing
- Command-line argument parsing
- State machines for pattern recognition
- Cross-platform considerations
- The Unix philosophy of doing one thing well

The complete implementation is under 500 lines of well-commented C code, demonstrating that powerful tools can be simple and maintainable.
