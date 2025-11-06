# Load Balancer - Architecture and Implementation

This document explains the internal architecture and implementation details of the load balancer.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Data Structures](#data-structures)
5. [Algorithms](#algorithms)
6. [Concurrency Model](#concurrency-model)
7. [Request Flow](#request-flow)
8. [Health Check System](#health-check-system)
9. [Code Walkthrough](#code-walkthrough)
10. [Design Decisions](#design-decisions)

## Overview

The load balancer is implemented in Go, consisting of ~350 lines of code in a single file. It uses Go's standard library exclusively, with no external dependencies.

**Key Characteristics:**
- **Language:** Go 1.21+
- **Concurrency:** Goroutines and channels
- **HTTP:** Standard library `net/http`
- **Synchronization:** Mutexes and atomic operations
- **Lines of Code:** ~350

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                                                          │
│  ┌────────────────┐         ┌──────────────────┐       │
│  │   HTTP Server  │────────▶│  Request Handler │       │
│  │   (Port 8080)  │         │   (lb function)  │       │
│  └────────────────┘         └──────────────────┘       │
│                                      │                   │
│                                      ▼                   │
│                            ┌──────────────────┐         │
│                            │   Server Pool    │         │
│                            │  (Round-Robin)   │         │
│                            └──────────────────┘         │
│                                      │                   │
│                     ┌────────────────┼─────────────┐    │
│                     ▼                ▼             ▼    │
│             ┌──────────┐     ┌──────────┐  ┌──────────┐│
│             │Backend #1│     │Backend #2│  │Backend #N││
│             │ (alive)  │     │ (dead)   │  │ (alive)  ││
│             └──────────┘     └──────────┘  └──────────┘│
│                     ▲                ▲             ▲    │
│                     └────────────────┴─────────────┘    │
│                                      │                   │
│                            ┌──────────────────┐         │
│                            │ Health Checker   │         │
│                            │   (Goroutine)    │         │
│                            └──────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

### Component Interaction

```
Start
  │
  ├─▶ Parse CLI Arguments
  │
  ├─▶ Initialize ServerPool
  │     ├─ Parse backend URLs
  │     └─ Create Backend structs
  │
  ├─▶ Initial Health Check
  │
  ├─▶ Start Health Check Goroutine
  │     └─ Runs in background forever
  │
  ├─▶ Create HTTP Server
  │     ├─ "/" → lb() handler
  │     └─ "/lb-status" → statusHandler()
  │
  └─▶ Start HTTP Server (blocking)
        └─ Handle graceful shutdown
```

## Core Components

### 1. Backend

Represents a single backend server.

```go
type Backend struct {
    URL          *url.URL       // Backend server URL
    Alive        bool            // Health status
    mu           sync.RWMutex    // Protects Alive field
    ReverseProxy *http.Client    // HTTP client for requests
}
```

**Methods:**
- `SetAlive(bool)` - Thread-safe setter for health status
- `IsAlive() bool` - Thread-safe getter for health status

**Why RWMutex?**
- Multiple goroutines read `Alive` concurrently (request handlers)
- One goroutine writes `Alive` periodically (health checker)
- RWMutex allows multiple readers or one writer

### 2. ServerPool

Manages the collection of backends and implements round-robin selection.

```go
type ServerPool struct {
    backends []*Backend  // List of backend servers
    current  uint64      // Current round-robin index (atomic)
}
```

**Methods:**
- `AddBackend(*Backend)` - Adds a backend to the pool
- `NextIndex() int` - Gets next round-robin index atomically
- `GetNextPeer() *Backend` - Returns next healthy backend
- `HealthCheck()` - Checks health of all backends
- `GetBackendStatus()` - Returns status of all backends

### 3. HTTP Handlers

#### Main Load Balancer Handler

```go
func lb(w http.ResponseWriter, r *http.Request, s *ServerPool)
```

Handles incoming client requests:
1. Gets next healthy backend
2. Creates proxy request
3. Copies headers and body
4. Sends request to backend
5. Returns response to client

#### Status Handler

```go
func statusHandler(w http.ResponseWriter, r *http.Request, s *ServerPool)
```

Returns JSON with backend health status.

### 4. Health Checker

```go
func healthCheckRoutine(ctx context.Context, s *ServerPool, interval time.Duration)
```

Runs in a goroutine:
1. Waits for interval using `time.Ticker`
2. Calls `ServerPool.HealthCheck()`
3. Repeats until context is cancelled

## Data Structures

### Backend URL Storage

```go
// Stored as parsed URL
URL *url.URL

// Example:
// Input:  "http://localhost:8081"
// Parsed: {Scheme: "http", Host: "localhost:8081", Path: ""}
```

### Round-Robin Index

```go
// Atomic uint64 for thread-safe increment
current uint64

// Operations use atomic package:
atomic.AddUint64(&s.current, 1)
atomic.StoreUint64(&s.current, idx)
```

### Backend Array

```go
// Simple slice (read-only after initialization)
backends []*Backend

// No resizing or removal during runtime
// Simplifies concurrency safety
```

## Algorithms

### Round-Robin Selection

```
Algorithm: GetNextPeer()

1. Get next index: (current + 1) % backend_count
2. Set loop end: start + backend_count
3. For i = start to end:
     idx = i % backend_count
     if backends[idx].IsAlive():
         if idx != start:
             Update current to idx
         return backends[idx]
4. Return nil (no healthy backends)
```

**Example with 3 backends (A=alive, B=dead, C=alive):**
```
current = 0
Request arrives

1. NextIndex() returns 1 (0+1=1)
2. Loop from 1 to 4 (1 + 3)
   - i=1: idx=1, backends[1]=B, dead → skip
   - i=2: idx=2, backends[2]=C, alive → return C, set current=2
```

**Time Complexity:** O(n) worst case (all dead), O(1) average case

### Health Check Algorithm

```
Algorithm: HealthCheck()

For each backend:
1. Try GET /health endpoint
2. If fails, try GET / (root)
3. If response:
     if status < 500:
         Mark alive
     else:
         Mark dead
4. If error:
     Mark dead
```

**Timeout:** 2 seconds per backend

## Concurrency Model

### Goroutines

The load balancer uses multiple goroutines:

1. **Main goroutine**: Runs HTTP server
2. **Health check goroutine**: Periodic health checks
3. **Request handler goroutines**: One per client request (created by `net/http`)

### Synchronization

#### Backend.Alive Field

```go
// Protected by RWMutex
mu sync.RWMutex

// Read (multiple concurrent readers OK)
func (b *Backend) IsAlive() bool {
    b.mu.RLock()
    defer b.mu.RUnlock()
    return b.Alive
}

// Write (exclusive access)
func (b *Backend) SetAlive(alive bool) {
    b.mu.Lock()
    defer b.mu.Unlock()
    b.Alive = alive
}
```

#### ServerPool.current Field

```go
// Atomic operations (lock-free)
current uint64

// Increment atomically
atomic.AddUint64(&s.current, 1)

// Store atomically
atomic.StoreUint64(&s.current, idx)
```

**Why atomic instead of mutex?**
- Faster (no lock contention)
- Simpler for single counter
- Suitable for frequently updated values

### Race Condition Prevention

**Potential race:**
```
Thread 1: Read current
Thread 2: Read current
Thread 1: Increment current
Thread 2: Increment current
// current only incremented once!
```

**Solution:** Atomic operations
```go
// Atomic increment returns NEW value
next := atomic.AddUint64(&s.current, 1)
// Thread-safe, no race
```

## Request Flow

### Detailed Request Flow

```
1. Client sends: GET /api/users HTTP/1.1
                 Host: localhost:8080
                 User-Agent: curl/7.68.0

2. Load Balancer receives request
   │
   ├─▶ Calls lb(w, r, serverPool)
   │
   ├─▶ GetNextPeer()
   │     ├─ Current index: 0
   │     ├─ Try Backend[1] (0+1=1)
   │     └─ Backend[1] is alive ✓
   │
   ├─▶ Create target URL
   │     Original:  /api/users
   │     Backend:   http://localhost:8081
   │     Target:    http://localhost:8081/api/users
   │
   ├─▶ Create new HTTP request
   │     Method:     GET
   │     URL:        http://localhost:8081/api/users
   │     Body:       (copied from original)
   │
   ├─▶ Copy headers
   │     User-Agent: curl/7.68.0
   │     X-Forwarded-For: 127.0.0.1
   │     X-Forwarded-Host: localhost:8080
   │     X-Forwarded-Proto: http
   │
   ├─▶ Send request to backend
   │     Client.Do(request)
   │
   ├─▶ Backend processes request
   │     Returns: HTTP/1.1 200 OK
   │              Content-Type: application/json
   │              {"users": [...]}
   │
   ├─▶ Copy response headers to client
   │     Content-Type: application/json
   │
   ├─▶ Copy response body to client
   │     {"users": [...]}
   │
   └─▶ Log request
       "Forwarded GET /api/users to http://localhost:8081 [200]"

3. Client receives: HTTP/1.1 200 OK
                    Content-Type: application/json
                    {"users": [...]}
```

## Health Check System

### Health Check Lifecycle

```
Start Load Balancer
   │
   ├─▶ Initial health check (blocking)
   │     └─ Marks all backends alive or dead
   │
   └─▶ Start health check goroutine
         │
         └─▶ Loop:
               │
               ├─▶ Wait for interval (e.g., 10 seconds)
               │
               ├─▶ Check all backends
               │     For each backend:
               │       ├─ Try GET /health
               │       │    Success (status < 500): alive=true
               │       │    Error or status >= 500: try /
               │       └─ Try GET /
               │            Success (status < 500): alive=true
               │            Error or status >= 500: alive=false
               │
               └─▶ Log results
```

### Health Check Implementation

```go
func isBackendAlive(u *url.URL) bool {
    // 1. Create HTTP client with timeout
    conn := http.Client{
        Timeout: 2 * time.Second,
    }

    // 2. Try /health endpoint
    healthURL := *u
    healthURL.Path = "/health"
    resp, err := conn.Get(healthURL.String())

    // 3. If /health fails, try /
    if err != nil {
        resp, err = conn.Get(u.String())
        if err != nil {
            return false  // Both failed
        }
    }
    defer resp.Body.Close()

    // 4. Check status code
    return resp.StatusCode < 500
}
```

**Why try two endpoints?**
- `/health` - Preferred, dedicated health endpoint
- `/` - Fallback, for backends without `/health`

**Why status < 500?**
- 1xx, 2xx, 3xx, 4xx: Server is responding (alive)
- 5xx: Server error (dead)
- No response: Server unreachable (dead)

## Code Walkthrough

### main.go Structure

```
main.go (350 lines)
│
├─ Type Definitions (40 lines)
│  ├─ Backend struct
│  └─ ServerPool struct
│
├─ Backend Methods (20 lines)
│  ├─ SetAlive()
│  └─ IsAlive()
│
├─ ServerPool Methods (80 lines)
│  ├─ AddBackend()
│  ├─ NextIndex()
│  ├─ GetNextPeer()
│  ├─ HealthCheck()
│  └─ GetBackendStatus()
│
├─ Health Check Functions (40 lines)
│  ├─ isBackendAlive()
│  └─ healthCheckRoutine()
│
├─ HTTP Handlers (120 lines)
│  ├─ lb() - Main load balancing handler
│  └─ statusHandler() - Status endpoint
│
└─ main() (50 lines)
   ├─ Parse flags
   ├─ Initialize ServerPool
   ├─ Initial health check
   ├─ Start health check goroutine
   ├─ Create HTTP server
   └─ Handle graceful shutdown
```

### Key Functions Explained

#### GetNextPeer()

```go
func (s *ServerPool) GetNextPeer() *Backend {
    // Get next index in round-robin
    next := s.NextIndex()

    // Calculate loop bounds
    l := len(s.backends) + next

    // Try to find alive backend
    for i := next; i < l; i++ {
        idx := i % len(s.backends)

        // Check if this backend is alive
        if s.backends[idx].IsAlive() {
            // Update current pointer if we skipped dead backends
            if i != next {
                atomic.StoreUint64(&s.current, uint64(idx))
            }
            return s.backends[idx]
        }
    }

    // No healthy backends found
    return nil
}
```

**Why loop from `next` to `next + len`?**
- Ensures we check all backends exactly once
- Handles wrap-around at end of list
- Example: [A, B, C], start at 2 → check 2, 0, 1

#### lb() - Request Forwarding

```go
func lb(w http.ResponseWriter, r *http.Request, s *ServerPool) {
    // 1. Get healthy backend
    peer := s.GetNextPeer()
    if peer == nil {
        http.Error(w, "Service unavailable", http.StatusServiceUnavailable)
        return
    }

    // 2. Build target URL
    targetURL := *peer.URL
    targetURL.Path = r.URL.Path
    targetURL.RawQuery = r.URL.RawQuery

    // 3. Create proxy request
    proxyReq, err := http.NewRequest(r.Method, targetURL.String(), r.Body)
    if err != nil {
        http.Error(w, "Error creating request", http.StatusInternalServerError)
        return
    }

    // 4. Copy headers
    for key, values := range r.Header {
        for _, value := range values {
            proxyReq.Header.Add(key, value)
        }
    }

    // 5. Add forwarding headers
    proxyReq.Header.Set("X-Forwarded-For", r.RemoteAddr)
    proxyReq.Header.Set("X-Forwarded-Host", r.Host)
    proxyReq.Header.Set("X-Forwarded-Proto", "http")

    // 6. Send to backend
    resp, err := peer.ReverseProxy.Do(proxyReq)
    if err != nil {
        peer.SetAlive(false)
        http.Error(w, "Bad Gateway", http.StatusBadGateway)
        return
    }
    defer resp.Body.Close()

    // 7. Copy response headers
    for key, values := range resp.Header {
        for _, value := range values {
            w.Header().Add(key, value)
        }
    }

    // 8. Copy response body
    w.WriteHeader(resp.StatusCode)
    io.Copy(w, resp.Body)
}
```

## Design Decisions

### Why Go?

**Pros:**
- Excellent concurrency with goroutines
- Fast compilation and execution
- Rich standard library (HTTP, networking)
- Simple deployment (single binary)
- Great for network services

**Alternatives considered:**
- C: Too low-level, complex threading
- Python: Slower, GIL limitations
- Rust: Steeper learning curve
- Node.js: Single-threaded by default

### Why Round-Robin?

**Pros:**
- Simple to implement and understand
- Fair distribution
- No configuration needed
- Predictable behavior

**Cons:**
- Doesn't consider server load
- Doesn't consider request complexity
- All servers must have similar capacity

**Alternatives:**
- Least connections: Tracks active connections
- Weighted round-robin: Different server capacities
- IP hash: Session persistence

### Why No Configuration File?

**Decision:** Use command-line flags instead of config file

**Reasoning:**
- Simpler code (no file parsing)
- Easier to script and automate
- Follows Unix philosophy
- Good for learning

**Trade-off:** Less convenient for many backends

### Why In-Memory State Only?

**Decision:** No persistent storage of state

**Reasoning:**
- Simplifies implementation
- Fast startup
- Stateless design
- Educational focus

**Trade-off:** State lost on restart

### Why No External Dependencies?

**Decision:** Standard library only

**Reasoning:**
- Easier to build and distribute
- No dependency management
- Smaller binary
- More portable

**Trade-off:** Some features harder to implement

## Performance Characteristics

### Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Get next backend | O(n) worst, O(1) average | n = number of backends |
| Health check | O(n) | Runs periodically, not per-request |
| Request forwarding | O(1) | Plus network latency |
| Add backend | O(1) | During initialization only |

### Space Complexity

O(n) where n = number of backends

**Memory usage per backend:**
- Backend struct: ~100 bytes
- HTTP client: ~500 bytes
- Total: ~600 bytes per backend

**Example:**
- 10 backends ≈ 6 KB
- 100 backends ≈ 60 KB
- 1000 backends ≈ 600 KB

### Concurrency Limits

- **Max concurrent requests:** Limited by OS (typically 10,000+)
- **Goroutines per request:** 1
- **Backend health checks:** Sequential (one at a time)

## Testing Strategy

The test suite (`test.sh`) validates:

1. **Basic connectivity** - Can forward requests
2. **Round-robin distribution** - Even distribution across backends
3. **Concurrent requests** - Handles simultaneous clients
4. **Failure detection** - Removes failed backends
5. **Status endpoint** - Reports accurate health
6. **Path preservation** - Forwards URLs correctly
7. **Query parameters** - Preserves query strings

## Future Improvements

Possible enhancements:

1. **Connection pooling tuning** - Optimize for high throughput
2. **Metrics collection** - Request counts, latencies
3. **Weighted round-robin** - Different backend capacities
4. **Circuit breaker** - Faster failure detection
5. **TLS support** - HTTPS backends and clients
6. **Configuration file** - YAML/JSON config
7. **Dynamic backend management** - Add/remove at runtime
8. **Request retry** - Automatic retry on failure
9. **Middleware support** - Pluggable request/response filters
10. **Admin API** - REST API for management

## References

- [Go net/http documentation](https://pkg.go.dev/net/http)
- [Load Balancing Algorithms](https://codingchallenges.fyi/blog/load-balancing-algorithms/)
- [Concurrency in Go](https://go.dev/blog/pipelines)
- [Atomic Operations](https://pkg.go.dev/sync/atomic)
