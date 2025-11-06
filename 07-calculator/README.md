# Calculator

A command-line calculator implementation in C that parses and evaluates mathematical expressions. This project demonstrates the implementation of expression parsing, the Shunting Yard algorithm, and stack-based evaluation.

## Challenge

This is Challenge #7 from [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/challenge-calculator).

## Features

- ✅ **Basic Operations**: Addition (+), Subtraction (-), Multiplication (*), Division (/), Exponentiation (^)
- ✅ **Operator Precedence**: Correct handling of operator priority (PEMDAS/BODMAS)
- ✅ **Parentheses Support**: Group operations with parentheses, including nested parentheses
- ✅ **Decimal Numbers**: Support for floating-point arithmetic
- ✅ **Negative Numbers**: Unary minus operator for negative values
- ✅ **Interactive Mode**: REPL-style interface for continuous calculations
- ✅ **Error Handling**: Clear error messages for invalid expressions
- ✅ **Cross-Platform**: Works on macOS, Linux, and BSD systems

## How It Works

The calculator uses a three-stage pipeline to evaluate expressions:

### 1. Tokenization
The input string is parsed into tokens (numbers, operators, parentheses):
```
"2 + 3 * 4" → [2] [+] [3] [*] [4]
```

### 2. Infix to Postfix Conversion (Shunting Yard Algorithm)
The tokenized infix expression is converted to postfix notation (Reverse Polish Notation) which makes evaluation simpler and naturally handles precedence:
```
Infix:    2 + 3 * 4
Postfix:  2 3 4 * +
```

The Shunting Yard algorithm uses an operator stack and follows these rules:
- Numbers go directly to output
- Operators are pushed to the stack based on precedence
- Higher precedence operators are output before lower precedence ones
- Parentheses force precedence boundaries

### 3. Stack-Based Evaluation
The postfix expression is evaluated using a number stack:
```
Postfix:  2 3 4 * +

Step 1: Push 2          Stack: [2]
Step 2: Push 3          Stack: [2, 3]
Step 3: Push 4          Stack: [2, 3, 4]
Step 4: Pop 4, 3, *, push 12   Stack: [2, 12]
Step 5: Pop 12, 2, +, push 14  Stack: [14]
Result: 14
```

## Building

### Requirements
- GCC or Clang compiler
- Make
- Standard C library with math support (libm)

### Build Commands

```bash
# Standard release build
make

# Debug build with symbols
make debug

# Static binary (Linux/BSD only)
make static

# Run tests
make test

# Clean build artifacts
make clean

# Install system-wide
sudo make install

# Check dependencies
make check-deps
```

### Platform Support

The calculator is tested and works on:
- **Linux** (Ubuntu, Debian, CentOS, RHEL, Fedora, Arch)
- **macOS** (Darwin)
- **BSD** (FreeBSD, OpenBSD, NetBSD)

## Usage

### Command-Line Mode

Calculate a single expression:

```bash
./calc "2 + 3 * 4"
# Output: 14

./calc "(2 + 3) * 4"
# Output: 20

./calc "3.14 * 2^10"
# Output: 3215.36

./calc "-5 + 10"
# Output: 5

./calc "(1 * 2) - (3 * 4)"
# Output: -10
```

### Interactive Mode

Start an interactive REPL session:

```bash
./calc -i

Calculator - Interactive Mode
Enter expressions to calculate (or 'quit' to exit)

> 2 + 3
= 5

> (2 + 3) * 4
= 20

> 10 / 3
= 3.333333333

> quit
Goodbye!
```

### Help

```bash
./calc -h
# or
./calc --help
```

## Examples

### Basic Arithmetic
```bash
./calc "5 + 3"              # 8
./calc "10 - 7"             # 3
./calc "4 * 6"              # 24
./calc "15 / 3"             # 5
./calc "2 ^ 8"              # 256
```

### Operator Precedence
```bash
./calc "2 + 3 * 4"          # 14 (not 20)
./calc "10 - 2 * 3"         # 4 (not 24)
./calc "2 ^ 3 * 2"          # 16 (exponent first)
```

### Parentheses
```bash
./calc "(2 + 3) * 4"        # 20
./calc "2 * (3 + 4)"        # 14
./calc "((2 + 3) * 4) - 5"  # 15
./calc "(1 + 2) * (3 + 4)"  # 21
```

