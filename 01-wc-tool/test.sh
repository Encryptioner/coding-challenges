#!/usr/bin/env bash
#
# Test suite for ccwc - A clone of the Unix wc tool
#
# This script tests all the functionality of ccwc to ensure it works correctly.
# It creates test files, runs ccwc with various options, and validates the output.
#
# Usage: ./test.sh
#
# Exit codes:
#   0 - All tests passed
#   1 - One or more tests failed

set -e  # Exit on error

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
CCWC="./ccwc"

# Test file names
TEST_FILE_1="test_simple.txt"
TEST_FILE_2="test_multiline.txt"
TEST_FILE_3="test_empty.txt"
TEST_FILE_4="test_unicode.txt"

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

# Check if ccwc binary exists
check_binary() {
    if [ ! -f "$CCWC" ]; then
        print_msg "$RED" "Error: $CCWC not found. Run 'make' first."
        exit 1
    fi

    if [ ! -x "$CCWC" ]; then
        print_msg "$RED" "Error: $CCWC is not executable."
        exit 1
    fi
}

# Run a test
run_test() {
    local description="$1"
    local command="$2"
    local expected="$3"

    TESTS_RUN=$((TESTS_RUN + 1))

    # Run command and capture output
    local output
    output=$(eval "$command" 2>&1)

    # Check if output matches expected
    if echo "$output" | grep -q "$expected"; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        print_msg "$GREEN" "  ✓ $description"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        print_msg "$RED" "  ✗ $description"
        print_msg "$YELLOW" "    Expected: $expected"
        print_msg "$YELLOW" "    Got:      $output"
        return 1
    fi
}

# Create test files
create_test_files() {
    print_msg "$BLUE" "Creating test files..."

    # Simple test file
    echo "hello world" > "$TEST_FILE_1"

    # Multi-line test file
    cat > "$TEST_FILE_2" << 'EOF'
line1
line2
line3
EOF

    # Empty file
    touch "$TEST_FILE_3"

    # Unicode test file
    echo "Hello 世界 🌍" > "$TEST_FILE_4"

    print_msg "$GREEN" "Test files created"
}

# Clean up test files
cleanup_test_files() {
    print_msg "$BLUE" "Cleaning up test files..."
    rm -f "$TEST_FILE_1" "$TEST_FILE_2" "$TEST_FILE_3" "$TEST_FILE_4"
    print_msg "$GREEN" "Cleanup complete"
}

#
# Test Cases
#

# Test 1: Help output
test_help() {
    print_test "Help output"
    run_test "Show help with --help" "$CCWC --help" "Usage:"
    run_test "Show help with -h" "$CCWC -h" "Usage:"
}

# Test 2: Version output
test_version() {
    print_test "Version output"
    run_test "Show version with --version" "$CCWC --version" "version"
    run_test "Show version with -v" "$CCWC -v" "version"
}

# Test 3: Byte counting (-c flag)
test_byte_count() {
    print_test "Byte counting (-c flag)"

    # Simple file: "hello world\n" = 12 bytes
    run_test "Count bytes in simple file" "$CCWC -c $TEST_FILE_1" "12"

    # Multi-line file: "line1\nline2\nline3\n" = 18 bytes
    run_test "Count bytes in multi-line file" "$CCWC -c $TEST_FILE_2" "18"

    # Empty file: 0 bytes
    run_test "Count bytes in empty file" "$CCWC -c $TEST_FILE_3" "0"
}

# Test 4: Line counting (-l flag)
test_line_count() {
    print_test "Line counting (-l flag)"

    # Simple file: 1 line
    run_test "Count lines in simple file" "$CCWC -l $TEST_FILE_1" "1"

    # Multi-line file: 3 lines
    run_test "Count lines in multi-line file" "$CCWC -l $TEST_FILE_2" "3"

    # Empty file: 0 lines
    run_test "Count lines in empty file" "$CCWC -l $TEST_FILE_3" "0"
}

# Test 5: Word counting (-w flag)
test_word_count() {
    print_test "Word counting (-w flag)"

    # Simple file: "hello world" = 2 words
    run_test "Count words in simple file" "$CCWC -w $TEST_FILE_1" "2"

    # Multi-line file: "line1 line2 line3" = 3 words
    run_test "Count words in multi-line file" "$CCWC -w $TEST_FILE_2" "3"

    # Empty file: 0 words
    run_test "Count words in empty file" "$CCWC -w $TEST_FILE_3" "0"
}

