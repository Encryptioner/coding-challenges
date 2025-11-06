# The Shunting Yard Algorithm

## Overview

The Shunting Yard algorithm, invented by Edsger Dijkstra in 1961, converts mathematical expressions from **infix notation** (what humans use) to **postfix notation** (what computers prefer). The name comes from the algorithm's resemblance to a railway shunting yard where train cars are reorganized.

## Why Convert to Postfix?

### Infix Notation (Human-Friendly)
```
2 + 3 * 4
```
Operators are **between** operands. This is natural for humans but requires:
- Understanding operator precedence (* before +)
- Handling parentheses
- Lookahead to determine evaluation order

### Postfix Notation (Computer-Friendly)
```
2 3 4 * +
```
Operators come **after** their operands. This is perfect for computers because:
- No precedence rules needed
- No parentheses needed
- Can be evaluated with a simple stack
- Evaluation is always left-to-right

## The Algorithm Explained

### The Metaphor: Railway Shunting Yard

Imagine a train station with:
1. **Input Track**: Where tokens arrive (numbers, operators)
2. **Operator Yard**: A stack where operators wait
3. **Output Track**: Where the postfix expression is built

The algorithm moves tokens like a train dispatcher:
- Numbers go straight to output
- Operators wait in the yard
- Higher-priority operators push lower-priority ones to output

### The Rules

```
For each token in the input:

1. If token is a NUMBER:
   → Send directly to output

2. If token is an OPERATOR:
   → While there's an operator on the stack with higher/equal precedence:
     - Pop it to output
   → Push current operator to stack

3. If token is LEFT PARENTHESIS '(':
   → Push to stack (creates a precedence boundary)

4. If token is RIGHT PARENTHESIS ')':
   → Pop operators to output until we find the matching '('
   → Discard both parentheses

5. When input is empty:
   → Pop all remaining operators to output
```

## Step-by-Step Example

Let's convert: `2 + 3 * 4` to postfix

### Initial State
```
Input:  2 + 3 * 4
Stack:  (empty)
Output: (empty)
```

### Step 1: Process '2'
```
Token:  2 (number)
Action: Numbers go directly to output

Input:  + 3 * 4
Stack:  (empty)
Output: 2
```

### Step 2: Process '+'
```
Token:  + (operator)
Action: Stack is empty, push operator

Input:  3 * 4
Stack:  +
Output: 2
```

### Step 3: Process '3'
```
Token:  3 (number)
Action: Numbers go directly to output

Input:  * 4
Stack:  +
Output: 2 3
```

### Step 4: Process '*'
```
Token:  * (operator)
Action: * has higher precedence than +
        Push * to stack (don't pop +)

Input:  4
Stack:  + *
Output: 2 3
```

### Step 5: Process '4'
```
Token:  4 (number)
Action: Numbers go directly to output

Input:  (empty)
Stack:  + *
Output: 2 3 4
```

### Step 6: Empty Input
```
Action: Pop all operators to output

Input:  (empty)
Stack:  (empty)
Output: 2 3 4 * +
```

### Result
```
Infix:   2 + 3 * 4
Postfix: 2 3 4 * +

Evaluation: 3 * 4 = 12, then 2 + 12 = 14 ✓
```

## Operator Precedence

The algorithm handles precedence through the stacking rules:

```
Precedence Levels:
1. ^ (exponentiation)     - Highest
2. * / (multiply, divide)
3. + - (add, subtract)    - Lowest
```

### Example with Multiple Precedences

Convert: `2 ^ 3 + 4 * 5`

```
Step    Token   Action              Stack    Output
----    -----   ------              -----    ------
1       2       Output number       -        2
2       ^       Push operator       ^        2
3       3       Output number       ^        2 3
4       +       ^ higher, pop it    -        2 3 ^
                Push +              +        2 3 ^
5       4       Output number       +        2 3 ^ 4
6       *       * higher than +     + *      2 3 ^ 4
7       5       Output number       + *      2 3 ^ 4 5
End     -       Pop all             -        2 3 ^ 4 5 * +

Result: 2 3 ^ 4 5 * +
Evaluates: 2^3 = 8, 4*5 = 20, 8+20 = 28
```

## Associativity

Some operators are **left-associative** (evaluate left-to-right), others are **right-associative** (evaluate right-to-left).

### Left-Associative (most operators)
```
Expression: 10 - 5 - 2
Means:      (10 - 5) - 2 = 3

Postfix:    10 5 - 2 -
```

### Right-Associative (exponentiation)
```
Expression: 2 ^ 3 ^ 2
Means:      2 ^ (3 ^ 2) = 2 ^ 9 = 512

Postfix:    2 3 2 ^ ^
```

