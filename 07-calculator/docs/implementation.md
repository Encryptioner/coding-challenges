# Implementation Guide

This document explains the design decisions, code structure, and implementation details of the calculator.

## Architecture Overview

The calculator follows a **pipeline architecture** with three distinct stages:

```
Input String → [Tokenizer] → Token Array → [Shunting Yard] → Postfix Array → [Evaluator] → Result
```

Each stage is independent and can be tested separately, making the code modular and maintainable.

## Code Organization

### Main Components

```c
// Data Structures
Token           - Represents a single token (number, operator, parenthesis)
TokenArray      - Dynamic array of tokens
OpStack         - Stack for operators (char)
NumStack        - Stack for numbers (double)

// Pipeline Stages
tokenize()           - Stage 1: String → Tokens
infix_to_postfix()   - Stage 2: Infix Tokens → Postfix Tokens
evaluate_postfix()   - Stage 3: Postfix Tokens → Result

// Main Entry Point
calculate()          - Orchestrates the pipeline

// User Interface
main()              - Command-line argument handling
interactive_mode()   - REPL interface
```

### File Structure

```
main.c (600+ lines)
├── Token & Stack Definitions
├── Stack Operations
├── Operator Utilities
├── Tokenization
├── Shunting Yard Algorithm
├── Postfix Evaluation
├── Main Calculator Function
├── User Interface
└── Main Entry Point
```

## Design Decisions

### 1. Three-Stage Pipeline

**Why separate stages?**

```c
// Instead of this (single-pass):
double evaluate_directly(const char *expr) {
    // Parse and evaluate simultaneously
    // Complex, hard to test, error-prone
}

// We do this (three stages):
bool calculate(const char *expr, double *result) {
    TokenArray infix, postfix;
    tokenize(expr, &infix);           // Stage 1
    infix_to_postfix(&infix, &postfix); // Stage 2
    evaluate_postfix(&postfix, result);  // Stage 3
}
```

**Benefits:**
- Each stage is simple and testable
- Clear separation of concerns
- Easy to debug (can inspect intermediate results)
- Can optimize each stage independently

### 2. Token-Based Parsing

**Why tokenize first?**

Tokens provide a structured representation of the input:

```c
typedef struct {
    TokenType type;    // What kind of token?
    double value;      // For numbers
    char op;          // For operators
} Token;
```

**Benefits:**
- Handles multi-character numbers (e.g., "123.45")
- Simplifies precedence logic
- Makes negative numbers easier to handle
- Better error messages (can report token position)

**Alternative approaches:**
- Character-by-character parsing: More complex, harder to handle multi-digit numbers
- String-based: Less efficient, more error-prone

### 3. Stack-Based Implementation

**Why use stacks?**

Both the Shunting Yard algorithm and postfix evaluation naturally use stacks:

```c
// Operator stack for conversion
OpStack op_stack;
op_stack_push(&op_stack, '+');

// Number stack for evaluation
NumStack num_stack;
num_stack_push(&num_stack, 42.0);
```

**Benefits:**
- LIFO (Last In, First Out) matches algorithm needs
- O(1) push/pop operations
- Simple to implement
- Memory efficient

**Alternative:** Could use linked lists, but arrays are faster and simpler for fixed-size stacks.

### 4. Error Handling Strategy

**Philosophy:** Fail fast and clearly

```c
bool tokenize(const char *expr, TokenArray *tokens) {
    if (unknown_character) {
        fprintf(stderr, "Error: Unknown character '%c' at position %d\n", c, pos);
        return false;  // Fail immediately
    }
    return true;
}
```

**Error Types:**
1. **Syntax Errors** (tokenization)
   - Unknown characters
   - Invalid number format

2. **Structure Errors** (conversion)
   - Mismatched parentheses
   - Missing operators

3. **Mathematical Errors** (evaluation)
   - Division by zero
   - Stack underflow/overflow

**Benefits:**
- Clear, actionable error messages
- Early detection prevents cascading failures
- Boolean return values make error checking simple

### 5. Operator Precedence Table

```c
int get_precedence(char op) {
    switch (op) {
        case '+':
        case '-':
            return 1;  // Lowest
        case '*':
        case '/':
            return 2;  // Middle
        case '^':
            return 3;  // Highest
        default:
            return 0;  // Unknown
    }
}
```

**Why a function?**
- Easy to modify precedence levels
- Centralized logic
- Clear and readable

**Alternative:** Could use a lookup table (array), but switch statement is clearer for few operators.

### 6. Associativity Handling

```c
bool is_right_associative(char op) {
    return op == '^';  // Only exponentiation
}
```

Used in the Shunting Yard comparison:

