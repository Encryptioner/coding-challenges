# Build Your Own Web Server

This challenge is to build your own web server that speaks HTTP.

## Background

A web server is software that accepts HTTP requests from clients (web browsers) and returns HTTP responses with web content. The HTTP protocol is the foundation of data communication on the World Wide Web.

HTTP was originally developed at CERN by Tim Berners-Lee in 1989-1991. It has evolved through multiple versions:
- **HTTP/0.9** (1991) - Simple one-line protocol
- **HTTP/1.0** (1996) - MIME support, headers, methods
- **HTTP/1.1** (1997) - Persistent connections, chunked transfer, host headers
- **HTTP/2** (2015) - Multiplexing, header compression, binary protocol
- **HTTP/3** (2022) - QUIC transport, UDP-based

Web servers like Apache, nginx, and Microsoft IIS serve billions of requests daily. Understanding how they work is fundamental to web development.

## The Challenge - Building A Web Server

In this coding challenge, we're going to build a functional HTTP server that can serve static files and handle basic requests.

## Step Zero

Set up your development environment. Choose a language with:
- Network programming capabilities (TCP sockets)
- String parsing and text processing
- File system operations
- Concurrent request handling

**Recommended Languages**:
- **Go**: Excellent HTTP support in standard library, clean concurrency
- **Python**: Simple socket API, great for learning
- **Node.js**: Built-in HTTP modules, event-driven
- **Rust**: Performance, safety, growing web ecosystem

For this challenge, we'll use **Go** for its excellent net/http package and goroutines.

## Step 1

In this step, your goal is to create a TCP server that listens on a port and accepts connections.

Your server should:
1. Bind to a specified port (default 8080)
2. Listen for incoming TCP connections
3. Accept connections from clients
4. Log connection information

Test it with:
```bash
# Start your server
go run main.go --port 8080

# In another terminal, connect with telnet
telnet localhost 8080

# Or use curl (will fail but shows connection)
curl http://localhost:8080/
```

**Key Concepts**:
- TCP sockets and listeners
- Port binding
- Connection acceptance
- Client communication

## Step 2

In this step, your goal is to parse HTTP requests from clients.

Your server should:
1. Read data from the TCP connection
2. Parse the request line (method, path, version)
3. Parse headers (key-value pairs)
4. Handle request body if present
5. Parse query string parameters

Example request to parse:
```
GET /index.html?name=value HTTP/1.1
Host: localhost:8080
User-Agent: Mozilla/5.0
Accept: text/html,application/xhtml+xml

```

Data structure:
```go
type Request struct {
    Method   string            // GET, POST, etc.
    Path     string            // /index.html
    Version  string            // HTTP/1.1
    Headers  map[string]string // Request headers
    Query    map[string]string // Query parameters
    Body     []byte            // Request body
}
```

**Key Concepts**:
- HTTP request format (RFC 7230)
- Text parsing and splitting
- Header normalization
- URL encoding/decoding
- Request methods (GET, POST, PUT, DELETE, etc.)

## Step 3

In this step, your goal is to generate HTTP responses.

Your server should:
1. Create a status line (HTTP version, status code, reason phrase)
2. Add response headers (Content-Type, Content-Length, etc.)
3. Write response body
4. Close the connection (or keep-alive for HTTP/1.1)

Example response:
```
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 13

Hello, World!
```

Common status codes to implement:
- `200 OK` - Successful request
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Server error
- `301 Moved Permanently` - Redirect
- `400 Bad Request` - Malformed request

**Key Concepts**:
- HTTP response format
- Status codes and reason phrases
- Content-Type header (MIME types)
- Content-Length vs chunked encoding
- Connection management (close vs keep-alive)

## Step 4

In this step, your goal is to serve static files from a filesystem.

Your server should:
1. Map URL paths to filesystem paths
2. Check if requested file exists
3. Read file contents
4. Determine Content-Type from file extension
5. Return file contents or 404 if not found

File extension to MIME type mapping:
```
.html  → text/html
.css   → text/css
.js    → application/javascript
.json  → application/json
.png   → image/png
.jpg   → image/jpeg
.svg   → image/svg+xml
.ico   → image/x-icon
.txt   → text/plain
```

Test it:
```bash
# Create public directory with index.html
mkdir -p public
echo "<h1>Hello!</h1>" > public/index.html

# Start server
go run main.go --root ./public --port 8080

# Test in browser or curl
curl http://localhost:8080/index.html
# Output: <h1>Hello!</h1>
```

