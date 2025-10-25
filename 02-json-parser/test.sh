#!/usr/bin/env bash
#
# Test suite for ccjsonparser - A JSON Parser
#
# This script tests all the functionality of ccjsonparser to ensure it works correctly.
# It runs tests for all steps of the challenge and validates error handling.
#
# Usage: ./test.sh
#
# Exit codes:
#   0 - All tests passed
#   1 - One or more tests failed

# set -e disabled - we need to test error cases

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Binary to test
PARSER="./ccjsonparser"

#
# Helper Functions
#

# Print colored message
print_msg() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Print test header
print_test() {
    echo ""
    print_msg "$BLUE" "TEST: $1"
}

# Check if parser binary exists
check_binary() {
    if [ ! -f "$PARSER" ]; then
        print_msg "$RED" "Error: $PARSER not found. Run 'make' first."
        exit 1
    fi

    if [ ! -x "$PARSER" ]; then
        print_msg "$RED" "Error: $PARSER is not executable."
        exit 1
    fi
}

# Run a test expecting valid JSON
test_valid() {
    local description="$1"
    local file="$2"

    TESTS_RUN=$((TESTS_RUN + 1))

    if $PARSER "$file" >/dev/null 2>&1; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        print_msg "$GREEN" "  ✓ $description"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        print_msg "$RED" "  ✗ $description (expected valid, got invalid)"
        return 1
    fi
}

# Run a test expecting invalid JSON
test_invalid() {
    local description="$1"
    local file="$2"

    TESTS_RUN=$((TESTS_RUN + 1))

    if $PARSER "$file" >/dev/null 2>&1; then
        TESTS_FAILED=$((TESTS_FAILED + 1))
        print_msg "$RED" "  ✗ $description (expected invalid, got valid)"
        return 1
    else
        TESTS_PASSED=$((TESTS_PASSED + 1))
        print_msg "$GREEN" "  ✓ $description"
        return 0
    fi
}

#
# Test Cases
#

# Test 1: Help and version
test_help_version() {
    print_test "Help and version output"

    TESTS_RUN=$((TESTS_RUN + 1))
    if $PARSER --help | grep -q "Usage:"; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        print_msg "$GREEN" "  ✓ Help output"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        print_msg "$RED" "  ✗ Help output"
    fi

    TESTS_RUN=$((TESTS_RUN + 1))
    if $PARSER --version | grep -q "version"; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        print_msg "$GREEN" "  ✓ Version output"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        print_msg "$RED" "  ✗ Version output"
    fi
}

# Test Step 1: Empty objects
test_step1() {
    print_test "Step 1: Empty objects"

    if [ -d "tests/step1" ]; then
        test_valid "Valid empty object" "tests/step1/valid.json"
        test_invalid "Invalid JSON" "tests/step1/invalid.json"
    else
        print_msg "$YELLOW" "  Warning: tests/step1 directory not found"
    fi
}

# Test Step 2: String keys and values
test_step2() {
    print_test "Step 2: String keys and values"

    if [ -d "tests/step2" ]; then
        test_valid "Simple string key-value" "tests/step2/valid.json"
        test_valid "Multiple string key-values" "tests/step2/valid2.json"
        test_invalid "Invalid JSON format" "tests/step2/invalid.json"
        test_invalid "Invalid JSON format 2" "tests/step2/invalid2.json"
    else
        print_msg "$YELLOW" "  Warning: tests/step2 directory not found"
    fi
}

# Test Step 3: Multiple value types
test_step3() {
    print_test "Step 3: Multiple value types (string, number, boolean, null)"

    if [ -d "tests/step3" ]; then
        test_valid "Mixed value types" "tests/step3/valid.json"
        test_invalid "Invalid value types" "tests/step3/invalid.json"
    else
        print_msg "$YELLOW" "  Warning: tests/step3 directory not found"
    fi
}

# Test Step 4: Nested objects and arrays
test_step4() {
    print_test "Step 4: Nested objects and arrays"

    if [ -d "tests/step4" ]; then
        test_valid "Objects and arrays" "tests/step4/valid.json"
        test_valid "Nested structures" "tests/step4/valid2.json"
        test_invalid "Invalid nested structure" "tests/step4/invalid.json"
    else
        print_msg "$YELLOW" "  Warning: tests/step4 directory not found"
    fi
}

