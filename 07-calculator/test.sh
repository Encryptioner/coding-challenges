#!/bin/bash

# Test script for Calculator
# Tests various expressions and validates the results

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Calculator binary
CALC="./calc"

# Check if calculator binary exists
if [ ! -f "$CALC" ]; then
    echo -e "${RED}Error: Calculator binary not found. Please run 'make' first.${NC}"
    exit 1
fi

# Function to run a test
run_test() {
    local expr="$1"
    local expected="$2"
    local description="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    # Run calculator and capture output
    result=$($CALC "$expr" 2>&1)
    exit_code=$?

    # Check if test passed
    if [ $exit_code -eq 0 ]; then
        # Compare result (allowing for floating point precision)
        if echo "$result" | awk -v expected_val="$expected" '{exit !(sqrt(($1-expected_val)^2) < 0.0001)}'; then
            echo -e "${GREEN}✓${NC} Test $TOTAL_TESTS: $description"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}✗${NC} Test $TOTAL_TESTS: $description"
            echo "    Expression: $expr"
            echo "    Expected: $expected"
            echo "    Got: $result"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        echo -e "${RED}✗${NC} Test $TOTAL_TESTS: $description (ERROR)"
        echo "    Expression: $expr"
        echo "    Expected: $expected"
        echo "    Error: $result"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to test error cases
test_error() {
    local expr="$1"
    local description="$2"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    # Run calculator and expect error
    $CALC "$expr" >/dev/null 2>&1
    exit_code=$?

    if [ $exit_code -ne 0 ]; then
        echo -e "${GREEN}✓${NC} Test $TOTAL_TESTS: $description (error correctly detected)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC} Test $TOTAL_TESTS: $description (should have failed)"
        echo "    Expression: $expr"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo "========================================"
echo "Calculator Test Suite"
echo "========================================"
echo ""

# Basic arithmetic tests
echo "Basic Arithmetic:"
run_test "2 + 3" "5" "Simple addition"
run_test "10 - 4" "6" "Simple subtraction"
run_test "5 * 6" "30" "Simple multiplication"
run_test "20 / 4" "5" "Simple division"
run_test "2 ^ 3" "8" "Exponentiation"
echo ""

# Operator precedence tests
echo "Operator Precedence:"
run_test "2 + 3 * 4" "14" "Multiplication before addition"
run_test "2 * 3 + 4" "10" "Multiplication before addition (reversed)"
run_test "10 - 2 * 3" "4" "Multiplication before subtraction"
run_test "20 / 4 + 2" "7" "Division before addition"
run_test "2 + 3 * 4 - 5" "9" "Multiple operators"
run_test "2 ^ 3 * 2" "16" "Exponentiation before multiplication"
run_test "2 * 3 ^ 2" "18" "Exponentiation before multiplication (reversed)"
echo ""

# Parentheses tests
echo "Parentheses:"
run_test "(2 + 3) * 4" "20" "Parentheses override precedence"
run_test "2 * (3 + 4)" "14" "Parentheses override precedence (reversed)"
run_test "(10 - 2) * 3" "24" "Parentheses with subtraction"
run_test "(1 + 2) * (3 + 4)" "21" "Multiple parentheses"
run_test "((2 + 3) * 4) - 5" "15" "Nested parentheses"
run_test "2 * ((3 + 4) * 5)" "70" "Nested parentheses (complex)"
run_test "(1 * 2) - (3 * 4)" "-10" "Example from challenge"
echo ""

# Decimal numbers
echo "Decimal Numbers:"
run_test "3.14 * 2" "6.28" "Decimal multiplication"
run_test "10.5 + 2.5" "13" "Decimal addition"
run_test "7.5 / 2.5" "3" "Decimal division"
run_test "1.5 ^ 2" "2.25" "Decimal exponentiation"
run_test "0.1 + 0.2" "0.3" "Small decimals"
echo ""

# Negative numbers
echo "Negative Numbers:"
run_test "-5 + 10" "5" "Negative number addition"
run_test "-5 * 2" "-10" "Negative number multiplication"
run_test "10 + -5" "5" "Addition with negative"
run_test "10 - -5" "15" "Subtraction with negative (double negative)"
run_test "-2 ^ 2" "4" "Negative base exponentiation"
run_test "(-2) * (-3)" "6" "Negative multiplication"
echo ""

# Complex expressions
echo "Complex Expressions:"
run_test "2 + 3 * 4 - 5 / 2" "11.5" "Multiple operations"
run_test "(2 + 3) * (4 - 2) / 2" "5" "Complex with parentheses"
run_test "10 * 2 + 3 * 4 - 5" "27" "Multiple multiplications"
run_test "100 / 10 / 2" "5" "Chained division (left-to-right)"
run_test "2 ^ 2 ^ 3" "256" "Chained exponentiation (right-to-left)"
run_test "((1 + 2) * (3 + 4)) - ((5 - 2) * (6 - 4))" "15" "Very complex"
echo ""

# Edge cases
echo "Edge Cases:"
run_test "0" "0" "Zero"
run_test "0 + 0" "0" "Zero addition"
run_test "5 * 0" "0" "Multiplication by zero"
run_test "0 / 5" "0" "Zero division"
run_test "1 + 2 + 3 + 4 + 5" "15" "Long chain of additions"
run_test "2 * 2 * 2 * 2" "16" "Long chain of multiplications"
echo ""

# Error cases
echo "Error Cases:"
test_error "5 / 0" "Division by zero"
test_error "2 +" "Incomplete expression"
test_error "+ 2" "Operator at start"
test_error "2 3" "Missing operator"
test_error "(2 + 3" "Unclosed parenthesis"
test_error "2 + 3)" "Extra closing parenthesis"
test_error "2 + + 3" "Double operator"
test_error "abc" "Invalid characters"
echo ""

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
