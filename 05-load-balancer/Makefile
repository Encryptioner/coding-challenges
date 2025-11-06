.PHONY: all build test clean install uninstall help test-servers

# Binary names
LB_BINARY = lb
TEST_SERVER_BINARY = test-server

# Go parameters
GOCMD = go
GOBUILD = $(GOCMD) build
GOCLEAN = $(GOCMD) clean
GOTEST = $(GOCMD) test
GOGET = $(GOCMD) get
GOMOD = $(GOCMD) mod

# Build flags
LDFLAGS = -ldflags "-s -w"
BUILD_FLAGS = -trimpath

all: build ## Build all binaries

build: ## Build the load balancer
	@echo "Building load balancer..."
	$(GOBUILD) $(BUILD_FLAGS) -o $(LB_BINARY) main.go
	@echo "Building test server..."
	$(GOBUILD) $(BUILD_FLAGS) -o $(TEST_SERVER_BINARY) test_server.go
	@echo "Build complete!"

build-optimized: ## Build optimized binaries
	@echo "Building optimized binaries..."
	$(GOBUILD) $(BUILD_FLAGS) $(LDFLAGS) -o $(LB_BINARY) main.go
	$(GOBUILD) $(BUILD_FLAGS) $(LDFLAGS) -o $(TEST_SERVER_BINARY) test_server.go
	@echo "Optimized build complete!"

test: build ## Run tests
	@echo "Running tests..."
	@./test.sh

clean: ## Clean build artifacts
	@echo "Cleaning..."
	$(GOCLEAN)
	rm -f $(LB_BINARY)
	rm -f $(TEST_SERVER_BINARY)
	@echo "Clean complete!"

install: build ## Install the load balancer to /usr/local/bin
	@echo "Installing $(LB_BINARY) to /usr/local/bin..."
	@sudo cp $(LB_BINARY) /usr/local/bin/$(LB_BINARY)
	@echo "Installed successfully!"

uninstall: ## Uninstall the load balancer
	@echo "Uninstalling $(LB_BINARY)..."
	@sudo rm -f /usr/local/bin/$(LB_BINARY)
	@echo "Uninstalled successfully!"

deps: ## Download dependencies
	@echo "Downloading dependencies..."
	$(GOMOD) download
	$(GOMOD) tidy
	@echo "Dependencies updated!"

fmt: ## Format Go code
	@echo "Formatting code..."
	$(GOCMD) fmt ./...
	@echo "Format complete!"

vet: ## Run go vet
	@echo "Running go vet..."
	$(GOCMD) vet ./...
	@echo "Vet complete!"

test-servers: build ## Run multiple test servers
	@echo "Starting test servers on ports 8081, 8082, 8083..."
	@./$(TEST_SERVER_BINARY) -port 8081 -name "Server-1" &
	@./$(TEST_SERVER_BINARY) -port 8082 -name "Server-2" &
	@./$(TEST_SERVER_BINARY) -port 8083 -name "Server-3" &
	@echo "Test servers started!"
	@echo "Run 'make stop-test-servers' to stop them"

stop-test-servers: ## Stop test servers
	@echo "Stopping test servers..."
	@pkill -f "$(TEST_SERVER_BINARY)" || true
	@echo "Test servers stopped!"

run-example: build ## Run an example with 3 backend servers
	@echo "Starting example setup..."
	@echo "Starting backend servers..."
	@./$(TEST_SERVER_BINARY) -port 8081 -name "Server-1" > /dev/null 2>&1 &
	@./$(TEST_SERVER_BINARY) -port 8082 -name "Server-2" > /dev/null 2>&1 &
	@./$(TEST_SERVER_BINARY) -port 8083 -name "Server-3" > /dev/null 2>&1 &
	@sleep 2
	@echo "Starting load balancer..."
	@./$(LB_BINARY) -backends "http://localhost:8081,http://localhost:8082,http://localhost:8083" -port 8080

help: ## Display this help screen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
