.PHONY: all build test clean help

CC = gcc
CFLAGS = -std=c99 -Wall -Wextra -O2
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
    LDFLAGS = -lregex
else
    LDFLAGS =
endif

all: build

build:
	@echo "Building sed..."
	@$(CC) $(CFLAGS) -o sed src/*.c $(LDFLAGS)
	@echo "✅ Build complete: ./sed"

test: build
	@echo "Running sed tests..."
	@echo "\n=== Basic substitution ==="
	@echo "hello world" | ./sed -e 's/hello/goodbye/'
	@echo "\n=== Global substitution ==="
	@echo "foo foo foo" | ./sed -e 's/foo/bar/g'
	@echo "\n=== Case insensitive ==="
	@echo "HELLO world" | ./sed -e 's/hello/goodbye/i'
	@echo "\n=== Deletion (line 2) ==="
	@printf "line1\nline2\nline3\n" | ./sed -e '2d'
	@echo "\n=== Deletion (line 1) ==="
	@printf "line1\nline2\nline3\n" | ./sed -e '1d'
	@echo "\n=== Delete and substitute ==="
	@printf "foo\nbar\nbaz\n" | ./sed -e '2d' -e 's/foo/qux/'
	@echo "\n=== Print only line 2 ==="
	@printf "a\nb\nc\n" | ./sed -n -e '2p'
	@echo "\n✅ All tests passed!"

clean:
	@echo "Cleaning build artifacts..."
	@rm -f sed
	@echo "✅ Clean complete"

help:
	@echo "Available targets:"
	@echo "  make build   - Build sed"
	@echo "  make test    - Run basic tests"
	@echo "  make clean   - Remove build artifacts"
	@echo "  make help    - Show this help message"
