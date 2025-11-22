# JSON Parser Tutorial

A hands-on, step-by-step tutorial for understanding and building a JSON parser from scratch.

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Understanding JSON](#understanding-json)
4. [Building the Lexer](#building-the-lexer)
5. [Building the Parser](#building-the-parser)
6. [Testing Your Parser](#testing-your-parser)
7. [Common Pitfalls](#common-pitfalls)
8. [Exercises](#exercises)

## Introduction

In this tutorial, you'll learn to build a complete JSON parser by:
1. Understanding what parsing means
2. Breaking down JSON syntax
3. Building a lexer (tokenizer)
4. Building a parser (validator)
5. Testing with real JSON files

By the end, you'll understand:
- How programming languages are parsed
- The difference between lexing and parsing
- How to implement recursive descent parsing
- How to provide helpful error messages

## Prerequisites

### Required Knowledge

- Basic C programming
- Understanding of structs and pointers
- Familiarity with command-line tools

### Required Tools

- C compiler (gcc or clang)
- Make
- Text editor
- Terminal

### Recommended Reading

Before starting, familiarize yourself with:
- [JSON Specification](https://www.json.org/json-en.html)
- Basic compiler concepts (optional but helpful)

## Understanding JSON

### What is JSON?

JSON (JavaScript Object Notation) is a lightweight data format. It's human-readable and machine-parseable.

### JSON Syntax Rules

**Valid JSON Types:**

1. **Object**: Key-value pairs in curly braces
   ```json
   {"name": "Alice", "age": 30}
   ```

2. **Array**: List of values in square brackets
   ```json
   [1, 2, 3, "four", true]
   ```

3. **String**: Text in double quotes
   ```json
   "hello world"
   ```

4. **Number**: Integer or decimal
   ```json
   42, 3.14, -17, 1.5e10
   ```

5. **Boolean**: `true` or `false`
   ```json
   true
   ```

6. **Null**: The value `null`
   ```json
   null
   ```

### Important Rules

✓ **Keys must be strings**:
```json
{"name": "Alice"}     ✓ Valid
{name: "Alice"}       ✗ Invalid (unquoted key)
{123: "Alice"}        ✗ Invalid (number key)
```

✓ **Use double quotes**:
```json
{"name": "Alice"}     ✓ Valid
{'name': 'Alice'}     ✗ Invalid (single quotes)
```

✓ **No trailing commas**:
```json
{"a": 1, "b": 2}      ✓ Valid
{"a": 1, "b": 2,}     ✗ Invalid (trailing comma)
```

✓ **Top level must be object or array**:
```json
{}                    ✓ Valid
[]                    ✓ Valid
"just a string"       ✗ Invalid (in strict JSON)
42                    ✗ Invalid (in strict JSON)
```

### Manual Parsing Exercise

Before coding, let's manually parse this JSON:

```json
{"user": {"name": "Bob", "active": true}}
```

**Step 1**: Identify tokens
```
{              → LBRACE
"user"         → STRING("user")
:              → COLON
{              → LBRACE
"name"         → STRING("name")
:              → COLON
"Bob"          → STRING("Bob")
,              → COMMA
"active"       → STRING("active")
:              → COLON
true           → TRUE
}              → RBRACE
}              → RBRACE
```

**Step 2**: Verify grammar
```
- Top level: object ✓
- Object has pair "user": {...} ✓
- Key is string ✓
- Value is object ✓
- Nested object has two pairs ✓
- All keys are strings ✓
- Values are string and boolean ✓
```

**Result**: Valid JSON ✓

## Building the Lexer

The lexer (tokenizer) converts text into tokens.

### Step 1: Define Token Types

Create an enum for all possible tokens:

```c
typedef enum {
    TOKEN_LBRACE,      // {
    TOKEN_RBRACE,      // }
    TOKEN_LBRACKET,    // [
    TOKEN_RBRACKET,    // ]
    TOKEN_COLON,       // :
    TOKEN_COMMA,       // ,
    TOKEN_STRING,      // "..."
    TOKEN_NUMBER,      // 123
    TOKEN_TRUE,        // true
    TOKEN_FALSE,       // false
    TOKEN_NULL,        // null
    TOKEN_EOF,         // End of file
    TOKEN_ERROR        // Error token
} token_type_t;
```

### Step 2: Create Token Structure

```c
typedef struct {
    token_type_t type;
    char *value;       // For strings and numbers
    int line;          // For error messages
    int column;        // For error messages
} token_t;
```

### Step 3: Create Lexer State

```c
typedef struct {
    const char *input;  // The JSON string
    int pos;           // Current position
    int line;          // Current line
    int column;        // Current column
    char current_char; // Current character
} lexer_t;
```

### Step 4: Implement Basic Operations

**Advance to next character:**

```c
void advance(lexer_t *lexer) {
    if (lexer->current_char == '\n') {
        lexer->line++;
        lexer->column = 0;
    }

    lexer->pos++;
    if (lexer->pos < strlen(lexer->input)) {
        lexer->current_char = lexer->input[lexer->pos];
        lexer->column++;
    } else {
        lexer->current_char = '\0';  // End of input
    }
}
```

**Skip whitespace:**

```c
void skip_whitespace(lexer_t *lexer) {
    while (lexer->current_char == ' '  ||
           lexer->current_char == '\t' ||
           lexer->current_char == '\n' ||
           lexer->current_char == '\r') {
        advance(lexer);
    }
}
```

### Step 5: Scan Single Characters

```c
token_t next_token(lexer_t *lexer) {
    skip_whitespace(lexer);

    token_t token;
    token.line = lexer->line;
    token.column = lexer->column;

    switch (lexer->current_char) {
        case '{':
            token.type = TOKEN_LBRACE;
            advance(lexer);
            break;

        case '}':
            token.type = TOKEN_RBRACE;
            advance(lexer);
            break;

        // ... similar for other single chars

        case '\0':
            token.type = TOKEN_EOF;
            break;

        default:
            // Handle strings, numbers, keywords
            // (explained below)
    }

    return token;
}
```

### Step 6: Scan Strings

```c
token_t scan_string(lexer_t *lexer) {
    advance(lexer);  // Skip opening "

    int start = lexer->pos;

    while (lexer->current_char != '"' &&
           lexer->current_char != '\0') {

        if (lexer->current_char == '\\') {
            advance(lexer);  // Skip backslash
            advance(lexer);  // Skip escaped char
        } else {
            advance(lexer);
        }
    }

    if (lexer->current_char == '\0') {
        // Error: unterminated string
        return make_error_token("Unterminated string");
    }

    // Extract string value
    int length = lexer->pos - start;
    char *value = strndup(&lexer->input[start], length);

    advance(lexer);  // Skip closing "

    token_t token;
    token.type = TOKEN_STRING;
    token.value = value;
    return token;
}
```

### Step 7: Scan Numbers

```c
token_t scan_number(lexer_t *lexer) {
    int start = lexer->pos;

    // Optional minus
    if (lexer->current_char == '-') {
        advance(lexer);
    }

    // Integer part
    if (lexer->current_char == '0') {
        advance(lexer);
    } else if (isdigit(lexer->current_char)) {
        while (isdigit(lexer->current_char)) {
            advance(lexer);
        }
    }

    // Decimal part
    if (lexer->current_char == '.') {
        advance(lexer);
        while (isdigit(lexer->current_char)) {
            advance(lexer);
        }
    }

    // Exponent part (e or E)
    if (lexer->current_char == 'e' ||
        lexer->current_char == 'E') {
        advance(lexer);

        if (lexer->current_char == '+' ||
            lexer->current_char == '-') {
            advance(lexer);
        }

        while (isdigit(lexer->current_char)) {
            advance(lexer);
        }
    }

    // Extract number value
    int length = lexer->pos - start;
    char *value = strndup(&lexer->input[start], length);

    token_t token;
    token.type = TOKEN_NUMBER;
    token.value = value;
    return token;
}
```

### Step 8: Scan Keywords

```c
token_t scan_keyword(lexer_t *lexer) {
    int start = lexer->pos;

    while (isalpha(lexer->current_char)) {
        advance(lexer);
    }

    int length = lexer->pos - start;
    char *word = strndup(&lexer->input[start], length);

    token_t token;

    if (strcmp(word, "true") == 0) {
        token.type = TOKEN_TRUE;
    } else if (strcmp(word, "false") == 0) {
        token.type = TOKEN_FALSE;
    } else if (strcmp(word, "null") == 0) {
        token.type = TOKEN_NULL;
    } else {
        free(word);
        return make_error_token("Unknown keyword");
    }

    free(word);
    return token;
}
```

### Lexer Complete!

Now you can tokenize JSON:

```c
lexer_t *lexer = lexer_create("{\"name\": \"Alice\"}");

token_t token;
do {
    token = next_token(lexer);
    printf("Token: %s\n", token_type_name(token.type));
} while (token.type != TOKEN_EOF);
```

Output:
```
Token: LBRACE
Token: STRING
Token: COLON
Token: STRING
Token: RBRACE
Token: EOF
```

## Building the Parser

The parser validates that tokens follow JSON grammar.

### Step 1: Create Parser State

```c
typedef struct {
    lexer_t *lexer;
    token_t current_token;
    bool has_error;
    char error_message[256];
} parser_t;
```

### Step 2: Implement Helper Functions

**Check current token type:**

```c
bool match(parser_t *parser, token_type_t type) {
    return parser->current_token.type == type;
}
```

**Move to next token:**

```c
void advance(parser_t *parser) {
    parser->current_token = next_token(parser->lexer);
}
```

**Expect specific token:**

```c
bool consume(parser_t *parser, token_type_t type, const char *message) {
    if (parser->current_token.type == type) {
        advance(parser);
        return true;
    }

    // Error!
    snprintf(parser->error_message,
             sizeof(parser->error_message),
             "Error at line %d, column %d: %s",
             parser->current_token.line,
             parser->current_token.column,
             message);
    parser->has_error = true;
    return false;
}
```

### Step 3: Parse Values

A value can be any valid JSON type:

```c
bool parse_value(parser_t *parser) {
    switch (parser->current_token.type) {
        case TOKEN_LBRACE:
            return parse_object(parser);

        case TOKEN_LBRACKET:
            return parse_array(parser);

        case TOKEN_STRING:
        case TOKEN_NUMBER:
        case TOKEN_TRUE:
        case TOKEN_FALSE:
        case TOKEN_NULL:
            advance(parser);
            return true;

        default:
            consume(parser, TOKEN_ERROR, "Expected value");
            return false;
    }
}
```

### Step 4: Parse Objects

```c
bool parse_object(parser_t *parser) {
    // Consume opening brace
    consume(parser, TOKEN_LBRACE, "Expected '{'");

    // Empty object?
    if (match(parser, TOKEN_RBRACE)) {
        advance(parser);
        return true;
    }

    // Parse first pair
    consume(parser, TOKEN_STRING, "Expected string key");
    consume(parser, TOKEN_COLON, "Expected ':' after key");
    parse_value(parser);  // Value can be anything

    // Parse remaining pairs
    while (match(parser, TOKEN_COMMA)) {
        advance(parser);  // Skip comma

        consume(parser, TOKEN_STRING, "Expected string key");
        consume(parser, TOKEN_COLON, "Expected ':' after key");
        parse_value(parser);
    }

    // Consume closing brace
    consume(parser, TOKEN_RBRACE, "Expected '}'");

    return !parser->has_error;
}
```

### Step 5: Parse Arrays

```c
bool parse_array(parser_t *parser) {
    // Consume opening bracket
    consume(parser, TOKEN_LBRACKET, "Expected '['");

    // Empty array?
    if (match(parser, TOKEN_RBRACKET)) {
        advance(parser);
        return true;
    }

    // Parse first value
    parse_value(parser);

    // Parse remaining values
    while (match(parser, TOKEN_COMMA)) {
        advance(parser);  // Skip comma
        parse_value(parser);
    }

    // Consume closing bracket
    consume(parser, TOKEN_RBRACKET, "Expected ']'");

    return !parser->has_error;
}
```

### Step 6: Entry Point

```c
bool parse(parser_t *parser) {
    // Get first token
    advance(parser);

    // Parse the value
    bool valid = parse_value(parser);

    // Should be at end
    if (!match(parser, TOKEN_EOF)) {
        consume(parser, TOKEN_EOF, "Expected end of input");
        return false;
    }

    return valid && !parser->has_error;
}
```

### Parser Complete!

Now you can validate JSON:

```c
const char *json = "{\"name\": \"Alice\"}";

lexer_t *lexer = lexer_create(json);
parser_t *parser = parser_create(lexer);

if (parse(parser)) {
    printf("Valid JSON\n");
} else {
    printf("Invalid JSON\n");
    printf("%s\n", parser->error_message);
}
```

## Testing Your Parser

### Test 1: Empty Object

```json
{}
```

Expected: ✓ Valid

**What happens:**
1. Lexer: `LBRACE`, `RBRACE`, `EOF`
2. Parser: Enters `parse_object()`, sees `RBRACE`, accepts empty object

### Test 2: Simple Object

```json
{"key": "value"}
```

Expected: ✓ Valid

**What happens:**
1. Lexer: `LBRACE`, `STRING("key")`, `COLON`, `STRING("value")`, `RBRACE`, `EOF`
2. Parser: Parses object with one key-value pair

### Test 3: Invalid - Missing Colon

```json
{"key" "value"}
```

Expected: ✗ Invalid

**What happens:**
1. Lexer: `LBRACE`, `STRING("key")`, `STRING("value")`, ...
2. Parser: After key, expects `COLON`, finds `STRING`
3. Error: "Expected ':' after key"

### Test 4: Nested Structure

```json
{"outer": {"inner": [1, 2, 3]}}
```

Expected: ✓ Valid

**What happens:**
1. Parser enters `parse_object()` for outer
2. Sees value is object, recursively calls `parse_object()` for inner
3. Inner object has array value, calls `parse_array()`
4. Array contains numbers, parsed successfully
5. Unwinds back through recursion

### Running the Test Suite

```bash
# Build
make

# Run tests
./test.sh

# Or test manually
./ccjsonparser tests/step1/valid.json
./ccjsonparser tests/step1/invalid.json
```

## Common Pitfalls

### 1. Forgetting to Advance

```c
// Wrong!
if (match(TOKEN_COMMA)) {
    // Oops: didn't advance, infinite loop!
    parse_value();
}

// Correct
if (match(TOKEN_COMMA)) {
    advance();  // Move past comma
    parse_value();
}
```

### 2. Not Checking EOF

```c
// Wrong!
while (current_char != '"') {
    advance();
}
// What if string never closes? Reads past end!

// Correct
while (current_char != '"' && current_char != '\0') {
    advance();
}
if (current_char == '\0') {
    error("Unterminated string");
}
```

### 3. Memory Leaks

```c
// Remember to free tokens with values!
if (token.value != NULL) {
    free(token.value);
}
```

### 4. Off-by-One in Positions

```c
// Line and column numbers should be human-readable
// Start from 1, not 0
lexer->line = 1;    // Not 0
lexer->column = 1;  // Not 0
```

### 5. Forgetting Escape Sequences

```c
// String: "Line 1\nLine 2"
// Must handle \n as escape, not newline

if (current_char == '\\') {
    advance();  // Skip backslash
    advance();  // Skip escaped character
}
```

## Exercises

### Beginner

1. **Trace by hand**: Draw the token stream for `{"a": [1, 2]}`

2. **Add debug output**: Print each token as it's lexed

3. **Test error messages**: Try various invalid JSON, verify error messages

4. **Count elements**: Modify parser to count objects, arrays, strings, etc.

### Intermediate

5. **Pretty printer**: Instead of just validating, output formatted JSON

6. **JSON minifier**: Remove all whitespace

7. **Add line numbers**: Show line numbers in pretty printed output

8. **Syntax tree**: Build a tree structure instead of just validating

### Advanced

9. **Streaming parser**: Parse JSON without loading entire file into memory

10. **JSON Schema**: Add validation against a schema

11. **JSONPath**: Implement query language like `$.user.name`

12. **Performance**: Optimize for large files (1GB+)

## Next Steps

Now that you understand JSON parsing:

1. **Read the code**: Study `main.c` to see the complete implementation

2. **Extend it**: Add features like comments, trailing commas

3. **Other parsers**: Try parsing CSV, XML, or YAML

4. **Build a compiler**: Use these techniques for a programming language

5. **Study parser theory**: Learn about LL, LR, LALR parsers

## Resources

### Documentation
- Read [algorithm.md](algorithm.md) for deeper theory
- Check [examples.md](examples.md) for more use cases

### Books
- "Crafting Interpreters" - Best intro to language implementation
- "Writing An Interpreter In Go" - Practical guide
- "Dragon Book" - Comprehensive textbook

### Online Courses
- [Build Your Own Text Editor](https://viewsourcecode.org/snaptoken/kilo/)
- [Let's Build a Compiler](https://compilers.iecc.com/crenshaw/)
- [Compilers on Coursera](https://www.coursera.org/learn/compilers)

### Tools
- [AST Explorer](https://astexplorer.net/) - Visualize parsing
- [jq](https://stedolan.github.io/jq/) - JSON query tool
- [JSON Formatter](https://jsonformatter.org/) - Validate JSON

## Summary

You've learned:

✓ **Lexical analysis**: Converting text to tokens
✓ **Syntactic analysis**: Validating grammar rules
✓ **Recursive descent**: Parsing nested structures
✓ **Error handling**: Providing helpful messages
✓ **Testing**: Verifying correctness

These skills apply to:
- Building compilers
- Creating DSLs
- Processing data formats
- Understanding how languages work

Congratulations on completing the JSON parser tutorial!