```c
if ((is_right_associative(token.op) && curr_prec < top_prec) ||
    (!is_right_associative(token.op) && curr_prec <= top_prec)) {
    // Pop operator from stack
}
```

**Why this matters:**
```
2 - 3 - 4  =  (2 - 3) - 4  =  -5  [Left-associative]
2 ^ 3 ^ 4  =  2 ^ (3 ^ 4)  =  2^81 [Right-associative]
```

## Implementation Details

### Negative Number Handling

Challenge: Distinguish between minus operator and negative sign.

**Solution:** Context-based recognition

```c
// Negative if:
// 1. At start of expression: "-5 + 3"
// 2. After operator: "5 + -3"
// 3. After left paren: "(-5)"

if (expr[i] == '-' &&
    (tokens->count == 0 ||
     tokens->tokens[tokens->count - 1].type == TOKEN_OPERATOR ||
     tokens->tokens[tokens->count - 1].type == TOKEN_LEFT_PAREN)) {
    // Parse as negative number
}
```

### Decimal Number Parsing

Challenge: Parse numbers with decimal points.

**Solution:** Character-by-character accumulation

```c
char num_str[64];
int j = 0;

while (i < len && (isdigit(expr[i]) || expr[i] == '.')) {
    num_str[j++] = expr[i++];
}
num_str[j] = '\0';

double value = atof(num_str);  // Convert to float
```

**Why atof()?**
- Standard library function
- Handles scientific notation
- Robust parsing

**Alternative:** Manual parsing, but reinventing the wheel.

### Parentheses Matching

Challenge: Ensure parentheses are balanced and correctly nested.

**Solution:** Stack-based matching during Shunting Yard

```c
if (token.type == TOKEN_LEFT_PAREN) {
    op_stack_push(&op_stack, '(');  // Push boundary marker
}

if (token.type == TOKEN_RIGHT_PAREN) {
    // Pop until we find matching '('
    while (!op_stack_is_empty(&op_stack)) {
        char op = op_stack_pop(&op_stack);
        if (op == '(') {
            found_left_paren = true;
            break;
        }
        // Output operators
    }
    if (!found_left_paren) {
        return false;  // Error: unmatched ')'
    }
}

// At end, check for unclosed '('
if (op_stack has '(') {
    return false;  // Error: unmatched '('
}
```

### Stack Overflow Prevention

Challenge: Prevent buffer overflows in stacks.

**Solution:** Bounds checking

```c
bool op_stack_push(OpStack *stack, char c) {
    if (stack->top >= MAX_STACK - 1) {
        fprintf(stderr, "Error: Operator stack overflow\n");
        return false;
    }
    stack->data[++stack->top] = c;
    return true;
}
```

**Constants:**
```c
#define MAX_TOKENS 256      // Max tokens in expression
#define MAX_STACK 256       // Max stack depth
#define MAX_EXPR_LEN 1024   // Max input length
```

These limits are generous for normal use while preventing DOS attacks.

## Memory Management

### Stack Allocation

All data structures use **stack allocation** (not heap):

```c
TokenArray infix_tokens;    // On stack
TokenArray postfix_tokens;  // On stack
OpStack op_stack;          // On stack
NumStack num_stack;        // On stack
```

**Benefits:**
- No malloc/free needed
- Automatic cleanup (no memory leaks)
- Faster than heap allocation
- Simpler code

**Trade-off:** Fixed maximum sizes (but generous enough for practical use)

### No Dynamic Allocation

Why avoid malloc?

1. **Simplicity**: No need to track ownership
2. **Safety**: No memory leaks possible
3. **Performance**: Stack allocation is faster
4. **Portability**: Works on any platform

## Performance Characteristics

### Time Complexity

```
Tokenization:       O(n) - Single pass through input
Infix to Postfix:   O(n) - Each token processed once
Postfix Evaluation: O(n) - Each token processed once
Total:              O(n) - Linear time
```

Where n = number of characters in input.

### Space Complexity

```
Token Arrays:  O(n) - One token per operator/operand
Stacks:        O(n) - Worst case: all operators on stack
Total:         O(n) - Linear space
```

### Optimization Opportunities

1. **Single-Pass Parsing**: Combine tokenization with conversion
   - Saves one token array allocation
   - Reduces cache misses
   - More complex code

2. **Operator Caching**: Memoize precedence lookups
   - Negligible benefit for small operator set
   - Not worth the complexity

3. **JIT Compilation**: Compile expressions to bytecode
   - Useful for repeated evaluation
   - Overkill for single-shot calculator

## Testing Strategy

### Unit Testing Approach

Test each stage independently:

