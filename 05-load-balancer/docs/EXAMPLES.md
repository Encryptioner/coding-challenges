# Load Balancer - Practical Examples

This document contains real-world examples and use cases for the load balancer.

## Table of Contents

1. [Basic Examples](#basic-examples)
2. [Development Scenarios](#development-scenarios)
3. [Testing Scenarios](#testing-scenarios)
4. [Failure Simulation](#failure-simulation)
5. [Integration Examples](#integration-examples)
6. [Advanced Patterns](#advanced-patterns)

## Basic Examples

### Example 1: Simple Setup with 2 Backends

The minimal useful configuration.

```bash
# Terminal 1: Start first backend
./test-server -port 8081 -name "Backend-A"

# Terminal 2: Start second backend
./test-server -port 8082 -name "Backend-B"

# Terminal 3: Start load balancer
./lb -backends "http://localhost:8081,http://localhost:8082"

# Terminal 4: Make requests
curl http://localhost:8080/
# Output: ✓ Response from Backend-A (Port 8081)

curl http://localhost:8080/
# Output: ✓ Response from Backend-B (Port 8082)

curl http://localhost:8080/
# Output: ✓ Response from Backend-A (Port 8081)
```

**What's happening:** Round-robin alternates between Backend-A and Backend-B.

### Example 2: Three Backends with Different Names

```bash
# Start three backends
./test-server -port 8081 -name "API-Server-1" &
./test-server -port 8082 -name "API-Server-2" &
./test-server -port 8083 -name "API-Server-3" &

# Start load balancer
./lb -backends "http://localhost:8081,http://localhost:8082,http://localhost:8083" -port 8080

# Make multiple requests
for i in {1..9}; do
    curl -s http://localhost:8080/ | head -1
done
```

**Expected output:**
```
✓ Response from API-Server-1 (Port 8081)
✓ Response from API-Server-2 (Port 8082)
✓ Response from API-Server-3 (Port 8083)
✓ Response from API-Server-1 (Port 8081)
✓ Response from API-Server-2 (Port 8082)
✓ Response from API-Server-3 (Port 8083)
...
```

### Example 3: Custom Port Configuration

```bash
# Load balancer on port 3000, backends on 9001-9003
./test-server -port 9001 -name "Worker-1" &
./test-server -port 9002 -name "Worker-2" &
./test-server -port 9003 -name "Worker-3" &

./lb -backends "http://localhost:9001,http://localhost:9002,http://localhost:9003" -port 3000

# Access on port 3000
curl http://localhost:3000/
```

## Development Scenarios

### Example 4: Local Development with Fast Health Checks

For rapid development with quick failure detection.

```bash
# Start backends with descriptive names
./test-server -port 8081 -name "Dev-Backend-1" &
./test-server -port 8082 -name "Dev-Backend-2" &

# Start load balancer with 2-second health checks
./lb \
  -backends "http://localhost:8081,http://localhost:8082" \
  -port 8000 \
  -health-check-interval 2

# In another terminal, develop and test
curl http://localhost:8000/api/test
```

**Benefits:**
- Fast failure detection (2 seconds)
- Easy to test server failures
- Quick feedback loop

### Example 5: Testing Different API Endpoints

```bash
# Start load balancer and backends
make run-example &
sleep 5

# Test various endpoints
echo "Testing root endpoint:"
curl http://localhost:8080/

echo -e "\nTesting API endpoint:"
curl http://localhost:8080/api/users

echo -e "\nTesting with query parameters:"
curl "http://localhost:8080/search?q=golang&limit=10"

echo -e "\nTesting POST request:"
curl -X POST http://localhost:8080/api/data \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "value": 123}'
```

### Example 6: Debugging with Verbose Output

```bash
# Start everything
./test-server -port 8081 -name "Debug-1" &
./test-server -port 8082 -name "Debug-2" &
./lb -backends "http://localhost:8081,http://localhost:8082" &

sleep 3

# Make request with verbose curl to see headers
curl -v http://localhost:8080/test 2>&1 | grep -E "(^>|^<|X-Forwarded)"
```

**Expected output:**
```
> GET /test HTTP/1.1
> Host: localhost:8080
< HTTP/1.1 200 OK
< X-Forwarded-For: 127.0.0.1
< X-Forwarded-Host: localhost:8080
```

## Testing Scenarios

### Example 7: Verifying Round-Robin Distribution

Script to verify even distribution:

```bash
#!/bin/bash
# save as test_distribution.sh

# Start services
./test-server -port 8081 -name "Server-1" > /dev/null 2>&1 &
PID1=$!
./test-server -port 8082 -name "Server-2" > /dev/null 2>&1 &
PID2=$!
./test-server -port 8083 -name "Server-3" > /dev/null 2>&1 &
PID3=$!

./lb -backends "http://localhost:8081,http://localhost:8082,http://localhost:8083" \
  > /dev/null 2>&1 &
LB_PID=$!

sleep 3

# Make 30 requests and count distribution
echo "Making 30 requests..."
server1=0
server2=0
server3=0

for i in {1..30}; do
    response=$(curl -s http://localhost:8080/)
    if echo "$response" | grep -q "Server-1"; then
        server1=$((server1 + 1))
    elif echo "$response" | grep -q "Server-2"; then
        server2=$((server2 + 1))
    elif echo "$response" | grep -q "Server-3"; then
        server3=$((server3 + 1))
    fi
done

echo "Distribution:"
echo "  Server-1: $server1 requests (expected: 10)"
echo "  Server-2: $server2 requests (expected: 10)"
echo "  Server-3: $server3 requests (expected: 10)"

# Cleanup
kill $PID1 $PID2 $PID3 $LB_PID 2>/dev/null
```

### Example 8: Load Testing with Apache Bench

```bash
# Start load balancer and backends
make run-example &
sleep 5

# Install apache bench (if not installed)
# Ubuntu/Debian: sudo apt-get install apache2-utils
# macOS: brew install httpd (includes ab)

# Run load test: 1000 requests, 10 concurrent
ab -n 1000 -c 10 http://localhost:8080/

# Look for:
# - Requests per second
# - Time per request
# - Distribution across backends (check logs)
```

### Example 9: Concurrent Request Testing

```bash
# Start services
./test-server -port 8081 -name "Server-1" &
./test-server -port 8082 -name "Server-2" &
./lb -backends "http://localhost:8081,http://localhost:8082" &
sleep 3

# Make 10 concurrent requests
echo "Sending 10 concurrent requests..."
for i in {1..10}; do
    (curl -s http://localhost:8080/ | head -1) &
done
wait

echo "All requests completed"
```

## Failure Simulation

### Example 10: Simulating Backend Failure

```bash
# Terminal 1: Start backends
./test-server -port 8081 -name "Server-1" &
SERVER1_PID=$!
./test-server -port 8082 -name "Server-2" &
SERVER2_PID=$!
./test-server -port 8083 -name "Server-3" &
SERVER3_PID=$!

# Terminal 2: Start load balancer with fast health checks
./lb -backends "http://localhost:8081,http://localhost:8082,http://localhost:8083" \
    -health-check-interval 5

# Terminal 3: Make continuous requests
while true; do
    curl -s http://localhost:8080/ | head -1
    sleep 1
done

# Terminal 4: Simulate failure
echo "Killing Server-2..."
kill $SERVER2_PID

# Watch Terminal 2 (load balancer logs):
# - You'll see health check failures for Server-2
# - Requests will only go to Server-1 and Server-3

# Check status
curl http://localhost:8080/lb-status
```

### Example 11: Auto-Failing Server

Use the test server's built-in failure mode:

```bash
# Start server that will fail after 20 seconds
./test-server -port 8081 -name "Flaky-Server" -fail-after 20 &

# Start stable servers
./test-server -port 8082 -name "Stable-Server-1" &
./test-server -port 8083 -name "Stable-Server-2" &

# Start load balancer with 5-second health checks
./lb -backends "http://localhost:8081,http://localhost:8082,http://localhost:8083" \
    -health-check-interval 5

# Make requests continuously
watch -n 1 'curl -s http://localhost:8080/ | head -1'

# After 20 seconds, Flaky-Server will start failing
# After ~25 seconds, it will be removed from rotation
```

### Example 12: Server Recovery

```bash
# Start everything
./test-server -port 8081 -name "Server-1" &
./test-server -port 8082 -name "Server-2" &
./lb -backends "http://localhost:8081,http://localhost:8082" \
    -health-check-interval 5 &
sleep 3

# Make Server-1 fail
curl http://localhost:8081/fail

# Wait for health check to detect it (5-10 seconds)
sleep 10

# Verify Server-1 is marked down
curl -s http://localhost:8080/lb-status | grep -A1 "8081"

# Recover Server-1
curl http://localhost:8081/recover

# Wait for health check to detect recovery
sleep 10

# Verify Server-1 is back up
curl -s http://localhost:8080/lb-status | grep -A1 "8081"
```

## Integration Examples

### Example 13: Load Balancing a Node.js App

**app.js:**
```javascript
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({
        message: 'Hello from Node.js',
        port: port,
        pid: process.pid
    });
});

app.get('/health', (req, res) => {
    res.status(200).send('healthy');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
```

**Start multiple instances:**
```bash
# Terminal 1-3: Start Node.js instances
PORT=3001 node app.js &
PORT=3002 node app.js &
PORT=3003 node app.js &

# Terminal 4: Start load balancer
./lb -backends "http://localhost:3001,http://localhost:3002,http://localhost:3003"

# Terminal 5: Test
curl http://localhost:8080/
```

### Example 14: Load Balancing a Python Flask App

**app.py:**
```python
from flask import Flask
import os

app = Flask(__name__)
port = int(os.environ.get('PORT', 5000))

@app.route('/')
def hello():
    return f'Hello from Flask on port {port}'

@app.route('/health')
def health():
    return 'healthy', 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port)
```

**Start multiple instances:**
```bash
# Terminal 1-3: Start Flask instances
PORT=5001 python app.py &
PORT=5002 python app.py &
PORT=5003 python app.py &

# Terminal 4: Start load balancer
./lb -backends "http://localhost:5001,http://localhost:5002,http://localhost:5003"

# Terminal 5: Test
curl http://localhost:8080/
```

### Example 15: Load Balancing Go HTTP Server

**server.go:**
```go
package main

import (
    "fmt"
    "log"
    "net/http"
    "os"
)

func main() {
    port := os.Getenv("PORT")
    if port == "" {
        port = "8081"
    }

    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello from Go server on port %s\n", port)
    })

    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        fmt.Fprint(w, "healthy")
    })

    addr := ":" + port
    log.Printf("Server starting on %s", addr)
    log.Fatal(http.ListenAndServe(addr, nil))
}
```

**Start multiple instances:**
```bash
# Build
go build -o myserver server.go

# Start instances
PORT=8081 ./myserver &
PORT=8082 ./myserver &
PORT=8083 ./myserver &

# Start load balancer
./lb -backends "http://localhost:8081,http://localhost:8082,http://localhost:8083"

# Test
curl http://localhost:8080/
```

## Advanced Patterns

### Example 16: Multi-Tier Load Balancing

Load balance multiple services independently:

```bash
# API Servers (ports 3001-3003)
./test-server -port 3001 -name "API-1" &
./test-server -port 3002 -name "API-2" &
./test-server -port 3003 -name "API-3" &

# Web Servers (ports 4001-4002)
./test-server -port 4001 -name "Web-1" &
./test-server -port 4002 -name "Web-2" &

# API Load Balancer (port 8080)
./lb -backends "http://localhost:3001,http://localhost:3002,http://localhost:3003" \
    -port 8080 &

# Web Load Balancer (port 9080)
./lb -backends "http://localhost:4001,http://localhost:4002" \
    -port 9080 &

# Test
echo "API Load Balancer:"
curl http://localhost:8080/

echo "Web Load Balancer:"
curl http://localhost:9080/
```

### Example 17: Progressive Rollout Simulation

Simulate rolling out a new version:

```bash
# Start old version (v1) on most servers
./test-server -port 8081 -name "App-v1-Instance-1" &
./test-server -port 8082 -name "App-v1-Instance-2" &
./test-server -port 8083 -name "App-v1-Instance-3" &

# Start load balancer
./lb -backends "http://localhost:8081,http://localhost:8082,http://localhost:8083" &
sleep 3

# Make requests - all go to v1
echo "Before rollout:"
for i in {1..6}; do
    curl -s http://localhost:8080/ | head -1
done

# Kill one v1 instance and start v2
kill $(lsof -ti:8083)
./test-server -port 8083 -name "App-v2-Instance-1" &

# Wait for health check
sleep 10

# Now traffic is split: 66% v1, 33% v2
echo -e "\n25% rollout:"
for i in {1..6}; do
    curl -s http://localhost:8080/ | head -1
done

# Continue rollout...
kill $(lsof -ti:8082)
./test-server -port 8082 -name "App-v2-Instance-2" &
sleep 10

# Now 33% v1, 66% v2
echo -e "\n66% rollout:"
for i in {1..6}; do
    curl -s http://localhost:8080/ | head -1
done
```

### Example 18: Geographic Distribution Simulation

Simulate backends in different "regions":

```bash
# "US-East" servers
./test-server -port 8081 -name "US-East-1" &
./test-server -port 8082 -name "US-East-2" &

# "US-West" servers
./test-server -port 8083 -name "US-West-1" &
./test-server -port 8084 -name "US-West-2" &

# "Europe" servers
./test-server -port 8085 -name "EU-Central-1" &

# Global load balancer
./lb -backends "http://localhost:8081,http://localhost:8082,http://localhost:8083,http://localhost:8084,http://localhost:8085" \
    -port 8080

# Requests are distributed globally
for i in {1..10}; do
    curl -s http://localhost:8080/ | head -1
done
```

### Example 19: Blue-Green Deployment Simulation

```bash
# Blue environment (current production)
./test-server -port 8081 -name "Blue-1" &
./test-server -port 8082 -name "Blue-2" &

# Start load balancer pointing to blue
./lb -backends "http://localhost:8081,http://localhost:8082" -port 8080 &
LB_PID=$!
sleep 3

# All traffic goes to blue
echo "Blue environment active:"
curl -s http://localhost:8080/ | head -1

# Deploy green environment
./test-server -port 8083 -name "Green-1" &
./test-server -port 8084 -name "Green-2" &

# Test green independently
echo -e "\nTesting green environment:"
curl -s http://localhost:8083/ | head -1

# Switch to green by restarting load balancer
kill $LB_PID
./lb -backends "http://localhost:8083,http://localhost:8084" -port 8080 &

# All traffic now goes to green
echo -e "\nGreen environment active:"
curl -s http://localhost:8080/ | head -1
```

### Example 20: Monitoring Dashboard Script

```bash
#!/bin/bash
# save as monitor.sh

LB_URL="http://localhost:8080"

echo "Load Balancer Monitor"
echo "====================="
echo

while true; do
    clear
    echo "Load Balancer Status - $(date)"
    echo "=============================="
    echo

    # Get status
    status=$(curl -s $LB_URL/lb-status)

    # Parse and display
    echo "$status" | jq -r '.backends[] | "[\(if .alive then "✓" else "✗" end)] \(.url)"'

    echo
    echo "Press Ctrl+C to exit"
    sleep 5
done
```

## Summary

These examples demonstrate:
- Basic setup and configuration
- Development workflows
- Testing and validation
- Failure scenarios and recovery
- Integration with real applications
- Advanced deployment patterns

For more information:
- [GUIDE.md](GUIDE.md) - Comprehensive configuration guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - Implementation details
- [README.md](../README.md) - Main documentation
