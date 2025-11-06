# Makefile for Redis Server
# Cross-platform build configuration for macOS, Linux, and BSD systems

# Compiler
CC := gcc

# Detect OS
UNAME_S := $(shell uname -s)

# Binary name
TARGET := redis-server
TARGET_STATIC := redis-server-static

# Source files
SRCS := redis.c
OBJS := $(SRCS:.c=.o)

# Base compiler flags
CFLAGS := -std=c99 -Wall -Wextra -Wpedantic

# Platform-specific configurations
ifeq ($(UNAME_S),Darwin)
    # macOS
    LDFLAGS :=
    STATIC_AVAILABLE := no
else ifeq ($(UNAME_S),Linux)
    # Linux
    LDFLAGS :=
    STATIC_LDFLAGS := -static
    STATIC_AVAILABLE := yes
else ifeq ($(UNAME_S),FreeBSD)
    # FreeBSD
    LDFLAGS :=
    STATIC_LDFLAGS := -static
    STATIC_AVAILABLE := yes
else ifeq ($(UNAME_S),OpenBSD)
    # OpenBSD
    LDFLAGS :=
    STATIC_LDFLAGS := -static
    STATIC_AVAILABLE := yes
else ifeq ($(UNAME_S),NetBSD)
    # NetBSD
    LDFLAGS :=
    STATIC_LDFLAGS := -static
    STATIC_AVAILABLE := yes
else
    # Unknown OS - use defaults
    LDFLAGS :=
    STATIC_AVAILABLE := no
endif

# Build modes
.PHONY: all clean debug release static test help check-deps install uninstall

# Default target
all: release

# Release build (optimized)
release: CFLAGS += -O2
release: $(TARGET)

# Debug build
debug: CFLAGS += -g -O0 -DDEBUG
debug: clean $(TARGET)

# Static build (Linux/BSD only)
static:
ifeq ($(STATIC_AVAILABLE),yes)
	@echo "Building static binary for $(UNAME_S)..."
	$(CC) $(CFLAGS) -O2 $(SRCS) -o $(TARGET_STATIC) $(STATIC_LDFLAGS)
	@echo "Static binary created: $(TARGET_STATIC)"
	@file $(TARGET_STATIC)
	@size $(TARGET_STATIC)
else
	@echo "Static builds not fully supported on $(UNAME_S)"
	@echo "Creating semi-static binary (may still have some dynamic dependencies)..."
	$(CC) $(CFLAGS) -O2 $(SRCS) -o $(TARGET_STATIC) $(LDFLAGS)
	@echo "Note: On macOS, truly static binaries are not recommended."
	@echo "Binary created: $(TARGET_STATIC)"
	@file $(TARGET_STATIC)
endif

# Build target
$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) $(OBJS) -o $(TARGET) $(LDFLAGS)
	@echo "Build complete: $(TARGET)"
	@file $(TARGET)

# Compile source files
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# Run tests
test: $(TARGET)
	@echo "Running Redis server tests..."
	@./test.sh

# Clean build artifacts
clean:
	rm -f $(TARGET) $(TARGET_STATIC) $(OBJS)
	@echo "Clean complete"

# Install to /usr/local/bin
install: release
	@echo "Installing $(TARGET) to /usr/local/bin..."
	@install -m 755 $(TARGET) /usr/local/bin/$(TARGET)
	@echo "Installation complete. You can now run '$(TARGET)' from anywhere."

# Uninstall from /usr/local/bin
uninstall:
	@echo "Uninstalling $(TARGET) from /usr/local/bin..."
	@rm -f /usr/local/bin/$(TARGET)
	@echo "Uninstall complete."

# Check dependencies
check-deps:
	@echo "Checking build dependencies for $(UNAME_S)..."
	@command -v $(CC) >/dev/null 2>&1 && echo "✓ $(CC) found" || echo "✗ $(CC) not found - please install gcc"
	@command -v make >/dev/null 2>&1 && echo "✓ make found" || echo "✗ make not found"
	@echo ""
	@echo "Required libraries:"
	@echo "  - Standard C library (networking support)"
	@echo ""
	@echo "All dependencies are standard and should be available on most systems."

# Help
help:
	@echo "Redis Server Build System"
	@echo ""
	@echo "Targets:"
	@echo "  make              - Build release version (default)"
	@echo "  make all          - Same as release"
	@echo "  make release      - Build optimized release version"
	@echo "  make debug        - Build debug version with symbols"
	@echo "  make static       - Build static binary (Linux/BSD only)"
	@echo "  make test         - Run test suite"
	@echo "  make clean        - Remove build artifacts"
	@echo "  make install      - Install to /usr/local/bin (requires sudo)"
	@echo "  make uninstall    - Remove from /usr/local/bin (requires sudo)"
	@echo "  make check-deps   - Check for required build dependencies"
	@echo "  make help         - Show this help message"
	@echo ""
	@echo "Examples:"
	@echo "  make              # Build release version"
	@echo "  make debug        # Build with debug symbols"
	@echo "  make test         # Run tests"
	@echo "  sudo make install # Install system-wide"
	@echo ""
	@echo "Platform: $(UNAME_S)"
	@echo "Compiler: $(CC)"
