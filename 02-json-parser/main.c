/*
 * ccjsonparser - A JSON Parser
 *
 * This implementation follows proper compiler design principles with
 * separate lexical analysis (tokenization) and syntactic analysis (parsing).
 *
 * Challenge: https://codingchallenges.fyi/challenges/challenge-json-parser
 *
 * Features:
 * - Lexer (tokenizer) for JSON
 * - Recursive descent parser
 * - Support for all JSON types: objects, arrays, strings, numbers, booleans, null
 * - Proper error reporting with line and column numbers
 * - Memory-safe with proper cleanup
 *
 * Author: Coding Challenges
 * License: MIT
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <ctype.h>
#include <errno.h>

/* Version information */
#define VERSION "1.0.0"
#define PROGRAM_NAME "ccjsonparser"

/* Token types */
typedef enum {
    TOKEN_EOF = 0,
    TOKEN_ERROR,
    TOKEN_LBRACE,       // {
    TOKEN_RBRACE,       // }
    TOKEN_LBRACKET,     // [
    TOKEN_RBRACKET,     // ]
    TOKEN_COLON,        // :
    TOKEN_COMMA,        // ,
    TOKEN_STRING,       // "string"
    TOKEN_NUMBER,       // 123, 45.67, -89, 1.2e+3
    TOKEN_TRUE,         // true
    TOKEN_FALSE,        // false
    TOKEN_NULL          // null
} token_type_t;

/* Token structure */
typedef struct {
    token_type_t type;
    char *value;        // For strings and numbers
    int line;
    int column;
} token_t;

/* Lexer state */
typedef struct {
    const char *input;
    int pos;
    int line;
    int column;
    char current_char;
} lexer_t;

/* Parser state */
typedef struct {
    lexer_t *lexer;
    token_t current_token;
    bool has_error;
    char error_message[256];
} parser_t;

/* Function prototypes */
void print_usage(void);
void print_version(void);

/* Lexer functions */
lexer_t* lexer_create(const char *input);
void lexer_destroy(lexer_t *lexer);
void lexer_advance(lexer_t *lexer);
char lexer_peek(lexer_t *lexer, int offset);
void lexer_skip_whitespace(lexer_t *lexer);
token_t lexer_scan_string(lexer_t *lexer);
token_t lexer_scan_number(lexer_t *lexer);
token_t lexer_scan_keyword(lexer_t *lexer);
token_t lexer_next_token(lexer_t *lexer);

/* Parser functions */
parser_t* parser_create(lexer_t *lexer);
void parser_destroy(parser_t *parser);
void parser_advance(parser_t *parser);
bool parser_match(parser_t *parser, token_type_t type);
bool parser_consume(parser_t *parser, token_type_t type, const char *message);
void parser_error(parser_t *parser, const char *message);
bool parser_parse_value(parser_t *parser);
bool parser_parse_object(parser_t *parser);
bool parser_parse_array(parser_t *parser);
bool parser_parse(parser_t *parser);

/* Token functions */
void token_free(token_t *token);

/*
 * Print usage information
 */
void print_usage(void) {
    printf("Usage: %s [FILE]\n", PROGRAM_NAME);
    printf("Validate JSON files.\n\n");
    printf("If FILE is not specified or is -, read from standard input.\n\n");
    printf("Options:\n");
    printf("  -h, --help     display this help and exit\n");
    printf("  -v, --version  output version information and exit\n\n");
    printf("Exit status:\n");
    printf("  0  if JSON is valid\n");
    printf("  1  if JSON is invalid or an error occurred\n\n");
    printf("Examples:\n");
    printf("  %s file.json           Validate file.json\n", PROGRAM_NAME);
    printf("  cat file.json | %s    Validate JSON from stdin\n", PROGRAM_NAME);
    printf("  %s < file.json         Validate JSON from stdin\n", PROGRAM_NAME);
}

/*
 * Print version information
 */
void print_version(void) {
    printf("%s version %s\n", PROGRAM_NAME, VERSION);
    printf("A JSON Parser implementation\n");
    printf("Challenge: https://codingchallenges.fyi/challenges/challenge-json-parser\n");
}

/*
 * Create a new lexer
 */
lexer_t* lexer_create(const char *input) {
    lexer_t *lexer = (lexer_t*)malloc(sizeof(lexer_t));
    if (!lexer) {
        fprintf(stderr, "Error: Failed to allocate memory for lexer\n");
        return NULL;
    }

    lexer->input = input;
    lexer->pos = 0;
    lexer->line = 1;
    lexer->column = 1;
    lexer->current_char = input[0];

    return lexer;
}

