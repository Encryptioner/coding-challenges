#ifndef SED_H
#define SED_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <regex.h>
#include <stdbool.h>

#define MAX_LINE_LENGTH 4096
#define MAX_COMMANDS 100
#define MAX_PATTERN 256
#define MAX_REPLACEMENT 512

/* Command types */
typedef enum {
    CMD_NONE,
    CMD_SUBSTITUTE,     /* s/pattern/replacement/flags */
    CMD_DELETE,         /* d */
    CMD_PRINT,          /* p */
    CMD_QUIT,           /* q */
    CMD_LINE_NUMBER,    /* = */
} CommandType;

/* Address types */
typedef enum {
    ADDR_NONE,
    ADDR_LINE,          /* Line number */
    ADDR_RANGE,         /* Line range */
    ADDR_PATTERN,       /* Pattern match */
    ADDR_LAST           /* $ - last line */
} AddressType;

/* Address structure */
typedef struct {
    AddressType type;
    int line_start;
    int line_end;
    char pattern[MAX_PATTERN];
    bool negated;
} Address;

/* Command structure */
typedef struct {
    CommandType type;
    Address address;
    char pattern[MAX_PATTERN];
    char replacement[MAX_REPLACEMENT];
    bool global;         /* g flag */
    bool print;          /* p flag */
    bool ignore_case;    /* i flag */
    regex_t *regex;
} Command;

/* Sed state */
typedef struct {
    Command commands[MAX_COMMANDS];
    int num_commands;
    bool suppress_print;  /* -n flag */
    int current_line;
    bool quit_flag;
} SedState;

/* Function prototypes */
void sed_init(SedState *state);
void sed_parse_command(SedState *state, const char *cmd_str);
void sed_execute(SedState *state, FILE *input, FILE *output);
void sed_free(SedState *state);
int sed_substitute(SedState *state, Command *cmd, char *line, char *output);
bool sed_address_matches(SedState *state, const Address *addr);
void sed_compile_regex(Command *cmd);

#endif
