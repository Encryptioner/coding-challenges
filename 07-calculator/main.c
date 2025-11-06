/*
 * Calculator - A command-line calculator implementation
 *
 * This calculator parses and evaluates mathematical expressions using:
 * 1. Tokenization - Breaking input into tokens (numbers, operators, parentheses)
 * 2. Shunting Yard Algorithm - Converting infix notation to postfix (RPN)
 * 3. Stack-based Evaluation - Evaluating the postfix expression
 *
 * Supports: +, -, *, /, ^ (power), parentheses, decimal numbers, negative numbers
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <math.h>
#include <stdbool.h>

#define MAX_TOKENS 256
#define MAX_STACK 256
#define MAX_EXPR_LEN 1024

/* Token types */
typedef enum {
    TOKEN_NUMBER,
    TOKEN_OPERATOR,
    TOKEN_LEFT_PAREN,
    TOKEN_RIGHT_PAREN,
    TOKEN_END
} TokenType;

/* Token structure */
typedef struct {
    TokenType type;
    double value;      // For numbers
    char op;          // For operators
} Token;

/* Stack for operators (chars) */
typedef struct {
    char data[MAX_STACK];
    int top;
} OpStack;

/* Stack for numbers (doubles) */
typedef struct {
    double data[MAX_STACK];
    int top;
} NumStack;

/* Token array structure */
typedef struct {
    Token tokens[MAX_TOKENS];
    int count;
    int current;
} TokenArray;

/* ===== STACK OPERATIONS ===== */

void op_stack_init(OpStack *stack) {
    stack->top = -1;
}

bool op_stack_is_empty(OpStack *stack) {
    return stack->top == -1;
}

bool op_stack_push(OpStack *stack, char c) {
    if (stack->top >= MAX_STACK - 1) {
        fprintf(stderr, "Error: Operator stack overflow\n");
        return false;
    }
    stack->data[++stack->top] = c;
    return true;
}

char op_stack_pop(OpStack *stack) {
    if (op_stack_is_empty(stack)) {
        fprintf(stderr, "Error: Operator stack underflow\n");
        return '\0';
    }
    return stack->data[stack->top--];
}

char op_stack_peek(OpStack *stack) {
    if (op_stack_is_empty(stack)) {
        return '\0';
    }
    return stack->data[stack->top];
}

void num_stack_init(NumStack *stack) {
    stack->top = -1;
}

bool num_stack_is_empty(NumStack *stack) {
    return stack->top == -1;
}

bool num_stack_push(NumStack *stack, double value) {
    if (stack->top >= MAX_STACK - 1) {
        fprintf(stderr, "Error: Number stack overflow\n");
        return false;
    }
    stack->data[++stack->top] = value;
    return true;
}

double num_stack_pop(NumStack *stack) {
    if (num_stack_is_empty(stack)) {
        fprintf(stderr, "Error: Number stack underflow\n");
        return 0.0;
    }
    return stack->data[stack->top--];
}

/* ===== OPERATOR UTILITIES ===== */

int get_precedence(char op) {
    switch (op) {
        case '+':
        case '-':
            return 1;
        case '*':
        case '/':
            return 2;
        case '^':
            return 3;
        default:
            return 0;
    }
}

bool is_right_associative(char op) {
    return op == '^';
}

bool is_operator(char c) {
    return c == '+' || c == '-' || c == '*' || c == '/' || c == '^';
}

/* ===== TOKENIZATION ===== */

