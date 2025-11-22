# Load Balancer - Comprehensive User Guide

This guide provides detailed instructions on deploying, configuring, and using the load balancer in various scenarios.

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Basic Concepts](#basic-concepts)
4. [Configuration](#configuration)
5. [Load Balancing Strategies](#load-balancing-strategies)
6. [Health Checking](#health-checking)
7. [Monitoring and Debugging](#monitoring-and-debugging)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)
10. [Performance Tuning](#performance-tuning)

## Introduction

### What This Load Balancer Does

This load balancer acts as a reverse proxy that:
1. Accepts HTTP requests from clients
2. Selects a healthy backend server using round-robin
3. Forwards the request to the selected backend
4. Returns the backend's response to the client
5. Continuously monitors backend health

### When to Use This Load Balancer

**Good Use Cases:**
- Distributing traffic across multiple application instances
- Improving application availability and fault tolerance
- Horizontal scaling of stateless services
- Development and testing of distributed systems
- Learning about load balancing concepts

**Not Suitable For:**
- Production systems requiring SSL/TLS (this is HTTP only)
- Applications needing sticky sessions
- High-security environments (no authentication)
- Systems requiring sub-millisecond latency

## Installation

### From Source

#### Prerequisites

- Go 1.21 or later
- Make (optional, for convenience)
- curl (for testing)

#### Building

```bash
# Clone the repository
cd 05-load-balancer

# Build using Make
make build

# Or build manually
go build -o lb main.go
go build -o test-server test_server.go
```

#### Installing System-Wide

```bash
# Build and install to /usr/local/bin
make install

# Now you can run from anywhere
lb -backends "http://server1:8080,http://server2:8080"

# Uninstall
make uninstall
```

### Pre-built Binaries

Build optimized binaries:

```bash
make build-optimized
```

This creates smaller, faster binaries without debug symbols.

## Basic Concepts

### The Request Flow

```
1. Client sends HTTP request to Load Balancer
   ↓
2. Load Balancer receives request
   ↓
3. Round-robin selector chooses next healthy backend
   ↓
4. Load Balancer creates new HTTP request to backend
   ↓
5. Load Balancer copies client's headers and body
   ↓
6. Backend processes request and sends response
   ↓
7. Load Balancer receives backend response
   ↓
8. Load Balancer forwards response to client
```

### Backend Server States

Each backend server has a state:

- **Alive (healthy)**: Server responded to health check, receives traffic
- **Dead (unhealthy)**: Server failed health check, removed from rotation

State transitions:
```
         Health Check Success
    Dead ─────────────────────→ Alive
         ←─────────────────────
         Health Check Failure
```

### Round-Robin Algorithm

The load balancer maintains a circular list of backends:

```
Backends: [A, B, C]
Index:     0  1  2

Request 1: Index = 0 → Backend A, increment to 1
Request 2: Index = 1 → Backend B, increment to 2
Request 3: Index = 2 → Backend C, increment to 0 (wrap around)
Request 4: Index = 0 → Backend A, increment to 1
...
```

If a backend is unhealthy, it's skipped:
```
Backends: [A(alive), B(dead), C(alive)]

Request 1: Try index 0 → A is alive → use A
Request 2: Try index 1 → B is dead → skip, try 2 → C is alive → use C
Request 3: Try index 2 → C is alive → use C
Request 4: Try index 0 → A is alive → use A
```

## Configuration

### Command-Line Flags

#### `-backends` (Required)

Comma-separated list of backend server URLs.

```bash
# Single backend (testing only)
./lb -backends "http://localhost:8081"

# Multiple backends (recommended)
./lb -backends "http://localhost:8081,http://localhost:8082,http://localhost:8083"

# With different hosts
./lb -backends "http://server1.local:8080,http://server2.local:8080"

# With IP addresses
./lb -backends "http://192.168.1.10:8080,http://192.168.1.11:8080"
```

**Important:** No spaces around URLs, only commas.

#### `-port`

Port for the load balancer to listen on.

```bash
# Default port 8080
./lb -backends "..."

# Custom port
./lb -backends "..." -port 3000

# Standard HTTP port (requires sudo)
sudo ./lb -backends "..." -port 80
```

#### `-health-check-interval`

Interval in seconds between health checks.

```bash
# Default: 10 seconds
./lb -backends "..."

# Fast checks (3 seconds) - good for development
./lb -backends "..." -health-check-interval 3

# Slow checks (30 seconds) - good for stable backends
./lb -backends "..." -health-check-interval 30

# Very fast checks (1 second) - for testing only
./lb -backends "..." -health-check-interval 1
```

**Trade-offs:**
- **Faster checks**: Quicker failure detection, but more overhead
- **Slower checks**: Less overhead, but slower to detect failures

### Environment-Based Configuration

For different environments, use shell scripts:

**development.sh:**
```bash
#!/bin/bash
./lb \
  -backends "http://localhost:3001,http://localhost:3002" \
  -port 3000 \
  -health-check-interval 2
```

**staging.sh:**
```bash
#!/bin/bash
./lb \
  -backends "http://staging1.company.com:8080,http://staging2.company.com:8080" \
  -port 8080 \
  -health-check-interval 10
```

**production.sh:**
```bash
#!/bin/bash
./lb \
  -backends "http://prod1.company.com:8080,http://prod2.company.com:8080,http://prod3.company.com:8080" \
  -port 80 \
  -health-check-interval 15
```

## Load Balancing Strategies

### Round-Robin (Current Implementation)

Distributes requests evenly across all servers.

**Pros:**
- Simple and fair
- Works well for homogeneous backends
- Predictable distribution

**Cons:**
- Doesn't consider server load
- Doesn't consider response time
- All servers must have similar capacity

**Best For:**
- Stateless applications
- Similar backend specifications
- Even request complexity

### When Round-Robin Works Best

```bash
# All backends are identical
./lb -backends "http://server1:8080,http://server2:8080,http://server3:8080"

# Requests have similar processing time
# ✓ API endpoints with fast responses
# ✓ Static file serving
# ✓ Simple database queries
```

### When Round-Robin Might Not Be Ideal

```bash
# ✗ Backends have different capacities (use weighted round-robin)
# ✗ Requests have wildly different processing times (use least-connections)
# ✗ Need session persistence (use sticky sessions with IP hash)
```

## Health Checking

### How Health Checks Work

Every N seconds (configurable), the load balancer:

1. Tries to GET `/health` endpoint on each backend
2. If `/health` fails, tries GET `/` (root)
3. If response status code < 500, marks server as healthy
4. If request fails or status >= 500, marks as unhealthy

### Implementing Health Endpoints in Your App

#### Example in Go

```go
http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
    // Check database connection, cache, etc.
    if database.Ping() == nil {
        w.WriteHeader(http.StatusOK)
        w.Write([]byte("healthy"))
    } else {
        w.WriteHeader(http.StatusServiceUnavailable)
        w.Write([]byte("unhealthy"))
    }
})
```

#### Example in Node.js/Express

```javascript
app.get('/health', (req, res) => {
    // Check dependencies
    if (database.isConnected() && cache.isConnected()) {
        res.status(200).send('healthy');
    } else {
        res.status(503).send('unhealthy');
    }
});
```

#### Example in Python/Flask

```python
@app.route('/health')
def health():
    # Check application health
    try:
        database.ping()
        return 'healthy', 200
    except:
        return 'unhealthy', 503
```

### Health Check Best Practices

**DO:**
- Return 200 when healthy, 503 when unhealthy
- Keep health checks fast (< 100ms)
- Check critical dependencies (database, cache)
- Use a dedicated `/health` endpoint

**DON'T:**
- Make expensive database queries in health checks
- Return 200 when dependencies are down
- Make external API calls in health checks
- Use authentication on health endpoints

## Monitoring and Debugging

### Status Endpoint

Check load balancer status:

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

### Log Messages

The load balancer logs important events:

```
[INFO] Configured backend server: http://localhost:8081
[INFO] Health check: http://localhost:8081 [up]
[INFO] Forwarded GET /api/users to http://localhost:8081 [200]
[ERROR] Error forwarding request to http://localhost:8082: connection refused
```

### Monitoring Scripts

**check_health.sh** - Monitor backend health:
```bash
#!/bin/bash
while true; do
    curl -s http://localhost:8080/lb-status | jq '.backends[] | select(.alive == false)'
    sleep 10
done
```

**request_distribution.sh** - Verify round-robin:
```bash
#!/bin/bash
for i in {1..10}; do
    curl -s http://localhost:8080/ | grep "Server-"
done
```

### Debugging Connection Issues

```bash
# Check if load balancer is running
curl http://localhost:8080/lb-status

# Check if backends are accessible from load balancer host
curl http://localhost:8081/health

# Test with verbose output
curl -v http://localhost:8080/

# Follow redirects
curl -L http://localhost:8080/
```

## Production Deployment

### Systemd Service (Linux)

Create `/etc/systemd/system/loadbalancer.service`:

```ini
[Unit]
Description=HTTP Load Balancer
After=network.target

[Service]
Type=simple
User=loadbalancer
WorkingDirectory=/opt/loadbalancer
ExecStart=/opt/loadbalancer/lb \
  -backends "http://backend1:8080,http://backend2:8080,http://backend3:8080" \
  -port 8080 \
  -health-check-interval 10
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable loadbalancer
sudo systemctl start loadbalancer
sudo systemctl status loadbalancer
```

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o lb main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/lb .
EXPOSE 8080
ENTRYPOINT ["./lb"]
```

Build and run:
```bash
docker build -t myloadbalancer .
docker run -p 8080:8080 myloadbalancer \
  -backends "http://backend1:8080,http://backend2:8080"
```

### Kubernetes Deployment

While this load balancer is educational, in Kubernetes use the built-in Ingress or Service resources instead.

### Behind Another Load Balancer

This load balancer can sit behind NGINX or HAProxy for SSL termination:

**NGINX config:**
```nginx
upstream app_loadbalancer {
    server 127.0.0.1:8080;
}

server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;

    location / {
        proxy_pass http://app_loadbalancer;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

### Common Issues

#### Issue: "Service unavailable" errors

**Symptoms:** Clients receive 503 errors

**Causes:**
1. All backends are down
2. Backends are failing health checks
3. No backends configured

**Solutions:**
```bash
# Check backend status
curl http://localhost:8080/lb-status

# Verify backends are running
curl http://localhost:8081/health
curl http://localhost:8082/health

# Check load balancer logs
# Look for "No available backends" messages
```

#### Issue: Requests always go to same backend

**Symptoms:** Round-robin not working

**Causes:**
1. Only one backend is healthy
2. Concurrent requests from same client

**Solutions:**
```bash
# Check status
curl http://localhost:8080/lb-status

# Test distribution with sequential requests
for i in {1..10}; do curl http://localhost:8080/; sleep 0.5; done
```

#### Issue: High latency

**Symptoms:** Slow response times

**Causes:**
1. Backends are overloaded
2. Network latency
3. Too many health checks

**Solutions:**
- Add more backend servers
- Increase health check interval
- Optimize backend applications

#### Issue: Load balancer won't start

**Symptoms:** Error on startup

**Common errors:**
```bash
# Port already in use
Error: bind: address already in use

# Solution: Use different port or kill process on that port
lsof -ti:8080 | xargs kill -9
```

```bash
# Invalid backend URL
Error: Invalid server URL '...'

# Solution: Ensure URLs are properly formatted
# ✓ http://localhost:8081
# ✗ localhost:8081
# ✗ http://localhost:8081/
```

## Performance Tuning

### Optimal Health Check Interval

```bash
# High-availability (fast failure detection)
-health-check-interval 5

# Balanced (recommended)
-health-check-interval 10

# Low-overhead (stable backends)
-health-check-interval 30
```

### Number of Backend Servers

**Minimum:** 2 (for basic redundancy)
**Recommended:** 3+ (for good availability)
**Maximum:** No hard limit, but diminishing returns beyond 10-20

### Backend Server Timeouts

The load balancer uses a 30-second timeout for backend requests. For faster failure detection, modify the timeout in `main.go`:

```go
ReverseProxy: &http.Client{
    Timeout: 10 * time.Second,  // Reduce from 30s to 10s
},
```

### Connection Pooling

Go's HTTP client automatically manages connection pooling. For high-traffic scenarios, consider tuning:

```go
// In main.go, customize the transport
transport := &http.Transport{
    MaxIdleConns:        100,
    MaxIdleConnsPerHost: 10,
    IdleConnTimeout:     90 * time.Second,
}

backend.ReverseProxy = &http.Client{
    Transport: transport,
    Timeout:   30 * time.Second,
}
```

## Next Steps

- Read [EXAMPLES.md](EXAMPLES.md) for practical use cases
- Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand the implementation
- Experiment with different configurations
- Try simulating failures with the test server
- Monitor the logs to understand the behavior
