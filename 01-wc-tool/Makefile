# Makefile for ccwc - A clone of the Unix wc tool
#
# This Makefile provides cross-platform build support for ccwc.
# It auto-detects the operating system and configures appropriate
# compiler flags and build options.
#
# Supported platforms:
# - macOS (Darwin)
# - Linux (various distributions)
# - BSD (FreeBSD, OpenBSD, NetBSD)
#
# Usage:
#   make all        - Build the standard binary
#   make static     - Build a static binary (Linux/BSD only)
#   make debug      - Build with debug symbols
#   make clean      - Remove build artifacts
#   make test       - Run the test suite
#   make install    - Install to system (requires sudo)
#   make uninstall  - Remove from system (requires sudo)
#   make help       - Show this help message

# Compiler settings
CC = gcc
CFLAGS = -Wall -Wextra -pedantic -std=c99 -O2
DEBUG_CFLAGS = -Wall -Wextra -pedantic -std=c99 -g -O0 -DDEBUG
LDFLAGS =

# Binary name
TARGET = ccwc
SOURCE = main.c

# Installation directories
PREFIX ?= /usr/local
BINDIR = $(PREFIX)/bin

# Platform detection
UNAME_S := $(shell uname -s)
UNAME_M := $(shell uname -m)

# Platform-specific settings
ifeq ($(UNAME_S),Darwin)
    PLATFORM = darwin
    OS_TYPE = macOS
    # macOS doesn't support static linking well for standard libraries
    STATIC_WARNING = "Warning: Static linking not recommended on macOS"
endif

ifeq ($(UNAME_S),Linux)
    PLATFORM = linux
    OS_TYPE = Linux
    STATIC_LDFLAGS = -static

    # Detect Linux distribution
    ifneq (,$(wildcard /etc/os-release))
        DISTRO := $(shell . /etc/os-release && echo $$ID)
    endif
endif

ifeq ($(UNAME_S),FreeBSD)
    PLATFORM = freebsd
    OS_TYPE = FreeBSD
    STATIC_LDFLAGS = -static
endif

ifeq ($(UNAME_S),OpenBSD)
    PLATFORM = openbsd
    OS_TYPE = OpenBSD
    STATIC_LDFLAGS = -static
endif

ifeq ($(UNAME_S),NetBSD)
    PLATFORM = netbsd
    OS_TYPE = NetBSD
    STATIC_LDFLAGS = -static
endif

# Default target
.DEFAULT_GOAL := all

# PHONY targets (not files)
.PHONY: all clean debug static test install uninstall help check-deps show-config

# Main build target
all: $(TARGET)

$(TARGET): $(SOURCE)
	@echo "Building $(TARGET) for $(OS_TYPE)..."
	$(CC) $(CFLAGS) $(SOURCE) -o $(TARGET) $(LDFLAGS)
	@echo "Build complete: $(TARGET)"
	@echo "Run './$(TARGET) --help' for usage information"

# Debug build
debug: $(SOURCE)
	@echo "Building $(TARGET) with debug symbols..."
	$(CC) $(DEBUG_CFLAGS) $(SOURCE) -o $(TARGET) $(LDFLAGS)
	@echo "Debug build complete: $(TARGET)"
	@echo "Use with gdb or lldb for debugging"

# Static build (Linux/BSD only)
static: $(SOURCE)
ifeq ($(PLATFORM),darwin)
	@echo $(STATIC_WARNING)
	@echo "Building with default flags instead..."
	$(CC) $(CFLAGS) $(SOURCE) -o $(TARGET) $(LDFLAGS)
else
	@echo "Building static binary for $(OS_TYPE)..."
	$(CC) $(CFLAGS) $(SOURCE) -o $(TARGET) $(STATIC_LDFLAGS) $(LDFLAGS)
	@echo "Static build complete: $(TARGET)"
endif

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f $(TARGET)
	rm -rf $(TARGET).dSYM
	rm -f *.o *.out
	rm -f test_*.txt
	@echo "Clean complete"

# Run tests
test: $(TARGET)
	@echo "Running test suite..."
	@if [ -f test.sh ]; then \
		chmod +x test.sh; \
		./test.sh; \
	else \
		echo "Error: test.sh not found"; \
		exit 1; \
	fi

# Install to system
install: $(TARGET)
	@echo "Installing $(TARGET) to $(BINDIR)..."
	@mkdir -p $(BINDIR)
	install -m 755 $(TARGET) $(BINDIR)/$(TARGET)
	@echo "Installation complete"
	@echo "$(TARGET) is now available system-wide"

# Uninstall from system
uninstall:
	@echo "Uninstalling $(TARGET) from $(BINDIR)..."
	rm -f $(BINDIR)/$(TARGET)
	@echo "Uninstall complete"

# Check dependencies and show configuration
check-deps:
	@echo "=== Build Configuration ==="
	@echo "Platform: $(UNAME_S) ($(PLATFORM))"
	@echo "Architecture: $(UNAME_M)"
	@echo "OS Type: $(OS_TYPE)"
ifdef DISTRO
	@echo "Distribution: $(DISTRO)"
endif
	@echo ""
	@echo "=== Compiler Information ==="
	@which $(CC) > /dev/null 2>&1 && echo "Compiler: $(CC) (found)" || echo "Compiler: $(CC) (NOT FOUND)"
	@which $(CC) > /dev/null 2>&1 && $(CC) --version | head -n 1 || echo "Cannot get compiler version"
	@echo ""
	@echo "=== Build Flags ==="
	@echo "CFLAGS: $(CFLAGS)"
	@echo "LDFLAGS: $(LDFLAGS)"
ifdef STATIC_LDFLAGS
	@echo "STATIC_LDFLAGS: $(STATIC_LDFLAGS)"
endif
	@echo ""
	@echo "=== Install Configuration ==="
	@echo "PREFIX: $(PREFIX)"
	@echo "BINDIR: $(BINDIR)"
	@echo ""
	@echo "=== Dependencies ==="
	@echo "This project requires:"
	@echo "  - C compiler (gcc or clang)"
	@echo "  - Standard C library"
	@echo "  - POSIX-compatible system"
	@echo ""
	@echo "All dependencies are standard and should be available on any Unix-like system."

# Show configuration
show-config: check-deps

# Help message
help:
	@echo "ccwc - A clone of the Unix wc tool"
	@echo ""
	@echo "Available targets:"
	@echo "  make all        - Build the standard binary (default)"
	@echo "  make static     - Build a static binary (Linux/BSD only)"
	@echo "  make debug      - Build with debug symbols for development"
	@echo "  make clean      - Remove all build artifacts"
	@echo "  make test       - Run the test suite"
	@echo "  make install    - Install to $(BINDIR) (may require sudo)"
	@echo "  make uninstall  - Remove from $(BINDIR) (may require sudo)"
	@echo "  make check-deps - Show build configuration and dependencies"
	@echo "  make help       - Show this help message"
	@echo ""
	@echo "Build configuration:"
	@echo "  Platform: $(OS_TYPE)"
	@echo "  Compiler: $(CC)"
	@echo "  Target: $(TARGET)"
	@echo ""
	@echo "Examples:"
	@echo "  make              # Build the binary"
	@echo "  make clean all    # Clean and rebuild"
	@echo "  make debug        # Build for debugging"
	@echo "  make test         # Run tests"
	@echo "  sudo make install # Install system-wide"
	@echo ""
	@echo "For more information, see README.md"
