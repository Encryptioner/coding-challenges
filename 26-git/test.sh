#!/bin/bash

# Test script for mygit
# Tests core Git functionality

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# mygit command (use absolute path since we'll cd into test directory)
MYGIT="$(pwd)/mygit.py"

# Check if mygit exists
if [ ! -f "$MYGIT" ]; then
    echo -e "${RED}Error: mygit.py not found${NC}"
    exit 1
fi

# Create test directory
TEST_DIR="test-repo"

# Cleanup function
cleanup() {
    cd ..
    rm -rf "$TEST_DIR"
}

# Setup test directory
setup() {
    rm -rf "$TEST_DIR"
    mkdir "$TEST_DIR"
    cd "$TEST_DIR"
}

# Test function
run_test() {
    local description="$1"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -n "Test $TOTAL_TESTS: $description... "
}

pass_test() {
    echo -e "${GREEN}✓${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

fail_test() {
    local message="$1"
    echo -e "${RED}✗${NC}"
    if [ -n "$message" ]; then
        echo "    $message"
    fi
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

echo "========================================"
echo "mygit Test Suite"
echo "========================================"
echo ""

# Test 1: Initialize repository
setup
run_test "git init creates .git directory"
$MYGIT init > /dev/null 2>&1
if [ -d ".git" ]; then
    pass_test
else
    fail_test ".git directory not created"
fi

# Test 2: Check .git structure
run_test ".git has correct structure"
if [ -d ".git/objects" ] && [ -d ".git/refs" ] && [ -f ".git/HEAD" ]; then
    pass_test
else
    fail_test "Missing required .git subdirectories"
fi

# Test 3: HEAD file
run_test "HEAD points to refs/heads/main"
head_content=$(cat .git/HEAD)
if [ "$head_content" = "ref: refs/heads/main" ]; then
    pass_test
else
    fail_test "HEAD content: $head_content"
fi

# Test 4: hash-object
run_test "hash-object computes correct hash"
echo "test content" > testfile.txt
hash=$($MYGIT hash-object testfile.txt)
expected="d670460b4b4aece5915caf5c68d12f560a9fe3e4"
if [ "$hash" = "$expected" ]; then
    pass_test
else
    fail_test "Expected $expected, got $hash"
fi

# Test 5: hash-object with -w
run_test "hash-object -w writes object"
hash=$($MYGIT hash-object -w testfile.txt)
obj_path=".git/objects/${hash:0:2}/${hash:2}"
if [ -f "$obj_path" ]; then
    pass_test
else
    fail_test "Object file not created at $obj_path"
fi

# Test 6: cat-file -t
run_test "cat-file -t shows blob type"
type=$($MYGIT cat-file -t $hash)
if [ "$type" = "blob" ]; then
    pass_test
else
    fail_test "Expected 'blob', got '$type'"
fi

# Test 7: cat-file -p
run_test "cat-file -p shows content"
content=$($MYGIT cat-file -p $hash)
if [ "$content" = "test content" ]; then
    pass_test
else
    fail_test "Content mismatch"
fi

# Test 8: add file
run_test "add stages file to index"
$MYGIT add testfile.txt > /dev/null 2>&1
if [ -f ".git/index" ] && grep -q "testfile.txt" .git/index; then
    pass_test
else
    fail_test "File not added to index"
fi

# Test 9: status shows staged file
run_test "status shows staged file"
status_output=$($MYGIT status 2>&1)
if echo "$status_output" | grep -q "testfile.txt"; then
    pass_test
else
    fail_test "Status doesn't show staged file"
fi

# Test 10: commit
run_test "commit creates commit object"
commit_hash=$($MYGIT commit -m "Initial commit" 2>&1 | grep -oE "[0-9a-f]{7}" | head -1)
if [ -n "$commit_hash" ]; then
    pass_test
else
    fail_test "Commit failed"
fi

# Test 11: HEAD points to commit
run_test "branch reference updated"
if [ -f ".git/refs/heads/main" ]; then
    ref_hash=$(cat .git/refs/heads/main)
    if [ -n "$ref_hash" ]; then
        pass_test
    else
        fail_test "Branch reference is empty"
    fi
else
    fail_test "Branch reference not created"
fi

# Test 12: log shows commit
run_test "log shows commit history"
log_output=$($MYGIT log 2>&1)
if echo "$log_output" | grep -q "Initial commit"; then
    pass_test
else
    fail_test "Log doesn't show commit"
fi

# Test 13: Multiple files
run_test "add multiple files"
echo "file 1" > file1.txt
echo "file 2" > file2.txt
$MYGIT add file1.txt file2.txt > /dev/null 2>&1
if grep -q "file1.txt" .git/index && grep -q "file2.txt" .git/index; then
    pass_test
else
    fail_test "Multiple files not added"
fi

# Test 14: Second commit
run_test "create second commit"
$MYGIT commit -m "Add more files" > /dev/null 2>&1
log_output=$($MYGIT log 2>&1)
if echo "$log_output" | grep -q "Add more files" && echo "$log_output" | grep -q "Initial commit"; then
    pass_test
else
    fail_test "Second commit not in log"
fi

# Test 15: cat-file on commit
run_test "cat-file -p on commit object"
commit_hash=$(cat .git/refs/heads/main)
commit_content=$($MYGIT cat-file -p $commit_hash 2>&1)
if echo "$commit_content" | grep -q "tree" && echo "$commit_content" | grep -q "author"; then
    pass_test
else
    fail_test "Commit object content incorrect"
fi

# Test 16: status with clean working tree
run_test "status shows clean tree after commit"
status_output=$($MYGIT status 2>&1)
if echo "$status_output" | grep -q "nothing to commit"; then
    pass_test
else
    fail_test "Status should show clean tree"
fi

# Test 17: status with untracked file
run_test "status shows untracked files"
echo "untracked" > untracked.txt
status_output=$($MYGIT status 2>&1)
if echo "$status_output" | grep -q "untracked.txt"; then
    pass_test
else
    fail_test "Untracked file not shown"
fi

# Test 18: status with modified file
run_test "status shows modified files"
echo "modified content" >> file1.txt
status_output=$($MYGIT status 2>&1)
if echo "$status_output" | grep -q "modified"; then
    pass_test
else
    fail_test "Modified file not detected"
fi

# Cleanup
cleanup

# Print summary
echo ""
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
