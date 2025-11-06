# Challenge: Build Your Own grep

**Source:** [CodingChallenges.fyi - grep Challenge](https://codingchallenges.fyi/challenges/challenge-grep)

## Overview

Build your own version of the Unix command line tool grep. The grep utility searches any given input files, selecting lines that match one or more patterns. By default, a pattern matches an input line if the regular expression (RE) in the pattern matches the input line.

## Challenge Description

grep is one of the most useful Unix command line tools. It searches files for lines matching a pattern and prints those lines. It's essential for:
- Searching log files
- Finding code patterns
- Filtering command output
- Text processing pipelines

## Difficulty Levels

You can tackle this challenge at two levels:

### Easy Mode
Use the regular expression library from your programming language. This lets you focus on the grep logic rather than regex implementation.

### Hard Mode
Implement your own regex engine! This is a significant challenge but teaches you about:
- Finite automata
- Pattern matching algorithms
- Compiler theory basics

## Requirements

### Step 0: Setup

Download test data:
```bash
curl https://www.gutenberg.org/cache/epub/132/pg132.txt -o test.txt
```

This gives you a large text file (The Art of War by Sun Tzu) to test against.

### Step 1: Basic Pattern Matching

Implement basic pattern search:
```bash
grep "pattern" file.txt
```

Should print all lines containing "pattern".

**Test:**
```bash
./grep "the" test.txt
```

### Step 2: Case Insensitive Search (-i)

Add the `-i` option for case-insensitive matching:
```bash
grep -i "pattern" file.txt
```

Should match "pattern", "PATTERN", "Pattern", etc.

**Test:**
```bash
./grep -i "THE" test.txt
```

### Step 3: Inverted Match (-v)

Add the `-v` option to invert the match (show non-matching lines):
```bash
grep -v "pattern" file.txt
```

Should print all lines NOT containing "pattern".

**Test:**
```bash
./grep -v "the" test.txt
```

### Step 4: Pattern Support

Support special regex patterns:
- `\d` - Match any digit
- `\w` - Match any word character
- `.` - Match any character
- `*` - Match zero or more
- `+` - Match one or more
- `^` - Match start of line
- `$` - Match end of line

**Test:**
```bash
./grep "^\d" test.txt  # Lines starting with digit
./grep "\w{5,}" test.txt  # Words with 5+ characters
```

### Step 5: Additional Options

Implement more useful options:

**Line Numbers (-n):**
```bash
grep -n "pattern" file.txt
```
Shows line numbers with matches.

**Count Only (-c):**
```bash
grep -c "pattern" file.txt
```
Shows count of matching lines.

**Files with Matches (-l):**
```bash
grep -l "pattern" *.txt
```
Shows only filenames that contain matches.

**Recursive Search (-r):**
```bash
grep -r "pattern" directory/
```
Searches all files in directory and subdirectories.

## Common grep Options

| Option | Description |
|--------|-------------|
| `-i` | Ignore case |
| `-v` | Invert match |
| `-n` | Show line numbers |
| `-c` | Count matching lines |
| `-l` | Show files with matches |
| `-L` | Show files without matches |
| `-h` | Hide filename (default with one file) |
| `-H` | Show filename (default with multiple files) |
| `-r` | Recursive search |
| `-E` | Extended regex |
| `-F` | Fixed string (no regex) |
| `-q` | Quiet mode (only exit code) |
| `-A NUM` | Show NUM lines after match |
| `-B NUM` | Show NUM lines before match |
| `-C NUM` | Show NUM lines of context |

## Example Usage

### Basic Search
```bash
grep "error" logfile.txt
```

### Case Insensitive
```bash
grep -i "warning" logfile.txt
```

### With Line Numbers
```bash
grep -n "TODO" src/main.c
```

### Count Matches
```bash
grep -c "import" *.py
```

### Recursive Search
```bash
grep -r "function main" src/
```

### Context Lines
```bash
grep -C 2 "error" logfile.txt  # 2 lines before and after
```

### Multiple Files
```bash
grep "pattern" file1.txt file2.txt file3.txt
```

### Inverted Match
```bash
grep -v "debug" logfile.txt  # Show lines without "debug"
```

### Pipe from Other Commands
```bash
ps aux | grep "python"
cat file.txt | grep "pattern"
```

## Testing Strategy

### Basic Tests
```bash
# Should find lines
./grep "the" test.txt

# Should not find (exit code 1)
./grep "xyzabc" test.txt

# Case insensitive
./grep -i "THE" test.txt

# Invert
./grep -v "the" test.txt

# Line numbers
./grep -n "the" test.txt | head -5

# Count
./grep -c "the" test.txt
```

### Regex Tests
```bash
# Match digits
./grep "[0-9]" test.txt

# Match start of line
./grep "^The" test.txt

# Match end of line
./grep "end$" test.txt

# Match any character
./grep "t.e" test.txt
```

### Edge Cases
```bash
# Empty file
./grep "pattern" /dev/null

# Binary file
./grep "pattern" /bin/ls

# No pattern
./grep "" test.txt  # Should match all lines

# No files (stdin)
echo "test" | ./grep "test"
```

## Regular Expression Basics

### Special Characters

- `.` - Any character
- `*` - Zero or more of previous
- `+` - One or more of previous
- `?` - Zero or one of previous
- `^` - Start of line
- `$` - End of line
- `[]` - Character class
- `[^]` - Negated character class
- `\` - Escape special character

### Character Classes

- `[abc]` - Match a, b, or c
- `[a-z]` - Match lowercase letters
- `[A-Z]` - Match uppercase letters
- `[0-9]` - Match digits
- `[^abc]` - Match anything except a, b, c

### Shorthand Classes

- `\d` - Digit `[0-9]`
- `\D` - Non-digit
- `\w` - Word character `[a-zA-Z0-9_]`
- `\W` - Non-word character
- `\s` - Whitespace
- `\S` - Non-whitespace

### Quantifiers

- `*` - 0 or more
- `+` - 1 or more
- `?` - 0 or 1
- `{n}` - Exactly n
- `{n,}` - n or more
- `{n,m}` - Between n and m

### Examples

```bash
# Match email addresses
grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" file.txt

# Match phone numbers
grep -E "\d{3}-\d{3}-\d{4}" file.txt

# Match URLs
grep -E "https?://[^\s]+" file.txt

# Match IP addresses
grep -E "\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}" file.txt
```

## Implementation Approaches

### Using Built-in Regex (Easy)

Most languages have regex libraries:

**C:** POSIX regex (`<regex.h>`)
```c
#include <regex.h>

regex_t regex;
regcomp(&regex, pattern, REG_EXTENDED);
regexec(&regex, line, 0, NULL, 0);
regfree(&regex);
```

**Python:** `re` module
```python
import re
if re.search(pattern, line):
    print(line)
```

**JavaScript:** Built-in RegExp
```javascript
if (new RegExp(pattern).test(line)) {
    console.log(line);
}
```

### Building Your Own Regex (Hard)

Implement a regex engine:

1. **Parse regex into AST** - Convert pattern to syntax tree
2. **Build NFA** - Non-deterministic finite automaton
3. **Simulate or convert to DFA** - Execute matching
4. **Match against input** - Test each line

This teaches:
- Parsing and grammars
- Automata theory
- Algorithm design

## Learning Objectives

This challenge teaches:

1. **File I/O** - Reading files line by line
2. **Regular Expressions** - Pattern matching
3. **Command-Line Parsing** - Handling options and arguments
4. **Text Processing** - Efficient string operations
5. **Exit Codes** - Proper program return values
6. **Piping** - Reading from stdin
7. **Recursion** - Directory traversal

## Performance Considerations

Real grep is very fast. Optimizations:
- **Memory Mapping** - Use mmap() for large files
- **SIMD** - Vectorized string operations
- **Multi-threading** - Process multiple files in parallel
- **Smart Regex** - Optimize common patterns
- **Skip Binary Files** - Detect and skip non-text files

## Extensions

### Beyond Basic grep

- **grep -P** - Perl-compatible regex (PCRE)
- **grep -o** - Print only matching parts
- **grep --color** - Highlight matches
- **grep -m NUM** - Stop after NUM matches
- **grep --include/--exclude** - Filter files by pattern
- **grep -w** - Match whole words only
- **grep -x** - Match whole lines only

### Related Tools

- **egrep** - Extended grep (same as `grep -E`)
- **fgrep** - Fixed string grep (same as `grep -F`)
- **zgrep** - Search compressed files
- **pgrep** - Search process names
- **ag** - The Silver Searcher (faster grep)
- **ripgrep** - Modern grep replacement in Rust

## Resources

- [grep Manual](https://www.gnu.org/software/grep/manual/grep.html)
- [Regular Expression Tutorial](https://www.regular-expressions.info/)
- [POSIX Regex Documentation](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/regex.h.html)
- [Implementing Regular Expressions](https://swtch.com/~rsc/regexp/)

## Implementation Notes

This implementation:
- Uses C with POSIX regex library
- Implements most common grep options
- Handles multiple files and stdin
- Supports context lines
- Cross-platform (Linux, macOS, BSD)
- Well-documented for learning

## Success Criteria

Your grep implementation should:
- ✅ Match patterns in text files
- ✅ Support basic regex syntax
- ✅ Handle multiple files
- ✅ Read from stdin when no files specified
- ✅ Implement common options (-i, -v, -n, -c, -l)
- ✅ Return correct exit codes (0 = found, 1 = not found)
- ✅ Handle edge cases (empty files, no matches, etc.)
