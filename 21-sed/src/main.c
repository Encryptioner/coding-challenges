#include "../src/sed.h"

int main(int argc, char *argv[]) {
    SedState state;
    sed_init(&state);

    /* Parse command line options */
    int arg_idx = 1;
    while (arg_idx < argc && argv[arg_idx][0] == '-') {
        if (strcmp(argv[arg_idx], "-n") == 0) {
            state.suppress_print = true;
        } else if (strcmp(argv[arg_idx], "-e") == 0) {
            if (arg_idx + 1 < argc) {
                sed_parse_command(&state, argv[arg_idx + 1]);
                arg_idx++;
            }
        }
        arg_idx++;
    }

    /* If no -e commands, treat next arg as command */
    if (state.num_commands == 0 && arg_idx < argc) {
        /* Check if it's a command (starts with s or contains /) */
        if (argv[arg_idx][0] == 's' || strchr(argv[arg_idx], '/') != NULL) {
            sed_parse_command(&state, argv[arg_idx]);
            arg_idx++;
        }
    }

    /* If still no commands, show usage */
    if (state.num_commands == 0) {
        fprintf(stderr, "Usage: sed [-n] [-e 'command'] 'command' [file...]\n");
        fprintf(stderr, "Commands:\n");
        fprintf(stderr, "  s/pattern/replacement/flags  Substitute\n");
        fprintf(stderr, "  d                            Delete line\n");
        fprintf(stderr, "  p                            Print line\n");
        fprintf(stderr, "  q                            Quit\n");
        fprintf(stderr, "  =                            Print line number\n");
        fprintf(stderr, "Flags: g=global, p=print, i=case-insensitive\n");
        return 1;
    }

    /* Process files or stdin */
    if (arg_idx >= argc) {
        /* Read from stdin */
        sed_execute(&state, stdin, stdout);
    } else {
        /* Process each file */
        for (int i = arg_idx; i < argc; i++) {
            FILE *fp = fopen(argv[i], "r");
            if (fp == NULL) {
                perror(argv[i]);
                continue;
            }
            sed_execute(&state, fp, stdout);
            fclose(fp);
        }
    }

    sed_free(&state);
    return 0;
}
