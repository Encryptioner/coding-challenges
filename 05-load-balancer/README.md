# Load Balancer - A Layer 7 HTTP Load Balancer

A production-ready, educational implementation of a Layer 7 (application layer) HTTP load balancer with health checking, round-robin distribution, and graceful failure handling. This project is part of the [Coding Challenges](https://codingchallenges.fyi/challenges/challenge-load-balancer) series.

## 🎯 What is a Load Balancer?

A load balancer is a critical component in modern distributed systems that distributes incoming network traffic across multiple backend servers. Think of it like a traffic controller at a busy intersection:

- **Distributes load evenly** - No single server gets overwhelmed
- **Ensures high availability** - If one server fails, traffic goes to healthy servers
- **Improves reliability** - Automatic health checks detect and route around failures
- **Scales horizontally** - Add more servers to handle more traffic

### Layer 7 vs Layer 4

This is a **Layer 7 (Application Layer)** load balancer, which means:
- Works at the HTTP/HTTPS protocol level
- Can make routing decisions based on content (URLs, headers, etc.)
- More intelligent than Layer 4 (TCP/UDP) load balancers
- Can add headers, modify requests, and understand HTTP semantics

## 🚀 Quick Start

### Building

```bash
# Build both the load balancer and test server
make build

# Or build manually
go build -o lb main.go
go build -o test-server test_server.go
```

### Basic Usage

```bash
# Terminal 1: Start some backend servers
./test-server -port 8081 -name "Server-1"

# Terminal 2:
./test-server -port 8082 -name "Server-2"

# Terminal 3:
./test-server -port 8083 -name "Server-3"

# Terminal 4: Start the load balancer
./lb -backends "http://localhost:8081,http://localhost:8082,http://localhost:8083" -port 8080

# Terminal 5: Make requests
curl http://localhost:8080/
```

### Quick Example with Make

```bash
# This starts 3 backend servers and the load balancer automatically
make run-example

# In another terminal, make some requests:
curl http://localhost:8080/
curl http://localhost:8080/api/users
curl http://localhost:8080/health

# Check the load balancer status:
curl http://localhost:8080/lb-status
```

## 📖 Usage

### Load Balancer Options

```bash
./lb [OPTIONS]
```

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `-backends` | Comma-separated list of backend servers | *Required* | `http://localhost:8081,http://localhost:8082` |
| `-port` | Port for the load balancer | 8080 | `-port 3000` |
| `-health-check-interval` | Health check interval in seconds | 10 | `-health-check-interval 5` |

### Test Server Options

```bash
./test-server [OPTIONS]
```

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `-port` | Port to run the server | 8081 | `-port 9000` |
| `-name` | Server name for identification | "Server" | `-name "API-Server-1"` |
| `-fail-after` | Fail after N seconds (0 = never) | 0 | `-fail-after 30` |

## 💡 Features

### ✅ Round-Robin Load Balancing

Distributes requests evenly across all healthy backend servers in a circular pattern:

```bash
Request 1 → Server 1
Request 2 → Server 2
Request 3 → Server 3
Request 4 → Server 1 (cycle repeats)
```

### ✅ Health Checking

Automatically monitors backend server health:
- Periodic health checks (configurable interval)
- Checks `/health` endpoint or root path
- Automatically removes unhealthy servers from rotation
- Re-adds servers when they recover

### ✅ Graceful Failure Handling

When a backend server fails:
- Load balancer detects the failure
- Removes server from rotation
- Redistributes traffic to healthy servers
- Client requests continue uninterrupted

### ✅ Request Forwarding

Properly forwards HTTP requests with:
- All HTTP methods (GET, POST, PUT, DELETE, etc.)
- Request headers
- Query parameters
- Request body
- Custom headers: `X-Forwarded-For`, `X-Forwarded-Host`, `X-Forwarded-Proto`

### ✅ Status Endpoint

Monitor load balancer health at `/lb-status`:

```bash
curl http://localhost:8080/lb-status
```

Response:
```json
{
  "backends": [
    {"url": "http://localhost:8081", "alive": true},
    {"url": "http://localhost:8082", "alive": true},
    {"url": "http://localhost:8083", "alive": false}
  ]
}
```

### ✅ Concurrent Request Handling

Uses Go's goroutines to handle multiple simultaneous client requests efficiently.

## 🔍 How It Works

### Architecture Overview

```
Client Requests
      ↓
  Load Balancer (Port 8080)
      ↓
  [Health Checker] ← Monitors backends every N seconds
      ↓
  Round-Robin Selector
      ↓
  ┌─────────┬─────────┬─────────┐
  ↓         ↓         ↓         ↓
Server-1  Server-2  Server-3  ...
(8081)    (8082)    (8083)
```

### Round-Robin Algorithm

```go
1. Start with index 0
2. For each request:
   a. Get next index (current + 1) % server_count
   b. Check if server at index is healthy
   c. If healthy, forward request
   d. If unhealthy, try next server
   e. If all unhealthy, return 503 error
```

### Health Check Process

```go
1. Every N seconds (default 10):
   a. For each backend server:
      - Try GET /health endpoint
      - If fails, try GET / (root)
      - If response code < 500, mark healthy
      - If error or code >= 500, mark unhealthy
   b. Log results
```

## 🏗️ Building and Testing

### Standard Build

```bash
# Build everything
make build

# Build optimized binaries (smaller size)
make build-optimized

# Clean build artifacts
make clean
```

### Running Tests

```bash
# Run automated test suite
make test

# Or run directly
./test.sh
```

The test suite includes:
- Basic connectivity tests
- Round-robin distribution verification
- Concurrent request handling
- Server failure detection
- Health check accuracy
- Path and query parameter preservation

### Manual Testing

```bash
# Start test servers
make test-servers

# In another terminal, start load balancer
./lb -backends "http://localhost:8081,http://localhost:8082,http://localhost:8083"

# Make requests
curl http://localhost:8080/

# Check status
curl http://localhost:8080/lb-status

# Simulate a server failure
curl http://localhost:8081/fail

# Wait for health check cycle, then observe traffic goes to remaining servers
for i in {1..6}; do curl http://localhost:8080/ | grep "Server-"; done

# Stop test servers
make stop-test-servers
```

## 📚 Real-World Examples

### Example 1: Basic Web Application

```bash
# Start your web app on multiple ports
./my-webapp -port 8081 &
./my-webapp -port 8082 &
./my-webapp -port 8083 &

# Start load balancer
./lb -backends "http://localhost:8081,http://localhost:8082,http://localhost:8083"

# Now access your app through the load balancer
curl http://localhost:8080/
```

### Example 2: API Server with Fast Health Checks

```bash
# Start load balancer with 5-second health checks
./lb -backends "http://api1.local:3000,http://api2.local:3000" \
    -port 8080 \
    -health-check-interval 5
```

### Example 3: Testing Server Resilience

```bash
# Start a server that will fail after 20 seconds
./test-server -port 8081 -name "Flaky-Server" -fail-after 20 &

# Start normal servers
./test-server -port 8082 -name "Stable-Server-1" &
./test-server -port 8083 -name "Stable-Server-2" &

# Start load balancer
./lb -backends "http://localhost:8081,http://localhost:8082,http://localhost:8083" \
    -health-check-interval 5

# Watch the logs - you'll see the flaky server get removed from rotation after 20s
```

### Example 4: Multiple Load Balancer Instances

```bash
# Run multiple load balancers for different services

# API Load Balancer
./lb -backends "http://api1:8080,http://api2:8080" -port 3000 &

# Web Load Balancer
./lb -backends "http://web1:9000,http://web2:9000" -port 4000 &

# Static Assets Load Balancer
./lb -backends "http://cdn1:5000,http://cdn2:5000" -port 5000 &
```

## 📚 Additional Documentation

- [**GUIDE.md**](docs/GUIDE.md) - Comprehensive user guide with advanced techniques and patterns
- [**EXAMPLES.md**](docs/EXAMPLES.md) - Extensive collection of practical examples and use cases
- [**ARCHITECTURE.md**](docs/ARCHITECTURE.md) - Detailed code structure and implementation details

## 🎓 Learning Objectives

This challenge teaches important concepts:

### Networking
- HTTP protocol and reverse proxying
- TCP/IP fundamentals
- Request/response lifecycle
- Header propagation

### Distributed Systems
- Load balancing algorithms
- Health checking strategies
- Failure detection and recovery
- High availability patterns

### Concurrency
- Go goroutines and channels
- Thread-safe data structures
- Atomic operations
- Race condition prevention

### Software Design
- Clean architecture
- Separation of concerns
- Graceful shutdown
- Signal handling

## ⚙️ Configuration Examples

### High-Traffic Setup

For high-traffic scenarios with many backend servers:

```bash
./lb \
  -backends "http://server1:8080,http://server2:8080,http://server3:8080,http://server4:8080,http://server5:8080" \
  -port 8080 \
  -health-check-interval 3
```

### Development Setup

For local development with quick feedback:

```bash
./lb \
  -backends "http://localhost:3000,http://localhost:3001" \
  -port 8000 \
  -health-check-interval 2
```

## ⚠️ Limitations

This is an educational implementation. Some differences from production load balancers:

- **No SSL/TLS support** - HTTP only, not HTTPS
- **Single algorithm** - Only round-robin (no least-connections, IP-hash, etc.)
- **No sticky sessions** - Each request may go to a different server
- **Basic health checks** - Simple HTTP checks only (no custom health check endpoints with credentials)
- **No request retry** - If forwarding fails, returns error immediately
- **No metrics/monitoring** - No Prometheus metrics or detailed analytics
- **In-memory only** - No persistent configuration or state
- **Single instance** - No clustering or distributed coordination

## 🚀 Future Enhancements

Possible improvements for learning:

1. **Multiple algorithms** - Add least-connections, weighted round-robin, IP-hash
2. **SSL/TLS support** - HTTPS termination and backend connections
3. **Sticky sessions** - Cookie-based or IP-based session affinity
4. **Advanced health checks** - Custom endpoints, timeouts, retry logic
5. **Metrics** - Prometheus/Grafana integration
6. **Configuration file** - YAML/JSON config instead of command-line flags
7. **Circuit breaker** - Temporary server removal after repeated failures
8. **Rate limiting** - Per-client or global rate limits
9. **Request retry** - Automatic retry on failed backends
10. **WebSocket support** - Upgrade and proxy WebSocket connections

## 🤝 Compatibility

Tested and working on:
- **Linux** (Ubuntu, Debian, CentOS, RHEL, Arch, etc.)
- **macOS** (Intel and Apple Silicon)
- **Windows** (with Go installed)
- **BSD** variants (FreeBSD, OpenBSD, NetBSD)

Requirements:
- Go 1.21 or later (for building)
- No external dependencies (uses only Go standard library)

## 📝 License

This is an educational project created as part of the Coding Challenges series.

## 🔗 Resources

- [Coding Challenges - Load Balancer](https://codingchallenges.fyi/challenges/challenge-load-balancer)
- [Load Balancing Algorithms](https://codingchallenges.fyi/blog/load-balancing-algorithms/)
- [NGINX Load Balancing](https://docs.nginx.com/nginx/admin-guide/load-balancer/)
- [HAProxy Documentation](https://www.haproxy.org/#docs)
- [AWS Elastic Load Balancing](https://aws.amazon.com/elasticloadbalancing/)

## 🎯 Challenge Progress

**Status:** ✓ Completed

**Challenge Requirements:**
- ✅ Route traffic to multiple backend servers
- ✅ Implement round-robin algorithm
- ✅ Health check backend servers
- ✅ Handle server failures gracefully
- ✅ Support concurrent client requests
- ✅ Automated testing

---

Part of the [94 Coding Challenges](https://codingchallenges.fyi) series.
