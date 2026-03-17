# Build Your Own sed

This challenge is to build your own `sed` (stream editor), a Unix utility for parsing and transforming text.

## Background

`sed` (stream editor) is one of the earliest and most powerful Unix text processing tools, created by Lee E. McMahon at Bell Labs in 1973-1974. It was designed as a specialized text editor for editing files programmatically, unlike interactive editors like `ed` or `vi`.

The philosophy behind `sed`:
- **Stream-oriented**: Read text line-by-line, process, and output
- **Pattern-action**: Match patterns using regex, perform actions
- **Non-destructive**: Original files unchanged unless specified
- **Composable**: Output can be piped to other tools

`sed` became a cornerstone of the Unix philosophy:
> "Write programs that do one thing and do it well. Write programs to work together. Write programs to handle text streams, because that is a universal interface."

Modern `sed` implementations:
- **GNU sed** - Most common on Linux
- **BSD sed** - Standard on macOS
- **ssed** (Super sed) - Enhanced features

## The Challenge - Building A Stream Editor

In this coding challenge, we're going to build a functional `sed` implementation that can parse commands, match patterns using regular expressions, and transform text line-by-line.

## Step Zero

Set up your development environment. Choose a language with:
- String manipulation and text processing
- Regular expression support
- File I/O operations
- Command-line argument parsing

**Recommended Languages**:
- **C**: The original language, excellent for text processing
- **Go**: Good regex support, clean I/O handling
- **Python**: Excellent regex, simple string operations
- **Rust**: Safety, performance, regex crate

For this challenge, we'll use **C** for authenticity and performance.

## Step 1

In this step, your goal is to read input line-by-line.

Your program should:
1. Read from stdin or file arguments
2. Process text line-by-line (streaming)
3. Output each line (initially unchanged)
4. Handle file not found errors

Test it:
```bash
# Basic pass-through
./sed '' input.txt

# Pipe input
cat input.txt | ./sed ''

# Multiple files
./sed '' file1.txt file2.txt

# Should output file contents unchanged
```