/*
 * Destroy lexer and free memory
 */
void lexer_destroy(lexer_t *lexer) {
    if (lexer) {
        free(lexer);
    }
}

/*
 * Advance to next character
 */
void lexer_advance(lexer_t *lexer) {
    if (lexer->current_char == '\0') {
        return;
    }

    if (lexer->current_char == '\n') {
        lexer->line++;
        lexer->column = 1;
    } else {
        lexer->column++;
    }

    lexer->pos++;
    lexer->current_char = lexer->input[lexer->pos];
}

/*
 * Peek ahead without consuming
 */
char lexer_peek(lexer_t *lexer, int offset) {
    int pos = lexer->pos + offset;
    if (pos >= 0 && lexer->input[pos] != '\0') {
        return lexer->input[pos];
    }
    return '\0';
}

/*
 * Skip whitespace characters
 */
void lexer_skip_whitespace(lexer_t *lexer) {
    while (isspace(lexer->current_char)) {
        lexer_advance(lexer);
    }
}

/*
 * Scan a string token
 */
token_t lexer_scan_string(lexer_t *lexer) {
    token_t token;
    token.type = TOKEN_STRING;
    token.line = lexer->line;
    token.column = lexer->column;

    int start = lexer->pos;
    lexer_advance(lexer); // Skip opening quote

    while (lexer->current_char != '"' && lexer->current_char != '\0') {
        if (lexer->current_char == '\\') {
            lexer_advance(lexer); // Skip escape character
            if (lexer->current_char == '\0') {
                break;
            }
        }
        lexer_advance(lexer);
    }

    if (lexer->current_char == '\0') {
        token.type = TOKEN_ERROR;
        token.value = strdup("Unterminated string");
        return token;
    }

    lexer_advance(lexer); // Skip closing quote

    int length = lexer->pos - start;
    token.value = (char*)malloc(length + 1);
    strncpy(token.value, &lexer->input[start], length);
    token.value[length] = '\0';

    return token;
}

/*
 * Scan a number token
 */
token_t lexer_scan_number(lexer_t *lexer) {
    token_t token;
    token.type = TOKEN_NUMBER;
    token.line = lexer->line;
    token.column = lexer->column;

    int start = lexer->pos;

    // Optional minus
    if (lexer->current_char == '-') {
        lexer_advance(lexer);
    }

    // Integer part
    if (lexer->current_char == '0') {
        lexer_advance(lexer);
    } else if (isdigit(lexer->current_char)) {
        while (isdigit(lexer->current_char)) {
            lexer_advance(lexer);
        }
    }

    // Fractional part
    if (lexer->current_char == '.') {
        lexer_advance(lexer);
        while (isdigit(lexer->current_char)) {
            lexer_advance(lexer);
        }
    }

    // Exponent part
    if (lexer->current_char == 'e' || lexer->current_char == 'E') {
        lexer_advance(lexer);
        if (lexer->current_char == '+' || lexer->current_char == '-') {
            lexer_advance(lexer);
        }
        while (isdigit(lexer->current_char)) {
            lexer_advance(lexer);
        }
    }

    int length = lexer->pos - start;
    token.value = (char*)malloc(length + 1);
    strncpy(token.value, &lexer->input[start], length);
    token.value[length] = '\0';

    return token;
}

/*
 * Scan a keyword (true, false, null)
 */
token_t lexer_scan_keyword(lexer_t *lexer) {
    token_t token;
    token.line = lexer->line;
    token.column = lexer->column;
    token.value = NULL;

    int start = lexer->pos;

    while (isalpha(lexer->current_char)) {
        lexer_advance(lexer);
    }

    int length = lexer->pos - start;
    char *word = (char*)malloc(length + 1);
    strncpy(word, &lexer->input[start], length);
    word[length] = '\0';

    if (strcmp(word, "true") == 0) {
        token.type = TOKEN_TRUE;
    } else if (strcmp(word, "false") == 0) {
        token.type = TOKEN_FALSE;
    } else if (strcmp(word, "null") == 0) {
        token.type = TOKEN_NULL;
    } else {
        token.type = TOKEN_ERROR;
        token.value = (char*)malloc(strlen(word) + 30);
        sprintf(token.value, "Unknown keyword: %s", word);
    }

    free(word);
    return token;
}

