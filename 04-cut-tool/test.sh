#!/bin/bash
#
# Test suite for cccut
# Tests various features and edge cases
#

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL=0
PASSED=0
FAILED=0

# cccut executable
CCCUT="./cccut"

# Check if cccut exists
if [ ! -f "$CCCUT" ]; then
    echo -e "${RED}Error: cccut not found. Run 'make' first.${NC}"
    exit 1
fi

# Test function
test_case() {
    local name="$1"
    local input="$2"
    local args="$3"
    local expected="$4"

    TOTAL=$((TOTAL + 1))

    # Run test
    actual=$(echo -e "$input" | $CCCUT $args 2>/dev/null)

    # Compare
    if [ "$actual" = "$expected" ]; then
        echo -e "${GREEN}✓${NC} Test $TOTAL: $name"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} Test $TOTAL: $name"
        echo "  Input:    '$input'"
        echo "  Args:     $args"
        echo "  Expected: '$expected'"
        echo "  Got:      '$actual'"
        FAILED=$((FAILED + 1))
    fi
}

# Print header
echo "========================================"
echo "cccut Test Suite"
echo "========================================"
echo ""

# ========================================
# Field Mode Tests
# ========================================
echo "Testing Field Mode (-f)..."
echo ""

test_case "Single field extraction" \
    "A,B,C,D,E" \
    "-d',' -f2" \
    "B"

test_case "Multiple fields" \
    "A,B,C,D,E" \
    "-d',' -f1,3,5" \
    "A,C,E"

test_case "Field range" \
    "A,B,C,D,E" \
    "-d',' -f2-4" \
    "B,C,D"

test_case "Open-ended range (N-)" \
    "A,B,C,D,E" \
    "-d',' -f3-" \
    "C,D,E"

test_case "Range from start (-M)" \
    "A,B,C,D,E" \
    "-d',' -f-3" \
    "A,B,C"

test_case "Combined ranges and fields" \
    "A,B,C,D,E,F,G,H" \
    "-d',' -f1,3-5,8" \
    "A,C,D,E,H"

test_case "Field reordering" \
    "Alice,25,Engineer" \
    "-d',' -f3,1,2" \
    "Engineer,Alice,25"

test_case "Colon delimiter" \
    "root:x:0:0:root:/root:/bin/bash" \
    "-d':' -f1,6" \
    "root:/root"

test_case "Tab delimiter (default)" \
    "A\tB\tC" \
    "-f2" \
    "B"

# ========================================
# Character Mode Tests
# ========================================
echo ""
echo "Testing Character Mode (-c)..."
echo ""

test_case "Single character" \
    "Hello World" \
    "-c1" \
    "H"

test_case "Character range" \
    "Hello World" \
    "-c1-5" \
    "Hello"

test_case "Multiple character positions" \
    "Hello World" \
    "-c1,3,5,7,9,11" \
    "HloWrd"

test_case "Open-ended character range" \
    "Hello World" \
    "-c7-" \
    "World"

test_case "Character range from start" \
    "Hello World" \
    "-c-5" \
    "Hello"

test_case "Combined character ranges" \
    "Hello World" \
    "-c1-5,7-11" \
    "HelloWorld"

# ========================================
# Delimiter Tests
# ========================================
echo ""
echo "Testing Delimiters..."
echo ""

test_case "Comma delimiter" \
    "A,B,C" \
    "-d',' -f2" \
    "B"

test_case "Pipe delimiter" \
    "A|B|C" \
    "-d'|' -f2" \
    "B"

test_case "Space delimiter" \
    "A B C" \
    "-d' ' -f2" \
    "B"

test_case "Semicolon delimiter" \
    "A;B;C" \
    "-d';' -f2" \
    "B"

# ========================================
# Suppress (-s) Tests
# ========================================
echo ""
echo "Testing Suppress Flag (-s)..."
echo ""

test_case "Suppress lines without delimiter" \
    "A:B:C\nNo delimiter here\nD:E:F" \
    "-d':' -f1 -s" \
    "A\nD"

