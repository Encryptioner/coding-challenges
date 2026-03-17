# Build Your Own Web Server - Implementation

A functional HTTP web server built from scratch, demonstrating HTTP protocol implementation, connection handling, static file serving, and routing. Built with Go.

## Overview

This implementation recreates core web server functionality by building an HTTP server that speaks the HTTP/1.1 protocol, serves static files, handles concurrent connections, and implements a routing system. It demonstrates how web servers work under the hood.

## Features

- ✅ **HTTP/1.1 Protocol**: Full request/response parsing and generation
- ✅ **TCP Server**: Socket-based connection handling
- ✅ **Static File Serving**: Serve HTML, CSS, JS, images, and more
- ✅ **Concurrent Connections**: Handle multiple clients simultaneously
- ✅ **HTTP Methods**: GET, HEAD, POST, PUT, DELETE support
- ✅ **Routing System**: Path-based routing with parameters
- ✅ **MIME Type Detection**: Automatic Content-Type from file extension
- ✅ **TLS/HTTPS**: Secure connections with certificates
- ✅ **Middleware**: Logging, authentication, compression hooks
- ✅ **Keep-Alive**: Persistent connections (HTTP/1.1)
- ✅ **Graceful Shutdown**: Clean connection termination

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Web Server UI                           │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐ │
│  │   Status     │  │  Configuration  │  │   Controls       │ │
│  │   Panel      │  │                 │  │  (Start/Stop)    │ │
│  └──────────────┘  └─────────────────┘  └──────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Request Pipeline                        │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐  │ │
│  │  │  TCP    │  │  HTTP   │  │  Router │  │ Handlers  │  │ │
│  │  │ Listener│  │ Parser  │  │         │  │           │  │ │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └─────┬─────┘  │ │
│  │       │            │            │              │         │ │
│  │       ▼            ▼            ▼              ▼         │ │
│  │  ┌─────────────────────────────────────────────────┐    │ │
│  │  │              Middleware Chain                   │    │ │
│  │  │  Logging → Auth → CORS → Compression → Route   │    │ │
│  │  └─────────────────────────────────────────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Connection Pool                          │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │ │
│  │  │ Conn 1  │  │ Conn 2  │  │ Conn 3  │  │ Conn N  │   │ │
│  │  │ (idle)  │  │ (active)│  │ (active)│  │ (idle)  │   │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Build and Installation

### Prerequisites

- **Go 1.21+**
- **OpenSSL** (for TLS certificate generation)

### Build from Source

```bash
# Navigate to challenge directory
cd 11-web-server

# Download dependencies
go mod download

# Build the binary
go build -o webserver ./cmd/webserver

# (Optional) Install to system path
sudo cp webserver /usr/local/bin/
```

### TLS Certificate Generation

```bash
# Generate self-signed certificate for development
openssl req -x509 -newkey rsa:2048 \
  -keyout key.pem \
  -out cert.pem \
  -days 365 \
  -nodes \
  -subj "/CN=localhost"

# Or with the built-in tool
./webserver cert-generate
```

## Usage

### Basic Web Server

```bash
# Start HTTP server on default port 8080
./webserver

# Start on custom port
./webserver --port 3000

# Serve from custom directory
./webserver --root ./public

# Enable verbose logging
./webserver --verbose
```

### HTTPS Server

```bash
# Start HTTPS server
./webserver --tls --cert cert.pem --key key.pem --port 8443
```

### CLI Options

```
--port int          Server port (default 8080)
--root string       Document root directory (default ./public)
--tls               Enable TLS/HTTPS
--cert string       TLS certificate file (default cert.pem)
--key string        TLS private key file (default key.pem)
--workers int       Number of worker goroutines (default 10)
--timeout duration  Read/write timeout (default 30s)
--verbose           Enable verbose logging
--log-file string   Log file path (default stdout)
```

### Testing

```bash
# Start server
./webserver

# In another terminal, test with curl
curl http://localhost:8080/
curl http://localhost:8080/index.html
curl -I http://localhost:8080/style.css

# Test with different methods
curl -X POST http://localhost:8080/api/users -d '{"name":"John"}'
curl -X DELETE http://localhost:8080/api/users/123

# Test HTTPS
curl -k https://localhost:8443/
```

