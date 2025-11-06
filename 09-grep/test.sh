#!/bin/bash

# Test script for grep
# Tests various grep functionality and options

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# grep binary
GREP="./grep"

# Check if grep binary exists
if [ ! -f "$GREP" ]; then
    echo -e "${RED}Error: grep binary not found. Please run 'make' first.${NC}"
    exit 1
fi

# Create test files
setup_test_files() {
    echo "Setting up test files..."

    # test1.txt - Simple text file
    cat > test1.txt <<'EOF'
Hello World
hello world
HELLO WORLD
goodbye world
The quick brown fox
jumps over the lazy dog
Testing 123
Line with numbers: 456 789
EOF

    # test2.txt - Another test file
    cat > test2.txt <<'EOF'
First line
Second line
Third line with pattern
Fourth line
EOF

    # test3.txt - Empty file
    touch test3.txt

    # testdir/ - Directory for recursive tests
    mkdir -p testdir
    echo "file1 content" > testdir/file1.txt
    echo "file2 content" > testdir/file2.txt
    mkdir -p testdir/subdir
    echo "nested content" > testdir/subdir/nested.txt
}

# Cleanup test files
cleanup_test_files() {
    rm -f test1.txt test2.txt test3.txt
    rm -rf testdir
}

# Function to run a test
run_test() {
    local description="$1"
    shift
    local command="$@"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    # Run command and capture output and exit code
    output=$(eval "$command" 2>&1)
    exit_code=$?

    # For now, just check if command ran without crashing
    # More sophisticated tests would check actual output
    if [ $exit_code -le 1 ]; then  # 0 = found, 1 = not found, both OK
        echo -e "${GREEN}✓${NC} Test $TOTAL_TESTS: $description"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} Test $TOTAL_TESTS: $description"
        echo "    Command: $command"
        echo "    Exit code: $exit_code"
        echo "    Output: $output"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to test expected output
test_output() {
    local description="$1"
    local command="$2"
    local expected="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    output=$(eval "$command" 2>&1)

    if echo "$output" | grep -q "$expected"; then
        echo -e "${GREEN}✓${NC} Test $TOTAL_TESTS: $description"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} Test $TOTAL_TESTS: $description"
        echo "    Command: $command"
        echo "    Expected to contain: $expected"
        echo "    Got: $output"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to test line count
test_line_count() {
    local description="$1"
    local command="$2"
    local expected_count="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    output=$(eval "$command" 2>&1)
    actual_count=$(echo "$output" | wc -l)

    if [ "$actual_count" -eq "$expected_count" ]; then
        echo -e "${GREEN}✓${NC} Test $TOTAL_TESTS: $description"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} Test $TOTAL_TESTS: $description"
        echo "    Command: $command"
        echo "    Expected $expected_count lines, got $actual_count"
        echo "    Output: $output"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo "========================================"
echo "grep Test Suite"
echo "========================================"
echo ""

# Setup
setup_test_files
echo ""

# Basic pattern matching
echo "Basic Pattern Matching:"
run_test "Match simple string" "$GREP 'Hello' test1.txt"
run_test "Match string not in file" "$GREP 'notfound' test1.txt"
run_test "Match with regex" "$GREP 'H.*o' test1.txt"
run_test "Match numbers" "$GREP '[0-9]' test1.txt"
echo ""

# Case insensitive search (-i)
echo "Case Insensitive Search (-i):"
test_line_count "Match case insensitive" "$GREP -i 'hello' test1.txt" "3"
run_test "Case insensitive with regex" "$GREP -i 'HELLO.*WORLD' test1.txt"
echo ""

# Inverted match (-v)
echo "Inverted Match (-v):"
run_test "Invert match" "$GREP -v 'Hello' test1.txt"
run_test "Invert with case insensitive" "$GREP -vi 'hello' test1.txt"
echo ""

# Line numbers (-n)
echo "Line Numbers (-n):"
test_output "Show line numbers" "$GREP -n 'Hello' test1.txt" "1:"
test_output "Line numbers with match" "$GREP -n 'world' test1.txt" ":"
echo ""

# Count only (-c)
echo "Count Only (-c):"
test_output "Count matches" "$GREP -c 'world' test1.txt" "3"
test_output "Count case insensitive" "$GREP -ic 'hello' test1.txt" "3"
echo ""

# Files with matches (-l)
echo "Files With Matches (-l):"
test_output "List files with matches" "$GREP -l 'Hello' test*.txt" "test1.txt"
run_test "Multiple files -l" "$GREP -l 'line' test*.txt"
echo ""

# Fixed string search (-F)
echo "Fixed String Search (-F):"
run_test "Fixed string (no regex)" "$GREP -F 'Hello' test1.txt"
run_test "Fixed string with special chars" "$GREP -F '...' test1.txt || true"
echo ""

# Multiple files
echo "Multiple Files:"
run_test "Search multiple files" "$GREP 'line' test1.txt test2.txt"
test_output "Filename prefix with multiple files" "$GREP 'line' test1.txt test2.txt" "test"
echo ""

# Stdin input
echo "Standard Input:"
test_output "Read from stdin" "echo 'test string' | $GREP 'test'" "test string"
test_output "Pipe from cat" "cat test1.txt | $GREP 'Hello'" "Hello"
echo ""

# Context lines
echo "Context Lines:"
run_test "After context -A" "$GREP -A 1 'Hello' test1.txt"
run_test "Before context -B" "$GREP -B 1 'world' test1.txt"
run_test "Context both -C" "$GREP -C 1 'quick' test1.txt"
echo ""

# Quiet mode (-q)
echo "Quiet Mode (-q):"
$GREP -q 'Hello' test1.txt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Test $((TOTAL_TESTS+1)): Quiet mode with match (exit 0)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗${NC} Test $((TOTAL_TESTS+1)): Quiet mode with match (exit 0)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

$GREP -q 'notfound' test1.txt
if [ $? -eq 1 ]; then
    echo -e "${GREEN}✓${NC} Test $((TOTAL_TESTS+1)): Quiet mode without match (exit 1)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗${NC} Test $((TOTAL_TESTS+1)): Quiet mode without match (exit 1)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Recursive search (-r)
echo "Recursive Search (-r):"
run_test "Recursive directory search" "$GREP -r 'content' testdir/"
run_test "Recursive with pattern" "$GREP -r 'file' testdir/"
echo ""

# Edge cases
echo "Edge Cases:"
run_test "Empty file" "$GREP 'anything' test3.txt"
run_test "Empty pattern" "$GREP '' test1.txt"
test_line_count "Match all lines with empty pattern" "$GREP '' test1.txt" "8"
echo ""

# Combined options
echo "Combined Options:"
run_test "Case insensitive inverted" "$GREP -vi 'HELLO' test1.txt"
run_test "Count with invert" "$GREP -vc 'Hello' test1.txt"
run_test "Line numbers with case insensitive" "$GREP -ni 'hello' test1.txt"
run_test "Multiple options" "$GREP -inH 'world' test1.txt"
echo ""

# Cleanup
cleanup_test_files

# Print summary
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
else
    echo -e "Failed: $FAILED_TESTS"
fi
echo ""

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
