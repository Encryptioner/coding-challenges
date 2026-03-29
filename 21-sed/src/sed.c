#include "../src/sed.h"

/* Initialize sed state */
void sed_init(SedState *state) {
    memset(state, 0, sizeof(SedState));
    state->suppress_print = false;
    state->current_line = 0;
    state->quit_flag = false;
}

/* Compile regex for a command */
void sed_compile_regex(Command *cmd) {
    if (cmd->pattern[0] == '\0') {
        return;
    }

    cmd->regex = malloc(sizeof(regex_t));
    if (cmd->regex == NULL) {
        perror("malloc");
        exit(1);
    }

    int flags = REG_EXTENDED;
    if (cmd->ignore_case) {
        flags |= REG_ICASE;
    }

    int result = regcomp(cmd->regex, cmd->pattern, flags);
    if (result != 0) {
        char errbuf[MAX_LINE_LENGTH];
        regerror(result, cmd->regex, errbuf, sizeof(errbuf));
        fprintf(stderr, "sed: regex error: %s\n", errbuf);
        free(cmd->regex);
        cmd->regex = NULL;
    }
}

/* Check if address matches current line */
bool sed_address_matches(SedState *state, const Address *addr) {
    if (addr->type == ADDR_NONE) {
        return !addr->negated;
    }

    bool matches = false;

    switch (addr->type) {
    case ADDR_LINE:
        matches = (state->current_line == addr->line_start);
        break;

    case ADDR_RANGE:
        matches = (state->current_line >= addr->line_start &&
                   state->current_line <= addr->line_end);
        break;

    case ADDR_PATTERN:
        if (addr->negated) {
            matches = true;  /* Pattern matching requires line content */
        }
        /* Pattern matching handled during execution */
        break;

    case ADDR_LAST:
        /* Cannot determine in stream processing */
        matches = false;
        break;

    default:
        matches = !addr->negated;
    }

    return addr->negated ? !matches : matches;
}

/* Substitute command implementation */
int sed_substitute(SedState *state, Command *cmd, char *line, char *output) {
    if (cmd->regex == NULL) {
        strcpy(output, line);
        return 0;
    }

    regmatch_t matches[10];
    int result = regexec(cmd->regex, line, 10, matches, 0);

    if (result != 0) {
        strcpy(output, line);
        return 0;
    }

    /* Perform substitution */
    int out_pos = 0;
    int last_end = 0;
    int sub_count = 0;

    while (result == 0 && (cmd->global || sub_count == 0)) {
        /* Copy text before match */
        for (int i = last_end; i < matches[0].rm_so; i++) {
            output[out_pos++] = line[i];
        }

        /* Copy replacement */
        for (int i = 0; cmd->replacement[i] != '\0'; i++) {
            if (cmd->replacement[i] == '&' && cmd->replacement[i+1] != '\\') {
                /* & = matched string */
                for (int j = matches[0].rm_so; j < matches[0].rm_eo; j++) {
                    output[out_pos++] = line[j];
                }
            } else if (cmd->replacement[i] == '\\' &&
                       cmd->replacement[i+1] >= '1' && cmd->replacement[i+1] <= '9') {
                /* Backreference \1-\9 */
                int ref = cmd->replacement[++i] - '0';
                if (ref <= 9 && matches[ref].rm_so >= 0) {
                    for (int j = matches[ref].rm_so; j < matches[ref].rm_eo; j++) {
                        output[out_pos++] = line[j];
                    }
                }
            } else {
                output[out_pos++] = cmd->replacement[i];
            }
        }

        last_end = matches[0].rm_eo;
        sub_count++;

        /* Find next match if global */
        if (cmd->global) {
            char *remaining = line + last_end;
            result = regexec(cmd->regex, remaining, 10, matches, 0);
            if (result == 0) {
                /* Adjust match offsets */
                for (int i = 0; i < 10; i++) {
                    if (matches[i].rm_so >= 0) {
                        matches[i].rm_so += last_end;
                        matches[i].rm_eo += last_end;
                    }
                }
            }
        } else {
            break;
        }
    }

    /* Copy remaining text */
    for (int i = last_end; line[i] != '\0'; i++) {
        output[out_pos++] = line[i];
    }

    output[out_pos] = '\0';
    return sub_count;
}

