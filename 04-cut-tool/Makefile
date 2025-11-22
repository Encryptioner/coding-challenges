# Makefile for cccut - Cross-platform cut tool implementation
# Supports: Linux, macOS, *BSD

# Compiler
CC = gcc

# Program name
PROGRAM = cccut

# Source files
SOURCES = cccut.c
OBJECTS = $(SOURCES:.c=.o)

# Detect the operating system
UNAME_S := $(shell uname -s)

# Base compiler flags
CFLAGS = -Wall -Wextra -std=c99 -D_POSIX_C_SOURCE=200809L

# Base linker flags
LDFLAGS =

# Platform-specific settings
ifeq ($(UNAME_S),Linux)
    PLATFORM = Linux
    # Linux-specific flags
    CFLAGS += -D_GNU_SOURCE
endif

ifeq ($(UNAME_S),Darwin)
    PLATFORM = macOS
    # macOS-specific flags
    CFLAGS += -D_DARWIN_C_SOURCE
endif

ifeq ($(findstring BSD,$(UNAME_S)),BSD)
    PLATFORM = BSD
    # BSD-specific flags
endif

# Build targets
.PHONY: all clean debug static test install uninstall check-deps

# Default target
all: CFLAGS += -O2
all: $(PROGRAM)

# Debug build
debug: CFLAGS += -g -O0 -DDEBUG
debug: $(PROGRAM)

# Static build (Linux/BSD only, limited on macOS)
static: CFLAGS += -O2
ifeq ($(UNAME_S),Darwin)
static: LDFLAGS += -static-libgcc
else
static: LDFLAGS += -static
endif
static: $(PROGRAM)

# Main program
$(PROGRAM): $(OBJECTS)
	@echo "Building $(PROGRAM) for $(PLATFORM)..."
	$(CC) $(CFLAGS) -o $(PROGRAM) $(OBJECTS) $(LDFLAGS)
	@echo "Build complete!"

# Compile source files
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f $(PROGRAM) $(OBJECTS)
	rm -f test*.txt test*.csv
	@echo "Clean complete!"

# Run tests
test: $(PROGRAM)
	@echo "Running tests..."
	@if [ -f test.sh ]; then \
		bash test.sh; \
	else \
		echo "No test script found. Creating basic tests..."; \
		echo -e "one\ttwo\tthree" > test.txt; \
		./$(PROGRAM) -f 1 test.txt; \
		echo "one,two,three" > test.csv; \
		./$(PROGRAM) -f 1,3 -d , test.csv; \
	fi

# Install (to /usr/local/bin by default)
PREFIX ?= /usr/local
install: $(PROGRAM)
	@echo "Installing $(PROGRAM) to $(PREFIX)/bin..."
	install -d $(PREFIX)/bin
	install -m 755 $(PROGRAM) $(PREFIX)/bin/
	@echo "Installation complete!"

# Uninstall
uninstall:
	@echo "Uninstalling $(PROGRAM)..."
	rm -f $(PREFIX)/bin/$(PROGRAM)
	@echo "Uninstall complete!"

# Check dependencies and configuration
check-deps:
	@echo "Checking build environment..."
	@echo "OS: $(UNAME_S) ($(PLATFORM))"
	@echo "Compiler: $(CC)"
	@$(CC) --version 2>/dev/null || echo "Warning: Compiler not found"
	@echo ""
	@echo "Required tools:"
	@command -v $(CC) >/dev/null 2>&1 && echo "  ✓ $(CC) found" || echo "  ✗ $(CC) not found"
	@command -v make >/dev/null 2>&1 && echo "  ✓ make found" || echo "  ✗ make not found"
	@echo ""
	@echo "Configuration:"
	@echo "  CFLAGS: $(CFLAGS)"
	@echo "  LDFLAGS: $(LDFLAGS)"
	@echo ""
	@echo "Environment check complete!"

# Help target
help:
	@echo "Available targets:"
	@echo "  all         - Build the program (default)"
	@echo "  debug       - Build with debug symbols"
	@echo "  static      - Build statically linked binary"
	@echo "  clean       - Remove build artifacts"
	@echo "  test        - Run tests"
	@echo "  install     - Install to PREFIX (default: /usr/local)"
	@echo "  uninstall   - Remove installed binary"
	@echo "  check-deps  - Check build dependencies"
	@echo "  help        - Show this help message"
