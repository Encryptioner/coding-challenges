# Challenge: Build Your Own Calculator

**Source:** [CodingChallenges.fyi - Calculator Challenge](https://codingchallenges.fyi/challenges/challenge-calculator)

## Overview

Build a command-line calculator that can parse and evaluate mathematical expressions. The calculator should handle operator precedence, parentheses, and various mathematical operations.

## Challenge Description

The calculator can be a command line tool, desktop application or web based, and to complete the challenge you'll need to parse a mathematical expression and then perform the relevant calculations before returning the answer to the user.

## Requirements

### Core Features

1. **Basic Operations**
   - Addition (+)
   - Subtraction (-)
   - Multiplication (*)
   - Division (/)
   - Exponentiation (^)

2. **Operator Precedence**
   - Follow standard mathematical precedence (PEMDAS/BODMAS)
   - Exponentiation has highest priority
   - Multiplication and division before addition and subtraction
   - Left-to-right evaluation for same precedence

3. **Parentheses Support**
   - Support grouping with parentheses
   - Handle nested parentheses
   - Parentheses override normal precedence

4. **Number Support**
   - Integer numbers
   - Decimal/floating-point numbers
   - Negative numbers

### Example Expressions

```
2 + 3 * 4           → 14 (not 20)
(2 + 3) * 4         → 20
(1 * 2) - (3 * 4)   → -10
3.14 * 2^10         → 3215.36
-5 + 10             → 5
```

## Implementation Approach

### Recommended Algorithm: Shunting Yard

The challenge suggests converting input from **infix notation** (what humans use) to **postfix notation** (also known as Reverse Polish Notation), which makes it much easier to handle precedence and parentheses.

**Example:**
- Infix: `(1 * 2) - (3 * 4)`
- Postfix: `1 2 * 3 4 * -`

Once you have the input in reverse polish notation, it's much easier to perform the calculations by simply pushing onto a stack until you reach an operator, then popping off the values.

### Steps to Complete

You could proceed with Step 1 first, perhaps doing test-driven development (TDD), or read through all the steps first which may change your approach:

1. **Tokenization** - Break the input string into tokens (numbers, operators, parentheses)
2. **Parsing** - Convert infix notation to postfix using Shunting Yard algorithm
3. **Evaluation** - Evaluate the postfix expression using a stack
4. **Error Handling** - Handle invalid expressions, division by zero, etc.

## Test Cases

### Basic Arithmetic
- `2 + 3` → `5`
- `10 - 4` → `6`
- `5 * 6` → `30`
- `20 / 4` → `5`
- `2 ^ 3` → `8`

### Operator Precedence
- `2 + 3 * 4` → `14`
- `10 - 2 * 3` → `4`
- `2 ^ 3 * 2` → `16`

### Parentheses
- `(2 + 3) * 4` → `20`
- `((2 + 3) * 4) - 5` → `15`
- `(1 * 2) - (3 * 4)` → `-10`

### Decimal Numbers
- `3.14 * 2` → `6.28`
- `10.5 + 2.5` → `13`

### Negative Numbers
- `-5 + 10` → `5`
- `10 - -5` → `15`

### Error Cases
- `5 / 0` → Error: Division by zero
- `2 +` → Error: Incomplete expression
- `(2 + 3` → Error: Mismatched parentheses

## Bonus Features

- **Interactive Mode** - REPL interface for continuous calculations
- **Functions** - Support for sin, cos, sqrt, log, etc.
- **Variables** - Store and recall values
- **Scientific Notation** - Support for numbers like `1.5e10`
- **Different Bases** - Binary, octal, hexadecimal support
- **Expression History** - Save and recall previous calculations

## Learning Objectives

This challenge teaches:
- **Parsing** - Converting text to structured data
- **Stack-based algorithms** - Using stacks for expression evaluation
- **Algorithm implementation** - Shunting Yard algorithm
- **Operator precedence** - Understanding mathematical precedence rules
- **Error handling** - Robust input validation

## Resources

- [Shunting Yard Algorithm - Wikipedia](https://en.wikipedia.org/wiki/Shunting-yard_algorithm)
- [Reverse Polish Notation - Wikipedia](https://en.wikipedia.org/wiki/Reverse_Polish_notation)
- [Operator Precedence - Wikipedia](https://en.wikipedia.org/wiki/Order_of_operations)

## Implementation Notes

This implementation:
- Uses C for performance and low-level control
- Implements all three stages: tokenization, conversion, evaluation
- Provides comprehensive error handling
- Includes 50 test cases
- Supports interactive mode
- Cross-platform (Linux, macOS, BSD)