/*
 * Get next token from input
 */
token_t lexer_next_token(lexer_t *lexer) {
    token_t token;
    token.value = NULL;

    lexer_skip_whitespace(lexer);

    token.line = lexer->line;
    token.column = lexer->column;

    if (lexer->current_char == '\0') {
        token.type = TOKEN_EOF;
        return token;
    }

    // Single character tokens
    switch (lexer->current_char) {
        case '{':
            token.type = TOKEN_LBRACE;
            lexer_advance(lexer);
            return token;
        case '}':
            token.type = TOKEN_RBRACE;
            lexer_advance(lexer);
            return token;
        case '[':
            token.type = TOKEN_LBRACKET;
            lexer_advance(lexer);
            return token;
        case ']':
            token.type = TOKEN_RBRACKET;
            lexer_advance(lexer);
            return token;
        case ':':
            token.type = TOKEN_COLON;
            lexer_advance(lexer);
            return token;
        case ',':
            token.type = TOKEN_COMMA;
            lexer_advance(lexer);
            return token;
        case '"':
            return lexer_scan_string(lexer);
        case '-':
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            return lexer_scan_number(lexer);
        default:
            if (isalpha(lexer->current_char)) {
                return lexer_scan_keyword(lexer);
            }
            token.type = TOKEN_ERROR;
            token.value = (char*)malloc(50);
            sprintf(token.value, "Unexpected character: '%c'", lexer->current_char);
            lexer_advance(lexer);
            return token;
    }
}

/*
 * Free token memory
 */
void token_free(token_t *token) {
    if (token && token->value) {
        free(token->value);
        token->value = NULL;
    }
}

/*
 * Create a new parser
 */
parser_t* parser_create(lexer_t *lexer) {
    parser_t *parser = (parser_t*)malloc(sizeof(parser_t));
    if (!parser) {
        fprintf(stderr, "Error: Failed to allocate memory for parser\n");
        return NULL;
    }

    parser->lexer = lexer;
    parser->has_error = false;
    parser->error_message[0] = '\0';

    // Get first token
    parser->current_token = lexer_next_token(lexer);

    return parser;
}

/*
 * Destroy parser and free memory
 */
void parser_destroy(parser_t *parser) {
    if (parser) {
        token_free(&parser->current_token);
        free(parser);
    }
}

/*
 * Advance to next token
 */
void parser_advance(parser_t *parser) {
    token_free(&parser->current_token);
    parser->current_token = lexer_next_token(parser->lexer);
}

/*
 * Check if current token matches expected type
 */
bool parser_match(parser_t *parser, token_type_t type) {
    return parser->current_token.type == type;
}

/*
 * Consume a token of expected type
 */
bool parser_consume(parser_t *parser, token_type_t type, const char *message) {
    if (parser->current_token.type == type) {
        parser_advance(parser);
        return true;
    }

    parser_error(parser, message);
    return false;
}

/*
 * Report parser error
 */
void parser_error(parser_t *parser, const char *message) {
    parser->has_error = true;
    snprintf(parser->error_message, sizeof(parser->error_message),
             "Error at line %d, column %d: %s",
             parser->current_token.line,
             parser->current_token.column,
             message);
}

/*
 * Parse a JSON value
 */
bool parser_parse_value(parser_t *parser) {
    switch (parser->current_token.type) {
        case TOKEN_STRING:
        case TOKEN_NUMBER:
        case TOKEN_TRUE:
        case TOKEN_FALSE:
        case TOKEN_NULL:
            parser_advance(parser);
            return true;
        case TOKEN_LBRACE:
            return parser_parse_object(parser);
        case TOKEN_LBRACKET:
            return parser_parse_array(parser);
        case TOKEN_ERROR:
            parser_error(parser, parser->current_token.value);
            return false;
        default:
            parser_error(parser, "Expected value");
            return false;
    }
}

/*
 * Parse a JSON object
 */
