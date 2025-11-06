package main

import (
	"context"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"sync"
	"sync/atomic"
	"syscall"
	"time"
)

// Backend represents a backend server
type Backend struct {
	URL          *url.URL
	Alive        bool
	mu           sync.RWMutex
	ReverseProxy *http.Client
}

// SetAlive sets the backend's alive status
func (b *Backend) SetAlive(alive bool) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.Alive = alive
}

// IsAlive returns the backend's alive status
func (b *Backend) IsAlive() bool {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return b.Alive
}

// ServerPool holds information about backend servers
type ServerPool struct {
	backends []*Backend
	current  uint64
}

// AddBackend adds a backend to the pool
func (s *ServerPool) AddBackend(backend *Backend) {
	s.backends = append(s.backends, backend)
}

// NextIndex increments and returns the next index in round-robin fashion
func (s *ServerPool) NextIndex() int {
	return int(atomic.AddUint64(&s.current, uint64(1)) % uint64(len(s.backends)))
}

// GetNextPeer returns the next available backend using round-robin
func (s *ServerPool) GetNextPeer() *Backend {
	// Loop through all backends to find an alive one
	next := s.NextIndex()
	l := len(s.backends) + next

	for i := next; i < l; i++ {
		idx := i % len(s.backends)
		if s.backends[idx].IsAlive() {
			if i != next {
				atomic.StoreUint64(&s.current, uint64(idx))
			}
			return s.backends[idx]
		}
	}
	return nil
}

// HealthCheck performs health check on all backends
func (s *ServerPool) HealthCheck() {
	for _, b := range s.backends {
		status := "up"
		alive := isBackendAlive(b.URL)
		b.SetAlive(alive)
		if !alive {
			status = "down"
		}
		log.Printf("Health check: %s [%s]", b.URL, status)
	}
}

// GetBackendStatus returns status of all backends
func (s *ServerPool) GetBackendStatus() []map[string]interface{} {
	status := make([]map[string]interface{}, len(s.backends))
	for i, b := range s.backends {
		status[i] = map[string]interface{}{
			"url":   b.URL.String(),
			"alive": b.IsAlive(),
		}
	}
	return status
}

// isBackendAlive checks if a backend is alive
func isBackendAlive(u *url.URL) bool {
	timeout := 2 * time.Second
	conn := http.Client{
		Timeout: timeout,
	}

	// Try to reach the backend's health endpoint or root
	healthURL := *u
	healthURL.Path = "/health"

	resp, err := conn.Get(healthURL.String())
	if err != nil {
		// If /health fails, try the root path
		resp, err = conn.Get(u.String())
		if err != nil {
			return false
		}
	}
	defer resp.Body.Close()

	// Consider the backend alive if we get any response
	return resp.StatusCode < 500
}

// healthCheckRoutine performs periodic health checks
func healthCheckRoutine(ctx context.Context, s *ServerPool, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("Stopping health check routine")
			return
		case <-ticker.C:
			log.Println("Starting health check...")
			s.HealthCheck()
		}
	}
}

