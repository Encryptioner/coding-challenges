#!/bin/bash

# Test script for Redis Server
# Tests RESP protocol and various Redis commands

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Redis server details
PORT=6380  # Use non-standard port to avoid conflicts
SERVER_PID=""

# Check if redis-server binary exists
if [ ! -f "./redis-server" ]; then
    echo -e "${RED}Error: Redis server binary not found. Please run 'make' first.${NC}"
    exit 1
fi

# Function to start Redis server
start_server() {
    echo "Starting Redis server on port $PORT..."
    ./redis-server $PORT > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 1

    # Check if server is running
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "${RED}Error: Failed to start Redis server${NC}"
        exit 1
    fi

    echo "Redis server started (PID: $SERVER_PID)"
}

# Function to stop Redis server
stop_server() {
    if [ -n "$SERVER_PID" ]; then
        echo "Stopping Redis server..."
        kill $SERVER_PID 2>/dev/null
        wait $SERVER_PID 2>/dev/null
        echo "Redis server stopped"
    fi
}

# Cleanup on exit
trap stop_server EXIT

# Function to send command via netcat/telnet
send_command() {
    local command="$1"
    echo -ne "$command" | nc localhost $PORT 2>/dev/null
}

# Function to test a command
test_command() {
    local description="$1"
    local request="$2"
    local expected="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    result=$(send_command "$request")

    if [ "$result" == "$expected" ]; then
        echo -e "${GREEN}✓${NC} Test $TOTAL_TESTS: $description"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC} Test $TOTAL_TESTS: $description"
        echo "    Expected: $(echo -n "$expected" | od -An -tx1 | tr -d ' \n')"
        echo "    Got:      $(echo -n "$result" | od -An -tx1 | tr -d ' \n')"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to test with pattern matching
test_pattern() {
    local description="$1"
    local request="$2"
    local pattern="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    result=$(send_command "$request")

    if echo "$result" | grep -q "$pattern"; then
        echo -e "${GREEN}✓${NC} Test $TOTAL_TESTS: $description"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC} Test $TOTAL_TESTS: $description"
        echo "    Pattern:  $pattern"
        echo "    Got:      $result"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Check if nc (netcat) is available
if ! command -v nc &> /dev/null; then
    echo -e "${YELLOW}Warning: netcat (nc) not found. Some tests may fail.${NC}"
    echo "Please install netcat: apt-get install netcat (Ubuntu) or brew install netcat (macOS)"
fi

echo "========================================"
echo "Redis Server Test Suite"
echo "========================================"
echo ""

# Start the server
start_server
echo ""

# PING tests
echo "PING Command Tests:"
test_command "PING without argument" "*1\r\n\$4\r\nPING\r\n" "+PONG\r\n"
test_command "PING with argument" "*2\r\n\$4\r\nPING\r\n\$5\r\nhello\r\n" "\$5\r\nhello\r\n"
echo ""

# ECHO tests
echo "ECHO Command Tests:"
test_command "ECHO hello" "*2\r\n\$4\r\nECHO\r\n\$5\r\nhello\r\n" "\$5\r\nhello\r\n"
test_command "ECHO world" "*2\r\n\$4\r\nECHO\r\n\$5\r\nworld\r\n" "\$5\r\nworld\r\n"
echo ""

# SET tests
echo "SET Command Tests:"
test_command "SET key value" "*3\r\n\$3\r\nSET\r\n\$3\r\nkey\r\n\$5\r\nvalue\r\n" "+OK\r\n"
test_command "SET foo bar" "*3\r\n\$3\r\nSET\r\n\$3\r\nfoo\r\n\$3\r\nbar\r\n" "+OK\r\n"
test_command "SET name John" "*3\r\n\$3\r\nSET\r\n\$4\r\nname\r\n\$4\r\nJohn\r\n" "+OK\r\n"
echo ""

# GET tests
echo "GET Command Tests:"
test_command "GET existing key" "*2\r\n\$3\r\nGET\r\n\$3\r\nkey\r\n" "\$5\r\nvalue\r\n"
test_command "GET foo" "*2\r\n\$3\r\nGET\r\n\$3\r\nfoo\r\n" "\$3\r\nbar\r\n"
test_command "GET name" "*2\r\n\$3\r\nGET\r\n\$4\r\nname\r\n" "\$4\r\nJohn\r\n"
test_command "GET non-existent key" "*2\r\n\$3\r\nGET\r\n\$7\r\nmissing\r\n" "\$-1\r\n"
echo ""

# EXISTS tests
echo "EXISTS Command Tests:"
test_command "EXISTS for existing key" "*2\r\n\$6\r\nEXISTS\r\n\$3\r\nkey\r\n" ":1\r\n"
test_command "EXISTS for non-existing key" "*2\r\n\$6\r\nEXISTS\r\n\$7\r\nmissing\r\n" ":0\r\n"
echo ""

# DEL tests
echo "DEL Command Tests:"
test_command "DEL existing key" "*2\r\n\$3\r\nDEL\r\n\$3\r\nfoo\r\n" ":1\r\n"
test_command "DEL non-existing key" "*2\r\n\$3\r\nDEL\r\n\$7\r\nmissing\r\n" ":0\r\n"
echo ""

# Verify deletion
echo "Verify Deletion:"
test_command "GET deleted key returns null" "*2\r\n\$3\r\nGET\r\n\$3\r\nfoo\r\n" "\$-1\r\n"
echo ""

# KEYS test (basic)
echo "KEYS Command Tests:"
test_pattern "KEYS returns array" "*1\r\n\$4\r\nKEYS\r\n" "^\*"
echo ""

# Case insensitivity test
echo "Case Insensitivity Tests:"
test_command "ping (lowercase)" "*1\r\n\$4\r\nping\r\n" "+PONG\r\n"
test_command "get (lowercase)" "*2\r\n\$3\r\nget\r\n\$3\r\nkey\r\n" "\$5\r\nvalue\r\n"
test_command "SET (uppercase)" "*3\r\n\$3\r\nSET\r\n\$4\r\ntest\r\n\$4\r\ndata\r\n" "+OK\r\n"
echo ""

# Error handling
echo "Error Handling Tests:"
test_pattern "Unknown command" "*1\r\n\$7\r\nINVALID\r\n" "^-ERR"
test_pattern "GET without key" "*1\r\n\$3\r\nGET\r\n" "^-ERR"
test_pattern "SET without value" "*2\r\n\$3\r\nSET\r\n\$3\r\nkey\r\n" "^-ERR"
echo ""

# Multiple operations
echo "Multiple Operations:"
test_command "SET x 10" "*3\r\n\$3\r\nSET\r\n\$1\r\nx\r\n\$2\r\n10\r\n" "+OK\r\n"
test_command "SET y 20" "*3\r\n\$3\r\nSET\r\n\$1\r\ny\r\n\$2\r\n20\r\n" "+OK\r\n"
test_command "GET x" "*2\r\n\$3\r\nGET\r\n\$1\r\nx\r\n" "\$2\r\n10\r\n"
test_command "GET y" "*2\r\n\$3\r\nGET\r\n\$1\r\ny\r\n" "\$2\r\n20\r\n"
test_command "DEL multiple keys" "*3\r\n\$3\r\nDEL\r\n\$1\r\nx\r\n\$1\r\ny\r\n" ":2\r\n"
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
