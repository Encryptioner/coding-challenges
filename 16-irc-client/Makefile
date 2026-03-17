.PHONY: all build run test clean help

all: build

build:
	@echo "Building IRC client..."
	@go build -o ircclient main.go
	@echo "✅ Build complete: ./ircclient"

run: build
	@echo "Starting IRC client..."
	@./ircclient --server irc.libera.chat --port 6697 --tls --nick TestClient$$RANDOM --channels "#libera-test"

test: build
	@echo "Testing IRC client (dry run)..."
	@echo "To test manually, run:"
	@echo "  ./ircclient --server irc.libera.chat --port 6697 --tls --nick YourNick --channels '#libera-test'"

clean:
	@echo "Cleaning build artifacts..."
	@rm -f ircclient
	@echo "✅ Clean complete"

help:
	@echo "Available targets:"
	@echo "  make build   - Build the IRC client"
	@echo "  make run     - Build and run with test settings"
	@echo "  make test    - Show test instructions"
	@echo "  make clean   - Remove build artifacts"
	@echo "  make help    - Show this help message"
