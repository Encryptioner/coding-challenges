# cccut - A Simple Unix cut Tool Implementation

A lightweight, educational implementation of the Unix `cut` command for extracting sections from lines of text. This project is part of the [Coding Challenges](https://codingchallenges.fyi/challenges/challenge-cut) series.

## 🎯 What is cut?

The `cut` tool is a Unix utility that extracts specific portions of each line from a file or input stream. Think of it like a pair of scissors that can:

- **Cut out specific columns** from a CSV file (like extracting just names from a contact list)
- **Extract character ranges** from text (like getting the first 10 characters of each line)
- **Parse delimited data** (working with tab-separated, comma-separated, or any custom-delimited data)

## 🚀 Quick Start

### Building

```bash
# Compile the tool
make

# Or compile manually
gcc -o cccut cccut.c -Wall -Wextra
```

### Basic Examples

```bash
# Extract the 2nd field from a CSV file
echo "Alice,25,Engineer" | ./cccut -d',' -f2
# Output: 25

# Get the first 5 characters from each line
echo "Hello World" | ./cccut -c1-5
# Output: Hello

# Extract multiple fields
echo "Alice,25,Engineer,NYC" | ./cccut -d',' -f1,3
# Output: Alice,Engineer

# Extract from 3rd field to the end
echo "A,B,C,D,E,F" | ./cccut -d',' -f3-
# Output: C,D,E,F
```

## 📖 Usage

```
cccut [OPTION]... [FILE]...
```

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `-f LIST` | Select fields (columns) | `-f1,3,5` or `-f1-3` |
| `-c LIST` | Select characters | `-c1-10` or `-c5,10,15` |
| `-d DELIM` | Set field delimiter (default: TAB) | `-d','` or `-d':'` |
| `-s` | Suppress lines with no delimiter | `-s -f1-3` |
| `-h` | Show help message | `-h` |

### Range Syntax

The `LIST` parameter supports flexible range specifications:

| Format | Meaning | Example |
|--------|---------|---------|
| `N` | Single field/character at position N | `3` = 3rd position |
| `N-M` | Range from N to M (inclusive) | `1-5` = positions 1 through 5 |
| `N-` | From N to end of line | `3-` = position 3 to end |
| `-M` | From beginning to M | `-5` = positions 1 through 5 |
| `N,M,P` | Multiple selections | `1,3,5` = positions 1, 3, and 5 |

You can combine ranges: `-f1-3,5,7-9` selects fields 1, 2, 3, 5, 7, 8, and 9.

## 💡 Real-World Examples

### Working with CSV Files

```bash
# Extract names and emails from a contact list
# Input: Alice,alice@example.com,123-456-7890,NYC
./cccut -d',' -f1-2 contacts.csv

# Get just the phone numbers (3rd column)
./cccut -d',' -f3 contacts.csv
```

### Processing Log Files

```bash
# Extract timestamps (first 19 characters) from logs
# Input: 2024-01-15 10:30:45 [INFO] User logged in
./cccut -c1-19 app.log

# Get log levels (assuming space-delimited)
./cccut -d' ' -f3 app.log
```

### Working with /etc/passwd

```bash
# Extract usernames (1st field, colon-delimited)
./cccut -d':' -f1 /etc/passwd

# Get username and home directory (1st and 6th fields)
./cccut -d':' -f1,6 /etc/passwd
```

### Pipeline with Other Commands

```bash
# Count unique shells in /etc/passwd
./cccut -d':' -f7 /etc/passwd | sort | uniq -c

# Find all users with UID >= 1000
./cccut -d':' -f1,3 /etc/passwd | awk -F: '$2 >= 1000'

# Extract commit hashes from git log
git log --oneline | ./cccut -c1-7
```

## 🏗️ Building and Testing

### Compilation

```bash
# Standard build
make

# Build with debug symbols
make debug

# Clean build artifacts
make clean
```

### Running Tests

```bash
# Run all tests
make test

# Or manually
./test.sh
```

## 🔍 How It Works

### Field Extraction (-f)

When you use `-f`, the tool:
1. Splits each line by the delimiter (default: TAB, customizable with `-d`)
2. Numbers fields starting from 1
3. Outputs only the specified fields, separated by the delimiter

**Example:**
```bash
# Input:  "A:B:C:D:E"
# Command: cccut -d':' -f2,4
# Process: Split → ["A", "B", "C", "D", "E"]
#          Select fields 2,4 → ["B", "D"]
# Output: "B:D"
```

### Character Extraction (-c)

When you use `-c`, the tool:
1. Treats each line as a sequence of characters
2. Numbers characters starting from 1
3. Outputs only characters at the specified positions

**Example:**
```bash
# Input:  "Hello World"
# Command: cccut -c1-5
# Process: Positions 1,2,3,4,5 → "H","e","l","l","o"
# Output: "Hello"
```

## 📚 Additional Documentation

- [**GUIDE.md**](docs/GUIDE.md) - Comprehensive user guide with advanced techniques
- [**EXAMPLES.md**](docs/EXAMPLES.md) - Extensive collection of practical examples
- [**ARCHITECTURE.md**](docs/ARCHITECTURE.md) - Code structure and implementation details

## ⚠️ Limitations

This is an educational implementation. Some differences from GNU cut:

- Maximum line length: 4096 characters
- Maximum fields: 1024
- No support for byte selection (-b)
- No support for complement selection (--complement)
- Single character delimiter only (no multi-character delimiters)

## 🤝 Compatibility

Works on:
- Linux (all distributions)
- macOS
- BSD variants (FreeBSD, OpenBSD, NetBSD)
- Windows (with WSL or MinGW)

## 📝 License

This is an educational project created as part of the Coding Challenges series.

## 🔗 Resources

- [Coding Challenges - Cut Tool](https://codingchallenges.fyi/challenges/challenge-cut)
- [GNU cut manual](https://www.gnu.org/software/coreutils/manual/html_node/cut-invocation.html)
- [POSIX cut specification](https://pubs.opengroup.org/onlinepubs/9699919799/utilities/cut.html)

## 🎓 Learning Objectives

This challenge teaches:
- Command-line argument parsing with `getopt`
- String manipulation in C
- Input/output streams and file handling
- Unix philosophy: do one thing well
- Text processing fundamentals

---

**Challenge Progress:** ✓ Completed

Part of the [94 Coding Challenges](https://codingchallenges.fyi) series.