**Key Concepts**:
- File system operations
- MIME type detection
- Path traversal security (prevent `../../../etc/passwd`)
- Default files (index.html, index.htm)
- Directory listing (optional)

## Step 5

In this step, your goal is to handle multiple concurrent connections.

Your server should:
1. Handle multiple clients simultaneously
2. Process requests in parallel
3. Not block one client while waiting for another

Approaches:
- **Thread per connection** - Create new thread for each client
- **Process pool** - Pre-forked worker processes
- **Event loop** - Single-threaded with I/O multiplexing (epoll, kqueue)
- **Goroutines** - Lightweight concurrent execution (Go)

In Go with goroutines:
```go
for {
    conn, err := listener.Accept()
    if err != nil {
        continue
    }
    go handleConnection(conn)  // Handle in goroutine
}
```

**Key Concepts**:
- Concurrency models
- Goroutines and channels
- Context cancellation
- Graceful shutdown
- Connection limits

## Step 6

In this step, your goal is to support different HTTP methods.

Your server should handle:
- **GET** - Retrieve resource
- **HEAD** - Headers only (no body)
- **POST** - Submit data
- **PUT** - Update resource
- **DELETE** - Remove resource

Method-specific handling:
```go
switch req.Method {
case "GET":
    // Return resource content
case "HEAD":
    // Return headers only (no body)
case "POST":
    // Process submitted data
case "PUT":
    // Update/create resource
case "DELETE":
    // Remove resource
default:
    // 405 Method Not Allowed
}
```

**Key Concepts**:
- Idempotent methods (GET, HEAD, PUT, DELETE)
- Non-idempotent methods (POST)
- Method validation
- Allow header
- OPTIONS method for CORS

## Step 7

In this step, your goal is to implement basic routing.

Your server should:
1. Match request paths to handlers
2. Support path parameters
3. Support wildcard routes
4. Have a default 404 handler

Example routes:
```
GET  /                   → Home page
GET  /about              → About page
GET  /api/users          → List users (JSON)
GET  /api/users/:id      → Get user by ID
POST /api/users          → Create user
GET  /static/*           → Serve static files
*    *                   → 404 Not Found
```

Router interface:
```go
type Router struct {
    routes map[string]map[string]Handler
}

func (r *Router) AddRoute(method, path string, handler Handler)
func (r *Router) Match(method, path string) (Handler, map[string]string)
```

**Key Concepts**:
- URL routing and matching
- Path parameters extraction
- Route registration
- Middleware chains
- Reverse routing (URL generation)

## Step 8

In this step, your goal is to add support for HTTPS.

Your server should:
1. Load TLS certificate and key
2. Wrap TCP listener with TLS
3. Handle HTTPS connections
4. Support HTTP/2 if possible

Certificate generation for development:
```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes
```

TLS server setup:
```go
cert, err := tls.LoadX509KeyPair("cert.pem", "key.pem")
config := &tls.Config{Certificates: []tls.Certificate{cert}}
listener := tls.NewListener(tcpListener, config)
```

**Key Concepts**:
- TLS/SSL protocol
- Certificate authorities
- Self-signed certificates
- Cipher suites
- Perfect Forward Secrecy (PFS)
- HTTP/2 over TLS

## Going Further

There's plenty more you can add:
- **Middleware** - Logging, authentication, compression
- **WebSockets** - Real-time bidirectional communication
- **Server-Sent Events** - Server push notifications
- **HTTP/2** - Multiplexing, header compression, server push
- **HTTP/3** - QUIC transport, UDP-based
- **CGI** - Execute external programs for dynamic content
- **Virtual hosts** - Multiple domains on one server
- **Access logging** - Apache/Nginx-style log format
- **Rate limiting** - Prevent abuse
- **Caching** - ETag, Last-Modified, Cache-Control headers
- **Security** - CSRF protection, CORS, HSTS headers

## References

- [RFC 7230 - HTTP/1.1 Message Syntax and Routing](https://tools.ietf.org/html/rfc7230)
- [RFC 7231 - HTTP/1.1 Semantics and Content](https://tools.ietf.org/html/rfc7231)
- [MDN Web Docs - HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [Build Your Own Web Tool - Web Server](https://codingchallenges.fyi/challenges/challenge-webserver)
- [HTTP Made Really Easy](https://www.jmarshall.com/easy/http/)