# Test stdin
test_stdin() {
    print_test "Standard input"

    TESTS_RUN=$((TESTS_RUN + 1))
    if echo '{}' | $PARSER >/dev/null 2>&1; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        print_msg "$GREEN" "  ✓ Valid JSON from stdin"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        print_msg "$RED" "  ✗ Valid JSON from stdin"
    fi

    TESTS_RUN=$((TESTS_RUN + 1))
    if echo '{' | $PARSER >/dev/null 2>&1; then
        TESTS_FAILED=$((TESTS_FAILED + 1))
        print_msg "$RED" "  ✗ Invalid JSON from stdin (expected invalid, got valid)"
    else
        TESTS_PASSED=$((TESTS_PASSED + 1))
        print_msg "$GREEN" "  ✓ Invalid JSON from stdin"
    fi

    TESTS_RUN=$((TESTS_RUN + 1))
    if $PARSER < tests/step1/valid.json >/dev/null 2>&1; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        print_msg "$GREEN" "  ✓ Valid JSON from redirect"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        print_msg "$RED" "  ✗ Valid JSON from redirect"
    fi
}

# Test additional cases
test_additional() {
    print_test "Additional test cases"

    # Create temporary test files
    local temp_dir=$(mktemp -d)

    # Test: Empty array
    echo '[]' > "$temp_dir/empty_array.json"
    test_valid "Empty array" "$temp_dir/empty_array.json"

    # Test: Array with values
    echo '[1, 2, 3]' > "$temp_dir/array_numbers.json"
    test_valid "Array with numbers" "$temp_dir/array_numbers.json"

    # Test: Nested arrays
    echo '[[1, 2], [3, 4]]' > "$temp_dir/nested_arrays.json"
    test_valid "Nested arrays" "$temp_dir/nested_arrays.json"

    # Test: Complex nested structure
    cat > "$temp_dir/complex.json" << 'EOF'
{
  "name": "John Doe",
  "age": 30,
  "active": true,
  "address": {
    "street": "123 Main St",
    "city": "Anytown"
  },
  "hobbies": ["reading", "coding", "gaming"],
  "metadata": null
}
EOF
    test_valid "Complex nested structure" "$temp_dir/complex.json"

    # Test: Missing closing brace
    echo '{' > "$temp_dir/missing_brace.json"
    test_invalid "Missing closing brace" "$temp_dir/missing_brace.json"

    # Test: Missing closing bracket
    echo '[' > "$temp_dir/missing_bracket.json"
    test_invalid "Missing closing bracket" "$temp_dir/missing_bracket.json"

    # Test: Missing quotes on key
    echo '{key: "value"}' > "$temp_dir/unquoted_key.json"
    test_invalid "Unquoted key" "$temp_dir/unquoted_key.json"

    # Test: Trailing comma
    echo '{"key": "value",}' > "$temp_dir/trailing_comma.json"
    test_invalid "Trailing comma in object" "$temp_dir/trailing_comma.json"

    # Test: Missing colon
    echo '{"key" "value"}' > "$temp_dir/missing_colon.json"
    test_invalid "Missing colon" "$temp_dir/missing_colon.json"

    # Test: Single value (not object/array)
    echo '"just a string"' > "$temp_dir/just_string.json"
    test_invalid "Just a string (not object/array)" "$temp_dir/just_string.json"

    # Test: Number without object/array
    echo '42' > "$temp_dir/just_number.json"
    test_invalid "Just a number (not object/array)" "$temp_dir/just_number.json"

    # Cleanup
    rm -rf "$temp_dir"
}

# Test exit codes
test_exit_codes() {
    print_test "Exit codes"

    TESTS_RUN=$((TESTS_RUN + 1))
    $PARSER tests/step1/valid.json >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        print_msg "$GREEN" "  ✓ Valid JSON returns 0"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        print_msg "$RED" "  ✗ Valid JSON should return 0"
    fi

    TESTS_RUN=$((TESTS_RUN + 1))
    $PARSER tests/step1/invalid.json >/dev/null 2>&1
    if [ $? -eq 1 ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        print_msg "$GREEN" "  ✓ Invalid JSON returns 1"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        print_msg "$RED" "  ✗ Invalid JSON should return 1"
    fi
}

#
# Main Test Runner
#

main() {
    print_msg "$BLUE" "================================================"
    print_msg "$BLUE" "  ccjsonparser Test Suite"
    print_msg "$BLUE" "================================================"

    # Check if binary exists
    check_binary

    # Run test suites
    test_help_version
    test_step1
    test_step2
    test_step3
    test_step4
    test_stdin
    test_additional
    test_exit_codes

    # Print summary
    echo ""
    print_msg "$BLUE" "================================================"
    print_msg "$BLUE" "  Test Summary"
    print_msg "$BLUE" "================================================"
    echo "Total tests run:    $TESTS_RUN"
    print_msg "$GREEN" "Tests passed:       $TESTS_PASSED"

    if [ $TESTS_FAILED -gt 0 ]; then
        print_msg "$RED" "Tests failed:       $TESTS_FAILED"
        echo ""
        print_msg "$RED" "SOME TESTS FAILED"
        exit 1
    else
        print_msg "$GREEN" "Tests failed:       $TESTS_FAILED"
        echo ""
        print_msg "$GREEN" "ALL TESTS PASSED!"
        exit 0
    fi
}

# Run main function
main
