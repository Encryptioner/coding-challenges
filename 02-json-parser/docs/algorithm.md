# JSON Parsing Algorithm

A comprehensive guide to understanding how JSON parsing works, from lexical analysis to syntax validation.

## Table of Contents

1. [Introduction](#introduction)
2. [What is Parsing?](#what-is-parsing)
3. [The Two Stages](#the-two-stages)
4. [Lexical Analysis (Lexing)](#lexical-analysis-lexing)
5. [Syntactic Analysis (Parsing)](#syntactic-analysis-parsing)
6. [JSON Grammar](#json-grammar)
7. [Recursive Descent Parsing](#recursive-descent-parsing)
8. [Error Handling](#error-handling)
9. [Complexity Analysis](#complexity-analysis)

## Introduction

JSON parsing is a perfect introduction to compiler design because:
- It has a simple, well-defined grammar
- It requires both lexing and parsing
- It demonstrates recursive descent parsing
- Error messages provide learning opportunities

By the end of this guide, you'll understand how to convert raw text into structured data.

## What is Parsing?

**Parsing** is the process of analyzing a sequence of tokens to determine its grammatical structure with respect to a given formal grammar.

### The Big Picture

```
Raw Text → Lexer → Tokens → Parser → Validation ✓/✗
```

**Example:**
```
Input:  {"name": "Alice", "age": 30}

Lexer:  LBRACE STRING("name") COLON STRING("Alice") COMMA
        STRING("age") COLON NUMBER(30) RBRACE

Parser: ✓ Valid JSON object with 2 properties
```

## The Two Stages

Parsing is typically divided into two stages:

### Stage 1: Lexical Analysis
- **Input**: Raw character stream
- **Output**: Token stream
- **Goal**: Group characters into meaningful units
- **Also called**: Tokenization, Scanning

### Stage 2: Syntactic Analysis
- **Input**: Token stream
- **Output**: Validation result (or syntax tree)
- **Goal**: Verify tokens follow grammar rules
- **Also called**: Parsing, Syntax Analysis

### Why Two Stages?

**Separation of Concerns:**
- Lexer handles low-level character processing
- Parser handles high-level structure validation
- Each stage can be optimized independently

**Example:**

```c
// Lexer's job: Is this a valid number?
"123.45" → TOKEN_NUMBER

// Parser's job: Is a number allowed here?
{"key": 123.45}  ✓ Valid (number allowed as value)
{123.45: "key"}  ✗ Invalid (number not allowed as key)
```

## Lexical Analysis (Lexing)

The lexer converts a stream of characters into a stream of tokens.

### What is a Token?

A token is the smallest meaningful unit in the language.

**JSON Token Types:**

| Type | Example | Description |
|------|---------|-------------|
| LBRACE | `{` | Left curly brace |
| RBRACE | `}` | Right curly brace |
| LBRACKET | `[` | Left square bracket |
| RBRACKET | `]` | Right square bracket |
| COLON | `:` | Colon separator |
| COMMA | `,` | Comma separator |
| STRING | `"hello"` | String literal |
| NUMBER | `123`, `45.67`, `-89` | Numeric literal |
| TRUE | `true` | Boolean true |
| FALSE | `false` | Boolean false |
| NULL | `null` | Null value |

### Lexer State Machine

The lexer maintains state as it scans:

```c
typedef struct {
    const char *input;  // The input string
    int pos;           // Current position
    int line;          // Current line number
    int column;        // Current column number
    char current_char; // Current character
} lexer_t;
```

### Scanning Process

#### 1. Skip Whitespace

JSON allows whitespace between tokens:

```c
void skip_whitespace() {
    while (current_char == ' ' ||
           current_char == '\t' ||
           current_char == '\n' ||
           current_char == '\r') {
        advance();  // Move to next character
    }
}
```

#### 2. Recognize Single-Character Tokens

```c
switch (current_char) {
    case '{': return make_token(TOKEN_LBRACE);
    case '}': return make_token(TOKEN_RBRACE);
    case '[': return make_token(TOKEN_LBRACKET);
    case ']': return make_token(TOKEN_RBRACKET);
    case ':': return make_token(TOKEN_COLON);
    case ',': return make_token(TOKEN_COMMA);
}
```

#### 3. Scan Strings

Strings are complex because they:
- Start and end with `"`
- Can contain escape sequences (`\"`, `\\`, `\n`, etc.)
- Cannot span multiple lines (in standard JSON)

```c
token_t scan_string() {
    advance();  // Skip opening "

    while (current_char != '"' && current_char != '\0') {
        if (current_char == '\\') {
            advance();  // Skip escape character
            advance();  // Skip escaped character
        } else {
            advance();
        }
    }

    if (current_char == '\0') {
        return error_token("Unterminated string");
    }

    advance();  // Skip closing "
    return make_token(TOKEN_STRING);
}
```

#### 4. Scan Numbers

JSON numbers support:
- Integers: `123`, `-45`
- Decimals: `3.14`, `-0.001`
- Scientific notation: `1.5e10`, `2E-5`

```c
token_t scan_number() {
    // Optional minus
    if (current_char == '-') advance();

    // Integer part
    if (current_char == '0') {
        advance();
    } else if (isdigit(current_char)) {
        while (isdigit(current_char)) advance();
    }

    // Decimal part
    if (current_char == '.') {
        advance();
        while (isdigit(current_char)) advance();
    }

    // Exponent part
    if (current_char == 'e' || current_char == 'E') {
        advance();
        if (current_char == '+' || current_char == '-') advance();
        while (isdigit(current_char)) advance();
    }

    return make_token(TOKEN_NUMBER);
}
```

#### 5. Scan Keywords

Keywords are recognized by exact match:

```c
token_t scan_keyword() {
    if (match("true"))  return make_token(TOKEN_TRUE);
    if (match("false")) return make_token(TOKEN_FALSE);
    if (match("null"))  return make_token(TOKEN_NULL);

    return error_token("Unexpected character");
}
```

### Lexer Example

**Input:**
```json
{"name": "Alice", "age": 30}
```

**Token Stream:**
```
1. TOKEN_LBRACE      at line 1, col 1
2. TOKEN_STRING      at line 1, col 2   value="name"
3. TOKEN_COLON       at line 1, col 8
4. TOKEN_STRING      at line 1, col 10  value="Alice"
5. TOKEN_COMMA       at line 1, col 17
6. TOKEN_STRING      at line 1, col 19  value="age"
7. TOKEN_COLON       at line 1, col 24
8. TOKEN_NUMBER      at line 1, col 26  value="30"
9. TOKEN_RBRACE      at line 1, col 28
10. TOKEN_EOF        at line 1, col 29
```

## Syntactic Analysis (Parsing)

The parser validates that tokens follow JSON grammar rules.

### Parser State

```c
typedef struct {
    lexer_t *lexer;
    token_t current_token;    // Current token being examined
    bool has_error;           // Error flag
    char error_message[256];  // Error description
} parser_t;
```

### Key Parser Operations

#### 1. Match

Check if current token is of expected type:

```c
bool match(token_type_t type) {
    return current_token.type == type;
}
```

#### 2. Consume

Expect a specific token, error if not found:

```c
bool consume(token_type_t type, const char *message) {
    if (current_token.type == type) {
        advance();  // Move to next token
        return true;
    }

    error(message);
    return false;
}
```

#### 3. Advance

Move to the next token:

```c
void advance() {
    current_token = lexer_next_token(lexer);
}
```

## JSON Grammar

JSON grammar defines what's syntactically valid.

### Formal Grammar (Simplified)

```
value       → object | array | string | number | boolean | null
object      → '{' (pair (',' pair)*)? '}'
pair        → string ':' value
array       → '[' (value (',' value)*)? ']'
string      → '"' characters '"'
number      → integer fraction? exponent?
boolean     → 'true' | 'false'
null        → 'null'
```

### Grammar Rules in Plain English

1. **JSON value** can be:
   - An object
   - An array
   - A string
   - A number
   - `true` or `false`
   - `null`

2. **Object** is:
   - Opening `{`
   - Zero or more key-value pairs separated by commas
   - Closing `}`
   - Keys must be strings

3. **Array** is:
   - Opening `[`
   - Zero or more values separated by commas
   - Closing `]`

### Grammar Visualization

```
           value
             |
    +--------+--------+
    |        |        |
  object   array   primitive
    |        |        |
   { }      [ ]   string/number/bool/null
    |        |
  pairs    values
```

## Recursive Descent Parsing

Each grammar rule becomes a parsing function.

### Parse Value

```c
bool parse_value() {
    switch (current_token.type) {
        case TOKEN_LBRACE:
            return parse_object();

        case TOKEN_LBRACKET:
            return parse_array();

        case TOKEN_STRING:
        case TOKEN_NUMBER:
        case TOKEN_TRUE:
        case TOKEN_FALSE:
        case TOKEN_NULL:
            advance();
            return true;

        default:
            error("Expected value");
            return false;
    }
}
```

### Parse Object

```c
bool parse_object() {
    consume(TOKEN_LBRACE, "Expected '{'");

    // Empty object?
    if (match(TOKEN_RBRACE)) {
        advance();
        return true;
    }

    // Parse first pair
    consume(TOKEN_STRING, "Expected string key");
    consume(TOKEN_COLON, "Expected ':' after key");
    parse_value();  // Recursive call!

    // Parse remaining pairs
    while (match(TOKEN_COMMA)) {
        advance();
        consume(TOKEN_STRING, "Expected string key");
        consume(TOKEN_COLON, "Expected ':' after key");
        parse_value();  // Recursive call!
    }

    consume(TOKEN_RBRACE, "Expected '}'");
    return !has_error;
}
```

### Parse Array

```c
bool parse_array() {
    consume(TOKEN_LBRACKET, "Expected '['");

    // Empty array?
    if (match(TOKEN_RBRACKET)) {
        advance();
        return true;
    }

    // Parse first value
    parse_value();  // Recursive call!

    // Parse remaining values
    while (match(TOKEN_COMMA)) {
        advance();
        parse_value();  // Recursive call!
    }

    consume(TOKEN_RBRACKET, "Expected ']'");
    return !has_error;
}
```

### Why "Recursive Descent"?

**Recursive**: Functions call themselves to handle nested structures

**Descent**: We descend through the grammar from top to bottom

**Example:**
```json
{"outer": {"inner": [1, 2, 3]}}
```

Call stack:
```
parse_object()
  ├─ parse_value()
  │   └─ parse_object()      ← Recursion!
  │       └─ parse_value()
  │           └─ parse_array()   ← More recursion!
  │               ├─ parse_value() → 1
  │               ├─ parse_value() → 2
  │               └─ parse_value() → 3
```

## Error Handling

### Error Detection

Errors occur when tokens don't match grammar expectations:

```c
void error(const char *message) {
    has_error = true;
    snprintf(error_message, sizeof(error_message),
             "Error at line %d, column %d: %s",
             current_token.line,
             current_token.column,
             message);
}
```

### Common Errors

| Error | Example | Message |
|-------|---------|---------|
| Missing closing brace | `{"key": "value"` | Expected '}' |
| Non-string key | `{123: "value"}` | Expected string key |
| Missing colon | `{"key" "value"}` | Expected ':' after key |
| Trailing comma | `{"key": "value",}` | Expected string key |
| Invalid value | `{"key": undefined}` | Expected value |

### Error Recovery

Simple parsers (like ours) use **panic mode**:
- Stop at first error
- Report error with location
- Exit with error code

Advanced parsers continue parsing to find more errors.

## Complexity Analysis

### Time Complexity

| Operation | Complexity | Explanation |
|-----------|------------|-------------|
| Lexing | O(n) | Scan each character once |
| Parsing | O(n) | Visit each token once |
| **Total** | **O(n)** | Linear in input size |

Where n = number of characters in input.

### Space Complexity

| Component | Complexity | Explanation |
|-----------|------------|-------------|
| Token storage | O(1) | Only store current token |
| Call stack | O(d) | d = maximum nesting depth |
| **Total** | **O(d)** | Depends on nesting |

For deeply nested JSON (d >> 1), space usage grows.

### Performance Characteristics

**Best case**: Flat structures
```json
{"a": 1, "b": 2, "c": 3}
```
- Time: O(n)
- Space: O(1)

**Worst case**: Deep nesting
```json
{"a": {"b": {"c": {"d": "..."}}}}
```
- Time: O(n)
- Space: O(d) where d = nesting depth

## Comparison with Other Approaches

### Approach 1: Recursive Descent (Our Approach)

✓ **Pros:**
- Easy to understand
- Easy to implement
- Easy to debug
- Natural mapping from grammar to code

✗ **Cons:**
- Can't handle left recursion
- Call stack limited by nesting depth

### Approach 2: Parser Generator (yacc/bison)

✓ **Pros:**
- Handles complex grammars
- More powerful (LALR parsing)
- Grammar is declarative

✗ **Cons:**
- Requires separate tool
- Less control over errors
- Harder to debug

### Approach 3: Combinator Parsing (Haskell/Scala style)

✓ **Pros:**
- Very composable
- Elegant functional style
- Easy to test

✗ **Cons:**
- Requires functional language
- Can be slow without optimization
- Learning curve

## Real-World Applications

JSON parsing demonstrates techniques used in:

1. **Programming Language Compilers**
   - Same lexer/parser structure
   - More complex grammar
   - Generate code instead of validating

2. **Configuration File Parsers**
   - YAML, TOML, INI files
   - Similar structure to JSON
   - Additional features (comments, etc.)

3. **Markup Languages**
   - HTML, XML
   - Tree structure like JSON
   - Different syntax

4. **Query Languages**
   - SQL, GraphQL
   - Parse queries into execution plans

5. **Domain-Specific Languages**
   - Regular expressions
   - Template languages
   - Build systems (Make, Gradle)

## Further Learning

### Next Steps

1. **Extend the parser**:
   - Add syntax tree generation
   - Implement pretty-printing
   - Add JSON Schema validation

2. **Try other parsers**:
   - XML parser
   - CSV parser
   - Markdown parser

3. **Learn about**:
   - Parser combinators
   - Parser generators (ANTLR, yacc)
   - PEG (Parsing Expression Grammars)

### Resources

- **Books:**
  - "Crafting Interpreters" by Robert Nystrom
  - "Writing An Interpreter In Go" by Thorsten Ball
  - "Dragon Book" (Compilers textbook)

- **Online:**
  - [JSON Specification](https://www.json.org/)
  - [Crafting Interpreters (free online)](https://craftinginterpreters.com/)
  - [Build a Lisp](http://buildyourownlisp.com/)

- **Tools:**
  - [AST Explorer](https://astexplorer.net/) - Visualize parsing
  - [Esprima](https://esprima.org/) - JavaScript parser
  - [jq](https://stedolan.github.io/jq/) - JSON processor

## Summary

JSON parsing demonstrates fundamental computer science concepts:

✓ **Lexical Analysis**: Breaking text into tokens
✓ **Syntactic Analysis**: Validating grammar rules
✓ **Recursive Descent**: Top-down parsing strategy
✓ **Error Handling**: Providing helpful feedback
✓ **Data Structures**: Managing state efficiently

Understanding these concepts prepares you for:
- Building compilers
- Creating DSLs
- Processing structured data
- Understanding language design

The principles you've learned apply far beyond JSON!
