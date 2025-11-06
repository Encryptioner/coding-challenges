# cccut - Architecture and Implementation

This document explains the internal structure, design decisions, and implementation details of cccut.

## Table of Contents

1. [Overview](#overview)
2. [Code Structure](#code-structure)
3. [Data Structures](#data-structures)
4. [Core Algorithms](#core-algorithms)
5. [Design Decisions](#design-decisions)
6. [Performance Considerations](#performance-considerations)
7. [Limitations](#limitations)
8. [Future Enhancements](#future-enhancements)

## Overview

cccut is a C implementation of the Unix `cut` utility, designed to be:
- **Simple:** Clear, readable code with minimal dependencies
- **Fast:** Efficient processing of large files
- **Educational:** Demonstrates fundamental Unix tool patterns
- **Portable:** Works across Linux, macOS, and BSD systems

### Key Features

- Field extraction with custom delimiters
- Character range extraction
- Support for multiple files and stdin
- Flexible range syntax (N, N-M, N-, -M)
- Line filtering with `-s` flag

## Code Structure

### File Organization

```
cccut.c
├── Headers and Includes
├── Constants and Macros
├── Type Definitions
│   ├── Range
│   ├── RangeList
│   ├── CutMode
│   └── Config
├── Function Declarations
│   ├── print_usage()
│   ├── parse_range()
│   ├── parse_range_list()
│   ├── in_ranges()
│   ├── cut_chars()
│   ├── cut_fields()
│   └── process_file()
└── main()
```

### Module Breakdown

**Parsing Module:**
- `parse_range()` - Parse individual range specifications
- `parse_range_list()` - Parse comma-separated range lists
- Command-line argument parsing with `getopt()`

**Processing Module:**
- `cut_chars()` - Character extraction logic
- `cut_fields()` - Field extraction logic
- `in_ranges()` - Range membership checking

**I/O Module:**
- `process_file()` - Main file processing loop
- stdin/file handling

## Data Structures

### Range Structure

```c
typedef struct {
    int start;      // Starting position (1-indexed)
    int end;        // Ending position (-1 = to end of line)
} Range;
```

**Design rationale:**
- Stores both endpoints for efficient range checking
- Uses `-1` as sentinel value for open-ended ranges (e.g., "5-")
- 1-indexed to match Unix cut behavior

**Memory:** 8 bytes per range (2 × 4-byte ints)

### RangeList Structure

```c
typedef struct {
    Range ranges[MAX_FIELDS];  // Array of ranges
    int count;                  // Number of ranges
} RangeList;
```

**Design rationale:**
- Fixed-size array for simplicity (no dynamic allocation)
- Maximum 1024 ranges (more than sufficient for typical use)
- Count field enables iteration

**Memory:** ~8KB per RangeList

### CutMode Enum

```c
typedef enum {
    MODE_NONE,      // No mode selected
    MODE_FIELDS,    // Field mode (-f)
    MODE_CHARS      // Character mode (-c)
} CutMode;
```

**Design rationale:**
- Clear distinction between operating modes
- Prevents conflicting modes (-f and -c together)
- Enables mode-specific logic

### Config Structure

```c
typedef struct {
    CutMode mode;              // Operating mode
    char delimiter;            // Field delimiter
    RangeList ranges;          // Selection ranges
    bool suppress_no_delim;    // -s flag
} Config;
```

**Design rationale:**
- Centralizes all configuration in one place
- Passed to processing functions for clarity
- Initialized with sensible defaults

## Core Algorithms

### Range Parsing

**Algorithm:** String tokenization and integer parsing

```c
bool parse_range(const char *str, Range *range)
```

**Steps:**
1. Find dash character position
2. Determine range format:
   - "-M": dash at start → range [1, M]
   - "N-M": dash in middle → range [N, M]
   - "N-": dash at end → range [N, ∞]
   - "N": no dash → range [N, N]
3. Parse integers with `atoi()`
4. Validate (start >= 1, end >= start)

**Time Complexity:** O(n) where n = string length
**Space Complexity:** O(1)

### Range List Parsing

**Algorithm:** Comma-separated tokenization

```c
bool parse_range_list(const char *list, RangeList *ranges)
```

**Steps:**
1. Duplicate input string (for safe tokenization)
2. Split on commas with `strtok_r()`
3. Parse each token as a range
4. Store in RangeList
5. Free temporary string

**Time Complexity:** O(n) where n = total string length
**Space Complexity:** O(n) for temporary copy

### Range Membership

**Algorithm:** Linear search through ranges

```c
bool in_ranges(int pos, const RangeList *ranges)
```

**Steps:**
1. Iterate through all ranges
2. For each range, check if pos ∈ [start, end]
3. Handle open-ended ranges (end = -1)
4. Return true on first match

**Time Complexity:** O(r) where r = number of ranges
**Space Complexity:** O(1)

**Optimization opportunity:** Ranges could be sorted and merged for O(log r) binary search.

### Character Extraction

**Algorithm:** Single-pass character selection

```c
void cut_chars(const char *line, const Config *config)
```

**Steps:**
1. Get line length, remove trailing newline
2. Iterate through characters (i = 0 to len-1)
3. For each position (i+1), check if in ranges
4. Print character if selected
5. Print final newline

**Time Complexity:** O(n × r) where n = line length, r = range count
**Space Complexity:** O(1)

### Field Extraction

**Algorithm:** Delimiter-based tokenization

```c
void cut_fields(const char *line, const Config *config)
```

**Steps:**
1. Copy line (tokenization modifies string)
2. Check if delimiter exists (handle with `-s`)
3. Tokenize on delimiter with `strtok_r()`
4. Store fields in array
5. Iterate through fields, print selected ones
6. Use delimiter for output separation
7. Free temporary copy

**Time Complexity:** O(n + f × r) where n = line length, f = field count, r = range count
**Space Complexity:** O(n) for line copy

## Design Decisions

### 1. Fixed-Size Buffers vs Dynamic Allocation

**Decision:** Use fixed-size buffers

**Rationale:**
- Simpler code (no malloc/free management)
- Sufficient for typical use cases
- Predictable memory usage
- Faster for small to medium inputs

**Trade-offs:**
- Line length limited to 4096 characters
- Field count limited to 1024
- Wastes memory for small files
- Cannot handle arbitrary input sizes

**Alternative:** Could use dynamic buffers with `realloc()` for unlimited sizes.

### 2. Range Storage

**Decision:** Store as array of Range structs

**Rationale:**
- Clear representation of user intent
- Easy to validate and manipulate
- Efficient range checking

**Trade-offs:**
- Some redundancy for overlapping ranges
- Linear search for membership checking

**Alternative:** Could merge overlapping ranges or use bitmap for dense ranges.

### 3. String Tokenization

**Decision:** Use `strtok_r()` for field splitting

**Rationale:**
- Standard C library function
- Thread-safe variant
- Simple API

**Trade-offs:**
- Modifies input string (requires copy)
- Cannot handle multi-character delimiters
- Cannot handle quoted fields (CSV with embedded delimiters)

**Alternative:** Could implement custom splitting for more complex cases.

### 4. Error Handling

**Decision:** Print errors to stderr and continue

**Rationale:**
- Matches Unix tool behavior
- Allows processing multiple files even if some fail
- Clear error messages for users

**Implementation:**
```c
if (fp == NULL) {
    fprintf(stderr, "Error: cannot open '%s'\n", argv[i]);
    continue;  // Process next file
}
```

### 5. Single Character Delimiters

**Decision:** Only support single-character delimiters

**Rationale:**
- Matches POSIX cut specification
- Simpler implementation
- Sufficient for most use cases

**Trade-offs:**
- Cannot split on multi-character strings (e.g., " | " or ":::")
- Users must preprocess with `sed` or `awk` for such cases

## Performance Considerations

### Time Complexity

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Parse arguments | O(a) | a = argument count |
| Parse range list | O(n) | n = list string length |
| Process line (chars) | O(l × r) | l = line length, r = ranges |
| Process line (fields) | O(l + f × r) | f = field count |
| Overall | O(L × (l + f × r)) | L = line count |

### Memory Usage

| Component | Size | Notes |
|-----------|------|-------|
| Config | ~8KB | Includes RangeList |
| Line buffer | 4KB | Per-line processing |
| Field array | ~8KB | MAX_FIELDS pointers |
| **Total** | **~20KB** | Plus stack/code |

### Optimization Strategies

**Current:**
- Single-pass processing
- No unnecessary copying (except for tokenization)
- Buffered I/O with `fgets()`

**Potential improvements:**

1. **Range merging:**
   ```c
   // Merge overlapping ranges: 1-5,3-7 → 1-7
   // Reduces membership checks
   ```

2. **Binary search:**
   ```c
   // Sort ranges, use binary search
   // O(log r) instead of O(r) per position
   ```

3. **Bitmap for dense ranges:**
   ```c
   // For ranges like 1-100, use 100-bit bitmap
   // O(1) lookup instead of O(r)
   ```

4. **Memory-mapped I/O:**
   ```c
   // For very large files, use mmap()
   // Reduces system call overhead
   ```

## Limitations

### Current Limitations

1. **Line length:** Maximum 4096 characters
   - **Impact:** Truncates or fails on very long lines
   - **Workaround:** Increase `MAX_LINE_LENGTH`

2. **Field count:** Maximum 1024 fields
   - **Impact:** Cannot process lines with more fields
   - **Workaround:** Increase `MAX_FIELDS`

3. **Range count:** Maximum 1024 ranges
   - **Impact:** Cannot specify more than 1024 ranges
   - **Workaround:** Increase `MAX_FIELDS`

4. **Single-character delimiter:**
   - **Impact:** Cannot split on multi-character sequences
   - **Workaround:** Use `sed` or `awk` preprocessing

5. **No byte mode:**
   - **Impact:** Cannot select by byte position (different from chars in UTF-8)
   - **Workaround:** Use GNU cut with `-b`

6. **No complement mode:**
   - **Impact:** Cannot invert selection (e.g., "all except field 3")
   - **Workaround:** Specify ranges explicitly

7. **No output delimiter:**
   - **Impact:** Output delimiter same as input delimiter
   - **Workaround:** Post-process with `tr` or `sed`

### Comparison with GNU cut

| Feature | cccut | GNU cut |
|---------|-------|---------|
| Field selection (-f) | ✓ | ✓ |
| Character selection (-c) | ✓ | ✓ |
| Byte selection (-b) | ✗ | ✓ |
| Custom delimiter (-d) | ✓ | ✓ |
| Suppress no-delim (-s) | ✓ | ✓ |
| Complement (--complement) | ✗ | ✓ |
| Output delimiter (--output-delimiter) | ✗ | ✓ |
| Zero-terminated (--zero-terminated) | ✗ | ✓ |
| Multi-byte chars | Partial | ✓ |

## Future Enhancements

### Potential Features

1. **Dynamic buffers:**
   - Remove line length and field count limits
   - Use `getline()` for unlimited line length

2. **Range optimization:**
   - Merge overlapping ranges
   - Sort and binary search for faster lookup

3. **Output delimiter:**
   - `--output-delimiter=STRING` option
   - Allow different input/output delimiters

4. **Complement mode:**
   - `--complement` to invert selection
   - Select all except specified ranges

5. **Multiple delimiters:**
   - `-d ' \t'` to split on space or tab
   - Regular expression delimiters

6. **Zero-terminated mode:**
   - `-z` for null-terminated records
   - Useful for filenames with newlines

7. **Unicode support:**
   - Proper handling of multi-byte UTF-8 characters
   - Character vs byte distinction

8. **Streaming mode:**
   - Process extremely large files efficiently
   - Minimal memory footprint

### Code Quality Improvements

1. **Unit tests:**
   - Test each function independently
   - Edge case coverage

2. **Better error messages:**
   - Line numbers in error reports
   - Suggestions for common mistakes

3. **Input validation:**
   - Better range syntax checking
   - Clearer error messages

4. **Documentation:**
   - Inline code comments
   - API documentation

## Testing Strategy

### Test Categories

**1. Unit tests:**
- `parse_range()` with various inputs
- `parse_range_list()` with edge cases
- `in_ranges()` boundary conditions

**2. Integration tests:**
- Complete workflows with sample files
- Pipeline integration
- Error handling

**3. Performance tests:**
- Large file processing
- Many fields/ranges
- Memory usage profiling

**4. Compatibility tests:**
- Compare output with GNU cut
- Cross-platform testing
- Edge case parity

### Example Test Cases

```bash
# Test basic field extraction
echo "A,B,C" | ./cccut -d',' -f2
# Expected: B

# Test range
echo "A,B,C,D,E" | ./cccut -d',' -f2-4
# Expected: B,C,D

# Test open-ended range
echo "A,B,C,D,E" | ./cccut -d',' -f3-
# Expected: C,D,E

# Test character mode
echo "Hello" | ./cccut -c1-3
# Expected: Hel

# Test -s flag
printf "A:B\nNo delimiter\nC:D\n" | ./cccut -d':' -f1 -s
# Expected: A\nC

# Test multiple files
./cccut -d',' -f1 file1.csv file2.csv
# Expected: Combined output

# Test stdin
cat file.csv | ./cccut -d',' -f2
# Expected: Second column
```

## Conclusion

cccut demonstrates fundamental Unix tool design:
- Simple, focused functionality
- Efficient text processing
- Pipeline-friendly interface
- Clear, maintainable code

The implementation prioritizes:
1. **Clarity** over complexity
2. **Simplicity** over features
3. **Performance** for typical use cases
4. **Education** value for learners

For production use, consider GNU cut or specialized tools for advanced features. For learning and typical text processing tasks, cccut is a solid, understandable implementation.

---

For usage information, see [GUIDE.md](GUIDE.md) and [EXAMPLES.md](EXAMPLES.md).
