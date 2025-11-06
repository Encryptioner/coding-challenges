# Makefile for ccjsonparser - A JSON Parser
#
# Supports multiple platforms:
# - macOS (Darwin)
# - Linux (various distributions)
# - BSD variants (FreeBSD, OpenBSD, NetBSD)

# Program name
TARGET = ccjsonparser
SRC = main.c

# Installation directories
PREFIX ?= /usr/local
BINDIR = $(PREFIX)/bin

# Detect operating system
UNAME_S := $(shell uname -s)

# Compiler and flags
CC ?= cc
CFLAGS = -std=c99 -Wall -Wextra -Wpedantic -O2
LDFLAGS =

# Debug flags
DEBUG_CFLAGS = -std=c99 -Wall -Wextra -Wpedantic -g -O0 -DDEBUG
DEBUG_TARGET = $(TARGET)_debug

# Static build flags (platform-dependent)
STATIC_CFLAGS = $(CFLAGS)
STATIC_LDFLAGS = -static
STATIC_TARGET = $(TARGET)_static

# Platform-specific configurations
ifeq ($(UNAME_S),Darwin)
	# macOS: static linking is limited, use dynamic
	STATIC_LDFLAGS =
	STATIC_WARNING = @echo "Note: Full static linking not supported on macOS"
endif

# Default target
.PHONY: all
all: $(TARGET)

# Build standard binary
$(TARGET): $(SRC)
	$(CC) $(CFLAGS) $(SRC) -o $(TARGET) $(LDFLAGS)
	@echo "Built $(TARGET) successfully"

# Build debug version
.PHONY: debug
debug: $(SRC)
	$(CC) $(DEBUG_CFLAGS) $(SRC) -o $(DEBUG_TARGET) $(LDFLAGS)
	@echo "Built $(DEBUG_TARGET) with debug symbols"

# Build static binary (where supported)
.PHONY: static
static: $(SRC)
	$(STATIC_WARNING)
	$(CC) $(STATIC_CFLAGS) $(SRC) -o $(STATIC_TARGET) $(STATIC_LDFLAGS)
	@echo "Built $(STATIC_TARGET)"

# Install
.PHONY: install
install: $(TARGET)
	install -d $(BINDIR)
	install -m 755 $(TARGET) $(BINDIR)/$(TARGET)
	@echo "Installed $(TARGET) to $(BINDIR)"

# Uninstall
.PHONY: uninstall
uninstall:
	rm -f $(BINDIR)/$(TARGET)
	@echo "Uninstalled $(TARGET) from $(BINDIR)"

# Run tests
.PHONY: test
test: $(TARGET)
	@echo "Running tests..."
	@./test.sh

# Clean build artifacts
.PHONY: clean
clean:
	rm -f $(TARGET) $(DEBUG_TARGET) $(STATIC_TARGET)
	rm -f *.o *.core core
	@echo "Cleaned build artifacts"

# Check dependencies
.PHONY: check-deps
check-deps:
	@echo "Checking build dependencies..."
	@echo "Operating System: $(UNAME_S)"
	@command -v $(CC) >/dev/null 2>&1 && echo "✓ C compiler ($(CC)) found" || echo "✗ C compiler not found"
	@command -v make >/dev/null 2>&1 && echo "✓ Make found" || echo "✗ Make not found"
	@echo ""
	@echo "Compiler version:"
	@$(CC) --version 2>/dev/null || echo "Unable to determine compiler version"

# Help
.PHONY: help
help:
	@echo "ccjsonparser - JSON Parser Build System"
	@echo ""
	@echo "Available targets:"
	@echo "  make all        Build the standard binary (default)"
	@echo "  make debug      Build with debug symbols"
	@echo "  make static     Build static binary (Linux/BSD only)"
	@echo "  make test       Run test suite"
	@echo "  make install    Install to $(BINDIR)"
	@echo "  make uninstall  Remove from $(BINDIR)"
	@echo "  make clean      Remove build artifacts"
	@echo "  make check-deps Check build dependencies"
	@echo "  make help       Show this help message"
	@echo ""
	@echo "Variables:"
	@echo "  CC=<compiler>   Use specific C compiler (default: cc)"
	@echo "  PREFIX=<path>   Installation prefix (default: /usr/local)"
	@echo ""
	@echo "Examples:"
	@echo "  make                    # Build with default settings"
	@echo "  make CC=gcc             # Build with GCC"
	@echo "  make PREFIX=~/.local    # Install to ~/.local/bin"
	@echo "  make debug              # Build for debugging"
