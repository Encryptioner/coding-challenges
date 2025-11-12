#!/bin/bash

# Test suite for ccwc - Coding Challenges Word Count Tool

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# ccwc command
CCWC="./ccwc"

# Test function
run_test() {
    local description="$1"
    local command="$2"
    local expected="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -n "Test $TOTAL_TESTS: $description... "

    # Run command and capture output
    actual=$($command 2>&1)

    # Compare output
    if [ "$actual" = "$expected" ]; then
        echo -e "${GREEN}✓${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC}"
        echo "  Expected: $expected"
        echo "  Actual:   $actual"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Check if ccwc exists
if [ ! -f "$CCWC" ]; then
    echo -e "${RED}Error: ccwc not found. Please run 'make' first.${NC}"
    exit 1
fi

# Check if test file exists
if [ ! -f "test.txt" ]; then
    echo -e "${YELLOW}Downloading test file...${NC}"
    curl -s https://www.gutenberg.org/cache/epub/132/pg132.txt -o test.txt
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to download test file${NC}"
        exit 1
    fi
    echo -e "${GREEN}Test file downloaded.${NC}"
fi

echo "========================================"
echo "ccwc Test Suite"
echo "========================================"
echo ""

# Test 1: Byte count (-c flag)
run_test "byte count with -c flag" \
    "$CCWC -c test.txt" \
    "  342190 test.txt"

# Test 2: Line count (-l flag)
run_test "line count with -l flag" \
    "$CCWC -l test.txt" \
    "    7145 test.txt"

# Test 3: Word count (-w flag)
run_test "word count with -w flag" \
    "$CCWC -w test.txt" \
    "   58164 test.txt"

# Test 4: Character count (-m flag)
run_test "character count with -m flag" \
    "$CCWC -m test.txt" \
    "  339292 test.txt"

# Test 5: Default output (no flags)
run_test "default output (lines, words, bytes)" \
    "$CCWC test.txt" \
    "    7145   58164  342190 test.txt"

# Test 6: Multiple flags (-l -w)
run_test "multiple flags (-l -w)" \
    "$CCWC -l -w test.txt" \
    "    7145   58164 test.txt"

# Test 7: Multiple flags (-l -w -c)
run_test "multiple flags (-l -w -c)" \
    "$CCWC -l -w -c test.txt" \
    "    7145   58164  342190 test.txt"

# Test 8: Reading from stdin
run_test "reading from stdin with cat" \
    "cat test.txt | $CCWC -l" \
    "    7145"

# Test 9: Reading from stdin with explicit -
run_test "reading from stdin with - argument" \
    "cat test.txt | $CCWC -l -" \
    "    7145"

# Test 10: Empty file
echo -n "" > empty.txt
run_test "empty file" \
    "$CCWC empty.txt" \
    "       0       0       0 empty.txt"
rm empty.txt

# Test 11: Single line file
echo "Hello world" > single.txt
run_test "single line with no newline" \
    "$CCWC -l single.txt" \
    "       0 single.txt"

# Test 12: Single line file with newline
echo "Hello world" > single_nl.txt
run_test "single line with newline" \
    "$CCWC -l single_nl.txt" \
    "       1 single_nl.txt"

# Test 13: Word count for single line
run_test "word count for single line" \
    "$CCWC -w single_nl.txt" \
    "       2 single_nl.txt"

# Test 14: Byte count for single line
run_test "byte count for single line" \
    "$CCWC -c single_nl.txt" \
    "      12 single_nl.txt"
rm single.txt single_nl.txt

# Test 15: File with multiple lines
cat > multi.txt << 'EOF'
Line 1
Line 2
Line 3
EOF

run_test "multiple lines" \
    "$CCWC -l multi.txt" \
    "       3 multi.txt"

# Test 16: Word count with multiple words
run_test "word count with multiple words" \
    "$CCWC -w multi.txt" \
    "       6 multi.txt"
rm multi.txt

# Test 17: Long option --bytes
run_test "long option --bytes" \
    "$CCWC --bytes test.txt" \
    "  342190 test.txt"

# Test 18: Long option --lines
run_test "long option --lines" \
    "$CCWC --lines test.txt" \
    "    7145 test.txt"

# Test 19: Long option --words
run_test "long option --words" \
    "$CCWC --words test.txt" \
    "   58164 test.txt"

# Test 20: Long option --chars
run_test "long option --chars" \
    "$CCWC --chars test.txt" \
    "  339292 test.txt"

echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