bool parser_parse_object(parser_t *parser) {
    if (!parser_consume(parser, TOKEN_LBRACE, "Expected '{'")) {
        return false;
    }

    // Empty object
    if (parser_match(parser, TOKEN_RBRACE)) {
        parser_advance(parser);
        return true;
    }

    // Parse key-value pairs
    while (true) {
        // Expect string key
        if (!parser_consume(parser, TOKEN_STRING, "Expected string key")) {
            return false;
        }

        // Expect colon
        if (!parser_consume(parser, TOKEN_COLON, "Expected ':' after key")) {
            return false;
        }

        // Parse value
        if (!parser_parse_value(parser)) {
            return false;
        }

        // Check for more pairs or end of object
        if (parser_match(parser, TOKEN_RBRACE)) {
            parser_advance(parser);
            return true;
        }

        if (!parser_consume(parser, TOKEN_COMMA, "Expected ',' or '}'")) {
            return false;
        }
    }
}

/*
 * Parse a JSON array
 */
bool parser_parse_array(parser_t *parser) {
    if (!parser_consume(parser, TOKEN_LBRACKET, "Expected '['")) {
        return false;
    }

    // Empty array
    if (parser_match(parser, TOKEN_RBRACKET)) {
        parser_advance(parser);
        return true;
    }

    // Parse values
    while (true) {
        if (!parser_parse_value(parser)) {
            return false;
        }

        // Check for more values or end of array
        if (parser_match(parser, TOKEN_RBRACKET)) {
            parser_advance(parser);
            return true;
        }

        if (!parser_consume(parser, TOKEN_COMMA, "Expected ',' or ']'")) {
            return false;
        }
    }
}

/*
 * Parse JSON input
 */
bool parser_parse(parser_t *parser) {
    // JSON must be an object or array at the top level
    if (!parser_match(parser, TOKEN_LBRACE) && !parser_match(parser, TOKEN_LBRACKET)) {
        parser_error(parser, "JSON must start with '{' or '['");
        return false;
    }

    bool success = parser_parse_value(parser);

    if (success && !parser_match(parser, TOKEN_EOF)) {
        parser_error(parser, "Unexpected content after JSON");
        return false;
    }

    return success && !parser->has_error;
}

/*
 * Read entire file into memory
 */
char* read_file(const char *filename) {
    FILE *fp;
    char *content;
    size_t capacity = 4096;
    size_t size = 0;

    if (filename == NULL || strcmp(filename, "-") == 0) {
        fp = stdin;
    } else {
        fp = fopen(filename, "r");
        if (!fp) {
            fprintf(stderr, "%s: %s: %s\n", PROGRAM_NAME, filename, strerror(errno));
            return NULL;
        }
    }

    // Allocate initial buffer
    content = (char*)malloc(capacity);
    if (!content) {
        fprintf(stderr, "Error: Failed to allocate memory\n");
        if (fp != stdin) fclose(fp);
        return NULL;
    }

    // Read file (handle stdin which can't be seeked)
    int c;
    while ((c = fgetc(fp)) != EOF) {
        if (size >= capacity - 1) {
            capacity *= 2;
            char *new_content = (char*)realloc(content, capacity);
            if (!new_content) {
                fprintf(stderr, "Error: Failed to allocate memory\n");
                free(content);
                if (fp != stdin) fclose(fp);
                return NULL;
            }
            content = new_content;
        }
        content[size++] = c;
    }
    content[size] = '\0';

    if (fp != stdin) {
        fclose(fp);
    }

    return content;
}

/*
 * Main entry point
 */
int main(int argc, char *argv[]) {
    const char *filename = NULL;

    // Parse command-line arguments
    if (argc > 1) {
        if (strcmp(argv[1], "-h") == 0 || strcmp(argv[1], "--help") == 0) {
            print_usage();
            return 0;
        }
        if (strcmp(argv[1], "-v") == 0 || strcmp(argv[1], "--version") == 0) {
            print_version();
            return 0;
        }
        filename = argv[1];
    }

    // Read input
    char *input = read_file(filename);
    if (!input) {
        return 1;
    }

    // Create lexer and parser
    lexer_t *lexer = lexer_create(input);
    if (!lexer) {
        free(input);
        return 1;
    }

    parser_t *parser = parser_create(lexer);
    if (!parser) {
        lexer_destroy(lexer);
        free(input);
        return 1;
    }

    // Parse JSON
    bool valid = parser_parse(parser);

    // Report results
    if (valid) {
        printf("Valid JSON\n");
    } else {
        printf("Invalid JSON\n");
        if (parser->error_message[0] != '\0') {
            fprintf(stderr, "%s\n", parser->error_message);
        }
    }

    // Cleanup
    parser_destroy(parser);
    lexer_destroy(lexer);
    free(input);

    return valid ? 0 : 1;
}