## Project Structure

```
11-web-server/
├── cmd/
│   └── webserver/
│       └── main.go              # CLI entry point
├── internal/
│   ├── server/
│   │   ├── server.go             # Main server orchestration
│   │   ├── listener.go           # TCP listener management
│   │   └── conn.go               # Connection handling
│   ├── http/
│   │   ├── parser.go             # HTTP request/response parsing
│   │   ├── request.go            # Request structure and methods
│   │   ├── response.go           # Response structure and methods
│   │   ├── methods.go            # HTTP method handlers
│   │   └── status.go             # Status code definitions
│   ├── routing/
│   │   ├── router.go             # Route registration and matching
│   │   ├── route.go              # Route structure
│   │   └── trie.go               # Trie-based path matching
│   ├── handlers/
│   │   ├── file_handler.go       # Static file serving
│   │   ├── api_handler.go        # API endpoint handlers
│   │   └── handler.go            # Handler interface
│   ├── middleware/
│   │   ├── logger.go             # Request logging
│   │   ├── auth.go               # Authentication
│   │   ├── cors.go               # CORS headers
│   │   └── compress.go           # Response compression
│   ├── fs/
│   │   ├── file_server.go        # File system operations
│   │   ├── mime.go               # MIME type detection
│   │   └── cache.go              // File caching
│   ├── tls/
│   │   ├── tls.go                # TLS configuration
│   │   └── cert.go               # Certificate generation
│   └── config/
│       └── config.go             # Configuration management
├── public/                       # Default document root
│   ├── index.html
│   ├── style.css
│   └── app.js
├── test/
│   ├── server_test.go
│   ├── http_test.go
│   └── integration_test.go
├── docs/
│   ├── implementation.md         # Implementation details
│   ├── examples.md               # Usage examples
│   └── internals.md              # Deep dive into internals
├── CHALLENGE.md                  # Challenge requirements
├── README.md                     # This file
├── go.mod
├── go.sum
└── Dockerfile
```

## How It Works

### HTTP Request Flow

```
1. Client Connection
   ├─ TCP three-way handshake
   ├─ Connection accepted by listener
   └─ Goroutine spawned for connection

2. Request Reading
   ├─ Read bytes from socket
   ├─ Parse request line (GET /path HTTP/1.1)
   ├─ Parse headers (key: value)
   ├─ Parse body (if Content-Length > 0)
   └─ Validate request format

3. Routing
   ├─ Extract path from request
   ├─ Match against registered routes
   ├─ Extract path parameters
   └─ Select handler function

4. Middleware Chain
   ├─ Log request details
   ├─ Validate authentication
   ├─ Set CORS headers
   ├─ Compress response
   └─ Call handler

5. Handler Execution
   ├─ Execute handler logic
   ├─ Generate response
   ├─ Set status code and headers
   └─ Write response body

6. Response Writing
   ├─ Write status line
   ├─ Write headers
   ├─ Write body
   └─ Flush socket

7. Connection Cleanup
   ├─ Close connection (if not keep-alive)
   └─ Return connection to pool
```

### Static File Serving

```
File Request Processing:
┌─────────────────────────────────────────────────────────────┐
│  1. URL to Filesystem Path Mapping                         │
│     Request: /style/css/main.css                            │
│     Root: /var/www/public                                   │
│     Path: /var/www/public/style/css/main.css                 │
│                                                              │
│  2. Security Checks                                         │
│     ├─ Path traversal check (prevent ../../../)              │
│     ├─ Existence check                                     │
│     └─ Permission check                                    │
│                                                              │
│  3. MIME Type Detection                                     │
│     .css → text/css                                         │
│     .js → application/javascript                            │
│     .html → text/html                                       │
│     .png → image/png                                        │
│                                                              │
│  4. File Reading                                            │
│     ├─ Open file                                            │
│     ├─ Read contents                                        │
│     └─ Cache if enabled                                     │
│                                                              │
│  5. Response Generation                                     │
│     HTTP/1.1 200 OK                                         │
│     Content-Type: text/css                                   │
│     Content-Length: 1234                                    │
│     ETag: "abc123"                                           │
│                                                              │
│     [file contents]                                          │
└─────────────────────────────────────────────────────────────┘
```

