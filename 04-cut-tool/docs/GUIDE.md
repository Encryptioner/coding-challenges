# cccut - Comprehensive User Guide

This guide provides detailed instructions on using cccut effectively for various text processing tasks.

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Basic Concepts](#basic-concepts)
4. [Field Mode (-f)](#field-mode--f)
5. [Character Mode (-c)](#character-mode--c)
6. [Delimiters (-d)](#delimiters--d)
7. [Advanced Techniques](#advanced-techniques)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

## Introduction

`cccut` is a text extraction tool that follows the Unix philosophy: do one thing and do it well. It excels at extracting specific portions of text from structured data.

### When to Use cccut

Use `cccut` when you need to:
- Extract specific columns from CSV, TSV, or other delimited files
- Get specific character positions from fixed-width data
- Parse structured log files
- Extract fields from configuration files
- Process command output in pipelines

### When NOT to Use cccut

Consider alternatives for:
- Complex text transformations → use `awk` or `sed`
- Pattern-based extraction → use `grep` with `-o`
- Multiple delimiters or complex parsing → use `awk`
- Full CSV parsing with quoted fields → use dedicated CSV tools

## Installation

### Compile from Source

```bash
# Clone or download the source
cd 04-cut-tool

# Compile
gcc -o cccut cccut.c -Wall -Wextra -O2

# Install (optional)
sudo cp cccut /usr/local/bin/
```

### Verify Installation

```bash
./cccut -h
```

## Basic Concepts

### Fields vs Characters

**Fields** are segments of text separated by a delimiter:
```
"Alice:25:Engineer" with delimiter ':' has 3 fields:
  Field 1: Alice
  Field 2: 25
  Field 3: Engineer
```

**Characters** are individual letters/symbols in the text:
```
"Hello" has 5 characters:
  Char 1: H
  Char 2: e
  Char 3: l
  Char 4: l
  Char 5: o
```

### Indexing

Both fields and characters are **1-indexed** (start counting from 1, not 0):
```bash
# "A:B:C:D"
# Field 1 = A, Field 2 = B, Field 3 = C, Field 4 = D

echo "A:B:C:D" | ./cccut -d':' -f1    # Output: A
echo "A:B:C:D" | ./cccut -d':' -f2    # Output: B
```

## Field Mode (-f)

### Basic Field Selection

Select a single field:
```bash
echo "Alice,25,Engineer" | ./cccut -d',' -f1
# Output: Alice

echo "Alice,25,Engineer" | ./cccut -d',' -f2
# Output: 25
```

### Multiple Fields

Select multiple fields with commas:
```bash
echo "A,B,C,D,E" | ./cccut -d',' -f1,3,5
# Output: A,C,E

echo "A,B,C,D,E" | ./cccut -d',' -f2,3
# Output: B,C
```

### Field Ranges

Select a range of fields:
```bash
# Fields 2 through 4
echo "A,B,C,D,E,F" | ./cccut -d',' -f2-4
# Output: B,C,D

# Fields 1 through 3
echo "A,B,C,D,E,F" | ./cccut -d',' -f1-3
# Output: A,B,C

# From field 3 to the end
echo "A,B,C,D,E,F" | ./cccut -d',' -f3-
# Output: C,D,E,F

# From beginning to field 3
echo "A,B,C,D,E,F" | ./cccut -d',' -f-3
# Output: A,B,C
```

### Combining Ranges and Individual Fields

Mix ranges and individual selections:
```bash
echo "A,B,C,D,E,F,G,H" | ./cccut -d',' -f1,3-5,8
# Output: A,C,D,E,H

echo "A,B,C,D,E,F,G,H" | ./cccut -d',' -f1-2,5,7-8
# Output: A,B,E,G,H
```

### Lines Without Delimiters

By default, lines without the delimiter are printed as-is:
```bash
cat file.txt
# Line with:delimiters:here
# Line without delimiters
# Another:line:with:delimiters

./cccut -d':' -f1 file.txt
# Output:
# Line with
# Line without delimiters
# Another
```

Use `-s` to suppress lines without delimiters:
```bash
./cccut -d':' -f1 -s file.txt
# Output:
# Line with
# Another
```

## Character Mode (-c)

### Basic Character Selection

Select specific character positions:
```bash
echo "Hello World" | ./cccut -c1
# Output: H

echo "Hello World" | ./cccut -c7
# Output: W
```

### Character Ranges

```bash
# First 5 characters
echo "Hello World" | ./cccut -c1-5
# Output: Hello

# Characters 7 to 11
echo "Hello World" | ./cccut -c7-11
# Output: World

# From character 7 to end
echo "Hello World" | ./cccut -c7-
# Output: World

# First 5 characters (alternative syntax)
echo "Hello World" | ./cccut -c-5
# Output: Hello
```

### Multiple Character Selections

```bash
echo "Hello World" | ./cccut -c1,3,5,7,9,11
# Output: HloWrd

echo "Hello World" | ./cccut -c1-5,7-11
# Output: HelloWorld
```

### Practical Character Mode Uses

Extract timestamps:
```bash
echo "2024-01-15 10:30:45 INFO: User logged in" | ./cccut -c1-19
# Output: 2024-01-15 10:30:45
```

Extract fixed-width data:
```bash
# Fixed-width format: Name(10 chars), Age(3 chars), City(15 chars)
echo "Alice     25 New York      " | ./cccut -c1-10
# Output: Alice

echo "Alice     25 New York      " | ./cccut -c11-13
# Output: 25

echo "Alice     25 New York      " | ./cccut -c14-28
# Output: New York
```

## Delimiters (-d)

### Default Delimiter (TAB)

Without `-d`, cccut uses TAB as the delimiter:
```bash
printf "A\tB\tC\n" | ./cccut -f2
# Output: B
```

### Custom Delimiters

Common delimiters:
```bash
# Comma
echo "A,B,C" | ./cccut -d',' -f2
# Output: B

# Colon
echo "A:B:C" | ./cccut -d':' -f2
# Output: B

# Pipe
echo "A|B|C" | ./cccut -d'|' -f2
# Output: B

# Space
echo "A B C" | ./cccut -d' ' -f2
# Output: B

# Semicolon
echo "A;B;C" | ./cccut -d';' -f2
# Output: B
```

### Delimiter Notes

- Delimiter must be a **single character**
- Cannot use multi-character delimiters
- The same delimiter is used for output

## Advanced Techniques

### Processing Multiple Files

Process several files at once:
```bash
./cccut -d',' -f1 file1.csv file2.csv file3.csv
```

### Using stdin

Read from stdin with `-` or by omitting filename:
```bash
cat data.csv | ./cccut -d',' -f1-3
# or
./cccut -d',' -f1-3 - < data.csv
# or
./cccut -d',' -f1-3 < data.csv
```

### Pipeline Integration

Combine with other Unix tools:
```bash
# Count unique values in column 2
cat data.csv | ./cccut -d',' -f2 | sort | uniq -c

# Filter then extract
grep "ERROR" app.log | ./cccut -d' ' -f1,4-

# Extract and search
./cccut -d':' -f1 /etc/passwd | grep "^user"

# Chain multiple cuts
echo "A,B:C,D" | ./cccut -d',' -f2 | ./cccut -d':' -f1
# Output: B
```

### Reordering Fields

Extract fields in a different order:
```bash
# Original order: Name,Age,City
echo "Alice,25,NYC" | ./cccut -d',' -f3,1,2
# Output: NYC,Alice,25
```

### Duplicating Fields

Select the same field multiple times:
```bash
echo "Alice,25,NYC" | ./cccut -d',' -f1,1,1
# Output: Alice,Alice,Alice
```

## Common Patterns

### Extract usernames from /etc/passwd

```bash
./cccut -d':' -f1 /etc/passwd
```

### Get email addresses from CSV

```bash
# Format: Name,Email,Phone
./cccut -d',' -f2 contacts.csv
```

### Parse Apache/Nginx logs

```bash
# Extract IP addresses (assuming space-delimited)
./cccut -d' ' -f1 access.log | sort | uniq -c
```

### Extract dates from filenames

```bash
ls | grep "backup-" | ./cccut -c8-17
# backup-2024-01-15.tar.gz → 2024-01-15
```

### Process CSV with header

```bash
# Skip header, extract columns 2 and 4
tail -n +2 data.csv | ./cccut -d',' -f2,4
```

### Extract PATH components

```bash
echo $PATH | tr ':' '\n' | head -5
# Shows first 5 PATH directories

# Or extract specific component
echo $PATH | ./cccut -d':' -f3
```

### Git log processing

```bash
# Extract commit hashes
git log --oneline | ./cccut -c1-7

# Extract commit messages
git log --oneline | ./cccut -c9-
```

### JSON processing (simple cases)

```bash
# Extract values between quotes (very simple JSON only)
echo '{"name":"Alice","age":25}' | ./cccut -d'"' -f4,8
# Output: Alice,25
```

**Note:** For real JSON processing, use `jq` instead.

## Troubleshooting

### Issue: No output

**Cause:** Wrong field number or delimiter

```bash
# Wrong delimiter
echo "A,B,C" | ./cccut -d':' -f2
# Output: A,B,C (no colon found, prints whole line)

# Wrong field number
echo "A,B,C" | ./cccut -d',' -f10
# Output: (empty - field 10 doesn't exist)
```

**Solution:** Verify your delimiter and field count:
```bash
# Check field count
echo "A,B,C" | awk -F',' '{print NF}'
# Output: 3

# Test delimiter
echo "A,B,C" | ./cccut -d',' -f1,2,3
```

### Issue: Unexpected output with spaces

**Cause:** Delimiter confusion

```bash
echo "A, B, C" | ./cccut -d',' -f2
# Output: " B" (includes leading space)
```

**Solution:** Be aware that spaces are part of fields:
```bash
# Trim spaces with another tool
echo "A, B, C" | ./cccut -d',' -f2 | sed 's/^ *//'
# Output: "B"
```

### Issue: Multi-line fields (CSV with quotes)

**Cause:** cccut doesn't handle quoted CSV fields

```bash
echo '"A","B,C","D"' | ./cccut -d',' -f2
# Output: "B (incorrect - breaks on comma inside quotes)
```

**Solution:** Use a proper CSV parser:
```bash
# Use Python
python3 -c "import csv; print(list(csv.reader(['\"A\",\"B,C\",\"D\"'])))"

# Or use specialized tools like csvcut (csvkit)
```

### Issue: Lines not suppressed with -s

**Cause:** Mixing -s with -c mode

```bash
./cccut -c1-5 -s file.txt
# -s has no effect in character mode
```

**Solution:** -s only works with -f (field mode)

### Issue: Range not working

**Cause:** Invalid range syntax

```bash
./cccut -d',' -f5-2 data.csv
# Error: end before start
```

**Solution:** Use correct range format (start <= end):
```bash
./cccut -d',' -f2-5 data.csv
```

## Performance Tips

1. **Process large files efficiently:**
   ```bash
   # Good: Direct file input
   ./cccut -d',' -f1 large_file.csv

   # Less efficient: Using cat
   cat large_file.csv | ./cccut -d',' -f1
   ```

2. **Use -s to filter early:**
   ```bash
   # Skip lines without delimiters early
   ./cccut -d',' -f1 -s messy_data.txt
   ```

3. **Limit field ranges when possible:**
   ```bash
   # Specify exact fields you need
   ./cccut -d',' -f1,5 data.csv

   # Rather than extracting all then filtering
   ./cccut -d',' -f1- data.csv | ...
   ```

## Summary

- Use `-f` for field extraction (delimited data)
- Use `-c` for character extraction (fixed-width data)
- Use `-d` to specify custom delimiters (default: TAB)
- Use `-s` to suppress lines without delimiters
- Ranges are inclusive: `1-5` means positions 1, 2, 3, 4, 5
- cccut excels at simple extraction tasks; use `awk` for complex transformations

For more examples, see [EXAMPLES.md](EXAMPLES.md).
