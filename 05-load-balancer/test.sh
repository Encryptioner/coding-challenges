#!/bin/bash

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

# Ports
LB_PORT=8080
SERVER1_PORT=8081
SERVER2_PORT=8082
SERVER3_PORT=8083

# PIDs
LB_PID=""
SERVER1_PID=""
SERVER2_PID=""
SERVER3_PID=""

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."

    if [ -n "$LB_PID" ]; then
        kill $LB_PID 2>/dev/null
        wait $LB_PID 2>/dev/null
    fi

    if [ -n "$SERVER1_PID" ]; then
        kill $SERVER1_PID 2>/dev/null
        wait $SERVER1_PID 2>/dev/null
    fi

    if [ -n "$SERVER2_PID" ]; then
        kill $SERVER2_PID 2>/dev/null
        wait $SERVER2_PID 2>/dev/null
    fi

    if [ -n "$SERVER3_PID" ]; then
        kill $SERVER3_PID 2>/dev/null
        wait $SERVER3_PID 2>/dev/null
    fi

    # Kill any remaining processes on our test ports
    pkill -f "test-server -port $SERVER1_PORT" 2>/dev/null
    pkill -f "test-server -port $SERVER2_PORT" 2>/dev/null
    pkill -f "test-server -port $SERVER3_PORT" 2>/dev/null
    pkill -f "lb -backends" 2>/dev/null

    sleep 1
}

# Set up trap to cleanup on exit
trap cleanup EXIT INT TERM

# Check if binaries exist
check_binaries() {
    if [ ! -f "./lb" ]; then
        log_error "Load balancer binary './lb' not found. Run 'make build' first."
        exit 1
    fi

    if [ ! -f "./test-server" ]; then
        log_error "Test server binary './test-server' not found. Run 'make build' first."
        exit 1
    fi
}

# Start backend servers
start_servers() {
    log_info "Starting backend servers..."

    ./test-server -port $SERVER1_PORT -name "Server-1" > /dev/null 2>&1 &
    SERVER1_PID=$!

    ./test-server -port $SERVER2_PORT -name "Server-2" > /dev/null 2>&1 &
    SERVER2_PID=$!

    ./test-server -port $SERVER3_PORT -name "Server-3" > /dev/null 2>&1 &
    SERVER3_PID=$!

    sleep 2

    # Verify servers are running
    if ! kill -0 $SERVER1_PID 2>/dev/null || ! kill -0 $SERVER2_PID 2>/dev/null || ! kill -0 $SERVER3_PID 2>/dev/null; then
        log_error "Failed to start backend servers"
        return 1
    fi

    log_success "Backend servers started (PIDs: $SERVER1_PID, $SERVER2_PID, $SERVER3_PID)"
    return 0
}

# Start load balancer
start_load_balancer() {
    log_info "Starting load balancer..."

    ./lb -backends "http://localhost:$SERVER1_PORT,http://localhost:$SERVER2_PORT,http://localhost:$SERVER3_PORT" \
        -port $LB_PORT -health-check-interval 5 > /dev/null 2>&1 &
    LB_PID=$!

    sleep 3

    # Verify load balancer is running
    if ! kill -0 $LB_PID 2>/dev/null; then
        log_error "Failed to start load balancer"
        return 1
    fi

    log_success "Load balancer started (PID: $LB_PID)"
    return 0
}

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"

    TESTS_RUN=$((TESTS_RUN + 1))

    log_info "Test $TESTS_RUN: $test_name"

    result=$(eval "$test_command" 2>&1)
    exit_code=$?

    if [ $exit_code -eq 0 ] && echo "$result" | grep -q "$expected_result"; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log_success "$test_name"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        log_error "$test_name"
        log_warning "Expected: $expected_result"
        log_warning "Got: $result"
        return 1
    fi
}

# Main test suite
echo "=================================="
echo "Load Balancer Test Suite"
echo "=================================="
echo

# Step 1: Check binaries
log_info "Checking binaries..."
check_binaries

# Step 2: Start servers
start_servers || exit 1

# Step 3: Start load balancer
start_load_balancer || exit 1

echo
log_info "Running tests..."
echo

# Test 1: Basic connectivity
run_test "Basic connectivity" \
    "curl -s http://localhost:$LB_PORT/" \
    "Response from Server"

# Test 2: Status endpoint
run_test "Status endpoint" \
    "curl -s http://localhost:$LB_PORT/lb-status" \
    "backends"

# Test 3: Round-robin distribution
log_info "Test 3: Round-robin distribution"
TESTS_RUN=$((TESTS_RUN + 1))

server1_count=0
server2_count=0
server3_count=0

for i in {1..9}; do
    response=$(curl -s http://localhost:$LB_PORT/)
    if echo "$response" | grep -q "Server-1"; then
        server1_count=$((server1_count + 1))
    elif echo "$response" | grep -q "Server-2"; then
        server2_count=$((server2_count + 1))
    elif echo "$response" | grep -q "Server-3"; then
        server3_count=$((server3_count + 1))
    fi
done

if [ $server1_count -eq 3 ] && [ $server2_count -eq 3 ] && [ $server3_count -eq 3 ]; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
    log_success "Round-robin distribution (Server-1: $server1_count, Server-2: $server2_count, Server-3: $server3_count)"
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
    log_error "Round-robin distribution not working correctly (Server-1: $server1_count, Server-2: $server2_count, Server-3: $server3_count)"
fi

# Test 4: Concurrent requests
log_info "Test 4: Concurrent requests"
TESTS_RUN=$((TESTS_RUN + 1))

success_count=0
for i in {1..5}; do
    curl -s http://localhost:$LB_PORT/ > /dev/null &
done
wait

for i in {1..5}; do
    response=$(curl -s http://localhost:$LB_PORT/)
    if echo "$response" | grep -q "Response from Server"; then
        success_count=$((success_count + 1))
    fi
done

if [ $success_count -eq 5 ]; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
    log_success "Concurrent requests handled successfully"
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
    log_error "Concurrent requests failed ($success_count/5 successful)"
fi

# Test 5: Server failure handling
log_info "Test 5: Server failure handling"
TESTS_RUN=$((TESTS_RUN + 1))

# Kill one server
log_info "Killing Server-1..."
kill $SERVER1_PID 2>/dev/null
wait $SERVER1_PID 2>/dev/null
sleep 8  # Wait for health check to detect failure

# Make requests, should only go to remaining servers
working=true
for i in {1..6}; do
    response=$(curl -s http://localhost:$LB_PORT/)
    if echo "$response" | grep -q "Server-1"; then
        working=false
        break
    fi
done

if $working; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
    log_success "Server failure handled correctly"
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
    log_error "Server failure not handled correctly"
fi

# Test 6: Status shows correct backend health
run_test "Status shows unhealthy backend" \
    "curl -s http://localhost:$LB_PORT/lb-status | grep -c 'false'" \
    "1"

# Test 7: Different paths
run_test "Different paths work" \
    "curl -s http://localhost:$LB_PORT/test/path" \
    "Path: /test/path"

# Test 8: Query parameters
run_test "Query parameters preserved" \
    "curl -s 'http://localhost:$LB_PORT/test?param=value'" \
    "param=value"

# Summary
echo
echo "=================================="
echo "Test Summary"
echo "=================================="
echo "Tests run:    $TESTS_RUN"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"
echo "=================================="
echo

if [ $TESTS_FAILED -eq 0 ]; then
    log_success "All tests passed!"
    exit 0
else
    log_error "Some tests failed!"
    exit 1
fi
