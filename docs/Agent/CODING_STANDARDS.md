# Coding Standards: Coding Challenges

**Last Updated:** 2026-03-17

These coding standards are MANDATORY for all code written in this repository. They ensure consistency, maintainability, and educational quality across all challenges.

---

## Table of Contents

1. [General Principles](#general-principles)
2. [C Standards](#c-standards)
3. [Go Standards](#go-standards)
4. [JavaScript/TypeScript Standards](#javascripttypescript-standards)
5. [Python Standards](#python-standards)
6. [Documentation Standards](#documentation-standards)
7. [Testing Standards](#testing-standards)
8. [Git Standards](#git-standards)
9. [Build and Package Standards](#build-and-package-standards)

---

## General Principles

### Code Quality

1. **Readability First:** Code is a learning resource. Prioritize clarity over cleverness.
2. **No Premature Optimization:** Write clear code first, optimize only if necessary.
3. **Comment the Why:** Comments should explain *why* something is done, not *what*.
4. **Error Handling:** Always handle errors appropriately. Never ignore return values.
5. **Resource Cleanup:** Always free allocated resources (memory, file handles, sockets).

### Cross-Cutting Rules

| Rule | Rationale |
|------|-----------|
| Never commit build artifacts | Keeps repository clean, avoids merge conflicts |
| Always create `.gitignore` | Prevents accidental commits of generated files |
| Use meaningful variable names | Self-documenting code |
| Follow language conventions | Each language has idiomatic patterns |
| Test before committing | Catches bugs early |
| Document as you code | Forgotten details are hard to recover |

---

## C Standards

### Memory Management

```c
// ✓ GOOD: Always free allocated memory
char *buffer = malloc(size);
if (buffer == NULL) {
    fprintf(stderr, "Memory allocation failed\n");
    exit(EXIT_FAILURE);
}
/* ... use buffer ... */
free(buffer);
buffer = NULL;  // Prevent dangling pointer

// ✗ BAD: Memory leak
char *buffer = malloc(size);
/* ... use buffer ... */
// forgot to free
```

### Error Handling

```c
// ✓ GOOD: Check all return values
FILE *file = fopen("data.txt", "r");
if (file == NULL) {
    perror("Failed to open file");
    exit(EXIT_FAILURE);
}

// ✗ BAD: Ignoring return value
FILE *file = fopen("data.txt", "r");
// No check - segfault if file doesn't exist
```

### Buffer Safety

```c
// ✓ GOOD: Bounds checking
char buffer[1024];
if (input_length < sizeof(buffer)) {
    strncpy(buffer, input, sizeof(buffer) - 1);
    buffer[sizeof(buffer) - 1] = '\0';
} else {
    fprintf(stderr, "Input too large\n");
}

// ✗ BAD: Unsafe buffer operations
char buffer[1024];
strcpy(buffer, input);  // No bounds check
```

### Function Organization

```c
// Prefer this structure:
// 1. Includes
#include <stdio.h>
#include <stdlib.h>

// 2. Constants
#define BUFFER_SIZE 1024

// 3. Function prototypes
void process_file(const char *filename);
void cleanup(void);

// 4. Global variables (minimize these)
static int global_counter = 0;

// 5. Main function
int main(int argc, char *argv[]) {
    // ...
}

// 6. Implementation
void process_file(const char *filename) {
    // ...
}
```

### Naming Conventions

```c
// Variables: snake_case
int line_count;
char *file_name;

// Constants: UPPER_SNAKE_CASE
#define MAX_BUFFER_SIZE 1024

// Functions: snake_case
int calculate_word_count(const char *text);

// Types: PascalCase for structs, snake_case for typedef
typedef struct {
    int x;
    int y;
} Point;
```

---

## Go Standards

### Error Handling

```go
// ✓ GOOD: Always check errors
file, err := os.Open("data.txt")
if err != nil {
    log.Printf("Failed to open file: %v", err)
    return err
}
defer file.Close()

// ✗ BAD: Ignoring errors
file, _ := os.Open("data.txt")  // Never ignore errors
```

### Goroutines and Channels

```go
// ✓ GOOD: Proper channel management
ch := make(chan Result, 100)
go func() {
    defer close(ch)
    for _, item := range items {
        ch <- process(item)
    }
}()

for result := range ch {
    // handle result
}

// ✗ BAD: Unclosed channel
ch := make(chan Result)
go func() {
    ch <- process(item)
    // forgot to close
}()
```

### Context Usage

```go
// ✓ GOOD: Use context for cancellation
func Process(ctx context.Context, data []string) error {
    for _, item := range data {
        select {
        case <-ctx.Done():
            return ctx.Err()
        default:
            // process item
        }
    }
    return nil
}

// ✗ BAD: No cancellation support
func Process(data []string) error {
    for _, item := range data {
        // Can't be cancelled
    }
    return nil
}
```

### Naming Conventions

```go
// Variables: camelCase (exported), camelCase (unexported)
var GlobalCount int
var localCount int

// Constants: PascalCase (exported), camelCase (unexported)
const MaxRetries = 3
const defaultTimeout = 30

// Functions: PascalCase (exported), camelCase (unexported)
func ProcessData() error { ... }
func processData() error { ... }

// Interfaces: PascalCase, often -er suffix
type Reader interface {
    Read(p []byte) (n int, err error)
}

// File names: snake_case
// file_reader.go not fileReader.go
```

---

## JavaScript/TypeScript Standards

### Type Safety (TypeScript)

```typescript
// ✓ GOOD: Explicit types
function calculateTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.price, 0);
}

// ✗ BAD: any types
function calculateTotal(items: any[]): any {
    // No type safety
}
```

### Async/Error Handling

```typescript
// ✓ GOOD: Proper async/await with error handling
async function fetchData(url: string): Promise<Data> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fetch failed:', error);
        throw error;  // Re-throw for caller to handle
    }
}

// ✗ BAD: No error handling
async function fetchData(url: string) {
    const response = await fetch(url);
    return await response.json();  // What if it fails?
}
```

### React Best Practices

```typescript
// ✓ GOOD: Proper hooks usage
function Component() {
    const [data, setData] = useState<Data | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            const result = await fetchData(url);
            if (!cancelled) {
                setData(result);
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [url]);

    if (!data) return <Loading />;

    return <Display data={data} />;
}

// ✗ BAD: Missing dependency and cleanup
function Component() {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchData(url).then(setData);
        // Missing dependency array
        // No cleanup - race condition!
    });

    return <Display data={data} />;
}
```

### Naming Conventions

```typescript
// Variables: camelCase
const userCount = 10;
const isActive = true;

// Constants: UPPER_SNAKE_CASE for true constants
const MAX_RETRIES = 3;
const API_URL = 'https://api.example.com';

// Functions/Methods: camelCase
function calculateTotal() { }

// Classes/Interfaces/Types: PascalCase
class UserController { }
interface UserData { }
type Result = string | number;

// Components: PascalCase
function UserProfile() { }

// Files: kebab-case for utilities, PascalCase for components
// user-utils.ts
// UserProfile.tsx
```

### Module Organization

```
src/
├── components/      # Reusable UI components
│   ├── Button.tsx
│   └── Modal.tsx
├── hooks/          # Custom React hooks
│   └── useDebounce.ts
├── services/       # API/external service calls
│   └── api.ts
├── utils/          # Helper functions
│   └── format.ts
├── types/          # TypeScript type definitions
│   └── index.ts
└── App.tsx         # Main app component
```

---

## Python Standards

### PEP 8 Compliance

```python
# ✓ GOOD: PEP 8 compliant
def calculate_total(items: list[dict]) -> float:
    """Calculate the total price of all items."""
    total = 0.0
    for item in items:
        total += item.get('price', 0.0)
    return total

# ✗ BAD: Not PEP 8 compliant
def CalculateTotal( i ):
    t=0
    for x in i: t+=x['price']
    return t
```

### Type Hints

```python
# ✓ GOOD: Use type hints
from typing import List, Optional

def find_user(user_id: int) -> Optional[dict]:
    """Find a user by ID, or None if not found."""
    # ...
    return user_data if found else None

# ✗ BAD: No type hints
def find_user(user_id):
    # What does this return?
```

### Context Managers

```python
# ✓ GOOD: Use context managers for resources
def process_file(filename: str) -> str:
    with open(filename, 'r') as f:
        return f.read()

# ✗ BAD: Manual resource management
def process_file(filename: str) -> str:
    f = open(filename, 'r')
    data = f.read()
    f.close()  # What if an exception occurs?
    return data
```

---

## Documentation Standards

### Code Comments

```c
// ✓ GOOD: Explains WHY, not WHAT
// We need to double-buffer input because processing may block
// and we don't want to miss incoming data
char buffer[BUFFER_SIZE * 2];

// ✗ BAD: States the obvious
// Declare buffer
char buffer[BUFFER_SIZE];
```

### Function Documentation

```typescript
/**
 * Calculate the Fibonacci number for a given position.
 *
 * Uses memoization for O(n) time complexity.
 *
 * @param n - The position in the Fibonacci sequence (0-indexed)
 * @returns The Fibonacci number at position n
 * @throws {RangeError} If n is negative or exceeds MAX_SAFE_INTEGER
 *
 * @example
 * ```typescript
 * fibonacci(10) // returns 55
 * ```
 */
function fibonacci(n: number): number {
    // ...
}
```

### README Structure

Each challenge README must include:

1. **One-paragraph overview** - What does this do?
2. **Features list** with checkmarks - What's implemented?
3. **Quick start** - How to run it immediately
4. **Build/install** - Dependencies and compilation
5. **Usage examples** - Code blocks showing common operations
6. **API/CLI reference** - All options and parameters
7. **Platform notes** - OS-specific behavior
8. **Testing** - How to run tests
9. **Project structure** - File organization

### Tutorial Documentation Style

- **Teach, don't just tell:** Explain concepts before showing code
- **Build understanding:** Start simple, add complexity gradually
- **Real examples:** Use practical, relatable examples
- **Visual aids:** Use ASCII art for structures, diagrams for flows
- **Cross-references:** Link to related concepts
- **Code blocks:** Always include language syntax highlighting

---

## Testing Standards

### Test Coverage

```c
// ✓ GOOD: Test edge cases
void test_count_words_empty_string() {
    assert(count_words("") == 0);
}

void test_count_words_multiple_spaces() {
    assert(count_words("hello   world") == 2);
}

void test_count_words_leading_trailing() {
    assert(count_words("  hello  ") == 1);
}
```

### Test Organization

```
challenge-name/
├── test.sh              # Shell script runner
├── tests/
│   ├── test_basic.c     # Basic functionality
│   ├── test_edge_cases.c
│   └── test_performance.c
└── fixtures/
    └── test_data.txt
```

### Test Naming

```typescript
// ✓ GOOD: Descriptive test names
describe('WordCounter', () => {
    it('should count words in simple string', () => { });
    it('should handle multiple consecutive spaces', () => { });
    it('should treat newlines as word separators', () => { });
});

// ✗ BAD: Vague test names
describe('WordCounter', () => {
    it('works', () => { });
    it('test 2', () => { });
});
```

---

## Git Standards

### Commit Messages

```
# ✓ GOOD: Conventional commits
feat: add support for Unicode characters in wc-tool
fix: handle empty files in JSON parser
docs: update installation instructions for shell challenge
test: add edge case tests for grep pattern matching
refactor: simplify buffer management in redis-server

# ✗ BAD: Vague messages
update stuff
fixed bug
changes
```

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** feat, fix, docs, test, refactor, chore

**Example:**
```
feat(redis-server): implement SET command with TTL

- Add SET command with EX/PX options for expiration
- Implement key expiration checker
- Add unit tests for TTL functionality

Closes #123
```

---

## Build and Package Standards

### .gitignore Template

```gitignore
# Build outputs
dist/
build/
lib/
src-gen/
*.o
*.so
*.dylib
*.exe

# Dependencies
node_modules/
vendor/
__pycache__/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
*.pem

# Logs
*.log
npm-debug.log*

# Testing
coverage/
.nyc_output/
```

### package.json Standards

For buildable challenges (TypeScript/React):

```json
{
  "name": "challenge-name",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    // runtime deps only
  },
  "devDependencies": {
    // build tools, linters, test frameworks
  }
}
```

### Makefile Standards

For C/Go challenges:

```makefile
# Variables
CC = gcc
CFLAGS = -Wall -Wextra -std=c17 -O2
TARGET = program_name
SRC = main.c utils.c

# Targets
.PHONY: all clean test

all: $(TARGET)

$(TARGET): $(SRC)
	$(CC) $(CFLAGS) -o $(TARGET) $(SRC)

test: $(TARGET)
	./test.sh

clean:
	rm -f $(TARGET) *.o

install: $(TARGET)
	install -m 755 $(TARGET) /usr/local/bin/
```

---

## Web Challenge Specific Standards

### PWA Requirements

```typescript
// vite.config.ts - PWA plugin
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Challenge Name',
        short_name: 'Challenge',
        description: 'Description',
        theme_color: '#ffffff',
      },
    }),
  ],
});
```

### Responsive Design

```css
/* Mobile-first approach */
.container {
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 2rem;
    max-width: 1024px;
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  .container {
    display: grid;
    grid-template-columns: 250px 1fr;
  }
}
```

---

## Security Considerations

### Input Validation

```c
// ✓ GOOD: Validate and sanitize
if (input_length > MAX_ALLOWED) {
    fprintf(stderr, "Input too large\n");
    return EXIT_FAILURE;
}

// ✓ GOOD: Use safe functions
strncpy(buffer, input, sizeof(buffer) - 1);
buffer[sizeof(buffer) - 1] = '\0';

// ✗ BAD: Unsafe operations
strcpy(buffer, input);  // Buffer overflow risk
sprintf(buffer, "%s", input);  // Same
```

### Dependency Management

```json
// ✓ GOOD: Lock dependencies
// Use package-lock.json or pnpm-lock.yaml
// Review security advisories regularly

// ✗ BAD: Unpinned versions
{
  "dependencies": {
    "library": "*"  // Major security risk
  }
}
```

---

## Performance Guidelines

### Optimization Order

1. **Write clear code first**
2. **Measure performance** (use profilers, benchmarks)
3. **Identify bottlenecks** (hot paths)
4. **Optimize the bottleneck**
5. **Measure again** to confirm improvement

### When to Optimize

```c
// ✓ GOOD: Clear code, fast enough
int count = 0;
for (int i = 0; i < n; i++) {
    if (is_valid(items[i])) {
        count++;
    }
}

// ✗ BAD: Premature optimization (hard to read)
int count = (n >> 2) +
    ((n & 3) >= 1 && is_valid(items[0])) +
    ((n & 3) >= 2 && is_valid(items[1])) +
    ((n & 3) >= 3 && is_valid(items[2]));
```

---

## Review Checklist

Before considering code complete:

- [ ] All error cases handled
- [ ] Resources properly cleaned up
- [ ] No memory leaks (Valgrind for C)
- [ ] Tests cover edge cases
- [ ] Documentation is complete
- [ ] Code follows language conventions
- [ ] No hardcoded paths or magic numbers
- [ ] .gitignore is present
- [ ] Build system works
- [ ] README has quick start guide
- [ ] docs/ directory has tutorial content

---

Remember: These challenges are learning resources. Code should be exemplary, not just functional.
