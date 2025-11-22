# Building and Testing Guide

This guide covers everything you need to know about building, testing, and packaging the `ccwc` project.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Building](#building)
3. [Testing](#testing)
4. [Packaging](#packaging)
5. [Cross-Platform Notes](#cross-platform-notes)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- **C Compiler**: gcc 4.8+ or clang 3.4+
- **Make**: GNU Make 3.81+ or compatible
- **Shell**: bash 3.2+ for build scripts

### Platform-Specific Requirements

#### macOS
```bash
# Install Xcode Command Line Tools (includes gcc/clang and make)
xcode-select --install

# Verify installation
gcc --version
make --version
```

#### Ubuntu/Debian
```bash
# Install build essentials
sudo apt-get update
sudo apt-get install build-essential

# Verify installation
gcc --version
make --version
```

#### CentOS/RHEL/Fedora
```bash
# Install development tools
sudo yum groupinstall "Development Tools"

# Verify installation
gcc --version
make --version
```

#### Arch Linux
```bash
# Install base development tools
sudo pacman -S base-devel

# Verify installation
gcc --version
make --version
```

#### FreeBSD
```bash
# Install compiler and make
sudo pkg install gcc gmake

# Use gmake instead of make
alias make=gmake
```

## Building

### Quick Start

```bash
# Navigate to project directory
cd 01-wc-tool

# Build the binary
make

# Verify it works
./ccwc --version
./ccwc --help
```

### Build Targets

#### Standard Build
```bash
make all
```
- Optimized for performance (`-O2`)
- Standard compiler warnings (`-Wall -Wextra`)
- POSIX-compliant code (`-std=c99`)

**Output**: `ccwc` binary in current directory

#### Debug Build
```bash
make debug
```
- Includes debug symbols (`-g`)
- No optimization (`-O0`)
- Enables debug macros (`-DDEBUG`)

**Use case**: Development and debugging with gdb/lldb

**Example debugging session**:
```bash
make debug
lldb ./ccwc        # macOS
# or
gdb ./ccwc         # Linux

(lldb) break main
(lldb) run test.txt
(lldb) next
(lldb) print counts
```

#### Static Build
```bash
make static
```
- Links standard library statically
- Creates standalone binary (Linux/BSD only)
- Larger binary size but no runtime dependencies

**Note**: Not recommended on macOS due to licensing restrictions on static system libraries.

**Use case**: Distribution on systems without matching libc

### Build Flags

The Makefile uses these compiler flags:

```makefile
CFLAGS = -Wall -Wextra -pedantic -std=c99 -O2
```

**Explanation**:
- `-Wall -Wextra`: Enable comprehensive warnings
- `-pedantic`: Enforce strict ISO C compliance
- `-std=c99`: Use C99 standard
- `-O2`: Optimize for performance

### Custom Builds

#### Change optimization level
```bash
# Maximum optimization (may increase compilation time)
make CFLAGS="-Wall -Wextra -std=c99 -O3" all

# No optimization (fastest compilation)
make CFLAGS="-Wall -Wextra -std=c99 -O0" all
```

#### Add custom flags
```bash
# Enable extra security features
make CFLAGS="-Wall -Wextra -std=c99 -O2 -fstack-protector-strong" all

# Enable address sanitizer (for debugging memory issues)
make CFLAGS="-Wall -Wextra -std=c99 -O0 -g -fsanitize=address" all
```

### Cleaning

```bash
# Remove built binary and artifacts
make clean

# Clean and rebuild
make clean all
```

## Testing

### Running the Test Suite

#### Using Make
```bash
make test
```

#### Direct Execution
```bash
# Make script executable (if not already)
chmod +x test.sh

# Run tests
./test.sh
```

### Test Output

Successful test run:
```
================================================
  ccwc Test Suite
================================================
Creating test files...
Test files created

TEST: Help output
  ✓ Show help with --help
  ✓ Show help with -h

TEST: Version output
  ✓ Show version with --version
  ✓ Show version with -v

TEST: Byte counting (-c flag)
  ✓ Count bytes in simple file
  ✓ Count bytes in multi-line file
  ✓ Count bytes in empty file

[... more tests ...]

================================================
  Test Summary
================================================
Total tests run:    42
Tests passed:       42
Tests failed:       0

ALL TESTS PASSED!
```

Failed test example:
```
TEST: Byte counting (-c flag)
  ✗ Count bytes in simple file
    Expected: 12
    Got:      11
```

### Test Categories

The test suite covers:

1. **Help and Version**: Verify --help and --version outputs
2. **Byte Counting**: Test -c flag with various files
3. **Line Counting**: Test -l flag with various files
4. **Word Counting**: Test -w flag with various files
5. **Character Counting**: Test -m flag with ASCII and Unicode
6. **Default Behavior**: Test output with no flags
7. **Multiple Flags**: Test flag combinations (-lw, -lc, etc.)
8. **Standard Input**: Test pipes, redirects, and here-documents
9. **Multiple Files**: Test processing multiple files with totals
10. **Error Handling**: Test invalid files and bad options
11. **Challenge Validation**: Test against official test file

### Manual Testing

#### Basic functionality
```bash
# Create a test file
echo "hello world" > mytest.txt

# Test each flag
./ccwc -c mytest.txt    # Should show 12 bytes
./ccwc -l mytest.txt    # Should show 1 line
./ccwc -w mytest.txt    # Should show 2 words
./ccwc mytest.txt       # Should show all three
```

#### Standard input
```bash
# Test with pipe
echo "test" | ./ccwc -l     # Should show 1

# Test with redirect
./ccwc -w < mytest.txt      # Should show 2

# Test with here-document
./ccwc -l << EOF
line 1
line 2
EOF
# Should show 2
```

#### Multiple files
```bash
# Create multiple files
echo "file 1" > test1.txt
echo "file 2 content" > test2.txt

# Process both
./ccwc test1.txt test2.txt
# Should show individual counts and total
```

#### Error cases
```bash
# Non-existent file (should show error)
./ccwc nonexistent.txt

# Invalid option (should show error)
./ccwc -x test.txt

# Both should exit with non-zero status
echo $?    # Check exit code
```

### Challenge Validation

The project includes the official test file from the challenge:

```bash
# Download test file (if not already present)
curl -o test.txt https://www.gutenberg.org/cache/epub/132/pg132.txt

# Validate byte count
./ccwc -c test.txt
# Expected:   342190 test.txt

# Validate line count
./ccwc -l test.txt
# Expected:     7145 test.txt

# Validate word count
./ccwc -w test.txt
# Expected:    58164 test.txt

# Validate character count
./ccwc -m test.txt
# Expected:   339292 test.txt

# Validate default output
./ccwc test.txt
# Expected:     7145   58164  342190 test.txt

# Validate stdin
cat test.txt | ./ccwc -l
# Expected:     7145
```

## Packaging

### Automated Packaging

```bash
# Full workflow: build, test, and package
./build-and-package.sh -a

# Package only (assumes binary exists)
./build-and-package.sh -p
```

### Package Contents

The distribution package includes:

```
ccwc-1.0.0-Darwin-arm64/
├── ccwc              # Binary executable
├── README.md         # User documentation
├── CHALLENGE.md      # Challenge description
├── test.sh           # Test suite
├── install.sh        # Installation script
├── uninstall.sh      # Uninstallation script
└── PACKAGE_INFO      # Package metadata
```

### Package Format

Packages are created as compressed tarballs:

```
dist/
├── ccwc-1.0.0-Darwin-arm64/           # Extracted directory
├── ccwc-1.0.0-Darwin-arm64.tar.gz     # Compressed package
└── ccwc-1.0.0-Darwin-arm64.tar.gz.sha256  # Checksum file
```

### Installation from Package

```bash
# Extract package
tar xzf ccwc-1.0.0-*.tar.gz

# Navigate to extracted directory
cd ccwc-1.0.0-*

# Install system-wide (requires sudo)
sudo ./install.sh

# Or install to user directory
PREFIX=~/.local ./install.sh
```

### Verifying Package Integrity

```bash
# Verify checksum
sha256sum -c ccwc-1.0.0-*.tar.gz.sha256
# or on macOS
shasum -a 256 -c ccwc-1.0.0-*.tar.gz.sha256
```

## Cross-Platform Notes

### macOS Specific

**Compiler**: Uses Apple Clang by default
```bash
# Check compiler
gcc --version
# Apple clang version 14.0.0 ...
```

**Static Linking**: Not recommended
```bash
# Static build will show warning and build normally
make static
```

**File Systems**: Case-insensitive by default (APFS)
- Be aware when testing file operations

### Linux Specific

**Compiler**: Usually GCC
```bash
# Check compiler
gcc --version
# gcc (Ubuntu 11.2.0-1ubuntu1) 11.2.0
```

**Static Linking**: Fully supported
```bash
# Create standalone binary
make static

# Verify (should show "statically linked")
ldd ccwc
# or
file ccwc
```

**Distribution Variations**:
- Debian/Ubuntu: `apt-get`
- RedHat/CentOS: `yum`
- Fedora: `dnf`
- Arch: `pacman`

### BSD Specific

**Make**: Use `gmake` (GNU Make)
```bash
# Install gmake
sudo pkg install gmake

# Use gmake instead of make
gmake all
```

**Compiler**: May need to install gcc
```bash
# FreeBSD
sudo pkg install gcc

# OpenBSD (uses base system compiler)
# No extra installation needed
```

## Troubleshooting

### Build Problems

#### "gcc: command not found"

**Problem**: No C compiler installed

**Solution**:
```bash
# macOS
xcode-select --install

# Ubuntu/Debian
sudo apt-get install build-essential

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
```

#### "make: command not found"

**Problem**: Make utility not installed

**Solution**: Install with build tools (same as above)

#### Compiler warnings

**Problem**: Warnings during compilation

**Solution**: Warnings are enabled intentionally (`-Wall -Wextra`). Fix them:
```bash
# View warnings
make all 2>&1 | less

# Common fixes:
# - Unused variable: Remove or prefix with __attribute__((unused))
# - Implicit declaration: Add proper #include
# - Type mismatch: Add explicit cast
```

### Test Failures

#### Test file not found

**Problem**: `test.txt` missing for challenge validation

**Solution**:
```bash
# Download test file
curl -o test.txt https://www.gutenberg.org/cache/epub/132/pg132.txt
```

#### Incorrect counts

**Problem**: Output doesn't match expected values

**Debug steps**:
```bash
# Compare with system wc
wc test.txt
./ccwc test.txt

# Check for differences
diff <(wc test.txt) <(./ccwc test.txt)

# Debug with verbose output
./ccwc -c test.txt
ls -l test.txt    # Compare byte count
```

#### Character count mismatch

**Problem**: `-m` (character count) doesn't match expected value

**Solution**: Check locale settings
```bash
# View current locale
locale

# Set UTF-8 locale
export LC_ALL=en_US.UTF-8

# Retry character count
./ccwc -m test.txt
```

### Runtime Problems

#### Segmentation fault

**Problem**: Program crashes

**Debug steps**:
```bash
# Rebuild with debug symbols
make debug

# Run with debugger
lldb ./ccwc          # macOS
# or
gdb ./ccwc           # Linux

# At the crash, examine:
(lldb) bt            # Backtrace
(lldb) print var     # Examine variables
```

#### Permission denied

**Problem**: Cannot open file

**Check permissions**:
```bash
ls -l file.txt
# If you don't have read permission:
chmod +r file.txt
```

#### Incorrect output format

**Problem**: Output doesn't match `wc` format

**Solution**: Check alignment and spacing
```bash
# System wc uses right-aligned fields
wc test.txt
#     7145   58164  342190 test.txt

# Our output should match exactly
./ccwc test.txt
```

## Performance Benchmarking

### Basic Benchmark

```bash
# Create a large test file
dd if=/dev/zero bs=1M count=100 | tr '\0' 'A' > large.txt

# Time system wc
time wc large.txt

# Time ccwc
time ./ccwc large.txt

# Compare times
```

### Detailed Profiling

#### Using `time` command
```bash
# Detailed timing (Linux)
/usr/bin/time -v ./ccwc large.txt

# Detailed timing (macOS requires gtime from Homebrew)
brew install gnu-time
gtime -v ./ccwc large.txt
```

#### Using profiling tools
```bash
# Profile with gprof (requires recompile)
make CFLAGS="-Wall -Wextra -std=c99 -O2 -pg" all
./ccwc large.txt
gprof ccwc gmon.out > profile.txt
less profile.txt

# Profile with valgrind (Linux)
valgrind --tool=callgrind ./ccwc large.txt
kcachegrind callgrind.out.*
```

## Continuous Integration

### Setting up CI Testing

Example GitHub Actions workflow (`.github/workflows/test.yml`):

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]

    steps:
    - uses: actions/checkout@v2

    - name: Build
      run: |
        cd 01-wc-tool
        make all

    - name: Test
      run: |
        cd 01-wc-tool
        make test

    - name: Package
      run: |
        cd 01-wc-tool
        ./build-and-package.sh -p
```

## Best Practices

1. **Always test after building**: `make && make test`
2. **Clean before release builds**: `make clean && make all`
3. **Verify package integrity**: Check SHA256 before distribution
4. **Test on target platform**: Cross-platform code should be tested on each platform
5. **Keep dependencies minimal**: The project only needs standard C library
6. **Document platform-specific issues**: Note any platform quirks in comments

## Additional Resources

- [GNU Make Manual](https://www.gnu.org/software/make/manual/)
- [GCC Compiler Options](https://gcc.gnu.org/onlinedocs/gcc/Option-Summary.html)
- [GDB Debugging Guide](https://www.gnu.org/software/gdb/documentation/)
- [Valgrind Documentation](https://valgrind.org/docs/manual/quick-start.html)
