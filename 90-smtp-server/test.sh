#!/bin/bash

# SMTP Server Test Suite
# Tests the CC SMTP Server implementation

set -e

echo "======================================"
echo "CC SMTP Server Test Suite"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Clean up function
cleanup() {
    echo ""
    echo "Cleaning up..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    fi
    rm -rf ./mail 2>/dev/null || true
}

trap cleanup EXIT

# Build the server and client
echo "Building SMTP server and test client..."
make clean > /dev/null 2>&1 || true
make all

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Build successful!${NC}"
echo ""

# Start the server
echo "Starting SMTP server on port 2525..."
./ccsmtp -p 2525 > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 1

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${RED}Server failed to start!${NC}"
    exit 1
fi

echo -e "${GREEN}Server started with PID $SERVER_PID${NC}"
echo ""

# Test 1: Basic Connection
echo "Test 1: Testing basic connection..."
timeout 5 nc -zv 127.0.0.1 2525 > /dev/null 2>&1
print_result $? "Server accepting connections"

# Test 2: Greeting message
echo "Test 2: Testing greeting message..."
GREETING=$(echo "QUIT" | nc 127.0.0.1 2525 | head -1)
if [[ $GREETING == 220* ]]; then
    print_result 0 "Server sends 220 greeting"
else
    print_result 1 "Server sends 220 greeting"
fi

# Test 3: HELO command
echo "Test 3: Testing HELO command..."
RESPONSE=$(printf "HELO testclient\r\nQUIT\r\n" | nc 127.0.0.1 2525 | grep "250")
if [ ! -z "$RESPONSE" ]; then
    print_result 0 "HELO command accepted"
else
    print_result 1 "HELO command accepted"
fi

# Test 4: EHLO command
echo "Test 4: Testing EHLO command..."
RESPONSE=$(printf "EHLO testclient\r\nQUIT\r\n" | nc 127.0.0.1 2525 | grep "250")
if [ ! -z "$RESPONSE" ]; then
    print_result 0 "EHLO command accepted"
else
    print_result 1 "EHLO command accepted"
fi

# Test 5: Full email transaction
echo "Test 5: Testing full email transaction..."
./test_client 127.0.0.1 2525 > /tmp/smtp_test.log 2>&1
if [ $? -eq 0 ]; then
    print_result 0 "Full email transaction successful"
else
    print_result 1 "Full email transaction successful"
fi

# Test 6: Email saved to file
echo "Test 6: Testing email file creation..."
if [ -d "./mail" ] && [ -n "$(ls -A ./mail)" ]; then
    print_result 0 "Email saved to file"
    echo "   Saved emails:"
    ls -lh ./mail/ | tail -n +2 | awk '{print "   - " $9 " (" $5 ")"}'
else
    print_result 1 "Email saved to file"
fi

# Test 7: Multiple recipients
echo "Test 7: Testing multiple recipients..."
RESPONSE=$(printf "HELO test\r\nMAIL FROM:<sender@test.com>\r\nRCPT TO:<user1@test.com>\r\nRCPT TO:<user2@test.com>\r\nQUIT\r\n" | nc 127.0.0.1 2525 | grep -c "250 OK")
if [ "$RESPONSE" -ge 3 ]; then
    print_result 0 "Multiple recipients accepted"
else
    print_result 1 "Multiple recipients accepted"
fi

# Test 8: RSET command
echo "Test 8: Testing RSET command..."
RESPONSE=$(printf "HELO test\r\nMAIL FROM:<sender@test.com>\r\nRSET\r\nQUIT\r\n" | nc 127.0.0.1 2525 | grep "250 OK")
if [ ! -z "$RESPONSE" ]; then
    print_result 0 "RSET command works"
else
    print_result 1 "RSET command works"
fi

# Test 9: Concurrent connections
echo "Test 9: Testing concurrent connections..."
./test_client 127.0.0.1 2525 > /dev/null 2>&1 &
CLIENT1_PID=$!
./test_client 127.0.0.1 2525 > /dev/null 2>&1 &
CLIENT2_PID=$!
./test_client 127.0.0.1 2525 > /dev/null 2>&1 &
CLIENT3_PID=$!

wait $CLIENT1_PID
RES1=$?
wait $CLIENT2_PID
RES2=$?
wait $CLIENT3_PID
RES3=$?

if [ $RES1 -eq 0 ] && [ $RES2 -eq 0 ] && [ $RES3 -eq 0 ]; then
    print_result 0 "Concurrent connections handled"
else
    print_result 1 "Concurrent connections handled"
fi

# Test 10: Invalid command sequence
echo "Test 10: Testing invalid command sequence..."
RESPONSE=$(printf "DATA\r\nQUIT\r\n" | nc 127.0.0.1 2525 | grep "503")
if [ ! -z "$RESPONSE" ]; then
    print_result 0 "Invalid sequence rejected with 503"
else
    print_result 1 "Invalid sequence rejected with 503"
fi

# Print summary
echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