bool tokenize(const char *expr, TokenArray *tokens) {
    tokens->count = 0;
    tokens->current = 0;

    int i = 0;
    int len = strlen(expr);

    while (i < len) {
        // Skip whitespace
        if (isspace(expr[i])) {
            i++;
            continue;
        }

        // Check for numbers (including decimals and negative numbers)
        if (isdigit(expr[i]) || expr[i] == '.') {
            char num_str[64];
            int j = 0;

            while (i < len && (isdigit(expr[i]) || expr[i] == '.')) {
                if (j < 63) {
                    num_str[j++] = expr[i];
                }
                i++;
            }
            num_str[j] = '\0';

            tokens->tokens[tokens->count].type = TOKEN_NUMBER;
            tokens->tokens[tokens->count].value = atof(num_str);
            tokens->count++;
            continue;
        }

        // Check for operators
        if (is_operator(expr[i])) {
            // Handle negative numbers: '-' is unary if it's at the start or after another operator or '('
            if (expr[i] == '-' && (tokens->count == 0 ||
                tokens->tokens[tokens->count - 1].type == TOKEN_OPERATOR ||
                tokens->tokens[tokens->count - 1].type == TOKEN_LEFT_PAREN)) {
                // This is a negative number
                i++;
                if (i >= len || (!isdigit(expr[i]) && expr[i] != '.')) {
                    fprintf(stderr, "Error: Invalid negative number\n");
                    return false;
                }

                char num_str[64];
                int j = 0;
                num_str[j++] = '-';

                while (i < len && (isdigit(expr[i]) || expr[i] == '.')) {
                    if (j < 63) {
                        num_str[j++] = expr[i];
                    }
                    i++;
                }
                num_str[j] = '\0';

                tokens->tokens[tokens->count].type = TOKEN_NUMBER;
                tokens->tokens[tokens->count].value = atof(num_str);
                tokens->count++;
                continue;
            }

            tokens->tokens[tokens->count].type = TOKEN_OPERATOR;
            tokens->tokens[tokens->count].op = expr[i];
            tokens->count++;
            i++;
            continue;
        }

        // Check for parentheses
        if (expr[i] == '(') {
            tokens->tokens[tokens->count].type = TOKEN_LEFT_PAREN;
            tokens->count++;
            i++;
            continue;
        }

        if (expr[i] == ')') {
            tokens->tokens[tokens->count].type = TOKEN_RIGHT_PAREN;
            tokens->count++;
            i++;
            continue;
        }

        // Unknown character
        fprintf(stderr, "Error: Unknown character '%c' at position %d\n", expr[i], i);
        return false;
    }

    return true;
}

/* ===== SHUNTING YARD ALGORITHM ===== */
/* Converts infix notation to postfix notation (Reverse Polish Notation) */

bool infix_to_postfix(TokenArray *infix, TokenArray *postfix) {
    OpStack op_stack;
    op_stack_init(&op_stack);

    postfix->count = 0;
    postfix->current = 0;

    for (int i = 0; i < infix->count; i++) {
        Token token = infix->tokens[i];

        if (token.type == TOKEN_NUMBER) {
            // Numbers go directly to output
            postfix->tokens[postfix->count++] = token;
        }
        else if (token.type == TOKEN_OPERATOR) {
            // Pop operators with higher or equal precedence (considering associativity)
            while (!op_stack_is_empty(&op_stack)) {
                char top_op = op_stack_peek(&op_stack);
                if (top_op == '(') {
                    break;
                }

                int top_prec = get_precedence(top_op);
                int curr_prec = get_precedence(token.op);

                if ((is_right_associative(token.op) && curr_prec < top_prec) ||
                    (!is_right_associative(token.op) && curr_prec <= top_prec)) {
                    Token op_token;
                    op_token.type = TOKEN_OPERATOR;
                    op_token.op = op_stack_pop(&op_stack);
                    postfix->tokens[postfix->count++] = op_token;
                } else {
                    break;
                }
            }
            op_stack_push(&op_stack, token.op);
        }
        else if (token.type == TOKEN_LEFT_PAREN) {
            op_stack_push(&op_stack, '(');
        }
        else if (token.type == TOKEN_RIGHT_PAREN) {
            // Pop until we find the matching left parenthesis
            bool found_left_paren = false;
            while (!op_stack_is_empty(&op_stack)) {
                char op = op_stack_pop(&op_stack);
                if (op == '(') {
                    found_left_paren = true;
                    break;
                }
                Token op_token;
                op_token.type = TOKEN_OPERATOR;
                op_token.op = op;
                postfix->tokens[postfix->count++] = op_token;
            }

            if (!found_left_paren) {
                fprintf(stderr, "Error: Mismatched parentheses\n");
                return false;
            }
        }
    }

    // Pop remaining operators
    while (!op_stack_is_empty(&op_stack)) {
        char op = op_stack_pop(&op_stack);
        if (op == '(') {
            fprintf(stderr, "Error: Mismatched parentheses\n");
            return false;
        }
        Token op_token;
        op_token.type = TOKEN_OPERATOR;
        op_token.op = op;
        postfix->tokens[postfix->count++] = op_token;
    }

    return true;
}

/* ===== POSTFIX EVALUATION ===== */

