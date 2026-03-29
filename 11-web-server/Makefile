.PHONY: all build run test clean help

all: build

build:
	@echo "Building web server..."
	@go build -o webserver main.go
	@echo "✅ Build complete: ./webserver"

run: build
	@echo "Starting web server on port 8080..."
	@./webserver --port 8080 --root ./public

test: build
	@echo "Testing web server..."
	@echo "Starting server in background..."
	@./webserver --port 8888 --root ./public &
	@sleep 2
	@echo "\n🧪 Running tests..."
	@curl -s -o /dev/null -w "GET / → %{http_code}\n" http://localhost:8888/
	@curl -s -o /dev/null -w "GET /index.html → %{http_code}\n" http://localhost:8888/index.html
	@curl -s -o /dev/null -w "GET /style.css → %{http_code}\n" http://localhost:8888/style.css
	@curl -s -o /dev/null -w "GET /app.js → %{http_code}\n" http://localhost:8888/app.js
	@curl -s -o /dev/null -w "GET /test.html → %{http_code}\n" http://localhost:8888/test.html
	@curl -s -o /dev/null -w "GET /missing → %{http_code}\n" http://localhost:8888/missing
	@echo "\n✅ Tests complete!"
	@pkill -f webserver || true

clean:
	@echo "Cleaning build artifacts..."
	@rm -f webserver
	@echo "✅ Clean complete"

help:
	@echo "Available targets:"
	@echo "  make build   - Build the web server"
	@echo "  make run     - Build and run the server on port 8080"
	@echo "  make test    - Build and run tests"
	@echo "  make clean   - Remove build artifacts"
	@echo "  make help    - Show this help message"
