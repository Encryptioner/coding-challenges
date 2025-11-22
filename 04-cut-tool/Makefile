# Makefile for cccut - A simple cut tool implementation
# Part of Coding Challenges: https://codingchallenges.fyi

# Compiler and flags
CC := gcc
CFLAGS := -Wall -Wextra -std=c99 -O2
DEBUG_FLAGS := -g -O0 -DDEBUG
STATIC_FLAGS := -static

# Target executable
TARGET := cccut
SOURCE := cccut.c

# Installation directory
PREFIX := /usr/local
BINDIR := $(PREFIX)/bin

# OS detection
UNAME_S := $(shell uname -s)

# Platform-specific adjustments
ifeq ($(UNAME_S),Darwin)
    # macOS - static linking is limited
    STATIC_WARNING := @echo "Warning: Full static linking not supported on macOS"
endif

ifeq ($(UNAME_S),Linux)
    # Linux - full static linking available
    STATIC_CFLAGS := $(CFLAGS) $(STATIC_FLAGS)
endif

# Default target
all: $(TARGET)

# Build the executable
$(TARGET): $(SOURCE)
	@echo "Building cccut..."
	$(CC) $(CFLAGS) -o $(TARGET) $(SOURCE)
	@echo "Build complete: ./$(TARGET)"

# Debug build
debug: $(SOURCE)
	@echo "Building cccut (debug mode)..."
	$(CC) $(CFLAGS) $(DEBUG_FLAGS) -o $(TARGET) $(SOURCE)
	@echo "Debug build complete: ./$(TARGET)"

# Static build (Linux/BSD only)
static: $(SOURCE)
	@echo "Building static cccut..."
	$(STATIC_WARNING)
ifeq ($(UNAME_S),Linux)
	$(CC) $(STATIC_CFLAGS) -o $(TARGET) $(SOURCE)
	@echo "Static build complete: ./$(TARGET)"
else
	@echo "Static linking not fully supported on $(UNAME_S)"
	@echo "Building with standard flags instead..."
	$(CC) $(CFLAGS) -o $(TARGET) $(SOURCE)
endif

# Run tests
test: $(TARGET)
	@echo "Running tests..."
	@if [ -f test.sh ]; then \
		bash test.sh; \
	else \
		echo "test.sh not found. Skipping tests."; \
	fi

# Install to system
install: $(TARGET)
	@echo "Installing cccut to $(BINDIR)..."
	install -d $(BINDIR)
	install -m 755 $(TARGET) $(BINDIR)/$(TARGET)
	@echo "Installation complete. Run 'cccut -h' to get started."

# Uninstall from system
uninstall:
	@echo "Uninstalling cccut from $(BINDIR)..."
	rm -f $(BINDIR)/$(TARGET)
	@echo "Uninstallation complete."

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f $(TARGET)
	rm -f *.o *.out
	@echo "Clean complete."

# Check if all dependencies are available
check-deps:
	@echo "Checking dependencies..."
	@which $(CC) > /dev/null || (echo "Error: $(CC) not found" && exit 1)
	@echo "  $(CC): OK"
	@echo "All dependencies satisfied."

# Show help
help:
	@echo "cccut - Makefile Help"
	@echo ""
	@echo "Targets:"
	@echo "  make           - Build cccut (default)"
	@echo "  make all       - Build cccut"
	@echo "  make debug     - Build with debug symbols"
	@echo "  make static    - Build static binary (Linux/BSD)"
	@echo "  make test      - Run test suite"
	@echo "  make install   - Install to $(BINDIR)"
	@echo "  make uninstall - Remove from $(BINDIR)"
	@echo "  make clean     - Remove build artifacts"
	@echo "  make check-deps- Check build dependencies"
	@echo "  make help      - Show this help message"
	@echo ""
	@echo "Variables:"
	@echo "  CC=$(CC)"
	@echo "  CFLAGS=$(CFLAGS)"
	@echo "  PREFIX=$(PREFIX)"
	@echo ""
	@echo "Examples:"
	@echo "  make                    # Build cccut"
	@echo "  make test               # Build and test"
	@echo "  make install            # Install system-wide"
	@echo "  make PREFIX=/opt/local  # Install to /opt/local/bin"

# Phony targets
.PHONY: all debug static test install uninstall clean check-deps help
