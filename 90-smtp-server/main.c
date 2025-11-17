/*
 * CC SMTP Server - A Simple SMTP Server Implementation
 * Challenge: https://codingchallenges.fyi/challenges/challenge-smtp
 *
 * This implements a basic SMTP server that can:
 * - Accept TCP connections on port 2525 (default, configurable)
 * - Handle HELO/EHLO commands
 * - Process MAIL FROM and RCPT TO commands
 * - Receive email data via DATA command
 * - Handle concurrent connections using fork()
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <signal.h>
#include <sys/wait.h>
#include <errno.h>
#include <time.h>
#include <ctype.h>

#define DEFAULT_PORT 2525
#define BUFFER_SIZE 4096
#define MAX_RECIPIENTS 100
#define MAIL_DIR "./mail"

/* SMTP Response Codes */
#define SMTP_READY "220"
#define SMTP_CLOSING "221"
#define SMTP_OK "250"
#define SMTP_START_MAIL "354"
#define SMTP_SYNTAX_ERROR "500"
#define SMTP_PARAM_ERROR "501"
#define SMTP_CMD_NOT_IMPL "502"
#define SMTP_BAD_SEQUENCE "503"

/* SMTP Session State */
typedef enum {
    STATE_INITIAL,
    STATE_GREETED,
    STATE_MAIL,
    STATE_RCPT,
    STATE_DATA
} smtp_state_t;

/* Email Session Data */
typedef struct {
    smtp_state_t state;
    char from[256];
    char recipients[MAX_RECIPIENTS][256];
    int recipient_count;
    char client_name[256];
} smtp_session_t;

/* Function Prototypes */
void handle_client(int client_sock);
void send_response(int sock, const char *code, const char *message);
int handle_command(int sock, smtp_session_t *session, const char *command);
int handle_helo(int sock, smtp_session_t *session, const char *args);
int handle_ehlo(int sock, smtp_session_t *session, const char *args);
int handle_mail_from(int sock, smtp_session_t *session, const char *args);
int handle_rcpt_to(int sock, smtp_session_t *session, const char *args);
int handle_data(int sock, smtp_session_t *session);
int handle_quit(int sock);
int handle_rset(int sock, smtp_session_t *session);
int handle_noop(int sock);
void save_email(smtp_session_t *session, const char *data);
void sigchld_handler(int sig);
void trim_newline(char *str);
void str_toupper(char *str);

int verbose = 0;

/* Signal handler to reap zombie processes */
void sigchld_handler(int sig) {
    (void)sig;
    while (waitpid(-1, NULL, WNOHANG) > 0);
}

/* Send SMTP response to client */
void send_response(int sock, const char *code, const char *message) {
    char response[BUFFER_SIZE];
    snprintf(response, sizeof(response), "%s %s\r\n", code, message);
    send(sock, response, strlen(response), 0);
    if (verbose) {
        printf("S: %s", response);
    }
}

/* Remove trailing newline characters */
void trim_newline(char *str) {
    size_t len = strlen(str);
    while (len > 0 && (str[len-1] == '\n' || str[len-1] == '\r')) {
        str[len-1] = '\0';
        len--;
    }
}

/* Convert string to uppercase */
void str_toupper(char *str) {
    for (int i = 0; str[i]; i++) {
        str[i] = toupper((unsigned char)str[i]);
    }
}

/* Handle HELO command */
int handle_helo(int sock, smtp_session_t *session, const char *args) {
    if (args == NULL || strlen(args) == 0) {
        send_response(sock, SMTP_PARAM_ERROR, "Syntax: HELO hostname");
        return 0;
    }

    strncpy(session->client_name, args, sizeof(session->client_name) - 1);
    session->state = STATE_GREETED;

    send_response(sock, SMTP_OK, "Hello, pleased to meet you");
    return 1;
}

