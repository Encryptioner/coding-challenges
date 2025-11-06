# Calculator Examples

This document provides detailed step-by-step examples of how the calculator processes and evaluates various expressions. Each example shows the complete pipeline: tokenization, infix-to-postfix conversion, and evaluation.

## Example 1: Simple Expression with Precedence

### Expression: `2 + 3 * 4`

#### Step 1: Tokenization
```
Input:  "2 + 3 * 4"

Tokens:
[0] NUMBER: 2
[1] OPERATOR: +
[2] NUMBER: 3
[3] OPERATOR: *
[4] NUMBER: 4
```

#### Step 2: Infix to Postfix (Shunting Yard)
```
Token   Type        Stack       Output          Action
-----   ----        -----       ------          ------
2       NUMBER      -           2               Output number
+       OPERATOR    +           2               Push operator
3       NUMBER      +           2 3             Output number
*       OPERATOR    + *         2 3             * > +, push
4       NUMBER      + *         2 3 4           Output number
END     -           -           2 3 4 * +       Pop all operators

Postfix: 2 3 4 * +
```

#### Step 3: Postfix Evaluation
```
Token   Type        Stack           Action
-----   ----        -----           ------
2       NUMBER      [2]             Push 2
3       NUMBER      [2, 3]          Push 3
4       NUMBER      [2, 3, 4]       Push 4
*       OPERATOR    [2, 12]         Pop 4, 3 → 3*4=12, push 12
+       OPERATOR    [14]            Pop 12, 2 → 2+12=14, push 14

Result: 14
```

#### Verification
```
2 + 3 * 4
= 2 + (3 * 4)    [* has higher precedence]
= 2 + 12
= 14 ✓
```

---

## Example 2: Parentheses Override Precedence

### Expression: `(2 + 3) * 4`

#### Step 1: Tokenization
```
Input:  "(2 + 3) * 4"

Tokens:
[0] LEFT_PAREN
[1] NUMBER: 2
[2] OPERATOR: +
[3] NUMBER: 3
[4] RIGHT_PAREN
[5] OPERATOR: *
[6] NUMBER: 4
```

#### Step 2: Infix to Postfix
```
Token   Type        Stack       Output          Action
-----   ----        -----       ------          ------
(       LEFT_PAREN  (           -               Push boundary
2       NUMBER      (           2               Output number
+       OPERATOR    ( +         2               Push operator
3       NUMBER      ( +         2 3             Output number
)       RIGHT_PAREN -           2 3 +           Pop until '(', discard both
*       OPERATOR    *           2 3 +           Push operator
4       NUMBER      *           2 3 + 4         Output number
END     -           -           2 3 + 4 *       Pop all

Postfix: 2 3 + 4 *
```

#### Step 3: Postfix Evaluation
```
Token   Type        Stack           Action
-----   ----        -----           ------
2       NUMBER      [2]             Push 2
3       NUMBER      [2, 3]          Push 3
+       OPERATOR    [5]             Pop 3, 2 → 2+3=5, push 5
4       NUMBER      [5, 4]          Push 4
*       OPERATOR    [20]            Pop 4, 5 → 5*4=20, push 20

Result: 20
```

#### Verification
```
(2 + 3) * 4
= 5 * 4
= 20 ✓
```

---

## Example 3: Nested Parentheses

### Expression: `((1 + 2) * (3 + 4)) - 5`

#### Step 1: Tokenization
```
Tokens:
[0]  LEFT_PAREN       [(]
[1]  LEFT_PAREN       [(]
[2]  NUMBER: 1
[3]  OPERATOR: +
[4]  NUMBER: 2
[5]  RIGHT_PAREN      [)]
[6]  OPERATOR: *
[7]  LEFT_PAREN       [(]
[8]  NUMBER: 3
[9]  OPERATOR: +
[10] NUMBER: 4
[11] RIGHT_PAREN      [)]
[12] RIGHT_PAREN      [)]
[13] OPERATOR: -
[14] NUMBER: 5
```

