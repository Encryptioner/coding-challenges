package main

import (
	"bufio"
	"crypto/tls"
	"fmt"
	"io"
	"log"
	"mime"
	"net"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

// Request represents an HTTP request
type Request struct {
	Method   string
	Path     string
	Version  string
	Headers  map[string]string
	Query    map[string]string
	Body     []byte
}

// Response represents an HTTP response
type Response struct {
	StatusCode int
	StatusText string
	Headers    map[string]string
	Body       []byte
}

// Server represents the web server
type Server struct {
	Address    string
	Port       int
	RootDir    string
	TLSCert    string
	TLSKey     string
	Listener   net.Listener
	middleware []func(*Request, *Response) bool
}

// NewServer creates a new server instance
func NewServer(port int, rootDir string) *Server {
	return &Server{
		Address:    "0.0.0.0",
		Port:       port,
		RootDir:    rootDir,
		middleware: make([]func(*Request, *Response) bool, 0),
	}
}

// Start begins the server
func (s *Server) Start() error {
	addr := fmt.Sprintf("%s:%d", s.Address, s.Port)

	listener, err := net.Listen("tcp", addr)
	if err != nil {
		return fmt.Errorf("failed to listen on %s: %w", addr, err)
	}
	s.Listener = listener

	log.Printf("Server listening on http://%s/", addr)
	log.Printf("Serving files from: %s", s.RootDir)

	return s.serve()
}

// StartTLS begins the HTTPS server
func (s *Server) StartTLS(certFile, keyFile string) error {
	addr := fmt.Sprintf("%s:%d", s.Address, s.Port)

	cert, err := tls.LoadX509KeyPair(certFile, keyFile)
	if err != nil {
		return fmt.Errorf("failed to load certificate: %w", err)
	}

	config := &tls.Config{
		Certificates: []tls.Certificate{cert},
		MinVersion:   tls.VersionTLS12,
	}

	listener, err := tls.Listen("tcp", addr, config)
	if err != nil {
		return fmt.Errorf("failed to listen on %s: %w", addr, err)
	}
	s.Listener = listener

	log.Printf("Server listening on https://%s/", addr)
	log.Printf("Serving files from: %s", s.RootDir)

	return s.serve()
}

// serve accepts and handles connections
func (s *Server) serve() error {
	defer s.Listener.Close()

	for {
		conn, err := s.Listener.Accept()
		if err != nil {
			log.Printf("Error accepting connection: %v", err)
			continue
		}

		go s.handleConnection(conn)
	}
}

// handleConnection processes a single connection
func (s *Server) handleConnection(conn net.Conn) {
	defer conn.Close()

	// Set read timeout
	conn.SetReadDeadline(time.Now().Add(30 * time.Second))

	// Parse request
	req, err := s.parseRequest(conn)
	if err != nil {
		log.Printf("Error parsing request: %v", err)
		s.sendError(conn, 400, "Bad Request")
		return
	}

	log.Printf("%s %s %s", req.Method, req.Path, req.Version)

	// Create response
	resp := &Response{
		StatusCode: 200,
		StatusText: "OK",
		Headers: map[string]string{
			"Server":       "WebServer/1.0",
			"Date":         time.Now().Format(time.RFC1123),
			"Connection":   "close",
			"Content-Type": "text/html; charset=utf-8",
		},
	}

	// Run middleware
	for _, mw := range s.middleware {
		if !mw(req, resp) {
			// Middleware returned false, stop processing
			s.sendResponse(conn, resp)
			return
		}
	}

	// Handle request
	s.handleRequest(req, resp)

	// Send response
	s.sendResponse(conn, resp)
}

// parseRequest reads and parses an HTTP request
func (s *Server) parseRequest(conn net.Conn) (*Request, error) {
	reader := bufio.NewReader(conn)

	// Read request line
	line, err := reader.ReadString('\n')
	if err != nil {
		return nil, err
	}

	line = strings.TrimSpace(line)
	parts := strings.Fields(line)
	if len(parts) < 2 {
		return nil, fmt.Errorf("invalid request line")
	}

	req := &Request{
		Method:  parts[0],
		Path:    parts[1],
		Version: "HTTP/1.0",
		Headers: make(map[string]string),
		Query:   make(map[string]string),
	}

	if len(parts) >= 3 {
		req.Version = parts[2]
	}

	// Parse query string
	if idx := strings.Index(req.Path, "?"); idx > 0 {
		queryString := req.Path[idx+1:]
		req.Path = req.Path[:idx]

		for _, pair := range strings.Split(queryString, "&") {
			if kv := strings.SplitN(pair, "=", 2); len(kv) == 2 {
				req.Query[kv[0]] = kv[1]
			}
		}
	}

	// Read headers
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			break
		}

		line = strings.TrimSpace(line)
		if line == "" {
			break
		}

		parts := strings.SplitN(line, ":", 2)
		if len(parts) == 2 {
			req.Headers[strings.TrimSpace(parts[0])] = strings.TrimSpace(parts[1])
		}
	}

	// Read body if Content-Length exists
	if contentLength := req.Headers["Content-Length"]; contentLength != "" {
		var length int
		fmt.Sscanf(contentLength, "%d", &length)
		req.Body = make([]byte, length)
		io.ReadFull(reader, req.Body)
	}

	return req, nil
}