```bash
# Test tokenization
Input:  "2 + 3"
Output: [NUMBER:2] [OP:+] [NUMBER:3]

# Test conversion
Input:  [NUMBER:2] [OP:+] [NUMBER:3] [OP:*] [NUMBER:4]
Output: [NUMBER:2] [NUMBER:3] [NUMBER:4] [OP:*] [OP:+]

# Test evaluation
Input:  [NUMBER:2] [NUMBER:3] [NUMBER:4] [OP:*] [OP:+]
Output: 14.0
```

### Integration Testing

Test the full pipeline:

```bash
./calc "2 + 3 * 4"
Expected: 14
```

### Test Categories

1. **Basic Arithmetic**: Simple operations
2. **Precedence**: Multiple operators
3. **Parentheses**: Grouping and nesting
4. **Decimals**: Floating-point numbers
5. **Negatives**: Unary minus
6. **Edge Cases**: Zero, long expressions
7. **Error Cases**: Invalid input

### Test Script

The `test.sh` script automates testing:

```bash
run_test() {
    local expr="$1"
    local expected="$2"
    result=$($CALC "$expr")
    # Compare with tolerance for floating-point
}
```

**Floating-Point Comparison:**

Can't use exact equality due to rounding:

```bash
# Instead of: [ "$result" = "$expected" ]
# Use tolerance:
awk -v res="$result" -v exp="$expected" '
    {exit !(sqrt((res-exp)^2) < 0.0001)}
'
```

## Cross-Platform Considerations

### Platform Detection

```makefile
UNAME_S := $(shell uname -s)

ifeq ($(UNAME_S),Darwin)
    # macOS specific flags
else ifeq ($(UNAME_S),Linux)
    # Linux specific flags
endif
```

### Math Library Linking

```makefile
LDFLAGS := -lm  # Link math library for pow()
```

Required for `pow()` function in exponentiation.

### Compiler Flags

```makefile
CFLAGS := -std=c99 -Wall -Wextra -Wpedantic
```

- `-std=c99`: Use C99 standard
- `-Wall -Wextra`: Enable all warnings
- `-Wpedantic`: Strict standards compliance

## Future Enhancements

### 1. Functions

Add support for `sin()`, `cos()`, `sqrt()`, etc.

```c
// Would need:
typedef enum {
    TOKEN_FUNCTION,  // New token type
} TokenType;

// Function table:
struct Function {
    char *name;
    double (*func)(double);
};
```

### 2. Variables

Store and recall values:

```c
// Example: "x = 5; y = 10; x + y"

struct Variable {
    char name[32];
    double value;
};

Variable vars[MAX_VARS];
```

### 3. Expression History

Save previous results:

```c
// In interactive mode:
// ans → previous result
// hist(n) → nth history entry
```

### 4. Multiple Bases

Support binary, octal, hex:

```c
// Examples:
// 0b1010 → 10
// 0o12 → 10
// 0xA → 10
```

### 5. Arbitrary Precision

Use library for unlimited precision:

```c
// Instead of double:
#include <gmp.h>  // GNU Multiple Precision library
mpf_t result;
```

## Lessons Learned

### What Worked Well

1. **Three-stage pipeline**: Clear separation made development easy
2. **Comprehensive testing**: Caught edge cases early
3. **Error messages**: Specific messages helped debugging
4. **Documentation**: Algorithm docs clarified implementation

### What Could Be Improved

1. **Parser generator**: Could use lex/yacc for more complex grammar
2. **AST representation**: Abstract syntax tree might be cleaner
3. **Better error recovery**: Could continue parsing after errors
4. **Localization**: Error messages are English-only

### Key Takeaways

1. **Algorithms matter**: Shunting Yard is elegant and efficient
2. **Test thoroughly**: Edge cases are where bugs hide
3. **Document clearly**: Future-you will thank present-you
4. **Keep it simple**: Stack allocation beats dynamic allocation
5. **Error handling is crucial**: Users need clear feedback

## References

### Algorithms
- [Shunting Yard Algorithm](https://en.wikipedia.org/wiki/Shunting-yard_algorithm)
- [Reverse Polish Notation](https://en.wikipedia.org/wiki/Reverse_Polish_notation)

### Implementation Guides
- [How to Write a Parser](https://craftinginterpreters.com/)
- [Compiler Design Principles](https://www.amazon.com/Compilers-Principles-Techniques-Tools-2nd/dp/0321486811)

### Testing
- [Test-Driven Development](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
- [Property-Based Testing](https://hypothesis.works/)

### C Programming
- [C Programming Language](https://www.amazon.com/Programming-Language-2nd-Brian-Kernighan/dp/0131103628)
- [Modern C](https://modernc.gforge.inria.fr/)