#### Step 2: Infix to Postfix (Detailed)
```
Token   Stack           Output              Notes
-----   -----           ------              -----
(       (               -                   Outer boundary
(       ( (             -                   Inner boundary #1
1       ( (             1                   Number
+       ( ( +           1                   Operator
2       ( ( +           1 2                 Number
)       (               1 2 +               Close inner #1
*       ( *             1 2 +               Multiply
(       ( * (           1 2 +               Inner boundary #2
3       ( * (           1 2 + 3             Number
+       ( * ( +         1 2 + 3             Operator
4       ( * ( +         1 2 + 3 4           Number
)       ( *             1 2 + 3 4 +         Close inner #2
)       -               1 2 + 3 4 + *       Close outer, output *
-       -               1 2 + 3 4 + * -     Subtract
5       -               1 2 + 3 4 + * 5     Number
END     -               1 2 + 3 4 + * 5 -   Pop all

Postfix: 1 2 + 3 4 + * 5 -
```

#### Step 3: Postfix Evaluation
```
Token   Stack               Action
-----   -----               ------
1       [1]                 Push 1
2       [1, 2]              Push 2
+       [3]                 Pop 2,1 → 1+2=3, push 3
3       [3, 3]              Push 3
4       [3, 3, 4]           Push 4
+       [3, 7]              Pop 4,3 → 3+4=7, push 7
*       [21]                Pop 7,3 → 3*7=21, push 21
5       [21, 5]             Push 5
-       [16]                Pop 5,21 → 21-5=16, push 16

Result: 16
```

#### Verification
```
((1 + 2) * (3 + 4)) - 5
= (3 * 7) - 5
= 21 - 5
= 16 ✓
```

---

## Example 4: Negative Numbers

### Expression: `-5 + 10`

#### Step 1: Tokenization
```
Input:  "-5 + 10"

Notes:  The minus at the start is recognized as unary (part of the number)
        because it's at the beginning of the expression.

Tokens:
[0] NUMBER: -5          [Negative number]
[1] OPERATOR: +
[2] NUMBER: 10
```

#### Step 2: Infix to Postfix
```
Token   Stack       Output
-----   -----       ------
-5      -           -5              Output number
+       +           -5              Push operator
10      +           -5 10           Output number
END     -           -5 10 +         Pop all

Postfix: -5 10 +
```

#### Step 3: Evaluation
```
Token   Stack           Action
-----   -----           ------
-5      [-5]            Push -5
10      [-5, 10]        Push 10
+       [5]             Pop 10,-5 → -5+10=5, push 5

Result: 5
```

---

## Example 5: Multiple Operations

### Expression: `2 + 3 * 4 - 5 / 2`

#### Step 1: Tokenization
```
Tokens:
[0] NUMBER: 2
[1] OPERATOR: +
[2] NUMBER: 3
[3] OPERATOR: *
[4] NUMBER: 4
[5] OPERATOR: -
[6] NUMBER: 5
[7] OPERATOR: /
[8] NUMBER: 2
```

#### Step 2: Infix to Postfix
```
Token   Stack       Output              Precedence Notes
-----   -----       ------              ----------------
2       -           2
+       +           2                   + (prec=1)
3       +           2 3
*       + *         2 3                 * (prec=2) > + (prec=1)
4       + *         2 3 4
-       -           2 3 4 * +           - (prec=1), pop * and +
5       -           2 3 4 * + 5
/       - /         2 3 4 * + 5         / (prec=2) > - (prec=1)
2       - /         2 3 4 * + 5 2
END     -           2 3 4 * + 5 2 / -   Pop all

Postfix: 2 3 4 * + 5 2 / -
```

#### Step 3: Evaluation
```
Token   Stack               Action
-----   -----               ------
2       [2]                 Push 2
3       [2, 3]              Push 3
4       [2, 3, 4]           Push 4
*       [2, 12]             Pop 4,3 → 3*4=12, push 12
+       [14]                Pop 12,2 → 2+12=14, push 14
5       [14, 5]             Push 5
2       [14, 5, 2]          Push 2
/       [14, 2.5]           Pop 2,5 → 5/2=2.5, push 2.5
-       [11.5]              Pop 2.5,14 → 14-2.5=11.5, push 11.5

Result: 11.5
```

#### Verification
```
2 + 3 * 4 - 5 / 2
= 2 + 12 - 2.5      [* and / first]
= 14 - 2.5
= 11.5 ✓
```

---

## Example 6: Right-Associative Exponentiation

### Expression: `2 ^ 3 ^ 2`

#### Important: Exponentiation is Right-Associative
```
2 ^ 3 ^ 2  means  2 ^ (3 ^ 2)  NOT  (2 ^ 3) ^ 2

This is because:
2 ^ (3 ^ 2) = 2 ^ 9 = 512
(2 ^ 3) ^ 2 = 8 ^ 2 = 64

Mathematically, we use the first interpretation.
```