**Key Concepts**:
- Stream processing (don't load entire file into memory)
- Standard input/output streams
- Buffer management for line reading
- Error handling for missing files
- File reading loop patterns

## Step 2

In this step, your goal is to parse `sed` commands from the command line.

Your program should:
1. Parse sed script syntax: `sed 'command' file`
2. Support single quotes, double quotes, and no quotes
3. Handle multiple commands: `sed 'cmd1; cmd2'`
4. Support -e flag for multiple expressions: `sed -e 'cmd1' -e 'cmd2'`
5. Support -f flag for script files: `sed -f script.sed`

Command parsing examples:
```bash
# Single command (no quotes)
sed s/old/new/ file.txt

# Single command (quotes)
sed 's/old/new/' file.txt

# Multiple commands with semicolon
sed 's/old/new/; s/foo/bar/' file.txt

# Multiple -e flags
sed -e 's/old/new/' -e 's/foo/bar/' file.txt

# Script file
sed -f commands.sed file.txt
```

Data structure for parsed commands:
```c
typedef enum {
    CMD_SUBSTITUTE,     // s/regex/replacement/
    CMD_DELETE,         // d
    CMD_PRINT,          // p
    CMD_QUIT,           // q
    CMD_INSERT,         // i text
    CMD_APPEND,         // a text
    CMD_CHANGE,         // c text
    CMD_READ,           // r filename
    CMD_WRITE,          // w filename
    CMD_LINE_NUMBER,    // =
    CMD_TRANSFORM,      // y/abc/xyz/
    CMD_HOLD,           // h
    CMD_GET,            // g
    CMD_EXCHANGE,       // x
    CMD_BRANCH,         // :label, b label
    CMD_TEST,           // t label
} CommandType;

typedef struct {
    CommandType type;
    char *pattern;         // Regex pattern for matching
    char *replacement;     // Replacement text
    int global;            // g flag - replace all occurrences
    int print;             // p flag - print pattern space
    int ignore_case;       // i flag - case insensitive
    int address_start;     // Start line number
    int address_end;       // End line number
    char *label;           // For branches
} Command;
```

**Key Concepts**:
- Command-line argument parsing
- String tokenization and parsing
- Regex pattern extraction
- Flag parsing (g, p, i, etc.)
- Address syntax (line numbers, patterns)

## Step 3

In this step, your goal is to implement pattern space and line addressing.

Your program should:
1. Load each line into "pattern space" (buffer)
2. Support line number addresses: `sed '5s/old/new/' file.txt`
3. Support line ranges: `sed '5,10s/old/new/' file.txt`
4. Support pattern addresses: `sed '/pattern/s/old/new/' file.txt`
5. Support negation with `!`: `sed '5!s/old/new/' file.txt`

Addressing examples:
```bash
# Line 5 only
sed '5s/old/new/' file.txt

# Lines 5-10
sed '5,10s/old/new/' file.txt

# From line 5 to end
sed '5,$s/old/new/' file.txt

# Lines matching pattern
sed '/foo/s/old/new/' file.txt

# Range between patterns
sed '/foo/,/bar/s/old/new/' file.txt

# All except line 5
sed '5!s/old/new/' file.txt

# Every 5th line
sed '0~5s/old/new/' file.txt
```

**Key Concepts**:
- Pattern space buffer (working buffer)
- Line addressing (single, range, pattern)
- Special addresses (1 = first line, $ = last line)
- Step addresses (first~step)
- Address negation
- Current line number tracking

## Step 4

In this step, your goal is to implement the substitute command (s).

Your program should:
1. Parse substitute syntax: `s/pattern/replacement/flags`
2. Support different delimiters: `s|pattern|replacement|`, `s#pattern#replacement#`
3. Support flags:
   - `g` - global (replace all occurrences, not just first)
   - `p` - print the pattern space if substitution made
   - `i` or `I` - case-insensitive matching
   - `n` or `N` - Nth occurrence (GNU extension)
4. Handle special characters in replacement:
   - `&` - matched string
   - `\1`, `\2`, etc. - capture groups
   - `\L`, `\U` - lowercase/uppercase conversion

Substitute examples:
```bash
# Simple replacement
echo "foo bar" | ./sed 's/foo/hello/'
# Output: hello bar

# Global replacement
echo "foo foo" | ./sed 's/foo/bar/g'
# Output: bar bar

# Case insensitive
echo "FOO foo" | ./sed 's/foo/baz/i'
# Output: baz foo

# Use matched string
echo "foo bar" | ./sed 's/.*/& &/'
# Output: foo bar foo bar

# Capture groups
echo "foo bar" | ./sed 's/\(foo\) \(bar\)/\2 \1/'
# Output: bar foo

# Print if substituted
echo "foo" | ./sed 's/foo/bar/p'
# Output:
# foo
# bar
```

**Key Concepts**:
- Regular expressions and matching
- String substitution algorithms
- Regex capture groups and backreferences
- Replacement string parsing
- Flag-based behavior modification

## Step 5

In this step, your goal is to implement delete, print, and quit commands.

Your program should:
1. Implement `d` - delete pattern space, start next cycle
2. Implement `p` - print pattern space
3. Implement `q` - quit processing
4. Implement `=` - print current line number
5. Support command addresses with these commands

Delete/Print/Quit examples:
```bash
# Delete lines 5-10
sed '5,10d' file.txt

# Delete lines matching pattern
sed '/error/d' file.txt

# Print only lines matching pattern
sed -n '/pattern/p' file.txt

# Print line numbers
sed '=' file.txt

# Quit after line 10
sed '10q' file.txt

# Print first 10 lines (head -10)
sed '10q' file.txt
```

**Key Concepts**:
- Pattern space manipulation
- Early termination (quit)
- Conditional printing
- Line number tracking
- -n flag (suppress automatic printing)

## Step 6

In this step, your goal is to implement hold space commands.

Your program should:
1. Implement `h` - copy pattern space to hold space
2. Implement `H` - append pattern space to hold space (with newline)
3. Implement `g` - copy hold space to pattern space
4. Implement `G` - append hold space to pattern space (with newline)
5. Implement `x` - exchange pattern and hold space

Hold space examples:
```bash
# Delete last line
sed '$!{h;};$g' file.txt

# Reverse lines (simple 2-line case)
sed '1!G;h;$!d' file.txt

# Duplicate every line
sed 'G' file.txt

# Join lines (replace newline with space)
sed 'N;s/\n/ /' file.txt

# Print first and last line of file
sed '1h;1d;$G' file.txt
```

**Key Concepts**:
- Hold space (secondary buffer)
- Pattern space vs hold space
- Buffer swapping and copying
- Multi-line processing
- Advanced text transformations

## Step 7

In this step, your goal is to implement insert, append, and change commands.

Your program should:
1. Implement `i\text` - insert text before current line
2. Implement `a\text` - append text after current line
3. Implement `c\text` - change (replace) current line
4. Support multi-line text with backslashes
5. Handle embedded escape sequences

Insert/Append/Change examples:
```bash
# Insert before line
sed '1i\# Header' file.txt

# Append after line
sed '$a\# Footer' file.txt

# Change line matching pattern
sed '/error/c\ERROR: Fixed' file.txt

# Multi-line insert
sed '1i\
Line 1\
Line 2\
Line 3' file.txt

# Add line numbers
sed '=' file.txt | sed 'N;s/\n/: /'
```

**Key Concepts**:
- Text insertion and deletion
- Multi-line command syntax
- Output queue (delayed output)
- Escape sequence handling
- Line vs stream processing

## Step 8

In this step, your goal is to implement branching and flow control.

Your program should:
1. Implement `:label` - define a branch label
2. Implement `b label` - branch (jump) to label
3. Implement `t label` - branch to label if substitution occurred
4. Implement `T label` - branch if no substitution (GNU extension)
5. Support infinite loops and conditional jumps

Branching examples:
```bash
# Remove all comments (multi-line)
sed ':a;/\\$/N;s/\\n//;ta' file.txt

# Join continuation lines
sed ':a;$!N;s/\n //;ta;$!ba' file.txt

# Delete leading blank lines
sed '/./,$!d' file.txt

# Delete trailing blank lines
sed ':a;/^\n*$/{$d;N;ba}' file.txt

# Condense multiple blank lines to one
sed ':a;/^$/N;s/\n$//;ta' file.txt
```

**Key Concepts**:
- Labels and branching
- Conditional jumps
- Loop construction in sed
- Flow control patterns
- State machines with sed

## Going Further

There's plenty more you can add:
- **In-place editing** (-i flag): Modify files directly
- **Extended regex** (-E flag): Modern regex syntax
- **Read file** (r command): Insert file contents
- **Write file** (w command): Write pattern space to file
- **Next line** (n/N commands): Load next line
- **Transform** (y command): Character-by-character translation
- **Case conversion**: \L, \U, \l, \u in replacement
- **Debug mode**: Show what's happening internally
- **Performance profiling**: Benchmark large files

## References

- [GNU sed Manual](https://www.gnu.org/software/sed/manual/sed.html)
- [sed - The Stream Editor](https://www.grymoire.com/Unix/Sed.html)
- [Regular Expressions](https://www.regular-expressions.info/)
- [Build Your Own Web Tool - sed](https://codingchallenges.fyi/challenges/challenge-sed)
- [The Unix Shell: sed & awk](https://www.learnshell.org/en/sed_awk)
- [Bruce Barnett's sed Tutorial](https://www.grymoire.com/Unix/Sed.html)
