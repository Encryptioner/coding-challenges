# Makefile for Huffman Compression Tool
# Supports: Linux, macOS, BSD variants

# Compiler and flags
CC = gcc
CFLAGS = -Wall -Wextra -O2 -std=c99
LDFLAGS =
TARGET = cccompress
SOURCES = main.c huffman.c
OBJECTS = $(SOURCES:.c=.o)
HEADERS = huffman.h

# Platform detection
UNAME_S := $(shell uname -s)

# Platform-specific configurations
ifeq ($(UNAME_S),Linux)
    CFLAGS += -D_POSIX_C_SOURCE=200809L
endif

ifeq ($(UNAME_S),Darwin)
    CFLAGS += -D_DARWIN_C_SOURCE
endif

# Default target
all: $(TARGET)

# Build the executable
$(TARGET): $(OBJECTS)
	@echo "Linking $(TARGET)..."
	$(CC) $(OBJECTS) -o $(TARGET) $(LDFLAGS)
	@echo "Build successful! Run './$(TARGET) -h' for usage."

# Compile source files
%.o: %.c $(HEADERS)
	@echo "Compiling $<..."
	$(CC) $(CFLAGS) -c $< -o $@

# Debug build
debug: CFLAGS += -g -DDEBUG -O0
debug: clean $(TARGET)
	@echo "Debug build complete."

# Static build (Linux only)
static: LDFLAGS += -static
static: clean $(TARGET)
	@echo "Static build complete."

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f $(OBJECTS) $(TARGET)
	rm -f *.huf *.decoded
	@echo "Clean complete."

# Install to system (requires root/sudo)
install: $(TARGET)
	@echo "Installing $(TARGET) to /usr/local/bin..."
	install -m 755 $(TARGET) /usr/local/bin/
	@echo "Installation complete."

# Uninstall from system
uninstall:
	@echo "Uninstalling $(TARGET)..."
	rm -f /usr/local/bin/$(TARGET)
	@echo "Uninstall complete."

# Run tests
test: $(TARGET)
	@echo "Running tests..."
	./test.sh

# Create a test file and run basic operations
demo: $(TARGET)
	@echo "Running demo..."
	@echo "This is a sample text for Huffman compression." > demo.txt
	@echo "The quick brown fox jumps over the lazy dog." >> demo.txt
	@echo "Huffman coding is a lossless data compression algorithm." >> demo.txt
	@echo ""
	@echo "=== Original file ==="
	@cat demo.txt
	@echo ""
	@echo "=== Character frequencies ==="
	./$(TARGET) -f demo.txt
	@echo ""
	@echo "=== Huffman codes ==="
	./$(TARGET) -c demo.txt
	@echo ""
	@echo "=== Compressing ==="
	./$(TARGET) -z demo.txt
	@echo ""
	@echo "=== Decompressing ==="
	./$(TARGET) -x demo.txt.huf
	@echo ""
	@echo "=== Verification ==="
	@if diff demo.txt demo.txt.decoded > /dev/null 2>&1; then \
		echo "✓ Files match! Compression/decompression successful."; \
	else \
		echo "✗ Files don't match! There's a problem."; \
	fi
	@rm -f demo.txt demo.txt.huf demo.txt.decoded

# Show help
help:
	@echo "Huffman Compression Tool - Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  make           - Build the program (default)"
	@echo "  make all       - Same as 'make'"
	@echo "  make debug     - Build with debug symbols"
	@echo "  make static    - Build static binary (Linux only)"
	@echo "  make clean     - Remove build artifacts"
	@echo "  make install   - Install to /usr/local/bin (requires sudo)"
	@echo "  make uninstall - Remove from /usr/local/bin (requires sudo)"
	@echo "  make test      - Run test suite"
	@echo "  make demo      - Run a quick demo"
	@echo "  make help      - Show this help message"
	@echo ""
	@echo "Platform: $(UNAME_S)"
	@echo "Compiler: $(CC)"

# Dependencies check
check-deps:
	@echo "Checking dependencies..."
	@which $(CC) > /dev/null || (echo "Error: $(CC) not found" && exit 1)
	@echo "✓ $(CC) found"
	@echo "✓ All dependencies satisfied"

.PHONY: all debug static clean install uninstall test demo help check-deps
