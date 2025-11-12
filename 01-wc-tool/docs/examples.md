# ccwc Practical Examples

This guide provides hands-on examples demonstrating how to use `ccwc` effectively in various scenarios.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Working with Different File Types](#working-with-different-file-types)
3. [Pipeline Composition](#pipeline-composition)
4. [Practical Tasks](#practical-tasks)
5. [Advanced Techniques](#advanced-techniques)
6. [Scripting with ccwc](#scripting-with-ccwc)
7. [Performance Comparisons](#performance-comparisons)
8. [Troubleshooting](#troubleshooting)

## Basic Usage

### Counting Everything (Default Mode)

```bash
$ ccwc file.txt
      10      50     300 file.txt
#   lines   words   bytes
```

Without any flags, `ccwc` shows lines, words, and bytes - the most commonly needed statistics.

### Counting Specific Metrics

**Lines:**
```bash
$ ccwc -l file.txt
      10 file.txt
```

**Words:**
```bash
$ ccwc -w file.txt
      50 file.txt
```

**Bytes:**
```bash
$ ccwc -c file.txt
     300 file.txt
```

**Characters (multibyte aware):**
```bash
$ ccwc -m file.txt
     295 file.txt
```

Note: Character count may differ from byte count for UTF-8 files.

### Multiple Flags

Combine flags to show only the metrics you need:

```bash
# Lines and words
$ ccwc -l -w file.txt
      10      50 file.txt

# Lines and bytes
$ ccwc -l -c file.txt
      10     300 file.txt
```

### Multiple Files

Process several files at once:

```bash
$ ccwc file1.txt file2.txt file3.txt
      10      50     300 file1.txt
      20     100     600 file2.txt
      15      75     450 file3.txt
```

### Long Options

Use descriptive long option names:

```bash
$ ccwc --lines --words --bytes file.txt
      10      50     300 file.txt

# Same as
$ ccwc -l -w -c file.txt
      10      50     300 file.txt
```

## Working with Different File Types

### Text Files

```bash
# README files
$ ccwc -l README.md
     150 README.md

# Configuration files
$ ccwc -l /etc/hosts
      25 /etc/hosts

# Log files
$ ccwc -l /var/log/syslog
    5000 /var/log/syslog
```

### Source Code Files

```bash
# Count lines in a C file
$ ccwc -l program.c
     500 program.c

# Count all C files in directory
$ ccwc -l *.c
     500 main.c
     300 utils.c
     200 parser.c

# Count lines in all source files
$ ccwc -l src/*.c src/*.h
     500 src/main.c
     300 src/utils.c
     100 src/main.h
      50 src/utils.h
```

### CSV and Data Files

```bash
# Count rows in CSV (minus header)
$ tail -n +2 data.csv | ccwc -l
     999

# Count fields in first row
$ head -n 1 data.csv | tr ',' '\n' | ccwc -l
      10
```

### Empty Files

```bash
$ touch empty.txt
$ ccwc empty.txt
       0       0       0 empty.txt
```

All counters show zero for empty files.

### Files Without Trailing Newline

```bash
$ echo -n "no newline here" > nonl.txt
$ ccwc -l nonl.txt
       0 nonl.txt

$ ccwc -w nonl.txt
       3 nonl.txt
```

Lines are counted by newline characters, so a file without a trailing newline shows 0 lines.

## Pipeline Composition

### Reading from Standard Input

**From a pipe:**
```bash
$ cat file.txt | ccwc -l
      10
```

**From a here-document:**
```bash
$ ccwc -w << EOF
> This is a test
> with multiple lines
> EOF
       6
```

**From a here-string (bash):**
```bash
$ ccwc -w <<< "hello world"
       2
```

### Combining with Other Commands

**Count files in directory:**
```bash
$ ls | ccwc -l
      42
```

**Count processes:**
```bash
$ ps aux | ccwc -l
     150
```

**Count grep matches:**
```bash
$ grep -i "error" logfile.txt | ccwc -l
      25
```

**Count unique words:**
```bash
$ tr '[:space:]' '\n' < file.txt | sort | uniq | ccwc -l
    1500
```

### Processing Compressed Files

**Gzip:**
```bash
$ gunzip -c file.txt.gz | ccwc -l
    1000
```

**Bzip2:**
```bash
$ bunzip2 -c file.txt.bz2 | ccwc -l
    1000
```

**Xz:**
```bash
$ xzcat file.txt.xz | ccwc -l
    1000
```

### Network Data

**Count lines from URL:**
```bash
$ curl -s https://example.com/data.txt | ccwc -l
    5000
```

**Count HTTP headers:**
```bash
$ curl -sI https://example.com | ccwc -l
      15
```

## Practical Tasks

### Counting Lines of Code

**Single project:**
```bash
$ find src/ -name "*.c" -o -name "*.h" | xargs ccwc -l
```

**By file type:**
```bash
$ find . -name "*.c" -exec ccwc -l {} + | tail -1
    5000 total

$ find . -name "*.h" -exec ccwc -l {} + | tail -1
    1000 total
```

**Excluding blank lines:**
```bash
$ grep -v '^$' file.c | ccwc -l
     450
```

**Excluding comments:**
```bash
$ grep -v '^\s*//' file.c | grep -v '^$' | ccwc -l
     400
```

### Log Analysis

**Count error messages:**
```bash
$ grep ERROR logfile.txt | ccwc -l
      25
```

**Count by log level:**
```bash
$ for level in DEBUG INFO WARN ERROR; do
>   echo -n "$level: "
>   grep $level logfile.txt | ccwc -l
> done
DEBUG:     1500
INFO:       800
WARN:       150
ERROR:       25
```

**Count logs by date:**
```bash
$ grep "2024-01-15" logfile.txt | ccwc -l
     500
```

### Data Validation

**Verify line count:**
```bash
expected=1000
actual=$(ccwc -l < data.txt)
if [ $actual -eq $expected ]; then
    echo "File has correct number of lines"
else
    echo "Expected $expected lines, got $actual"
fi
```

**Check for empty files:**
```bash
$ if [ $(ccwc -c < file.txt) -eq 0 ]; then
>   echo "File is empty"
> fi
```

### Comparing Files

**Line count difference:**
```bash
$ diff -u <(ccwc -l file1.txt) <(ccwc -l file2.txt)
```

**Find largest file by lines:**
```bash
$ ccwc -l *.txt | sort -n | tail -1
  10000 largest.txt
```

**Find smallest file by bytes:**
```bash
$ ccwc -c *.txt | sort -n | head -2
       0 empty.txt
     100 small.txt
```

## Advanced Techniques

### Word Frequency Analysis

**Most common word count:**
```bash
$ tr '[:space:]' '\n' < file.txt | \
  grep -v '^$' | \
  sort | \
  uniq -c | \
  sort -rn | \
  head -10
    150 the
    100 and
     75 is
    ...
```

**Total unique words:**
```bash
$ tr '[:space:]' '\n' < file.txt | \
  sort -u | \
  ccwc -l
    1500
```

### Average Line Length

```bash
$ bytes=$(ccwc -c < file.txt)
$ lines=$(ccwc -l < file.txt)
$ echo "scale=2; $bytes / $lines" | bc
   45.67
```

### Processing Multiple Directories

**Count by directory:**
```bash
$ for dir in src/ test/ docs/; do
>   echo -n "$dir: "
>   find $dir -type f -name "*.c" -exec cat {} \; | ccwc -l
> done
src/:  5000
test/:  2000
docs/:    50
```

**Recursive count:**
```bash
$ find . -type f -name "*.txt" -exec cat {} \; | ccwc -l
  15000
```

### Monitoring File Growth

**Watch log file growth:**
```bash
$ while true; do
>   clear
>   ccwc -l /var/log/application.log
>   sleep 5
> done
```

**Track growth rate:**
```bash
$ prev=$(ccwc -l < logfile.txt)
$ sleep 60
$ curr=$(ccwc -l < logfile.txt)
$ echo "Growth: $((curr - prev)) lines/minute"
Growth: 50 lines/minute
```

## Scripting with ccwc

### Bash Function for Excluding Comments

```bash
count_code() {
    local file=$1
    grep -v '^\s*//' "$file" | \
    grep -v '^\s*\*' | \
    grep -v '^\s*$' | \
    ccwc -l
}

$ count_code program.c
     450
```

### Shell Script for Project Statistics

```bash
#!/bin/bash

echo "Project Statistics"
echo "=================="
echo ""

total_files=$(find src/ -name "*.c" -o -name "*.h" | wc -l)
total_lines=$(find src/ -name "*.c" -o -name "*.h" -exec cat {} \; | ccwc -l)
total_words=$(find src/ -name "*.c" -o -name "*.h" -exec cat {} \; | ccwc -w)

echo "Total files: $total_files"
echo "Total lines: $total_lines"
echo "Total words: $total_words"
echo "Average lines per file: $((total_lines / total_files))"
```

### Makefile Integration

```makefile
.PHONY: stats

stats:
	@echo "Code Statistics:"
	@echo "==============="
	@echo -n "C files: "
	@find src/ -name "*.c" | ccwc -l
	@echo -n "Header files: "
	@find src/ -name "*.h" | ccwc -l
	@echo -n "Total lines: "
	@find src/ -name "*.[ch]" -exec cat {} \; | ccwc -l
```

### Git Integration

**Count changes in last commit:**
```bash
$ git diff HEAD~1 HEAD | grep '^+' | ccwc -l
      50

$ git diff HEAD~1 HEAD | grep '^-' | ccwc -l
      30
```

**Count files changed:**
```bash
$ git diff HEAD~1 HEAD --name-only | ccwc -l
       5
```

## Performance Comparisons

### ccwc vs. wc

**Speed test:**
```bash
$ time wc -l largefile.txt
    1000000 largefile.txt
real	0m0.145s

$ time ccwc -l largefile.txt
    1000000 largefile.txt
real	0m0.152s
```

Both are similarly fast for large files.

### Byte Mode vs. Character Mode

**Byte mode (fast):**
```bash
$ time ccwc -c largefile.txt
 50000000 largefile.txt
real	0m0.150s
```

**Character mode (accurate but slower):**
```bash
$ time ccwc -m largefile.txt
 48000000 largefile.txt
real	0m0.450s
```

Character mode is slower due to multibyte encoding conversions.

### Single Pass vs. Multiple Passes

**Single command (efficient):**
```bash
$ time ccwc -l -w -c file.txt
      10      50     300 file.txt
real	0m0.005s
```

**Multiple commands (wasteful):**
```bash
$ time (ccwc -l file.txt; ccwc -w file.txt; ccwc -c file.txt)
real	0m0.015s
```

Always combine flags in a single command for better performance.

## Troubleshooting

### Character Count Doesn't Match Byte Count

**Problem:**
```bash
$ ccwc -c utf8.txt
      20 utf8.txt

$ ccwc -m utf8.txt
      18 utf8.txt
```

**Explanation:** File contains multibyte characters (e.g., UTF-8).

**Solution:** This is expected. Use `-c` for bytes, `-m` for characters.

### Line Count Seems Wrong

**Problem:**
```bash
$ cat file.txt
Line 1
Line 2

$ ccwc -l file.txt
       1 file.txt
```

**Explanation:** File is missing trailing newline after "Line 2".

**Verification:**
```bash
$ od -c file.txt | tail
...
L   i   n   e       2
```

**Solution:** Lines are counted by newline characters. Add trailing newline if needed:
```bash
$ echo >> file.txt
$ ccwc -l file.txt
       2 file.txt
```

### Permission Denied Errors

**Problem:**
```bash
$ ccwc /etc/shadow
ccwc: /etc/shadow: No such file or directory
```

**Solution:** Check file permissions:
```bash
$ ls -l /etc/shadow
-rw------- 1 root root 1234 Jan 1 00:00 /etc/shadow

$ sudo ccwc /etc/shadow
      50 /etc/shadow
```

### Inconsistent Results for Binary Files

**Problem:**
```bash
$ ccwc -m binary.dat
ccwc: binary.dat: Invalid or incomplete multibyte or wide character
```

**Solution:** Use `-c` (byte mode) for binary files:
```bash
$ ccwc -c binary.dat
  1048576 binary.dat
```

### Pipeline Shows No Filename

**Problem:**
```bash
$ cat file.txt | ccwc -l
      10
```

**Expected:**
```bash
$ ccwc -l file.txt
      10 file.txt
```

**Explanation:** When reading from stdin, there's no filename to display.

**Workaround:** Process the file directly instead of using `cat`.

## Summary

Key takeaways:

1. **Default mode** (`ccwc file.txt`) shows lines, words, and bytes
2. **Combine flags** (`-l -w -c`) for multiple metrics in one pass
3. **Use `-c`** for bytes (fast), **`-m`** for characters (accurate)
4. **Pipeline friendly** - works seamlessly with other Unix tools
5. **Multiple files** - process many files efficiently
6. **Scripting** - integrate into bash scripts and Makefiles
7. **Performance** - single-pass algorithms are fast

For implementation details, see `implementation.md`.
For algorithm deep-dive, see `algorithms.md`.

## Quick Reference

```bash
# Basic counts
ccwc -l file.txt          # Lines
ccwc -w file.txt          # Words
ccwc -c file.txt          # Bytes
ccwc -m file.txt          # Characters

# Default (lines + words + bytes)
ccwc file.txt

# From stdin
cat file.txt | ccwc -l
ccwc -l < file.txt

# Multiple files
ccwc -l *.txt

# Long options
ccwc --lines --words file.txt

# Pipeline composition
find . -name "*.c" -exec cat {} \; | ccwc -l
```
