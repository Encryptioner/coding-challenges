# Implementation Guide: Building ccwc from Scratch

This guide walks through the implementation of `ccwc`, explaining design decisions, algorithms, and code structure step-by-step.

## Table of Contents

1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [Data Structures](#data-structures)
4. [Core Algorithm](#core-algorithm)
5. [Command-Line Parsing](#command-line-parsing)
6. [File vs. Standard Input](#file-vs-standard-input)
7. [Multibyte Character Support](#multibyte-character-support)
8. [Output Formatting](#output-formatting)
9. [Error Handling](#error-handling)
10. [Testing Strategy](#testing-strategy)

## Overview

`ccwc` is a reimplementation of the Unix `wc` (word count) tool. The tool needs to:

1. Count lines, words, characters, and bytes
2. Support multiple command-line flags
3. Read from files or standard input
4. Handle multibyte characters correctly
5. Match the output format of standard `wc`

## Design Philosophy

### Unix Philosophy

The implementation follows the Unix philosophy:

**1. Do one thing and do it well**
- Focus solely on counting text statistics
- No feature creep or unnecessary complexity

**2. Write programs to work together**
- Accept input from stdin for pipeline composition
- Output in standard format for other tools to parse

**3. Use text streams**
- Process text character-by-character
- No assumptions about file size or structure

### Design Goals

| Goal | Implementation |
|------|----------------|
| **Correctness** | Match `wc` behavior exactly |
| **Performance** | Single-pass algorithms |
| **Portability** | POSIX C99, cross-platform |
| **Simplicity** | Clear, readable code |
| **Robustness** | Handle edge cases gracefully |

## Data Structures

### Counts Structure

We use a single structure to hold all count results:

```c
typedef struct {
    long lines;
    long words;
    long chars;
    long bytes;
} Counts;
```

**Why a struct?**

1. **Encapsulation**: Related data grouped together
2. **Return multiple values**: Functions can return all counts at once
3. **Clarity**: Self-documenting code
4. **Extensibility**: Easy to add new counters if needed

**Why `long`?**

- Counts can be very large (millions of lines)
- `long` is at least 32 bits, typically 64 bits
- Matches standard `wc` behavior

### Alternative Approaches Considered

**Global variables:**
```c
long g_lines, g_words, g_chars, g_bytes;  // Bad: global state
```
❌ Makes testing difficult, not thread-safe

**Separate return values:**
```c
void count_file(FILE *fp, long *lines, long *words, ...);  // Ugly
```
❌ Too many parameters, error-prone

**✅ Struct is the best choice** for this use case.

## Core Algorithm

### Single-Pass Counting

The key insight is that we can count everything in a single pass through the file:

```c
Counts count_file(FILE *fp, bool count_bytes, bool count_lines,
                  bool count_words, bool count_chars) {
    Counts counts = {0, 0, 0, 0};
    int c;
    bool in_word = false;

    while ((c = fgetc(fp)) != EOF) {
        /* Count bytes */
        if (count_bytes) {
            counts.bytes++;
        }

        /* Count lines */
        if (count_lines && c == '\n') {
            counts.lines++;
        }

        /* Count words */
        if (count_words) {
            if (isspace(c)) {
                in_word = false;
            } else {
                if (!in_word) {
                    counts.words++;
                    in_word = true;
                }
            }
        }
    }

    return counts;
}
```

### Algorithm Analysis

**Time Complexity:** O(n) where n is the file size
- Each byte is read exactly once
- Constant-time operations per byte

**Space Complexity:** O(1)
- Fixed-size counters
- No buffering of file contents
- Works with arbitrarily large files

### Word Counting Algorithm

Words are defined as sequences of non-whitespace characters:

```
"hello world" = 2 words
"   hello   world   " = 2 words
"" = 0 words
"hello" = 1 word (no trailing newline)
```

**State machine approach:**

```
State: in_word (boolean)

Event: whitespace character
  Action: Set in_word = false

Event: non-whitespace character
  Action: If not in_word, increment count and set in_word = true
```

**Example trace:**

```
Input: "hi there"
       ^
in_word=false, see 'h' → count++, in_word=true (words=1)

Input: "hi there"
        ^
in_word=true, see 'i' → no change (words=1)

Input: "hi there"
          ^
in_word=true, see ' ' → in_word=false (words=1)

Input: "hi there"
           ^
in_word=false, see 't' → count++, in_word=true (words=2)
```

### Line Counting Algorithm

Lines are counted by newline characters (`\n`):

```c
if (c == '\n') {
    counts.lines++;
}
```

**Edge cases:**

1. **Empty file:** 0 lines ✓
2. **File without trailing newline:** Counts lines correctly
3. **File with only newlines:** Counts each newline

**Example:**

```
"hello\n" → 1 line
"hello" → 0 lines
"\n\n\n" → 3 lines
"" → 0 lines
```

This matches standard `wc` behavior.

## Command-Line Parsing

### Using getopt_long

We use POSIX `getopt_long()` for argument parsing:

```c
static struct option long_options[] = {
    {"bytes", no_argument, 0, 'c'},
    {"chars", no_argument, 0, 'm'},
    {"lines", no_argument, 0, 'l'},
    {"words", no_argument, 0, 'w'},
    {"help",  no_argument, 0, 'h'},
    {0, 0, 0, 0}
};

while ((opt = getopt_long(argc, argv, "cmlwh", long_options, NULL)) != -1) {
    switch (opt) {
        case 'c': show_bytes = true; break;
        case 'm': show_chars = true; break;
        case 'l': show_lines = true; break;
        case 'w': show_words = true; break;
        case 'h': usage(argv[0]); return 0;
        default:  usage(argv[0]); return 1;
    }
}
```

**Why getopt_long?**

1. **Standard library**: Available on all POSIX systems
2. **Handles both short and long options**: `-c` and `--bytes`
3. **Automatic error messages**: Invalid options detected
4. **Portable**: Works on Linux, macOS, BSD

### Default Mode

When no flags are specified, show lines, words, and bytes:

```c
if (!show_lines && !show_words && !show_chars && !show_bytes) {
    show_lines = true;
    show_words = true;
    show_bytes = true;
}
```

This matches `wc` behavior:

```bash
$ wc file.txt
  10   50  300 file.txt
#  ^    ^    ^
# lines words bytes
```

### Flag Precedence

When both `-m` (chars) and `-c` (bytes) are specified, `-m` takes precedence:

```c
if (show_chars && show_bytes) {
    show_bytes = false;
}
```

This matches standard `wc` behavior where character count is shown instead of byte count when both are requested.

## File vs. Standard Input

### File Processing

```c
if (filename) {
    fp = fopen(filename, "r");
    if (!fp) {
        fprintf(stderr, "ccwc: %s: No such file or directory\n", filename);
        return;
    }
}
```

**Error handling:**
- Check `fopen()` return value
- Print error message to stderr
- Continue with remaining files

### Standard Input

```c
if (optind >= argc) {
    /* No files specified, read from stdin */
    process_file(NULL, show_lines, show_words, show_chars, show_bytes);
}
```

**Detecting stdin:**

1. **No arguments:** `ccwc` (no files)
2. **Explicit `-`:** `ccwc -l -` (stdin marker)
3. **After options:** `ccwc -l` (no files after options)

### Pipeline Support

Reading from stdin enables pipeline composition:

```bash
# Count lines in output of another command
ls -l | ccwc -l

# Count words in compressed file
gunzip -c file.gz | ccwc -w

# Process multiple stages
cat file.txt | tr '[:lower:]' '[:upper:]' | ccwc -w
```

## Multibyte Character Support

### The Challenge

In UTF-8 and other multibyte encodings:
- One character may be multiple bytes
- Byte count ≠ character count

Example:
```
"café" in UTF-8:
- 4 characters: c, a, f, é
- 5 bytes: 0x63, 0x61, 0x66, 0xC3, 0xA9
```

### Wide Character Functions

For correct character counting, use wide character functions:

```c
if (count_chars) {
    wint_t wc;
    bool was_space = true;

    while ((wc = fgetwc(fp)) != WEOF) {
        counts.chars++;

        if (count_lines && wc == L'\n') {
            counts.lines++;
        }

        if (count_words) {
            if (iswspace(wc)) {
                was_space = true;
            } else {
                if (was_space) {
                    counts.words++;
                }
                was_space = false;
            }
        }
    }
}
```

**Key functions:**

| Function | Purpose | Header |
|----------|---------|--------|
| `fgetwc()` | Read wide character | `<wchar.h>` |
| `iswspace()` | Check if whitespace | `<wctype.h>` |
| `setlocale()` | Set locale | `<locale.h>` |

### Locale Setup

Must set locale before using wide character functions:

```c
setlocale(LC_ALL, "");
```

This respects the user's environment:

```bash
export LC_ALL=en_US.UTF-8
ccwc -m file.txt
```

### Performance Trade-off

**Byte mode (fast):**
- Uses `fgetc()` (byte-by-byte)
- No encoding awareness
- Fast and simple

**Character mode (accurate):**
- Uses `fgetwc()` (multibyte aware)
- Correct for UTF-8, etc.
- Slightly slower due to encoding conversion

**Decision:** Use fast byte mode by default, accurate character mode when `-m` specified.

## Output Formatting

### Format Specification

Match standard `wc` output format:

```
%8ld %8ld %8ld filename
  lines  words  bytes
```

**Implementation:**

```c
void print_counts(Counts counts, const char *filename,
                  bool show_lines, bool show_words,
                  bool show_chars, bool show_bytes) {
    if (show_lines) {
        printf("%8ld", counts.lines);
    }

    if (show_words) {
        printf("%8ld", counts.words);
    }

    if (show_chars) {
        printf("%8ld", counts.chars);
    } else if (show_bytes) {
        printf("%8ld", counts.bytes);
    }

    if (filename) {
        printf(" %s", filename);
    }

    printf("\n");
}
```

### Column Width

Use 8 characters for each column:

```
       7 file.txt         # Right-aligned
     123 file.txt
   12345 file.txt
12345678 file.txt
```

This ensures:
- Columns align when processing multiple files
- Numbers are easy to read
- Matches standard `wc` behavior

### Order of Output

Output order matches the flag order in standard `wc`:

1. Lines (`-l`)
2. Words (`-w`)
3. Characters/Bytes (`-m` or `-c`)
4. Filename

## Error Handling

### File Not Found

```c
fp = fopen(filename, "r");
if (!fp) {
    fprintf(stderr, "ccwc: %s: No such file or directory\n", filename);
    return;  /* Continue with next file */
}
```

**Strategy:**
- Print error to stderr (not stdout)
- Continue processing remaining files
- Don't exit immediately

### Invalid Options

```c
default:
    usage(argv[0]);
    return 1;  /* Exit with error code */
```

`getopt_long()` automatically prints error messages for invalid options.

### Edge Cases

| Case | Behavior |
|------|----------|
| **Empty file** | All counts are 0 |
| **Binary file** | Count bytes/characters correctly |
| **No trailing newline** | Count lines by '\n' only |
| **Very large file** | Process incrementally (no full buffering) |
| **Permission denied** | Print error, continue with next file |

## Testing Strategy

### Test Categories

**1. Basic functionality:**
- Byte count (`-c`)
- Line count (`-l`)
- Word count (`-w`)
- Character count (`-m`)
- Default output (no flags)

**2. Edge cases:**
- Empty files
- Files without trailing newline
- Files with only whitespace
- Very long lines

**3. Input sources:**
- Regular files
- Standard input (pipe)
- Multiple files
- Explicit stdin with `-`

**4. Options:**
- Single flags
- Multiple flags combined
- Long options (`--bytes`, etc.)
- Invalid options

### Test File Creation

```bash
# Empty file
touch empty.txt

# Single line, no newline
echo -n "hello world" > single.txt

# Single line, with newline
echo "hello world" > single_nl.txt

# Multiple lines
cat > multi.txt << 'EOF'
Line 1
Line 2
Line 3
EOF

# UTF-8 multibyte characters
echo "café naïve résumé" > utf8.txt
```

### Comparison Testing

Compare against system `wc`:

```bash
# Test byte count
diff <(wc -c file.txt) <(./ccwc -c file.txt)

# Test all options
for opt in "-l" "-w" "-c" "-m" ""; do
    diff <(wc $opt file.txt) <(./ccwc $opt file.txt) || echo "FAIL: $opt"
done
```

### Automated Test Suite

See `test.sh` for the complete automated test suite with:
- 20+ test cases
- Clear pass/fail indicators
- Expected vs. actual output comparison
- Summary statistics

## Summary

Key implementation decisions:

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Data structure** | `Counts` struct | Clean interface, easy to return multiple values |
| **Algorithm** | Single-pass | Optimal performance, O(n) time, O(1) space |
| **Word counting** | State machine | Simple, correct, efficient |
| **Multibyte support** | Wide char functions | Correct UTF-8 handling, locale-aware |
| **CLI parsing** | `getopt_long` | Standard, portable, supports both short/long options |
| **Input handling** | File + stdin | Composable, follows Unix philosophy |
| **Error handling** | Continue on error | Process all files, report errors separately |
| **Output format** | Match `wc` exactly | Drop-in replacement compatibility |

The implementation is:
- ✅ **Correct**: Matches standard `wc` behavior
- ✅ **Efficient**: Single-pass algorithms
- ✅ **Portable**: POSIX C99, works everywhere
- ✅ **Simple**: ~300 lines of clear code
- ✅ **Robust**: Handles edge cases gracefully

For more examples, see `examples.md`.
For algorithm details, see `algorithms.md`.