// lb performs load balancing
func lb(w http.ResponseWriter, r *http.Request, s *ServerPool) {
	peer := s.GetNextPeer()
	if peer == nil {
		http.Error(w, "Service unavailable", http.StatusServiceUnavailable)
		log.Printf("No available backends for request: %s %s", r.Method, r.URL.Path)
		return
	}

	// Create the target URL
	targetURL := *peer.URL
	targetURL.Path = r.URL.Path
	targetURL.RawQuery = r.URL.RawQuery

	// Create a new request
	proxyReq, err := http.NewRequest(r.Method, targetURL.String(), r.Body)
	if err != nil {
		http.Error(w, "Error creating request", http.StatusInternalServerError)
		log.Printf("Error creating proxy request: %v", err)
		return
	}

	// Copy headers
	for key, values := range r.Header {
		for _, value := range values {
			proxyReq.Header.Add(key, value)
		}
	}

	// Add X-Forwarded-For header
	if clientIP := r.RemoteAddr; clientIP != "" {
		proxyReq.Header.Set("X-Forwarded-For", clientIP)
	}
	proxyReq.Header.Set("X-Forwarded-Host", r.Host)
	proxyReq.Header.Set("X-Forwarded-Proto", "http")

	// Send the request
	resp, err := peer.ReverseProxy.Do(proxyReq)
	if err != nil {
		log.Printf("Error forwarding request to %s: %v", peer.URL, err)
		peer.SetAlive(false)
		http.Error(w, "Bad Gateway", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// Copy response headers
	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}

	// Set status code
	w.WriteHeader(resp.StatusCode)

	// Copy response body
	_, err = io.Copy(w, resp.Body)
	if err != nil {
		log.Printf("Error copying response body: %v", err)
	}

	log.Printf("Forwarded %s %s to %s [%d]", r.Method, r.URL.Path, peer.URL, resp.StatusCode)
}

// statusHandler returns the status of all backends
func statusHandler(w http.ResponseWriter, r *http.Request, s *ServerPool) {
	w.Header().Set("Content-Type", "application/json")
	status := s.GetBackendStatus()

	fmt.Fprintf(w, "{\n  \"backends\": [\n")
	for i, backend := range status {
		alive := "true"
		if !backend["alive"].(bool) {
			alive = "false"
		}
		fmt.Fprintf(w, "    {\"url\": \"%s\", \"alive\": %s}", backend["url"], alive)
		if i < len(status)-1 {
			fmt.Fprintf(w, ",")
		}
		fmt.Fprintf(w, "\n")
	}
	fmt.Fprintf(w, "  ]\n}\n")
}

func main() {
	var serverList string
	var port int
	var healthCheckInterval int

	flag.StringVar(&serverList, "backends", "", "Comma-separated list of backend servers (e.g., http://localhost:8081,http://localhost:8082)")
	flag.IntVar(&port, "port", 8080, "Port to run the load balancer on")
	flag.IntVar(&healthCheckInterval, "health-check-interval", 10, "Health check interval in seconds")
	flag.Parse()

	if serverList == "" {
		log.Fatal("Please provide at least one backend server using -backends flag")
	}

	// Parse backend servers
	serverPool := &ServerPool{}
	servers := strings.Split(serverList, ",")

	for _, server := range servers {
		server = strings.TrimSpace(server)
		serverURL, err := url.Parse(server)
		if err != nil {
			log.Fatalf("Invalid server URL '%s': %v", server, err)
		}

		backend := &Backend{
			URL:   serverURL,
			Alive: true,
			ReverseProxy: &http.Client{
				Timeout: 30 * time.Second,
			},
		}
		serverPool.AddBackend(backend)
		log.Printf("Configured backend server: %s", serverURL)
	}

	// Create a context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initial health check
	log.Println("Performing initial health check...")
	serverPool.HealthCheck()

	// Start health check routine
	go healthCheckRoutine(ctx, serverPool, time.Duration(healthCheckInterval)*time.Second)

	// Create HTTP server
	mux := http.NewServeMux()

	// Status endpoint
	mux.HandleFunc("/lb-status", func(w http.ResponseWriter, r *http.Request) {
		statusHandler(w, r, serverPool)
	})

	// Main load balancer handler
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Don't load balance requests to the status endpoint
		if r.URL.Path == "/lb-status" {
			statusHandler(w, r, serverPool)
			return
		}
		lb(w, r, serverPool)
	})

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", port),
		Handler: mux,
	}

	// Handle graceful shutdown
	go func() {
		sigint := make(chan os.Signal, 1)
		signal.Notify(sigint, os.Interrupt, syscall.SIGTERM)
		<-sigint

		log.Println("Shutting down load balancer...")
		cancel()

		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer shutdownCancel()

		if err := server.Shutdown(shutdownCtx); err != nil {
			log.Printf("HTTP server shutdown error: %v", err)
		}
	}()

	// Start server
	log.Printf("Load balancer starting on port %d", port)
	log.Printf("Health check interval: %d seconds", healthCheckInterval)
	log.Printf("Backend servers: %d", len(serverPool.backends))

	if err := server.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatalf("HTTP server error: %v", err)
	}

	log.Println("Load balancer stopped")
}