### Routing System

```
Route Matching Algorithm:
┌─────────────────────────────────────────────────────────────┐
│  Route Registration:                                        │
│     router.Get("/api/users", listUsers)                     │
│     router.Get("/api/users/:id", getUser)                   │
│     router.Post("/api/users", createUser)                    │
│                                                              │
│  Request Matching:                                          │
│     GET /api/users/123                                       │
│                                                              │
│  1. Split path by '/' → ["api", "users", "123"]            │
│                                                              │
│  2. Match against registered routes:                        │
│     "/api/users/:id" matches!                                │
│     params = {"id": "123"}                                    │
│                                                              │
│  3. Call handler with params:                               │
│     getUser(w, r, {"id": "123"})                             │
└─────────────────────────────────────────────────────────────┘
```

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| Linux (amd64) | ✅ Full support | Recommended |
| macOS (amd64) | ✅ Full support | Tested |
| macOS (arm64) | ✅ Full support | Apple Silicon |
| Windows | ✅ Full support | WSL or native |

## Testing

### Unit Tests

```bash
# Run all unit tests
go test ./...

# Run with coverage
go test -cover ./...

# Verbose output
go test -v ./...
```

### Integration Tests

```bash
# Start test server
./webserver --port 9999 &
SERVER_PID=$!

# Run integration tests
go test -tags=integration ./test/integration/

# Cleanup
kill $SERVER_PID
```

### Manual Testing

```bash
# Create test files
mkdir -p public/css public/js
echo "<h1>Hello!</h1>" > public/index.html
echo "body { color: blue; }" > public/css/style.css

# Start server
./webserver

# Test in browser
open http://localhost:8080/

# Or with curl
curl http://localhost:8080/index.html
curl http://localhost:8080/css/style.css
```

## Troubleshooting

### "Address already in use"

**Symptom**: Error binding to port

**Solutions**:
```bash
# Find process using port
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or use different port
./webserver --port 8081
```

### "Permission denied" on port 80/443

**Symptom**: Can't bind to privileged port

**Solutions**:
```bash
# Run with sudo
sudo ./webserver --port 80

# Or use port forwarding
./webserver --port 8080
sudo socat TCP-LISTEN:80,fork TCP:localhost:8080
```

### "Certificate not trusted"

**Symptom**: Browser shows certificate warning

**Solutions**:
- Self-signed certificates trigger warnings - this is expected
- Add certificate to browser's trust store for development
- Or proceed despite warning (for development only)

### Files not serving correctly

**Symptom**: 404 for existing files

**Solutions**:
- Check file permissions (must be readable)
- Verify root directory path is correct
- Check URL path matches filesystem path (case-sensitive)
- Ensure files are in the correct root directory

## Performance Considerations

- **Concurrent connections**: Goroutines handle thousands of concurrent connections
- **Memory usage**: ~2KB per connection goroutine
- **File serving**: ~10ms latency for cached files
- **TLS overhead**: ~5ms additional latency for HTTPS

## Security Considerations

⚠️ **This is an educational implementation, not production-hardened:**

- No input validation sanitization
- No rate limiting (vulnerable to DoS)
- No security headers (CSP, HSTS, X-Frame-Options)
- No request size limits
- Self-signed certificates (no certificate chain validation)

**For production use, use nginx, Apache, or Caddy.**

## Further Reading

- [RFC 7230 - HTTP/1.1 Message Syntax](https://tools.ietf.org/html/rfc7230)
- [RFC 7231 - HTTP/1.1 Semantics](https://tools.ietf.org/html/rfc7231)
- [MDN HTTP Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [nginx Architecture](https://www.nginx.com/blog/inside-nginx-how-we-designed-for-performance/)
- [Let's Encrypt - Free TLS Certificates](https://letsencrypt.org/)

## License

MIT License - See LICENSE file for details

## Contributing

This is a coding challenge implementation. For web server concepts and HTTP protocol understanding, this serves as an educational foundation for building production-ready servers.