/* Handle EHLO command */
int handle_ehlo(int sock, smtp_session_t *session, const char *args) {
    if (args == NULL || strlen(args) == 0) {
        send_response(sock, SMTP_PARAM_ERROR, "Syntax: EHLO hostname");
        return 0;
    }

    strncpy(session->client_name, args, sizeof(session->client_name) - 1);
    session->state = STATE_GREETED;

    /* Send EHLO response with supported extensions */
    char response[BUFFER_SIZE];
    snprintf(response, sizeof(response), "250-CC SMTP Server\r\n250 SIZE 10240000\r\n");
    send(sock, response, strlen(response), 0);
    if (verbose) {
        printf("S: %s", response);
    }
    return 1;
}

/* Handle MAIL FROM command */
int handle_mail_from(int sock, smtp_session_t *session, const char *args) {
    if (session->state != STATE_GREETED && session->state != STATE_MAIL && session->state != STATE_RCPT) {
        send_response(sock, SMTP_BAD_SEQUENCE, "Send HELO/EHLO first");
        return 0;
    }

    if (args == NULL || strlen(args) == 0) {
        send_response(sock, SMTP_PARAM_ERROR, "Syntax: MAIL FROM:<address>");
        return 0;
    }

    /* Parse email address from <...> */
    const char *start = strchr(args, '<');
    const char *end = strchr(args, '>');

    if (start && end && end > start) {
        size_t len = end - start - 1;
        if (len >= sizeof(session->from)) {
            len = sizeof(session->from) - 1;
        }
        strncpy(session->from, start + 1, len);
        session->from[len] = '\0';
        session->state = STATE_MAIL;
        session->recipient_count = 0;  /* Reset recipients */

        send_response(sock, SMTP_OK, "OK");
        return 1;
    } else {
        send_response(sock, SMTP_PARAM_ERROR, "Invalid email address format");
        return 0;
    }
}

/* Handle RCPT TO command */
int handle_rcpt_to(int sock, smtp_session_t *session, const char *args) {
    if (session->state != STATE_MAIL && session->state != STATE_RCPT) {
        send_response(sock, SMTP_BAD_SEQUENCE, "Send MAIL FROM first");
        return 0;
    }

    if (args == NULL || strlen(args) == 0) {
        send_response(sock, SMTP_PARAM_ERROR, "Syntax: RCPT TO:<address>");
        return 0;
    }

    if (session->recipient_count >= MAX_RECIPIENTS) {
        send_response(sock, SMTP_PARAM_ERROR, "Too many recipients");
        return 0;
    }

    /* Parse email address from <...> */
    const char *start = strchr(args, '<');
    const char *end = strchr(args, '>');

    if (start && end && end > start) {
        size_t len = end - start - 1;
        if (len >= sizeof(session->recipients[0])) {
            len = sizeof(session->recipients[0]) - 1;
        }
        strncpy(session->recipients[session->recipient_count], start + 1, len);
        session->recipients[session->recipient_count][len] = '\0';
        session->recipient_count++;
        session->state = STATE_RCPT;

        send_response(sock, SMTP_OK, "OK");
        return 1;
    } else {
        send_response(sock, SMTP_PARAM_ERROR, "Invalid email address format");
        return 0;
    }
}

/* Handle DATA command */
int handle_data(int sock, smtp_session_t *session) {
    if (session->state != STATE_RCPT) {
        send_response(sock, SMTP_BAD_SEQUENCE, "Send RCPT TO first");
        return 0;
    }

    send_response(sock, SMTP_START_MAIL, "End data with <CR><LF>.<CR><LF>");

    /* Read email data until we see "\r\n.\r\n" */
    char data[BUFFER_SIZE * 10] = {0};
    char line[BUFFER_SIZE];
    int total_len = 0;

    while (1) {
        int n = recv(sock, line, sizeof(line) - 1, 0);
        if (n <= 0) {
            return 0;
        }
        line[n] = '\0';

        if (verbose) {
            printf("C: %s", line);
        }

        /* Check for end of data marker */
        if (strstr(line, "\r\n.\r\n") || strstr(line, "\n.\n") || strcmp(line, ".\r\n") == 0 || strcmp(line, ".\n") == 0) {
            /* Remove the terminator from data */
            char *terminator = strstr(line, "\r\n.");
            if (!terminator) terminator = strstr(line, "\n.");
            if (terminator) {
                *terminator = '\0';
            }

            /* Append remaining data before terminator */
            if (strlen(line) > 0 && total_len + strlen(line) < sizeof(data)) {
                strncat(data, line, sizeof(data) - total_len - 1);
            }
            break;
        }

        /* Append to data buffer */
        if ((size_t)(total_len + n) < sizeof(data)) {
            strncat(data, line, sizeof(data) - total_len - 1);
            total_len += n;
        } else {
            send_response(sock, SMTP_PARAM_ERROR, "Message too large");
            return 0;
        }
    }

    /* Save the email */
    save_email(session, data);

    send_response(sock, SMTP_OK, "OK: message queued");
    session->state = STATE_GREETED;
    return 1;
}

