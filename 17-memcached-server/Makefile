# Makefile for ccmemcached - Coding Challenges Memcached Server
# Cross-platform build system

# Compiler
CC = gcc

# Program name
TARGET = ccmemcached

# Source files
SOURCES = memcached.c

# Object files
OBJECTS = $(SOURCES:.c=.o)

# Detect OS
UNAME_S := $(shell uname -s)

# Common flags
CFLAGS = -std=c99 -Wall -Wextra -pedantic -pthread
LDFLAGS = -pthread

# OS-specific flags
ifeq ($(UNAME_S),Linux)
    CFLAGS += -D_POSIX_C_SOURCE=200809L
endif

ifeq ($(UNAME_S),Darwin)
    CFLAGS += -D_DARWIN_C_SOURCE
endif

ifeq ($(findstring BSD,$(UNAME_S)),BSD)
    CFLAGS += -D_BSD_SOURCE
endif

# Debug flags
DEBUG_FLAGS = -g -O0 -DDEBUG -fsanitize=address

# Release flags
RELEASE_FLAGS = -O2 -DNDEBUG

# Default target
all: release

# Release build
release: CFLAGS += $(RELEASE_FLAGS)
release: $(TARGET)

# Debug build
debug: CFLAGS += $(DEBUG_FLAGS)
debug: LDFLAGS += -fsanitize=address
debug: clean $(TARGET)

# Build target
$(TARGET): $(OBJECTS)
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

# Compile source files
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# Clean build artifacts
clean:
	rm -f $(TARGET) $(OBJECTS)
	rm -f *.o

# Run tests
test: $(TARGET)
	@echo "Running tests..."
	@./test.sh

# Install (to /usr/local/bin)
install: release
	@echo "Installing $(TARGET) to /usr/local/bin..."
	@sudo cp $(TARGET) /usr/local/bin/
	@sudo chmod 755 /usr/local/bin/$(TARGET)
	@echo "Installation complete."

# Uninstall
uninstall:
	@echo "Removing $(TARGET) from /usr/local/bin..."
	@sudo rm -f /usr/local/bin/$(TARGET)
	@echo "Uninstallation complete."

# Check dependencies
check-deps:
	@echo "Checking dependencies..."
	@command -v $(CC) >/dev/null 2>&1 || { echo "Error: $(CC) not found"; exit 1; }
	@echo "All dependencies satisfied."
	@echo "Compiler: $(CC)"
	@$(CC) --version | head -n 1

# Run server
run: $(TARGET)
	@echo "Starting memcached server on port 11211..."
	@./$(TARGET)

# Run server on custom port
run-port: $(TARGET)
	@echo "Starting memcached server on port 9999..."
	@./$(TARGET) -p 9999

# Help target
help:
	@echo "ccmemcached - Coding Challenges Memcached Server"
	@echo ""
	@echo "Available targets:"
	@echo "  all        - Build release version (default)"
	@echo "  release    - Build optimized release version"
	@echo "  debug      - Build debug version with AddressSanitizer"
	@echo "  clean      - Remove build artifacts"
	@echo "  test       - Run test suite"
	@echo "  run        - Start server on default port (11211)"
	@echo "  run-port   - Start server on port 9999"
	@echo "  install    - Install to /usr/local/bin"
	@echo "  uninstall  - Remove from /usr/local/bin"
	@echo "  check-deps - Check build dependencies"
	@echo "  help       - Show this help message"

.PHONY: all release debug clean test install uninstall check-deps run run-port help