// handleRequest routes and handles the request
func (s *Server) handleRequest(req *Request, resp *Response) {
	// Serve static files
	filePath := filepath.Join(s.RootDir, req.Path)

	// Remove query string from file path
	filePath = regexp.MustCompile(`\?.*`).ReplaceAllString(filePath, "")

	// Default to index.html
	if strings.HasSuffix(filePath, "/") {
		filePath = filepath.Join(filePath, "index.html")
	}

	// Check if file exists
	info, err := os.Stat(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			resp.StatusCode = 404
			resp.StatusText = "Not Found"
			resp.Body = []byte(fmt.Sprintf("<html><body><h1>404 - File Not Found</h1><p>%s not found</p></body></html>", req.Path))
			return
		}
		resp.StatusCode = 500
		resp.StatusText = "Internal Server Error"
		resp.Body = []byte("<html><body><h1>500 - Internal Server Error</h1></body></html>")
		return
	}

	// Don't serve directories
	if info.IsDir() {
		filePath = filepath.Join(filePath, "index.html")
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			resp.StatusCode = 404
			resp.StatusText = "Not Found"
			resp.Body = []byte("<html><body><h1>404 - No index.html</h1></body></html>")
			return
		}
	}

	// Detect MIME type
	ext := filepath.Ext(filePath)
	mimeType := mime.TypeByExtension(ext)
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}
	resp.Headers["Content-Type"] = mimeType

	// Read file
	body, err := os.ReadFile(filePath)
	if err != nil {
		resp.StatusCode = 500
		resp.StatusText = "Internal Server Error"
		resp.Body = []byte("<html><body><h1>500 - Error reading file</h1></body></html>")
		return
	}

	resp.StatusCode = 200
	resp.StatusText = "OK"
	resp.Body = body
	resp.Headers["Content-Length"] = fmt.Sprintf("%d", len(body))
}

// sendResponse writes the response to the connection
func (s *Server) sendResponse(conn net.Conn, resp *Response) {
	// Write status line
	statusLine := fmt.Sprintf("HTTP/1.1 %d %s\r\n", resp.StatusCode, resp.StatusText)
	conn.Write([]byte(statusLine))

	// Write headers
	for key, value := range resp.Headers {
		header := fmt.Sprintf("%s: %s\r\n", key, value)
		conn.Write([]byte(header))
	}

	// Write blank line
	conn.Write([]byte("\r\n"))

	// Write body
	if resp.Body != nil {
		conn.Write(resp.Body)
	}
}

// sendError sends an error response
func (s *Server) sendError(conn net.Conn, code int, message string) {
	resp := &Response{
		StatusCode: code,
		StatusText: message,
		Headers: map[string]string{
			"Content-Type": "text/html",
			"Connection":   "close",
		},
		Body: []byte(fmt.Sprintf("<html><body><h1>%d - %s</h1></body></html>", code, message)),
	}
	s.sendResponse(conn, resp)
}

// Use adds a middleware function
func (s *Server) Use(mw func(*Request, *Response) bool) {
	s.middleware = append(s.middleware, mw)
}

func main() {
	port := 8080
	rootDir := "./public"
	tlsMode := false
	certFile := "cert.pem"
	keyFile := "key.pem"

	// Parse command line args
	for i, arg := range os.Args {
		switch arg {
		case "--port":
			if i+1 < len(os.Args) {
				fmt.Sscanf(os.Args[i+1], "%d", &port)
			}
		case "--root":
			if i+1 < len(os.Args) {
				rootDir = os.Args[i+1]
			}
		case "--tls":
			tlsMode = true
		case "--cert":
			if i+1 < len(os.Args) {
				certFile = os.Args[i+1]
			}
		case "--key":
			if i+1 < len(os.Args) {
				keyFile = os.Args[i+1]
			}
		}
	}

	server := NewServer(port, rootDir)

	// Add logging middleware
	server.Use(func(req *Request, resp *Response) bool {
		startTime := time.Now()
		defer func() {
			log.Printf("[%d] %s %s - %v", resp.StatusCode, req.Method, req.Path, time.Since(startTime))
		}()
		return true
	})

	// Start server
	var err error
	if tlsMode {
		err = server.StartTLS(certFile, keyFile)
	} else {
		err = server.Start()
	}

	if err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