### Decimal Numbers
```bash
./calc "3.14 * 2"           # 6.28
./calc "10.5 + 2.5"         # 13
./calc "7.5 / 2.5"          # 3
./calc "0.1 + 0.2"          # 0.3
```

### Negative Numbers
```bash
./calc "-5 + 10"            # 5
./calc "-5 * 2"             # -10
./calc "10 - -5"            # 15 (double negative)
./calc "(-2) * (-3)"        # 6
```

### Complex Expressions
```bash
./calc "2 + 3 * 4 - 5 / 2"                      # 11.5
./calc "(2 + 3) * (4 - 2) / 2"                  # 5
./calc "((1 + 2) * (3 + 4)) - ((5 - 2) * (6 - 4))"  # 15
```

## Testing

Run the comprehensive test suite:

```bash
make test
```

The test suite includes:
- Basic arithmetic operations
- Operator precedence rules
- Parentheses handling
- Decimal number calculations
- Negative number support
- Complex nested expressions
- Edge cases (zero, long chains)
- Error cases (division by zero, syntax errors)

## Error Handling

The calculator provides clear error messages for common issues:

```bash
./calc "5 / 0"
# Error: Division by zero

./calc "2 +"
# Error: Invalid expression

./calc "(2 + 3"
# Error: Mismatched parentheses

./calc "abc"
# Error: Unknown character 'a' at position 0
```

## Implementation Details

### Algorithm: Shunting Yard

The calculator uses Dijkstra's [Shunting Yard Algorithm](https://en.wikipedia.org/wiki/Shunting-yard_algorithm) to convert infix notation to postfix notation. This algorithm:

1. **Handles Operator Precedence**: Higher precedence operators are evaluated first
2. **Supports Associativity**: Handles both left-associative (most operators) and right-associative (exponentiation) operators
3. **Manages Parentheses**: Correctly processes nested parentheses

### Data Structures

- **Token Array**: Stores parsed tokens from the input
- **Operator Stack**: Used in Shunting Yard for operator reordering
- **Number Stack**: Used in postfix evaluation for calculation

### Code Organization

```
07-calculator/
├── main.c              # Complete implementation
├── Makefile            # Cross-platform build system
├── test.sh             # Comprehensive test suite
├── README.md           # This file
└── docs/
    ├── algorithm.md    # Detailed algorithm explanation
    ├── examples.md     # Extended examples
    └── implementation.md # Implementation notes
```

## Learning Resources

This implementation demonstrates several important concepts:

1. **Parsing**: Converting text input into structured data (tokens)
2. **Stack-Based Algorithms**: Using stacks for expression evaluation
3. **Algorithm Implementation**: Shunting Yard algorithm for precedence handling
4. **Finite State Machines**: Token recognition and parsing
5. **Error Handling**: Robust validation and error reporting

For detailed explanations, see:
- [docs/algorithm.md](docs/algorithm.md) - How the Shunting Yard algorithm works
- [docs/examples.md](docs/examples.md) - Step-by-step evaluation examples
- [docs/implementation.md](docs/implementation.md) - Code structure and design decisions

## Performance

The calculator has:
- **Time Complexity**: O(n) where n is the length of the expression
- **Space Complexity**: O(n) for storing tokens and stack operations
- **Maximum Expression Length**: 1024 characters
- **Maximum Tokens**: 256 tokens per expression
- **Stack Depth**: 256 levels

## Limitations and Future Enhancements

Current limitations:
- No support for functions (sin, cos, log, etc.)
- No variable support
- Fixed precision (double)
- No complex number support

Potential enhancements:
- Add mathematical functions (trigonometry, logarithms)
- Support for variables and expressions like "x = 5; x + 3"
- Scientific notation (1.5e10)
- Different number bases (binary, octal, hexadecimal)
- Expression history and recall
- Arbitrary precision arithmetic

## License

This implementation is part of the [CodingChallenges.fyi](https://codingchallenges.fyi) series and is provided for educational purposes.

## References

- [CodingChallenges.fyi - Calculator Challenge](https://codingchallenges.fyi/challenges/challenge-calculator)
- [Shunting Yard Algorithm - Wikipedia](https://en.wikipedia.org/wiki/Shunting-yard_algorithm)
- [Reverse Polish Notation - Wikipedia](https://en.wikipedia.org/wiki/Reverse_Polish_notation)
- [Operator Precedence - Wikipedia](https://en.wikipedia.org/wiki/Order_of_operations)
