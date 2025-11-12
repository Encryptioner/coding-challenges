#!/bin/bash

# Test suite for ccmemcached - Coding Challenges Memcached Server

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Server details
PORT=11211
SERVER_PID=""

# Start server
start_server() {
    echo -e "${YELLOW}Starting memcached server...${NC}"
    ./ccmemcached -p $PORT &
    SERVER_PID=$!
    sleep 1

    # Check if server is running
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "${RED}Failed to start server${NC}"
        exit 1
    fi

    echo -e "${GREEN}Server started (PID: $SERVER_PID)${NC}"
}

# Stop server
stop_server() {
    if [ -n "$SERVER_PID" ]; then
        echo -e "${YELLOW}Stopping server...${NC}"
        kill $SERVER_PID 2>/dev/null
        wait $SERVER_PID 2>/dev/null
        echo -e "${GREEN}Server stopped${NC}"
    fi
}

# Cleanup on exit
cleanup() {
    stop_server
}

trap cleanup EXIT INT TERM

# Test function
run_test() {
    local description="$1"
    local commands="$2"
    local expected="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -n "Test $TOTAL_TESTS: $description... "

    # Send commands and capture output
    actual=$(echo -e "$commands" | nc -w 2 localhost $PORT 2>/dev/null)

    # Compare output
    if echo "$actual" | grep -q "$expected"; then
        echo -e "${GREEN}✓${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC}"
        echo "  Expected to contain: $expected"
        echo "  Actual: $actual"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Check if ccmemcached exists
if [ ! -f "./ccmemcached" ]; then
    echo -e "${RED}Error: ccmemcached not found. Please run 'make' first.${NC}"
    exit 1
fi

# Check if nc is available
if ! command -v nc &> /dev/null; then
    echo -e "${RED}Error: nc (netcat) not found. Please install netcat.${NC}"
    exit 1
fi

echo "========================================"
echo "ccmemcached Test Suite"
echo "========================================"
echo ""

# Start server
start_server

# Give server a moment to fully start
sleep 1

# Test 1: SET command
run_test "SET command stores value" \
    "set testkey 0 0 5\r\nhello\r\n" \
    "STORED"

# Test 2: GET command retrieves value
run_test "GET command retrieves stored value" \
    "get testkey\r\n" \
    "VALUE testkey 0 5"

# Test 3: SET with flags
run_test "SET command with flags" \
    "set flagtest 123 0 4\r\ndata\r\n" \
    "STORED"

# Test 4: GET returns correct flags
run_test "GET returns correct flags" \
    "get flagtest\r\n" \
    "VALUE flagtest 123 4"

# Test 5: GET non-existent key
run_test "GET non-existent key returns END" \
    "get nonexistent\r\n" \
    "END"

# Test 6: SET with noreply
run_test "SET with noreply doesn't send response" \
    "set noreplykey 0 0 4 noreply\r\ntest\r\nget noreplykey\r\n" \
    "VALUE noreplykey"

# Test 7: ADD command with new key
run_test "ADD command with new key" \
    "add newkey 0 0 5\r\nvalue\r\n" \
    "STORED"

# Test 8: ADD command with existing key
run_test "ADD command with existing key fails" \
    "add testkey 0 0 5\r\nother\r\n" \
    "NOT_STORED"

# Test 9: REPLACE command with existing key
run_test "REPLACE command with existing key" \
    "replace testkey 0 0 7\r\nreplaced\r\n" \
    "STORED"

# Test 10: REPLACE command with non-existent key
run_test "REPLACE command with non-existent key fails" \
    "replace nokey 0 0 4\r\ntest\r\n" \
    "NOT_STORED"

# Test 11: APPEND command
run_test "APPEND command appends to value" \
    "set appendkey 0 0 5\r\nhello\r\nappend appendkey 0 0 6\r\n world\r\nget appendkey\r\n" \
    "hello world"

# Test 12: APPEND to non-existent key
run_test "APPEND to non-existent key fails" \
    "append nokey 0 0 4\r\ntest\r\n" \
    "NOT_STORED"

# Test 13: PREPEND command
run_test "PREPEND command prepends to value" \
    "set prependkey 0 0 5\r\nworld\r\nprepend prependkey 0 0 6\r\nhello \r\nget prependkey\r\n" \
    "hello world"

# Test 14: PREPEND to non-existent key
run_test "PREPEND to non-existent key fails" \
    "prepend nokey 0 0 4\r\ntest\r\n" \
    "NOT_STORED"

# Test 15: DELETE command
run_test "DELETE command removes key" \
    "delete testkey\r\n" \
    "DELETED"

# Test 16: DELETE non-existent key
run_test "DELETE non-existent key" \
    "delete nonexistent\r\n" \
    "NOT_FOUND"

# Test 17: Expiration (immediate)
run_test "Expiration with negative exptime" \
    "set expkey 0 -1 4\r\ntest\r\nget expkey\r\n" \
    "END"

# Test 18: Expiration (future)
run_test "Key with future expiration exists initially" \
    "set futurekey 0 100 4\r\ntest\r\nget futurekey\r\n" \
    "VALUE futurekey"

# Test 19: GET multiple keys
run_test "GET multiple keys" \
    "set key1 0 0 4\r\nval1\r\nset key2 0 0 4\r\nval2\r\nget key1 key2\r\n" \
    "VALUE key1.*VALUE key2"

# Test 20: FLUSH_ALL command
run_test "FLUSH_ALL clears all keys" \
    "set tempkey 0 0 4\r\ntemp\r\nflush_all\r\nget tempkey\r\n" \
    "END"

# Test 21: STATS command
run_test "STATS command returns statistics" \
    "stats\r\n" \
    "STAT curr_items"

# Test 22: Update existing key with SET
run_test "SET updates existing key" \
    "set updatekey 0 0 5\r\nfirst\r\nset updatekey 0 0 6\r\nsecond\r\nget updatekey\r\n" \
    "VALUE updatekey 0 6"

# Test 23: Large value
run_test "SET and GET large value" \
    "set bigkey 0 0 1000\r\n$(printf 'A%.0s' {1..1000})\r\nget bigkey\r\n" \
    "VALUE bigkey 0 1000"

# Test 24: Empty value
run_test "SET and GET empty value" \
    "set emptykey 0 0 0\r\n\r\nget emptykey\r\n" \
    "VALUE emptykey 0 0"

# Test 25: Key with spaces in value
run_test "Value with spaces" \
    "set spacekey 0 0 11\r\nhello world\r\nget spacekey\r\n" \
    "hello world"

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