/* Parse substitute command: s/pattern/replacement/flags */
void sed_parse_substitute(SedState *state, const char *cmd_str) {
    Command cmd = {0};
    cmd.type = CMD_SUBSTITUTE;
    cmd.global = false;
    cmd.print = false;
    cmd.ignore_case = false;

    const char *p = cmd_str + 1;  /* Skip 's' */
    char delim = *p++;
    if (delim == '\0') {
        fprintf(stderr, "sed: missing delimiter in substitute command\n");
        return;
    }

    /* Extract pattern */
    int i = 0;
    while (*p != '\0' && *p != delim && i < MAX_PATTERN - 1) {
        cmd.pattern[i++] = *p++;
    }
    cmd.pattern[i] = '\0';
    if (*p != delim) {
        fprintf(stderr, "sed: unterminated pattern\n");
        return;
    }
    p++;  /* Skip delimiter */

    /* Extract replacement */
    i = 0;
    while (*p != '\0' && *p != delim && i < MAX_REPLACEMENT - 1) {
        cmd.replacement[i++] = *p++;
    }
    cmd.replacement[i] = '\0';

    /* Extract flags */
    if (*p == delim) {
        p++;
        while (*p != '\0') {
            switch (*p) {
            case 'g':
                cmd.global = true;
                break;
            case 'p':
                cmd.print = true;
                break;
            case 'i':
            case 'I':
                cmd.ignore_case = true;
                break;
            default:
                /* Unknown flag, ignore */
                break;
            }
            p++;
        }
    }

    /* Compile regex */
    sed_compile_regex(&cmd);

    state->commands[state->num_commands++] = cmd;
}

/* Parse a simple command (d, p, q, =) with optional address */
void sed_parse_simple(SedState *state, const char *cmd_str) {
    Command cmd = {0};
    cmd.type = CMD_NONE;

    const char *p = cmd_str;

    /* Check for line number address (e.g., "2d", "5,10d") */
    if (*p >= '0' && *p <= '9') {
        int line_num = 0;
        while (*p >= '0' && *p <= '9') {
            line_num = line_num * 10 + (*p - '0');
            p++;
        }
        cmd.address.type = ADDR_LINE;
        cmd.address.line_start = line_num;
        cmd.address.line_end = line_num;
        cmd.address.negated = false;
    }

    switch (*p) {
    case 'd':
        cmd.type = CMD_DELETE;
        break;
    case 'p':
        cmd.type = CMD_PRINT;
        break;
    case 'q':
        cmd.type = CMD_QUIT;
        break;
    case '=':
        cmd.type = CMD_LINE_NUMBER;
        break;
    default:
        fprintf(stderr, "sed: unknown command: %c\n", *p);
        return;
    }

    state->commands[state->num_commands++] = cmd;
}

/* Parse command string */
void sed_parse_command(SedState *state, const char *cmd_str) {
    if (state->num_commands >= MAX_COMMANDS) {
        fprintf(stderr, "sed: too many commands\n");
        return;
    }

    /* Skip leading whitespace */
    while (*cmd_str == ' ' || *cmd_str == '\t') {
        cmd_str++;
    }

    if (*cmd_str == '\0') {
        return;
    }

    /* Check for substitute command */
    if (*cmd_str == 's') {
        sed_parse_substitute(state, cmd_str);
    } else {
        sed_parse_simple(state, cmd_str);
    }
}

/* Execute sed commands on input */
void sed_execute(SedState *state, FILE *input, FILE *output) {
    char line[MAX_LINE_LENGTH];
    bool print_default = !state->suppress_print;

    while (fgets(line, sizeof(line), input) != NULL) {
        state->current_line++;

        /* Remove trailing newline */
        int len = strlen(line);
        if (len > 0 && line[len-1] == '\n') {
            line[len-1] = '\0';
            len--;
        }

        bool should_print = print_default;
        bool should_delete = false;

        /* Execute each command */
        for (int i = 0; i < state->num_commands; i++) {
            Command *cmd = &state->commands[i];

            /* Check address */
            if (!sed_address_matches(state, &cmd->address)) {
                continue;
            }

            /* Execute command */
            char output_line[MAX_LINE_LENGTH];
            int substituted = 0;

            switch (cmd->type) {
            case CMD_SUBSTITUTE:
                substituted = sed_substitute(state, cmd, line, output_line);
                if (substituted > 0) {
                    strcpy(line, output_line);
                    if (cmd->print) {
                        fprintf(output, "%s\n", line);
                        should_print = false;
                    }
                }
                break;

            case CMD_DELETE:
                should_delete = true;
                break;

            case CMD_PRINT:
                fprintf(output, "%s\n", line);
                should_print = false;
                break;

            case CMD_QUIT:
                state->quit_flag = true;
                break;

            case CMD_LINE_NUMBER:
                fprintf(output, "%d\n", state->current_line);
                break;

            default:
                break;
            }

            if (state->quit_flag) {
                break;
            }
        }

        /* Print line if needed */
        if (!should_delete && should_print && !state->quit_flag) {
            fprintf(output, "%s\n", line);
        }

        if (state->quit_flag) {
            break;
        }
    }
}

/* Free resources */
void sed_free(SedState *state) {
    for (int i = 0; i < state->num_commands; i++) {
        if (state->commands[i].regex != NULL) {
            regfree(state->commands[i].regex);
            free(state->commands[i].regex);
        }
    }
}