#### Step 1: Tokenization
```
Tokens:
[0] NUMBER: 2
[1] OPERATOR: ^
[2] NUMBER: 3
[3] OPERATOR: ^
[4] NUMBER: 2
```

#### Step 2: Infix to Postfix
```
Token   Stack       Output          Notes
-----   -----       ------          -----
2       -           2
^       ^           2               Push first ^
3       ^           2 3
^       ^ ^         2 3             Right-assoc: don't pop equal precedence
2       ^ ^         2 3 2
END     -           2 3 2 ^ ^       Pop all (right-to-left order)

Postfix: 2 3 2 ^ ^
```

#### Step 3: Evaluation
```
Token   Stack           Action
-----   -----           ------
2       [2]             Push 2
3       [2, 3]          Push 3
2       [2, 3, 2]       Push 2
^       [2, 9]          Pop 2,3 → 3^2=9, push 9
^       [512]           Pop 9,2 → 2^9=512, push 512

Result: 512
```

#### Verification
```
2 ^ 3 ^ 2
= 2 ^ (3 ^ 2)    [Right-associative]
= 2 ^ 9
= 512 ✓
```

---

## Example 7: Division by Zero (Error Case)

### Expression: `5 / 0`

#### Step 1: Tokenization
```
Tokens:
[0] NUMBER: 5
[1] OPERATOR: /
[2] NUMBER: 0
```

#### Step 2: Infix to Postfix
```
Postfix: 5 0 /
```

#### Step 3: Evaluation (Error)
```
Token   Stack           Action
-----   -----           ------
5       [5]             Push 5
0       [5, 0]          Push 0
/       ERROR           Pop 0,5 → 5/0 → ERROR: Division by zero

Result: ERROR
```

---

## Example 8: Mismatched Parentheses (Error Case)

### Expression: `(2 + 3`

#### Step 1: Tokenization
```
Tokens:
[0] LEFT_PAREN
[1] NUMBER: 2
[2] OPERATOR: +
[3] NUMBER: 3
```

#### Step 2: Infix to Postfix (Error)
```
Token   Stack       Output
-----   -----       ------
(       (           -
2       (           2
+       ( +         2
3       ( +         2 3
END     ERROR       -

Error: Mismatched parentheses (unclosed '(')
```

---

## Example 9: Complex Real-World Expression

### Expression: `((10 + 5) * 2 - 3) / 9`

#### Tokenization
```
Tokens: ( ( 10 + 5 ) * 2 - 3 ) / 9
```

#### Infix to Postfix
```
Token   Stack           Output
-----   -----           ------
(       (               -
(       ( (             -
10      ( (             10
+       ( ( +           10
5       ( ( +           10 5
)       (               10 5 +
*       ( *             10 5 +
2       ( *             10 5 + 2
-       ( -             10 5 + 2 * -
3       ( -             10 5 + 2 * 3
)       -               10 5 + 2 * 3 -
/       /               10 5 + 2 * 3 -
9       /               10 5 + 2 * 3 - 9
END     -               10 5 + 2 * 3 - 9 /

Postfix: 10 5 + 2 * 3 - 9 /
```

#### Evaluation
```
Token   Stack               Action
-----   -----               ------
10      [10]                Push 10
5       [10, 5]             Push 5
+       [15]                Pop 5,10 → 10+5=15
2       [15, 2]             Push 2
*       [30]                Pop 2,15 → 15*2=30
3       [30, 3]             Push 3
-       [27]                Pop 3,30 → 30-3=27
9       [27, 9]             Push 9
/       [3]                 Pop 9,27 → 27/9=3

Result: 3
```

#### Verification
```
((10 + 5) * 2 - 3) / 9
= (15 * 2 - 3) / 9
= (30 - 3) / 9
= 27 / 9
= 3 ✓
```

---

## Summary

These examples demonstrate:

1. **Precedence Handling**: Higher precedence operators (* /) execute before lower ones (+ -)
2. **Parentheses**: Override precedence and create evaluation boundaries
3. **Associativity**: Right-associative (^) vs left-associative (others)
4. **Negative Numbers**: Handled during tokenization
5. **Error Detection**: Division by zero, syntax errors, mismatched parentheses
6. **Complex Expressions**: Multiple operators and nested parentheses

The three-stage pipeline (tokenize → convert → evaluate) handles all these cases systematically and efficiently.