bool evaluate_postfix(TokenArray *postfix, double *result) {
    NumStack num_stack;
    num_stack_init(&num_stack);

    for (int i = 0; i < postfix->count; i++) {
        Token token = postfix->tokens[i];

        if (token.type == TOKEN_NUMBER) {
            num_stack_push(&num_stack, token.value);
        }
        else if (token.type == TOKEN_OPERATOR) {
            if (num_stack.top < 1) {
                fprintf(stderr, "Error: Invalid expression\n");
                return false;
            }

            double b = num_stack_pop(&num_stack);
            double a = num_stack_pop(&num_stack);
            double res;

            switch (token.op) {
                case '+':
                    res = a + b;
                    break;
                case '-':
                    res = a - b;
                    break;
                case '*':
                    res = a * b;
                    break;
                case '/':
                    if (b == 0.0) {
                        fprintf(stderr, "Error: Division by zero\n");
                        return false;
                    }
                    res = a / b;
                    break;
                case '^':
                    res = pow(a, b);
                    break;
                default:
                    fprintf(stderr, "Error: Unknown operator '%c'\n", token.op);
                    return false;
            }

            num_stack_push(&num_stack, res);
        }
    }

    if (num_stack.top != 0) {
        fprintf(stderr, "Error: Invalid expression\n");
        return false;
    }

    *result = num_stack_pop(&num_stack);
    return true;
}

/* ===== MAIN CALCULATOR FUNCTION ===== */

bool calculate(const char *expr, double *result) {
    TokenArray infix_tokens, postfix_tokens;

    // Step 1: Tokenize the input
    if (!tokenize(expr, &infix_tokens)) {
        return false;
    }

    if (infix_tokens.count == 0) {
        fprintf(stderr, "Error: Empty expression\n");
        return false;
    }

    // Step 2: Convert infix to postfix using Shunting Yard algorithm
    if (!infix_to_postfix(&infix_tokens, &postfix_tokens)) {
        return false;
    }

    // Step 3: Evaluate the postfix expression
    if (!evaluate_postfix(&postfix_tokens, result)) {
        return false;
    }

    return true;
}

/* ===== USER INTERFACE ===== */

void print_usage(const char *prog_name) {
    printf("Calculator - A command-line calculator\n\n");
    printf("Usage:\n");
    printf("  %s \"expression\"          Calculate and print result\n", prog_name);
    printf("  %s -i or --interactive    Interactive mode\n", prog_name);
    printf("  %s -h or --help           Show this help message\n\n", prog_name);
    printf("Supported operators:\n");
    printf("  +   Addition\n");
    printf("  -   Subtraction (also unary minus for negative numbers)\n");
    printf("  *   Multiplication\n");
    printf("  /   Division\n");
    printf("  ^   Exponentiation (power)\n");
    printf("  ()  Parentheses for grouping\n\n");
    printf("Examples:\n");
    printf("  %s \"2 + 3 * 4\"\n", prog_name);
    printf("  %s \"(2 + 3) * 4\"\n", prog_name);
    printf("  %s \"3.14 * 2^10\"\n", prog_name);
    printf("  %s \"-5 + 10\"\n", prog_name);
    printf("  %s \"(1 * 2) - (3 * 4)\"\n\n", prog_name);
}

void interactive_mode(void) {
    char expr[MAX_EXPR_LEN];
    double result;

    printf("Calculator - Interactive Mode\n");
    printf("Enter expressions to calculate (or 'quit' to exit)\n\n");

    while (1) {
        printf("> ");
        fflush(stdout);

        if (!fgets(expr, sizeof(expr), stdin)) {
            break;
        }

        // Remove trailing newline
        expr[strcspn(expr, "\n")] = '\0';

        // Check for quit command
        if (strcmp(expr, "quit") == 0 || strcmp(expr, "exit") == 0 || strcmp(expr, "q") == 0) {
            break;
        }

        // Skip empty lines
        if (strlen(expr) == 0) {
            continue;
        }

        // Calculate and display result
        if (calculate(expr, &result)) {
            printf("= %.10g\n\n", result);
        } else {
            printf("\n");
        }
    }

    printf("Goodbye!\n");
}

/* ===== MAIN ===== */

int main(int argc, char *argv[]) {
    // No arguments - show usage
    if (argc < 2) {
        print_usage(argv[0]);
        return 0;
    }

    // Check for help flag
    if (strcmp(argv[1], "-h") == 0 || strcmp(argv[1], "--help") == 0) {
        print_usage(argv[0]);
        return 0;
    }

    // Check for interactive mode
    if (strcmp(argv[1], "-i") == 0 || strcmp(argv[1], "--interactive") == 0) {
        interactive_mode();
        return 0;
    }

    // Calculate expression from command line
    double result;
    if (calculate(argv[1], &result)) {
        printf("%.10g\n", result);
        return 0;
    } else {
        return 1;
    }
}