The algorithm handles this by checking associativity when comparing precedence:
- Left-associative: Pop operators with **equal or higher** precedence
- Right-associative: Pop operators with **strictly higher** precedence

## Parentheses Handling

Parentheses create precedence boundaries.

### Example: `(2 + 3) * 4`

```
Step    Token   Action                      Stack    Output
----    -----   ------                      -----    ------
1       2       Output number               -        2
2       (       Push (boundary marker)      (        2
3       2       Output number               (        2 2
        Wait, let me restart correctly...

Step    Token   Action                      Stack    Output
----    -----   ------                      -----    ------
1       (       Push (boundary marker)      (        -
2       2       Output number               (        2
3       +       Push operator               ( +      2
4       3       Output number               ( +      2 3
5       )       Pop until '('               -        2 3 +
                Discard both parens
6       *       Push operator               *        2 3 +
7       4       Output number               *        2 3 + 4
End     -       Pop all                     -        2 3 + 4 *

Result: 2 3 + 4 *
Evaluates: 2+3 = 5, 5*4 = 20 ✓
```

The left parenthesis acts as a "fence" - operators can't jump over it when being popped.

## Complex Example with Nested Parentheses

Convert: `((2 + 3) * 4) - 5`

```
Step    Token   Stack           Output          Notes
----    -----   -----           ------          -----
1       (       (               -               Boundary level 1
2       (       ( (             -               Boundary level 2
3       2       ( (             2               Number to output
4       +       ( ( +           2               Operator
5       3       ( ( +           2 3             Number to output
6       )       (               2 3 +           Pop to first (, discard both
7       *       ( *             2 3 +           Operator
8       4       ( *             2 3 + 4         Number to output
9       )       -               2 3 + 4 *       Pop to first (, discard both
10      -       -               2 3 + 4 * -     Push operator
11      5       -               2 3 + 4 * 5     Number to output
End     -       -               2 3 + 4 * 5 -   Pop remaining

Result: 2 3 + 4 * 5 -
Evaluates: 2+3=5, 5*4=20, 20-5=15 ✓
```

## Why This Works

The Shunting Yard algorithm works because:

1. **Numbers are already in the correct order** - they never need to move relative to each other
2. **Operators are reordered based on precedence** - high-precedence operators are output before low-precedence ones
3. **The stack naturally handles nesting** - operators wait in LIFO order
4. **Parentheses create precedence boundaries** - forcing operators to wait

## Implementation Considerations

### Edge Cases to Handle

1. **Negative Numbers**: `-5 + 3`
   - Solution: Treat leading minus as part of the number

2. **Double Operators**: `5 + - 3`
   - Solution: Parse as `5 + (-3)`

3. **Empty Parentheses**: `()`
   - Solution: Detect and report error

4. **Mismatched Parentheses**: `(2 + 3` or `2 + 3)`
   - Solution: Track depth and validate at end

5. **Adjacent Numbers**: `2 3`
   - Solution: Require operator between numbers

### Optimization Opportunities

1. **Single-Pass Parsing**: Combine tokenization with conversion
2. **Precedence Table**: Use array lookup instead of switch statements
3. **Memory Management**: Reuse token arrays instead of allocating
4. **Operator Fusion**: Optimize chains of same operator

## Comparison with Other Approaches

### Recursive Descent Parser
```
Pros: More flexible, handles grammar extensions
Cons: More complex, uses call stack, harder to debug
```

### Precedence Climbing
```
Pros: Simpler than full recursive descent
Cons: Still recursive, less intuitive
```

### Shunting Yard
```
Pros: Simple, iterative, efficient, well-understood
Cons: Two-pass (parse then evaluate), fixed to expression grammar
```

## Historical Context

Edsger Dijkstra invented this algorithm in 1961 while designing the ALGOL 60 compiler. He named it after railway shunting yards where train cars are reorganized using stacks and switches.

The algorithm was revolutionary because:
- It provided a systematic way to parse expressions
- It separated precedence logic from evaluation logic
- It could be implemented efficiently without recursion
- It laid groundwork for modern compiler design

## Further Reading

- [Original Paper](https://www.ics.uci.edu/~dan/class/165/papers/shunting_yard.pdf) - Dijkstra's description
- [Operator Precedence](https://en.wikipedia.org/wiki/Order_of_operations) - Mathematical conventions
- [Reverse Polish Notation](https://en.wikipedia.org/wiki/Reverse_Polish_notation) - History and applications
- [Compiler Design](https://en.wikipedia.org/wiki/Compiler) - Modern parsing techniques