# Test 6: Character counting (-m flag)
test_char_count() {
    print_test "Character counting (-m flag)"

    # Simple ASCII file
    run_test "Count characters in simple file" "$CCWC -m $TEST_FILE_1" "12"

    # Note: Unicode character count may vary by locale
    run_test "Count characters in unicode file" "$CCWC -m $TEST_FILE_4" "Hello"
}

# Test 7: Default behavior (no flags)
test_default() {
    print_test "Default behavior (no flags)"

    # Default should output: lines, words, bytes
    run_test "Default output for simple file" "$CCWC $TEST_FILE_1" "1.*2.*12"
    run_test "Default output for multi-line file" "$CCWC $TEST_FILE_2" "3.*3.*18"
}

# Test 8: Multiple flags
test_multiple_flags() {
    print_test "Multiple flags"

    # Combine -l and -w
    run_test "Combine -l and -w flags" "$CCWC -l -w $TEST_FILE_1" "1.*2"

    # Combine -c and -l
    run_test "Combine -c and -l flags" "$CCWC -c -l $TEST_FILE_2" "3.*18"

    # All flags together: -l -w -c
    run_test "All flags: -l -w -c" "$CCWC -l -w -c $TEST_FILE_1" "1.*2.*12"
}

# Test 9: Standard input
test_stdin() {
    print_test "Standard input"

    # Test with pipe
    run_test "Count lines from stdin (pipe)" "echo -e 'line1\nline2\nline3' | $CCWC -l" "3"

    # Test with redirection
    run_test "Count words from stdin (redirect)" "$CCWC -w < $TEST_FILE_1" "2"

    # Test with cat
    run_test "Count bytes from stdin (cat)" "cat $TEST_FILE_2 | $CCWC -c" "18"
}

# Test 10: Multiple files
test_multiple_files() {
    print_test "Multiple files"

    # Process multiple files - should show total
    run_test "Process multiple files" "$CCWC $TEST_FILE_1 $TEST_FILE_2" "total"

    # Count lines in multiple files
    run_test "Count lines in multiple files" "$CCWC -l $TEST_FILE_1 $TEST_FILE_2" "4.*total"
}

# Test 11: Error handling
test_errors() {
    print_test "Error handling"

    # Non-existent file
    if $CCWC nonexistent.txt 2>&1 | grep -q "No such file"; then
        TESTS_RUN=$((TESTS_RUN + 1))
        TESTS_PASSED=$((TESTS_PASSED + 1))
        print_msg "$GREEN" "  ✓ Handle non-existent file"
    else
        TESTS_RUN=$((TESTS_RUN + 1))
        TESTS_FAILED=$((TESTS_FAILED + 1))
        print_msg "$RED" "  ✗ Handle non-existent file"
    fi

    # Invalid option
    if $CCWC -x 2>&1 | grep -q "invalid option"; then
        TESTS_RUN=$((TESTS_RUN + 1))
        TESTS_PASSED=$((TESTS_PASSED + 1))
        print_msg "$GREEN" "  ✓ Handle invalid option"
    else
        TESTS_RUN=$((TESTS_RUN + 1))
        TESTS_FAILED=$((TESTS_FAILED + 1))
        print_msg "$RED" "  ✗ Handle invalid option"
    fi
}

# Test 12: Challenge test file (if available)
test_challenge_file() {
    if [ -f "test.txt" ]; then
        print_test "Challenge test file validation"

        # Expected values from the challenge
        run_test "Count bytes in test.txt" "$CCWC -c test.txt" "342190"
        run_test "Count lines in test.txt" "$CCWC -l test.txt" "7145"
        run_test "Count words in test.txt" "$CCWC -w test.txt" "58164"
        run_test "Count characters in test.txt" "$CCWC -m test.txt" "339292"
        run_test "Default count in test.txt" "$CCWC test.txt" "7145.*58164.*342190"

        # Test stdin with challenge file
        run_test "Count lines from stdin (challenge file)" "cat test.txt | $CCWC -l" "7145"
    else
        print_msg "$YELLOW" "Note: test.txt not found. Skipping challenge file tests."
        print_msg "$YELLOW" "      Download from: https://www.gutenberg.org/cache/epub/132/pg132.txt"
    fi
}

#
# Main Test Runner
#

main() {
    print_msg "$BLUE" "================================================"
    print_msg "$BLUE" "  ccwc Test Suite"
    print_msg "$BLUE" "================================================"

    # Check if binary exists
    check_binary

    # Create test files
    create_test_files

    # Run test suites
    test_help
    test_version
    test_byte_count
    test_line_count
    test_word_count
    test_char_count
    test_default
    test_multiple_flags
    test_stdin
    test_multiple_files
    test_errors
    test_challenge_file

    # Clean up
    cleanup_test_files

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