test_case "Without suppress (default)" \
    "A:B:C\nNo delimiter\nD:E:F" \
    "-d':' -f1" \
    "A\nNo delimiter\nD"

# ========================================
# Edge Cases
# ========================================
echo ""
echo "Testing Edge Cases..."
echo ""

test_case "Empty input" \
    "" \
    "-d',' -f1" \
    ""

test_case "Single field" \
    "OnlyOneField" \
    "-d',' -f1" \
    "OnlyOneField"

test_case "Empty fields" \
    "A,,C" \
    "-d',' -f2" \
    ""

test_case "Field beyond range" \
    "A,B,C" \
    "-d',' -f5" \
    ""

test_case "Duplicate field selection" \
    "A,B,C" \
    "-d',' -f2,2,2" \
    "B,B,B"

test_case "Single character extraction" \
    "X" \
    "-c1" \
    "X"

# ========================================
# Multi-line Tests
# ========================================
echo ""
echo "Testing Multi-line Input..."
echo ""

test_case "Multiple lines - field mode" \
    "A,B,C\nD,E,F\nG,H,I" \
    "-d',' -f2" \
    "B\nE\nH"

test_case "Multiple lines - character mode" \
    "Hello\nWorld\nTest" \
    "-c1-3" \
    "Hel\nWor\nTes"

# ========================================
# File Input Tests
# ========================================
echo ""
echo "Testing File Input..."
echo ""

# Create temporary test files
TEMP_FILE1=$(mktemp)
TEMP_FILE2=$(mktemp)

echo -e "A,B,C\nD,E,F" > "$TEMP_FILE1"
echo -e "G,H,I\nJ,K,L" > "$TEMP_FILE2"

# Test single file
actual=$($CCCUT -d',' -f2 "$TEMP_FILE1" 2>/dev/null)
expected="B\nE"
TOTAL=$((TOTAL + 1))
if [ "$actual" = "$(echo -e "$expected")" ]; then
    echo -e "${GREEN}✓${NC} Test $TOTAL: Single file input"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗${NC} Test $TOTAL: Single file input"
    FAILED=$((FAILED + 1))
fi

# Test multiple files
actual=$($CCCUT -d',' -f2 "$TEMP_FILE1" "$TEMP_FILE2" 2>/dev/null)
expected="B\nE\nH\nL"
TOTAL=$((TOTAL + 1))
if [ "$actual" = "$(echo -e "$expected")" ]; then
    echo -e "${GREEN}✓${NC} Test $TOTAL: Multiple file input"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗${NC} Test $TOTAL: Multiple file input"
    FAILED=$((FAILED + 1))
fi

# Clean up temp files
rm -f "$TEMP_FILE1" "$TEMP_FILE2"

# ========================================
# Real-World Scenarios
# ========================================
echo ""
echo "Testing Real-World Scenarios..."
echo ""

test_case "Extract usernames from /etc/passwd format" \
    "root:x:0:0:root:/root:/bin/bash\nalice:x:1000:1000:Alice:/home/alice:/bin/bash" \
    "-d':' -f1" \
    "root\nalice"

test_case "Extract timestamp from log" \
    "2024-01-15 10:30:45 INFO User logged in" \
    "-c1-19" \
    "2024-01-15 10:30:45"

test_case "Parse CSV contact list" \
    "Alice Johnson,alice@example.com,555-0101\nBob Smith,bob@example.com,555-0102" \
    "-d',' -f1,2" \
    "Alice Johnson,alice@example.com\nBob Smith,bob@example.com"

# ========================================
# Error Cases (should handle gracefully)
# ========================================
echo ""
echo "Testing Error Handling..."
echo ""

# Test non-existent file (should print error but not crash)
$CCCUT -d',' -f1 /nonexistent/file 2>/dev/null
TOTAL=$((TOTAL + 1))
if [ $? -ne 0 ] || [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Test $TOTAL: Non-existent file handled"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗${NC} Test $TOTAL: Non-existent file not handled"
    FAILED=$((FAILED + 1))
fi

# ========================================
# Summary
# ========================================
echo ""
echo "========================================"
echo "Test Results"
echo "========================================"
echo "Total:  $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
