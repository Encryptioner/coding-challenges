# Makefile for ccwc - Coding Challenges Word Count Tool
# Cross-platform build system

# Compiler
CC = gcc

# Program name
TARGET = ccwc

# Source files
SOURCES = ccwc.c

# Object files
OBJECTS = $(SOURCES:.c=.o)

# Detect OS
UNAME_S := $(shell uname -s)

# Common flags
CFLAGS = -std=c99 -Wall -Wextra -pedantic

# OS-specific flags
ifeq ($(UNAME_S),Linux)
    CFLAGS += -D_POSIX_C_SOURCE=200809L
    LDFLAGS =
endif

ifeq ($(UNAME_S),Darwin)
    CFLAGS += -D_DARWIN_C_SOURCE
    LDFLAGS =
endif

ifeq ($(findstring BSD,$(UNAME_S)),BSD)
    CFLAGS += -D_BSD_SOURCE
    LDFLAGS =
endif

# Debug flags
DEBUG_FLAGS = -g -O0 -DDEBUG

# Release flags
RELEASE_FLAGS = -O2 -DNDEBUG

# Default target
all: release

# Release build
release: CFLAGS += $(RELEASE_FLAGS)
release: $(TARGET)

# Debug build
debug: CFLAGS += $(DEBUG_FLAGS)
debug: clean $(TARGET)

# Static build (for distribution)
static: CFLAGS += $(RELEASE_FLAGS) -static
static: clean $(TARGET)

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
	rm -f test.txt

# Run tests
test: $(TARGET)
	@echo "Running tests..."
	@./test.sh

# Download test file
test.txt:
	@echo "Downloading test file..."
	@curl -s https://www.gutenberg.org/cache/epub/132/pg132.txt -o test.txt
	@echo "Test file downloaded."

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

# Help target
help:
	@echo "ccwc - Coding Challenges Word Count Tool"
	@echo ""
	@echo "Available targets:"
	@echo "  all        - Build release version (default)"
	@echo "  release    - Build optimized release version"
	@echo "  debug      - Build debug version with symbols"
	@echo "  static     - Build static binary"
	@echo "  clean      - Remove build artifacts"
	@echo "  test       - Run test suite"
	@echo "  test.txt   - Download test file"
	@echo "  install    - Install to /usr/local/bin"
	@echo "  uninstall  - Remove from /usr/local/bin"
	@echo "  check-deps - Check build dependencies"
	@echo "  help       - Show this help message"

.PHONY: all release debug static clean test install uninstall check-deps help
