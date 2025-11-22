#!/bin/bash

# Test suite for cccut - cut tool implementation
# Tests various features of the cut command

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
run_test() {
    local test_name=$1
    local command=$2
    local expected=$3

    TESTS_RUN=$((TESTS_RUN + 1))

    # Run the command and capture output
    actual=$(eval "$command" 2>&1)

    # Compare output
    if [ "$actual" = "$expected" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $test_name"
        echo -e "  Expected: ${YELLOW}$expected${NC}"
        echo -e "  Got:      ${YELLOW}$actual${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Setup
echo "Setting up test environment..."
CCCUT="./cccut"

# Check if binary exists
if [ ! -f "$CCCUT" ]; then
    echo -e "${RED}Error: $CCCUT not found. Please run 'make' first.${NC}"
    exit 1
fi

# Create test files
echo -e "one\ttwo\tthree" > test_tab.txt
echo "one,two,three,four" > test_csv.txt
echo -e "apple\tbanana\tcherry\tdate" > test_fruits.txt
echo "1:2:3:4:5" > test_colon.txt
echo -e "field1\tfield2" > test_two_fields.txt
echo "no-delimiter-here" > test_no_delim.txt

# Create multi-line test file
cat > test_multi.txt << 'EOF'
one	two	three	four
alpha	beta	gamma	delta
1	2	3	4
EOF

cat > test_multi_csv.txt << 'EOF'
one,two,three,four
alpha,beta,gamma,delta
1,2,3,4
EOF

echo ""
echo "Running tests..."
echo "================"

# Test 1: Single field extraction (TAB delimiter)
run_test "Extract first field (tab-delimited)" \
    "$CCCUT -f 1 test_tab.txt" \
    "one"

# Test 2: Multiple fields extraction
run_test "Extract fields 1 and 3 (tab-delimited)" \
    "$CCCUT -f 1,3 test_tab.txt" \
    "one	three"

# Test 3: Field range extraction
run_test "Extract field range 1-2 (tab-delimited)" \
    "$CCCUT -f 1-2 test_tab.txt" \
    "one	two"

# Test 4: Custom delimiter (comma)
run_test "Extract first field (comma-delimited)" \
    "$CCCUT -f 1 -d , test_csv.txt" \
    "one"

# Test 5: Multiple fields with custom delimiter
run_test "Extract fields 1,3 (comma-delimited)" \
    "$CCCUT -f 1,3 -d , test_csv.txt" \
    "one,three"

# Test 6: Field range with custom delimiter
run_test "Extract field range 2-3 (comma-delimited)" \
    "$CCCUT -f 2-3 -d , test_csv.txt" \
    "two,three"

# Test 7: Open-ended range (from N to end)
run_test "Extract fields 2- (from 2 to end)" \
    "$CCCUT -f 2- -d , test_csv.txt" \
    "two,three,four"

# Test 8: Open-ended range (from start to N)
run_test "Extract fields -2 (from start to 2)" \
    "$CCCUT -f -2 -d , test_csv.txt" \
    "one,two"

# Test 9: Byte extraction
run_test "Extract bytes 1-5" \
    "echo 'hello world' | $CCCUT -b 1-5" \
    "hello"

# Test 10: Character extraction
run_test "Extract characters 1-5" \
    "echo 'hello world' | $CCCUT -c 1-5" \
    "hello"

# Test 11: Non-contiguous byte ranges
run_test "Extract bytes 1,3,5" \
    "echo 'abcdef' | $CCCUT -b 1,3,5" \
    "ace"

# Test 12: Reading from stdin
run_test "Read from stdin (pipe)" \
    "echo -e 'one\ttwo\tthree' | $CCCUT -f 2" \
    "two"

# Test 13: Multiple lines processing
run_test "Process multiple lines (field 1)" \
    "$CCCUT -f 1 test_multi.txt | head -n 1" \
    "one"

# Test 14: Multiple lines processing (field 2-3)
run_test "Process multiple lines (fields 2-3)" \
    "$CCCUT -f 2-3 -d , test_multi_csv.txt | head -n 1" \
    "two,three"

# Test 15: Custom delimiter (colon)
run_test "Extract fields with colon delimiter" \
    "$CCCUT -f 1,3,5 -d : test_colon.txt" \
    "1:3:5"

# Test 16: All fields
run_test "Extract all fields (1-)" \
    "$CCCUT -f 1- test_two_fields.txt" \
    "field1	field2"

# Test 17: Suppress non-delimited lines
run_test "Suppress lines without delimiter" \
    "$CCCUT -f 1 -s test_no_delim.txt" \
    ""

# Cleanup
echo ""
echo "Cleaning up test files..."
rm -f test_tab.txt test_csv.txt test_fruits.txt test_colon.txt
rm -f test_two_fields.txt test_no_delim.txt test_multi.txt test_multi_csv.txt

# Summary
echo ""
echo "================"
echo "Test Summary"
echo "================"
echo "Tests run:    $TESTS_RUN"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed.${NC}"
    exit 1
fi