/* Handle QUIT command */
int handle_quit(int sock) {
    send_response(sock, SMTP_CLOSING, "Bye");
    return 0;  /* Signal to close connection */
}

/* Handle RSET command */
int handle_rset(int sock, smtp_session_t *session) {
    /* Reset session to greeted state */
    session->state = STATE_GREETED;
    session->from[0] = '\0';
    session->recipient_count = 0;
    send_response(sock, SMTP_OK, "OK");
    return 1;
}

/* Handle NOOP command */
int handle_noop(int sock) {
    send_response(sock, SMTP_OK, "OK");
    return 1;
}

/* Save email to file */
void save_email(smtp_session_t *session, const char *data) {
    /* Create mail directory if it doesn't exist */
    int ret = system("mkdir -p " MAIL_DIR);
    (void)ret;  /* Ignore return value */

    /* Generate filename with timestamp */
    time_t now = time(NULL);
    char filename[512];
    snprintf(filename, sizeof(filename), "%s/mail_%ld.eml", MAIL_DIR, (long)now);

    FILE *fp = fopen(filename, "w");
    if (fp) {
        fprintf(fp, "From: %s\n", session->from);
        for (int i = 0; i < session->recipient_count; i++) {
            fprintf(fp, "To: %s\n", session->recipients[i]);
        }
        fprintf(fp, "Received: from %s\n", session->client_name);
        fprintf(fp, "Date: %s", ctime(&now));
        fprintf(fp, "\n%s\n", data);
        fclose(fp);

        if (verbose) {
            printf("Email saved to: %s\n", filename);
        }
    } else {
        perror("Failed to save email");
    }
}

/* Parse and handle SMTP command */
int handle_command(int sock, smtp_session_t *session, const char *command) {
    char cmd[BUFFER_SIZE];
    strncpy(cmd, command, sizeof(cmd) - 1);
    cmd[sizeof(cmd) - 1] = '\0';
    trim_newline(cmd);

    if (strlen(cmd) == 0) {
        return 1;
    }

    if (verbose) {
        printf("C: %s\n", cmd);
    }

    /* Parse command and arguments */
    char *space = strchr(cmd, ' ');
    char *args = NULL;
    if (space) {
        *space = '\0';
        args = space + 1;
        /* Trim leading spaces from args */
        while (*args == ' ') args++;
    }

    /* Convert command to uppercase */
    str_toupper(cmd);

    /* Handle commands */
    if (strcmp(cmd, "HELO") == 0) {
        return handle_helo(sock, session, args);
    } else if (strcmp(cmd, "EHLO") == 0) {
        return handle_ehlo(sock, session, args);
    } else if (strcmp(cmd, "MAIL") == 0) {
        /* Handle "MAIL FROM:" */
        if (args && strncmp(args, "FROM:", 5) == 0) {
            return handle_mail_from(sock, session, args + 5);
        } else {
            send_response(sock, SMTP_PARAM_ERROR, "Syntax: MAIL FROM:<address>");
            return 0;
        }
    } else if (strcmp(cmd, "RCPT") == 0) {
        /* Handle "RCPT TO:" */
        if (args && strncmp(args, "TO:", 3) == 0) {
            return handle_rcpt_to(sock, session, args + 3);
        } else {
            send_response(sock, SMTP_PARAM_ERROR, "Syntax: RCPT TO:<address>");
            return 0;
        }
    } else if (strcmp(cmd, "DATA") == 0) {
        return handle_data(sock, session);
    } else if (strcmp(cmd, "QUIT") == 0) {
        return handle_quit(sock);
    } else if (strcmp(cmd, "RSET") == 0) {
        return handle_rset(sock, session);
    } else if (strcmp(cmd, "NOOP") == 0) {
        return handle_noop(sock);
    } else {
        send_response(sock, SMTP_CMD_NOT_IMPL, "Command not implemented");
        return 1;
    }
}

