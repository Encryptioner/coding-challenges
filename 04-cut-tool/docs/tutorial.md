# Cut Tool Tutorial

A comprehensive guide to understanding and implementing the Unix `cut` command.

## Table of Contents

1. [Introduction](#introduction)
2. [Understanding the Problem](#understanding-the-problem)
3. [Core Concepts](#core-concepts)
4. [Implementation Walkthrough](#implementation-walkthrough)
5. [Testing Strategy](#testing-strategy)
6. [Common Pitfalls](#common-pitfalls)

## Introduction

The `cut` command is a powerful Unix utility that extracts sections from each line of input. It's commonly used in shell scripts and command pipelines for text processing tasks like:

- Extracting columns from CSV files
- Parsing log files
- Processing configuration files
- Data transformation in pipelines

## Understanding the Problem

### What Does Cut Do?

Cut operates on each line of text independently and extracts:
- **Fields** - Delimited sections (like columns in a CSV)
- **Bytes** - Specific byte positions
- **Characters** - Specific character positions

### Real-World Example

Consider this tab-separated data:
```
John    Smith   30    Engineer
Jane    Doe     28    Designer
```

To extract just names (fields 1-2):
```bash
cut -f 1-2 data.txt
# Output:
# John    Smith
# Jane    Doe
```

To extract from CSV:
```bash
echo "John,Smith,30,Engineer" | cut -f 1,4 -d ,
# Output: John,Engineer
```

## Core Concepts

### 1. Operating Modes

Cut has three mutually exclusive modes:

#### Field Mode (`-f`)
- Splits lines by a delimiter (default: TAB)
- Extracts specified field numbers
- Most common mode for structured data

```bash
# Extract field 2 from CSV
echo "a,b,c,d" | cut -f 2 -d ,
# Output: b
```

#### Byte Mode (`-b`)
- Extracts specific byte positions
- Each byte counted as position 1, 2, 3...
- Works at raw byte level

```bash
# Extract bytes 1-5
echo "Hello World" | cut -b 1-5
# Output: Hello
```

#### Character Mode (`-c`)
- Similar to byte mode for ASCII
- Differs for multi-byte characters (UTF-8)
- Counts characters, not bytes

```bash
# Extract characters 1-5
echo "Hello World" | cut -c 1-5
# Output: Hello
```

### 2. Range Specification

Cut uses a flexible syntax for specifying positions:

| Syntax | Meaning | Example |
|--------|---------|---------|
| `N` | Single position N | `cut -f 3` → field 3 |
| `N-M` | Range from N to M | `cut -f 2-5` → fields 2,3,4,5 |
| `N-` | From N to end | `cut -f 3-` → field 3 onwards |
| `-M` | From start to M | `cut -f -3` → fields 1,2,3 |
| `N,M` | Multiple positions | `cut -f 1,3,5` → fields 1,3,5 |
| `N-M,X-Y` | Multiple ranges | `cut -f 1-3,7-9` → combined |

### 3. Delimiters

By default, cut uses TAB as the field delimiter, but you can specify any single character:

```bash
# Colon-delimited (like /etc/passwd)
cut -f 1,3 -d : /etc/passwd

# Comma-delimited (CSV)
cut -f 2,4 -d , data.csv

# Space-delimited
cut -f 1 -d ' ' data.txt
```

### 4. Suppress Mode (`-s`)

The `-s` flag suppresses lines that don't contain the delimiter:

```bash
# File with mixed content
cat data.txt
# Line with tabs: field1    field2    field3
# Line without tabs: no delimiters here

# Without -s (prints both lines)
cut -f 1 data.txt
# Output:
# field1
# no delimiters here

# With -s (only lines with delimiter)
cut -f 1 -s data.txt
# Output:
# field1
```

## Implementation Walkthrough

### Step 1: Data Structures

Start with clear data structures:

```c
typedef enum {
    MODE_FIELDS,
    MODE_BYTES,
    MODE_CHARS
} CutMode;

typedef struct {
    int start;
    int end;  // -1 means to end of line
} Range;

typedef struct {
    CutMode mode;
    char delimiter;
    bool suppress_no_delim;
    Range ranges[MAX_RANGES];
    int num_ranges;
} Config;
```

**Why this design?**
- `CutMode` enum makes mode selection clear
- `Range` struct handles all range types uniformly
- `Config` bundles all settings together

### Step 2: Range Parsing

The most complex part is parsing range specifications:

```c
int parse_range(const char *str, Range *range) {
    // Handle four cases:
    // 1. "N"    → single position
    // 2. "N-M"  → range
    // 3. "N-"   → from N to end
    // 4. "-M"   → from start to M

    char *dash = strchr(str, '-');

    if (dash == NULL) {
        // Case 1: Single number "5"
        range->start = range->end = parse_number(str);
    } else if (dash == str) {
        // Case 4: "-5" means 1-5
        range->start = 1;
        range->end = parse_number(dash + 1);
    } else if (*(dash + 1) == '\0') {
        // Case 3: "5-" means 5 to end
        range->start = parse_number(str);
        range->end = -1;  // Special: -1 means "to end"
    } else {
        // Case 2: "3-7"
        range->start = parse_number_before_dash(str);
        range->end = parse_number_after_dash(dash + 1);
    }
}
```

**Key insight:** Using `-1` for "to end" simplifies later logic.

### Step 3: Field Extraction

Field mode splits by delimiter and selects fields:

```c
void cut_fields(const char *line, const Config *config) {
    // 1. Check for delimiter (if -s flag set)
    if (config->suppress_no_delim &&
        strchr(line, config->delimiter) == NULL) {
        return;  // Skip this line
    }

    // 2. Split line into fields
    char *fields[MAX_FIELDS];
    int field_count = split_by_delimiter(line,
                                         config->delimiter,
                                         fields);

    // 3. Output selected fields
    bool first = true;
    for (int i = 1; i <= field_count; i++) {
        if (in_range(config, i)) {
            if (!first) printf("%c", config->delimiter);
            printf("%s", fields[i - 1]);
            first = false;
        }
    }
    printf("\n");
}
```

**Key decisions:**
- Fields are 1-indexed (Unix convention)
- Preserve the delimiter between output fields
- Handle empty fields correctly

### Step 4: Byte/Character Extraction

Simpler than field extraction:

```c
void cut_bytes(const char *line, const Config *config) {
    size_t len = strlen(line);

    for (size_t i = 0; i < len; i++) {
        if (in_range(config, i + 1)) {  // Convert to 1-indexed
            putchar(line[i]);
        }
    }
    printf("\n");
}
```

**Note:** Character mode would need UTF-8 handling for proper multi-byte support.

### Step 5: Main Loop

Process input line by line:

```c
int main() {
    // 1. Parse command-line options
    Config config = parse_options(argc, argv);

    // 2. Process each input file (or stdin)
    for (each file) {
        FILE *fp = open_file(file);

        char line[MAX_LINE];
        while (fgets(line, sizeof(line), fp)) {
            process_line(line, &config);
        }

        fclose(fp);
    }
}
```

## Testing Strategy

### Unit Testing Approach

Test each component independently:

#### 1. Range Parsing Tests
```bash
# Single number
test_range "5" → {start: 5, end: 5}

# Range
test_range "3-7" → {start: 3, end: 7}

# Open-ended
test_range "5-" → {start: 5, end: -1}
test_range "-5" → {start: 1, end: 5}

# Complex list
test_range "1,3,5-7" → [{1,1}, {3,3}, {5,7}]
```

#### 2. Field Extraction Tests
```bash
# Basic field extraction
echo -e "a\tb\tc" | cut -f 2
# Expected: b

# Multiple fields
echo -e "a\tb\tc\td" | cut -f 1,3
# Expected: a    c

# Field range
echo -e "a\tb\tc\td" | cut -f 2-3
# Expected: b    c
```

#### 3. Delimiter Tests
```bash
# Custom delimiter
echo "a,b,c,d" | cut -f 2,4 -d ,
# Expected: b,d

# Delimiter not in line
echo "no-commas" | cut -f 1 -d ,
# Expected: no-commas

# With -s flag
echo "no-commas" | cut -f 1 -s -d ,
# Expected: (empty - line suppressed)
```

#### 4. Edge Cases
```bash
# Empty field
echo "a,,c" | cut -f 2 -d ,
# Expected: (empty string)

# Field beyond count
echo "a,b,c" | cut -f 5 -d ,
# Expected: (nothing for field 5)

# Empty line
echo "" | cut -f 1
# Expected: (empty line)

# Very long line
generate_line(100000) | cut -f 1
# Should handle without error
```

### Integration Testing

Test real-world scenarios:

```bash
# CSV processing
cat people.csv
# Name,Age,City,Job
# John,30,NYC,Engineer
# Jane,28,LA,Designer

cut -f 1,4 -d , people.csv
# Expected:
# Name,Job
# John,Engineer
# Jane,Designer

# Log file parsing
cat access.log
# 192.168.1.1 - - [01/Jan/2024] "GET /" 200
# 192.168.1.2 - - [01/Jan/2024] "POST /api" 201

cut -f 1 -d ' ' access.log
# Expected:
# 192.168.1.1
# 192.168.1.2

# Pipeline usage
cat /etc/passwd | cut -f 1,7 -d : | head -5
# username:shell pairs for first 5 users
```

## Common Pitfalls

### 1. Off-by-One Errors

**Problem:** Fields and bytes are 1-indexed, not 0-indexed.

```c
// ❌ WRONG
for (int i = 0; i < field_count; i++) {
    if (in_range(config, i)) {  // Wrong: uses 0-based index
        ...
    }
}

// ✅ CORRECT
for (int i = 1; i <= field_count; i++) {
    if (in_range(config, i)) {  // Correct: 1-based
        ...
    }
}
```

### 2. Delimiter in Output

**Problem:** Forgetting to preserve delimiter between output fields.

```c
// ❌ WRONG - Fields run together
for (int i = 1; i <= field_count; i++) {
    if (in_range(config, i)) {
        printf("%s", fields[i - 1]);  // No delimiter!
    }
}
// Output: "JohnSmith" instead of "John,Smith"

// ✅ CORRECT - Add delimiter between fields
bool first = true;
for (int i = 1; i <= field_count; i++) {
    if (in_range(config, i)) {
        if (!first) printf("%c", config->delimiter);
        printf("%s", fields[i - 1]);
        first = false;
    }
}
```

### 3. Newline Handling

**Problem:** Including newlines in field content.

```c
// ❌ WRONG - Newline gets stored in last field
char *fields[MAX];
split_by_delimiter(line, delimiter, fields);
// If line is "a,b,c\n", last field is "c\n"

// ✅ CORRECT - Strip newline first
size_t len = strlen(line);
if (len > 0 && line[len-1] == '\n') {
    line[len-1] = '\0';
}
split_by_delimiter(line, delimiter, fields);
```

### 4. Empty Fields

**Problem:** Not handling empty fields correctly.

```bash
# Input: "a,,c" (empty middle field)
echo "a,,c" | cut -f 2 -d ,
# Should output empty line, not skip it
```

```c
// ✅ Handle empty fields
while (*ptr) {
    if (*ptr == delimiter) {
        *ptr = '\0';
        fields[count++] = field_start;  // Even if empty!
        field_start = ptr + 1;
    }
    ptr++;
}
fields[count++] = field_start;  // Last field
```

### 5. Memory Management

**Problem:** Memory leaks or buffer overflows.

```c
// ❌ WRONG - Memory leak
void cut_fields(const char *line, const Config *config) {
    char *line_copy = strdup(line);
    // ... use line_copy ...
    // Forgot to free!
}

// ✅ CORRECT - Always free
void cut_fields(const char *line, const Config *config) {
    char *line_copy = strdup(line);
    if (!line_copy) return;

    // ... use line_copy ...

    free(line_copy);  // Always free
}
```

## Performance Considerations

### Time Complexity

- **Range parsing:** O(r) where r = number of ranges
- **Field extraction:** O(n) where n = line length
- **Per line:** O(n × r) in worst case
- **Overall:** O(l × n × r) for l lines

### Space Complexity

- **Line buffer:** O(MAX_LINE_LENGTH)
- **Fields array:** O(MAX_FIELDS)
- **Ranges array:** O(MAX_RANGES)
- **Overall:** O(1) - constant space per line

### Optimization Tips

1. **Use buffered I/O** - `fgets()` is already buffered
2. **Avoid unnecessary copying** - Work with pointers where possible
3. **Early exit** - Skip lines early with `-s` flag
4. **Sorted ranges** - Could optimize range checking with binary search

## Advanced Topics

### UTF-8 Support

For proper character mode (`-c`) with UTF-8:

```c
int count_utf8_chars(const char *str) {
    int count = 0;
    while (*str) {
        // UTF-8 bytes start with:
        // 0xxxxxxx (1-byte)
        // 110xxxxx (2-byte start)
        // 1110xxxx (3-byte start)
        // 11110xxx (4-byte start)
        if ((*str & 0xC0) != 0x80) {
            count++;  // Start of character
        }
        str++;
    }
    return count;
}
```

### Output Delimiter

GNU cut supports `--output-delimiter` to change the output delimiter:

```bash
# Input uses tabs, output uses commas
cut -f 1,3 --output-delimiter=, data.txt
```

Implementation:
```c
typedef struct {
    // ... existing fields ...
    char *output_delimiter;  // If NULL, use input delimiter
} Config;

// When outputting:
char *delim = config->output_delimiter ?
              config->output_delimiter :
              &config->delimiter;
printf("%s", delim);
```

## Summary

Key takeaways:

1. **Cut operates line-by-line** - Process independently
2. **Three modes are mutually exclusive** - Only one at a time
3. **Fields are 1-indexed** - Follow Unix convention
4. **Range syntax is flexible** - Support all combinations
5. **Preserve delimiters** - Between output fields
6. **Handle edge cases** - Empty fields, missing delimiters, etc.

The implementation follows Unix philosophy:
- Do one thing well (extract fields/bytes/chars)
- Work with text streams
- Compose with other tools
- Simple, predictable behavior

## Next Steps

- Implement `--complement` to invert selection
- Add `--output-delimiter` support
- Improve UTF-8 character mode
- Add performance benchmarks
- Support zero-terminated lines (`-z`)

Happy cutting! 🔪
