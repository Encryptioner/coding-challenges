package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

func main() {
	var port int
	var name string
	var failAfter int

	flag.IntVar(&port, "port", 8081, "Port to run the test server on")
	flag.StringVar(&name, "name", "Server", "Server name for identification")
	flag.IntVar(&failAfter, "fail-after", 0, "Fail after N seconds (0 = never fail)")
	flag.Parse()

	startTime := time.Now()
	shouldFail := false

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Check if we should simulate failure
		if failAfter > 0 && time.Since(startTime) > time.Duration(failAfter)*time.Second {
			shouldFail = true
		}

		if shouldFail {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintf(w, "💀 %s (Port %d) - Server is down!\n", name, port)
			log.Printf("[FAIL] Request to %s - Responding with 500", r.URL.Path)
			return
		}

		// Normal response
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "✓ Response from %s (Port %d)\n", name, port)
		fmt.Fprintf(w, "Path: %s\n", r.URL.Path)
		fmt.Fprintf(w, "Method: %s\n", r.Method)
		fmt.Fprintf(w, "Time: %s\n", time.Now().Format(time.RFC3339))

		// Log headers
		fmt.Fprintf(w, "\nHeaders:\n")
		for key, values := range r.Header {
			for _, value := range values {
				fmt.Fprintf(w, "  %s: %s\n", key, value)
			}
		}

		log.Printf("[OK] %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		// Check if we should simulate failure
		if failAfter > 0 && time.Since(startTime) > time.Duration(failAfter)*time.Second {
			shouldFail = true
		}

		if shouldFail {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintf(w, "unhealthy")
			return
		}

		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "healthy")
	})

	http.HandleFunc("/fail", func(w http.ResponseWriter, r *http.Request) {
		shouldFail = true
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "Server will now fail health checks\n")
		log.Println("Server set to fail mode")
	})

	http.HandleFunc("/recover", func(w http.ResponseWriter, r *http.Request) {
		shouldFail = false
		startTime = time.Now() // Reset start time
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "Server recovered\n")
		log.Println("Server recovered")
	})

	addr := fmt.Sprintf(":%d", port)
	log.Printf("%s starting on http://localhost%s", name, addr)
	if failAfter > 0 {
		log.Printf("Server will fail after %d seconds", failAfter)
	}

	if err := http.ListenAndServe(addr, nil); err != nil {
		fmt.Fprintf(os.Stderr, "Error starting server: %v\n", err)
		os.Exit(1)
	}
}