/* Handle client connection */
void handle_client(int client_sock) {
    smtp_session_t session = {
        .state = STATE_INITIAL,
        .from = {0},
        .recipient_count = 0,
        .client_name = {0}
    };

    /* Send greeting */
    send_response(client_sock, SMTP_READY, "CC SMTP Server");

    /* Main command loop */
    char buffer[BUFFER_SIZE];
    while (1) {
        int n = recv(client_sock, buffer, sizeof(buffer) - 1, 0);
        if (n <= 0) {
            break;
        }
        buffer[n] = '\0';

        /* Handle command */
        if (!handle_command(client_sock, &session, buffer)) {
            break;
        }
    }

    close(client_sock);
}

/* Main function */
int main(int argc, char *argv[]) {
    int port = DEFAULT_PORT;
    int server_sock, client_sock;
    struct sockaddr_in server_addr, client_addr;
    socklen_t client_len = sizeof(client_addr);

    /* Parse command line arguments */
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-p") == 0 && i + 1 < argc) {
            port = atoi(argv[++i]);
        } else if (strcmp(argv[i], "-v") == 0) {
            verbose = 1;
        } else if (strcmp(argv[i], "-h") == 0) {
            printf("Usage: %s [-p port] [-v] [-h]\n", argv[0]);
            printf("  -p port    Port to listen on (default: %d)\n", DEFAULT_PORT);
            printf("  -v         Verbose mode\n");
            printf("  -h         Show this help\n");
            printf("\nNote: Port 25 requires root privileges. Using port %d by default.\n", DEFAULT_PORT);
            return 0;
        }
    }

    /* Set up signal handler for child processes */
    signal(SIGCHLD, sigchld_handler);

    /* Create socket */
    server_sock = socket(AF_INET, SOCK_STREAM, 0);
    if (server_sock < 0) {
        perror("socket");
        return 1;
    }

    /* Set socket options */
    int opt = 1;
    if (setsockopt(server_sock, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
        perror("setsockopt");
        close(server_sock);
        return 1;
    }

    /* Bind socket */
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(port);

    if (bind(server_sock, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
        perror("bind");
        close(server_sock);
        return 1;
    }

    /* Listen */
    if (listen(server_sock, 5) < 0) {
        perror("listen");
        close(server_sock);
        return 1;
    }

    printf("CC SMTP Server listening on port %d\n", port);
    printf("Mail will be saved to: %s/\n", MAIL_DIR);
    if (verbose) {
        printf("Verbose mode enabled\n");
    }

    /* Accept connections */
    while (1) {
        client_sock = accept(server_sock, (struct sockaddr *)&client_addr, &client_len);
        if (client_sock < 0) {
            if (errno == EINTR) {
                continue;  /* Interrupted by signal, try again */
            }
            perror("accept");
            continue;
        }

        if (verbose) {
            printf("Connection from %s:%d\n",
                   inet_ntoa(client_addr.sin_addr),
                   ntohs(client_addr.sin_port));
        }

        /* Fork to handle client */
        pid_t pid = fork();
        if (pid < 0) {
            perror("fork");
            close(client_sock);
        } else if (pid == 0) {
            /* Child process */
            close(server_sock);
            handle_client(client_sock);
            exit(0);
        } else {
            /* Parent process */
            close(client_sock);
        }
    }

    close(server_sock);
    return 0;
}
