#!/bin/bash

# Test script for Huffman Compression Tool
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TOOL="./cccompress"
PASSED=0
FAILED=0

# Function to print test header
print_header() {
    echo ""
    echo "======================================"
    echo "$1"
    echo "======================================"
}

# Function to run a test
run_test() {
    local test_name="$1"
    local test_cmd="$2"
    local expected_result="$3"

    echo -n "Testing: $test_name... "

    if eval "$test_cmd"; then
        if [ "$expected_result" = "success" ]; then
            echo -e "${GREEN}PASSED${NC}"
            ((PASSED++))
        else
            echo -e "${RED}FAILED${NC} (expected failure)"
            ((FAILED++))
        fi
    else
        if [ "$expected_result" = "fail" ]; then
            echo -e "${GREEN}PASSED${NC} (expected failure)"
            ((PASSED++))
        else
            echo -e "${RED}FAILED${NC}"
            ((FAILED++))
        fi
    fi
}

# Function to compare files
compare_files() {
    local file1="$1"
    local file2="$2"

    if diff "$file1" "$file2" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Cleanup function
cleanup() {
    rm -f test*.txt test*.huf test*.decoded
    rm -f empty.txt empty.txt.huf empty.txt.decoded
    rm -f single.txt single.txt.huf single.txt.decoded
    rm -f binary.dat binary.dat.huf binary.dat.decoded
}

# Start tests
print_header "Huffman Compression Tool - Test Suite"

# Check if tool exists
if [ ! -f "$TOOL" ]; then
    echo -e "${RED}Error: $TOOL not found. Please run 'make' first.${NC}"
    exit 1
fi

print_header "Test 1: Basic Compression and Decompression"

# Create test file
echo "this is an example of a huffman tree" > test1.txt

run_test "Compress test1.txt" "$TOOL -z test1.txt" "success"
run_test "Compressed file exists" "[ -f test1.txt.huf ]" "success"
run_test "Decompress test1.txt.huf" "$TOOL -x test1.txt.huf" "success"
run_test "Decompressed file exists" "[ -f test1.txt.decoded ]" "success"
run_test "Files match after decompression" "compare_files test1.txt test1.txt.decoded" "success"

print_header "Test 2: Empty File"

touch empty.txt
run_test "Compress empty file" "$TOOL -z empty.txt" "fail"

print_header "Test 3: Single Character File"

echo "aaaaaaaaaa" > single.txt
run_test "Compress single character file" "$TOOL -z single.txt" "success"
run_test "Decompress single character file" "$TOOL -x single.txt.huf" "success"
run_test "Single char files match" "compare_files single.txt single.txt.decoded" "success"

print_header "Test 4: Larger Text File"

# Create a larger test file
cat > test4.txt << 'EOF'
The Huffman coding algorithm was developed by David A. Huffman in 1952.
It is a method of lossless data compression that assigns variable-length codes to characters.
Characters that occur more frequently are assigned shorter codes.
This results in compression of the data.
The algorithm builds a binary tree where each leaf represents a character.
The path from the root to a leaf gives the binary code for that character.
EOF

run_test "Compress larger file" "$TOOL -z test4.txt" "success"
run_test "Decompress larger file" "$TOOL -x test4.txt.huf" "success"
run_test "Larger files match" "compare_files test4.txt test4.txt.decoded" "success"

print_header "Test 5: Binary Data"

# Create a binary file
dd if=/dev/urandom of=binary.dat bs=1024 count=1 2>/dev/null
run_test "Compress binary file" "$TOOL -z binary.dat" "success"
run_test "Decompress binary file" "$TOOL -x binary.dat.huf" "success"
run_test "Binary files match" "compare_files binary.dat binary.dat.decoded" "success"

print_header "Test 6: Character Frequencies"

echo "hello world" > test6.txt
run_test "Show frequencies" "$TOOL -f test6.txt > /dev/null" "success"

print_header "Test 7: Huffman Codes"

run_test "Show Huffman codes" "$TOOL -c test6.txt > /dev/null" "success"

print_header "Test 8: Huffman Tree"

run_test "Show Huffman tree" "$TOOL -t test6.txt > /dev/null" "success"

print_header "Test 9: Repeated Compression/Decompression"

echo "The quick brown fox jumps over the lazy dog" > test9.txt
run_test "First compression" "$TOOL -z test9.txt" "success"
run_test "First decompression" "$TOOL -x test9.txt.huf" "success"
run_test "First cycle matches" "compare_files test9.txt test9.txt.decoded" "success"

# Compress the decompressed file
mv test9.txt.decoded test9_round2.txt
run_test "Second compression" "$TOOL -z test9_round2.txt" "success"
run_test "Second decompression" "$TOOL -x test9_round2.txt.huf" "success"
run_test "Second cycle matches" "compare_files test9.txt test9_round2.txt.decoded" "success"

print_header "Test 10: Special Characters"

# Create file with special characters
printf "Line 1\nLine 2\tTabbed\nLine 3\r\n" > test10.txt
run_test "Compress special chars" "$TOOL -z test10.txt" "success"
run_test "Decompress special chars" "$TOOL -x test10.txt.huf" "success"
run_test "Special chars match" "compare_files test10.txt test10.txt.decoded" "success"

# Cleanup
cleanup
rm -f test6.txt test9.txt test9_round2.txt test9_round2.txt.huf test9_round2.txt.decoded test10.txt

# Print summary
print_header "Test Summary"
echo -e "Total tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
