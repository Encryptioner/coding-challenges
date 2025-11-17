# Makefile for CC SMTP Server

# Compiler and flags
CC = gcc
CFLAGS = -Wall -Wextra -O2 -std=c99
LDFLAGS =

# Detect OS
UNAME_S := $(shell uname -s)

# Platform-specific settings
ifeq ($(UNAME_S),Linux)
    CFLAGS += -D_POSIX_C_SOURCE=200809L
endif

ifeq ($(UNAME_S),Darwin)
    CFLAGS += -D_DARWIN_C_SOURCE
endif

# Target binary names
SERVER = ccsmtp
CLIENT = test_client

# Source files
SERVER_SRC = main.c
CLIENT_SRC = test_client.c

# Object files
SERVER_OBJ = $(SERVER_SRC:.c=.o)
CLIENT_OBJ = $(CLIENT_SRC:.c=.o)

# Default target
.PHONY: all
all: $(SERVER) $(CLIENT)

# Build server
$(SERVER): $(SERVER_OBJ)
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)
	@echo "Built $(SERVER)"

# Build test client
$(CLIENT): $(CLIENT_OBJ)
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)
	@echo "Built $(CLIENT)"

# Compile source files
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# Debug build
.PHONY: debug
debug: CFLAGS += -g -DDEBUG
debug: clean all

# Static build (mostly for Linux)
.PHONY: static
static: LDFLAGS += -static
static: clean all
	@echo "Static build complete"

# Run tests
.PHONY: test
test: all
	@chmod +x test.sh
	@./test.sh

# Clean build artifacts
.PHONY: clean
clean:
	rm -f $(SERVER) $(CLIENT) *.o
	rm -rf mail/
	@echo "Cleaned build artifacts"

# Install (requires root for port 25)
.PHONY: install
install: all
	@echo "Installing $(SERVER) to /usr/local/bin/"
	install -m 755 $(SERVER) /usr/local/bin/
	@echo "Installation complete"
	@echo ""
	@echo "Note: To use port 25 (standard SMTP port), run with root privileges:"
	@echo "  sudo ccsmtp -p 25"
	@echo ""
	@echo "For non-root usage, use a port >= 1024:"
	@echo "  ccsmtp -p 2525"

# Uninstall
.PHONY: uninstall
uninstall:
	rm -f /usr/local/bin/$(SERVER)
	@echo "Uninstalled $(SERVER)"

# Check dependencies
.PHONY: check-deps
check-deps:
	@echo "Checking system dependencies..."
	@which $(CC) > /dev/null || (echo "Error: $(CC) not found" && exit 1)
	@echo "✓ C compiler ($(CC)) found"
	@which nc > /dev/null || echo "⚠ Warning: netcat (nc) not found - some tests may fail"
	@echo "All required dependencies satisfied"

# Show help
.PHONY: help
help:
	@echo "CC SMTP Server - Makefile Help"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  all         - Build server and test client (default)"
	@echo "  debug       - Build with debug symbols"
	@echo "  static      - Build static binary"
	@echo "  test        - Run test suite"
	@echo "  clean       - Remove build artifacts"
	@echo "  install     - Install to /usr/local/bin (requires root)"
	@echo "  uninstall   - Remove from /usr/local/bin"
	@echo "  check-deps  - Check for required dependencies"
	@echo "  help        - Show this help message"
	@echo ""
	@echo "Examples:"
	@echo "  make              # Build everything"
	@echo "  make test         # Build and run tests"
	@echo "  make clean all    # Clean rebuild"

.DEFAULT_GOAL := all
