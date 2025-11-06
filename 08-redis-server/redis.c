/*
 * Redis Server - A lightweight Redis-compatible server
 *
 * This implementation provides a simplified Redis server with:
 * - RESP (Redis Serialization Protocol) support
 * - TCP server listening on port 6379
 * - In-memory key-value storage
 * - Basic Redis commands (PING, ECHO, SET, GET, DEL, EXISTS, KEYS)
 * - Multi-client support
 *
 * Architecture:
 * 1. RESP Protocol Layer - Parse and serialize RESP messages
 * 2. Command Parser - Parse commands from RESP arrays
 * 3. Data Store - Simple hash table for key-value storage
 * 4. Command Handlers - Execute Redis commands
 * 5. Server - TCP server with client handling
 */

#define _POSIX_C_SOURCE 200809L

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <unistd.h>
#include <errno.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <ctype.h>
#include <time.h>
#include <signal.h>

#define DEFAULT_PORT 6379
#define MAX_CLIENTS 100
#define BUFFER_SIZE 4096
#define HASH_TABLE_SIZE 1024
#define MAX_COMMAND_ARGS 10

/* ===== RESP PROTOCOL TYPES ===== */

typedef enum {
    RESP_SIMPLE_STRING,  // +OK\r\n
    RESP_ERROR,          // -Error message\r\n
    RESP_INTEGER,        // :1000\r\n
    RESP_BULK_STRING,    // $6\r\nfoobar\r\n
    RESP_ARRAY,          // *2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n
    RESP_NULL            // $-1\r\n
} RESPType;

typedef struct RESPValue {
    RESPType type;
    union {
        char *str;          // For simple string, error, bulk string
        long integer;       // For integer
        struct {
            struct RESPValue **elements;
            int count;
        } array;            // For array
    } data;
} RESPValue;

/* ===== DATA STORE ===== */

typedef struct KeyValue {
    char *key;
    char *value;
    time_t expiry;           // 0 = no expiry, otherwise timestamp
    struct KeyValue *next;   // For hash table chaining
} KeyValue;

typedef struct {
    KeyValue *buckets[HASH_TABLE_SIZE];
    int count;
} DataStore;

/* Global data store */
DataStore store;

/* Server running flag */
volatile sig_atomic_t server_running = 1;

/* ===== UTILITY FUNCTIONS ===== */

/* Simple hash function */
unsigned int hash(const char *str) {
    unsigned int hash = 5381;
    int c;
    while ((c = *str++))
        hash = ((hash << 5) + hash) + c; /* hash * 33 + c */
    return hash % HASH_TABLE_SIZE;
}

/* ===== DATA STORE OPERATIONS ===== */

void store_init(DataStore *store) {
    memset(store->buckets, 0, sizeof(store->buckets));
    store->count = 0;
}

void store_set(DataStore *store, const char *key, const char *value, time_t expiry) {
    unsigned int idx = hash(key);
    KeyValue *kv = store->buckets[idx];

    /* Check if key exists, update if found */
    while (kv != NULL) {
        if (strcmp(kv->key, key) == 0) {
            free(kv->value);
            kv->value = strdup(value);
            kv->expiry = expiry;
            return;
        }
        kv = kv->next;
    }

    /* Create new entry */
    kv = malloc(sizeof(KeyValue));
    kv->key = strdup(key);
    kv->value = strdup(value);
    kv->expiry = expiry;
    kv->next = store->buckets[idx];
    store->buckets[idx] = kv;
    store->count++;
}

char *store_get(DataStore *store, const char *key) {
    unsigned int idx = hash(key);
    KeyValue *kv = store->buckets[idx];

    while (kv != NULL) {
        if (strcmp(kv->key, key) == 0) {
            /* Check if expired */
            if (kv->expiry > 0 && time(NULL) >= kv->expiry) {
                return NULL;
            }
            return kv->value;
        }
        kv = kv->next;
    }
    return NULL;
}

int store_del(DataStore *store, const char *key) {
    unsigned int idx = hash(key);
    KeyValue *kv = store->buckets[idx];
    KeyValue *prev = NULL;

    while (kv != NULL) {
        if (strcmp(kv->key, key) == 0) {
            if (prev == NULL) {
                store->buckets[idx] = kv->next;
            } else {
                prev->next = kv->next;
            }
            free(kv->key);
            free(kv->value);
            free(kv);
            store->count--;
            return 1;
        }
        prev = kv;
        kv = kv->next;
    }
    return 0;
}

int store_exists(DataStore *store, const char *key) {
    char *value = store_get(store, key);
    return value != NULL;
}

/* Get all keys (simple implementation) */
char **store_keys(DataStore *store, int *count) {
    char **keys = malloc(store->count * sizeof(char*));
    int idx = 0;

    for (int i = 0; i < HASH_TABLE_SIZE; i++) {
        KeyValue *kv = store->buckets[i];
        while (kv != NULL) {
            /* Check if not expired */
            if (kv->expiry == 0 || time(NULL) < kv->expiry) {
                keys[idx++] = kv->key;
            }
            kv = kv->next;
        }
    }
    *count = idx;
    return keys;
}

/* ===== RESP PROTOCOL ===== */

RESPValue *resp_create_simple_string(const char *str) {
    RESPValue *val = malloc(sizeof(RESPValue));
    val->type = RESP_SIMPLE_STRING;
    val->data.str = strdup(str);
    return val;
}

RESPValue *resp_create_error(const char *msg) {
    RESPValue *val = malloc(sizeof(RESPValue));
    val->type = RESP_ERROR;
    val->data.str = strdup(msg);
    return val;
}

RESPValue *resp_create_integer(long num) {
    RESPValue *val = malloc(sizeof(RESPValue));
    val->type = RESP_INTEGER;
    val->data.integer = num;
    return val;
}

RESPValue *resp_create_bulk_string(const char *str) {
    RESPValue *val = malloc(sizeof(RESPValue));
    val->type = RESP_BULK_STRING;
    val->data.str = str ? strdup(str) : NULL;
    return val;
}

RESPValue *resp_create_null() {
    RESPValue *val = malloc(sizeof(RESPValue));
    val->type = RESP_NULL;
    return val;
}

RESPValue *resp_create_array(int count) {
    RESPValue *val = malloc(sizeof(RESPValue));
    val->type = RESP_ARRAY;
    val->data.array.count = count;
    val->data.array.elements = malloc(count * sizeof(RESPValue*));
    return val;
}

void resp_free(RESPValue *val) {
    if (!val) return;

    switch (val->type) {
        case RESP_SIMPLE_STRING:
        case RESP_ERROR:
        case RESP_BULK_STRING:
            free(val->data.str);
            break;
        case RESP_ARRAY:
            for (int i = 0; i < val->data.array.count; i++) {
                resp_free(val->data.array.elements[i]);
            }
            free(val->data.array.elements);
            break;
        default:
            break;
    }
    free(val);
}

/* Parse RESP from buffer */
RESPValue *resp_parse(const char **buf) {
    const char *p = *buf;

    if (*p == '+') {  /* Simple String */
        p++;
        const char *start = p;
        while (*p != '\r') p++;
        int len = p - start;
        char *str = malloc(len + 1);
        memcpy(str, start, len);
        str[len] = '\0';
        p += 2; /* Skip \r\n */
        *buf = p;

        RESPValue *val = malloc(sizeof(RESPValue));
        val->type = RESP_SIMPLE_STRING;
        val->data.str = str;
        return val;
    }
    else if (*p == '-') {  /* Error */
        p++;
        const char *start = p;
        while (*p != '\r') p++;
        int len = p - start;
        char *str = malloc(len + 1);
        memcpy(str, start, len);
        str[len] = '\0';
        p += 2;
        *buf = p;

        RESPValue *val = malloc(sizeof(RESPValue));
        val->type = RESP_ERROR;
        val->data.str = str;
        return val;
    }
    else if (*p == ':') {  /* Integer */
        p++;
        long num = atol(p);
        while (*p != '\r') p++;
        p += 2;
        *buf = p;
        return resp_create_integer(num);
    }
    else if (*p == '$') {  /* Bulk String */
        p++;
        int len = atoi(p);
        while (*p != '\r') p++;
        p += 2;

        if (len == -1) {
            *buf = p;
            return resp_create_null();
        }

        char *str = malloc(len + 1);
        memcpy(str, p, len);
        str[len] = '\0';
        p += len + 2;
        *buf = p;

        RESPValue *val = malloc(sizeof(RESPValue));
        val->type = RESP_BULK_STRING;
        val->data.str = str;
        return val;
    }
    else if (*p == '*') {  /* Array */
        p++;
        int count = atoi(p);
        while (*p != '\r') p++;
        p += 2;
        *buf = p;

        RESPValue *val = resp_create_array(count);
        for (int i = 0; i < count; i++) {
            val->data.array.elements[i] = resp_parse(buf);
            p = *buf;
        }
        return val;
    }

    return NULL;
}

/* Serialize RESP to buffer */
int resp_serialize(RESPValue *val, char *buf, int buf_size) {
    int written = 0;

    switch (val->type) {
        case RESP_SIMPLE_STRING:
            written = snprintf(buf, buf_size, "+%s\r\n", val->data.str);
            break;
        case RESP_ERROR:
            written = snprintf(buf, buf_size, "-%s\r\n", val->data.str);
            break;
        case RESP_INTEGER:
            written = snprintf(buf, buf_size, ":%ld\r\n", val->data.integer);
            break;
        case RESP_BULK_STRING:
            if (val->data.str) {
                int len = strlen(val->data.str);
                written = snprintf(buf, buf_size, "$%d\r\n%s\r\n", len, val->data.str);
            } else {
                written = snprintf(buf, buf_size, "$-1\r\n");
            }
            break;
        case RESP_NULL:
            written = snprintf(buf, buf_size, "$-1\r\n");
            break;
        case RESP_ARRAY:
            written = snprintf(buf, buf_size, "*%d\r\n", val->data.array.count);
            buf += written;
            buf_size -= written;
            for (int i = 0; i < val->data.array.count; i++) {
                int n = resp_serialize(val->data.array.elements[i], buf, buf_size);
                buf += n;
                buf_size -= n;
                written += n;
            }
            break;
    }

    return written;
}

/* ===== COMMAND HANDLERS ===== */

RESPValue *cmd_ping(int argc, char **argv) {
    if (argc == 1) {
        return resp_create_simple_string("PONG");
    } else {
        return resp_create_bulk_string(argv[1]);
    }
}

RESPValue *cmd_echo(int argc, char **argv) {
    if (argc < 2) {
        return resp_create_error("ERR wrong number of arguments for 'echo' command");
    }
    return resp_create_bulk_string(argv[1]);
}

RESPValue *cmd_set(int argc, char **argv) {
    if (argc < 3) {
        return resp_create_error("ERR wrong number of arguments for 'set' command");
    }

    time_t expiry = 0;

    /* Check for EX option (expiry in seconds) */
    if (argc >= 5 && strcasecmp(argv[3], "EX") == 0) {
        int seconds = atoi(argv[4]);
        expiry = time(NULL) + seconds;
    }

    store_set(&store, argv[1], argv[2], expiry);
    return resp_create_simple_string("OK");
}

RESPValue *cmd_get(int argc, char **argv) {
    if (argc < 2) {
        return resp_create_error("ERR wrong number of arguments for 'get' command");
    }

    char *value = store_get(&store, argv[1]);
    if (value) {
        return resp_create_bulk_string(value);
    } else {
        return resp_create_null();
    }
}

RESPValue *cmd_del(int argc, char **argv) {
    if (argc < 2) {
        return resp_create_error("ERR wrong number of arguments for 'del' command");
    }

    int deleted = 0;
    for (int i = 1; i < argc; i++) {
        deleted += store_del(&store, argv[i]);
    }

    return resp_create_integer(deleted);
}

RESPValue *cmd_exists(int argc, char **argv) {
    if (argc < 2) {
        return resp_create_error("ERR wrong number of arguments for 'exists' command");
    }

    int count = 0;
    for (int i = 1; i < argc; i++) {
        if (store_exists(&store, argv[i])) {
            count++;
        }
    }

    return resp_create_integer(count);
}

RESPValue *cmd_keys(int argc, char **argv) {
    (void)argc;
    (void)argv;

    int count;
    char **keys = store_keys(&store, &count);

    RESPValue *result = resp_create_array(count);
    for (int i = 0; i < count; i++) {
        result->data.array.elements[i] = resp_create_bulk_string(keys[i]);
    }

    free(keys);
    return result;
}

/* Execute command */
RESPValue *execute_command(RESPValue *cmd) {
    if (cmd->type != RESP_ARRAY || cmd->data.array.count == 0) {
        return resp_create_error("ERR invalid command");
    }

    /* Extract command and arguments */
    char *argv[MAX_COMMAND_ARGS];
    int argc = cmd->data.array.count;

    if (argc > MAX_COMMAND_ARGS) {
        return resp_create_error("ERR too many arguments");
    }

    for (int i = 0; i < argc; i++) {
        RESPValue *arg = cmd->data.array.elements[i];
        if (arg->type != RESP_BULK_STRING) {
            return resp_create_error("ERR invalid argument type");
        }
        argv[i] = arg->data.str;
    }

    /* Convert command to uppercase for comparison */
    char *command = argv[0];
    for (char *p = command; *p; p++) *p = toupper(*p);

    /* Dispatch to command handlers */
    if (strcmp(command, "PING") == 0) {
        return cmd_ping(argc, argv);
    } else if (strcmp(command, "ECHO") == 0) {
        return cmd_echo(argc, argv);
    } else if (strcmp(command, "SET") == 0) {
        return cmd_set(argc, argv);
    } else if (strcmp(command, "GET") == 0) {
        return cmd_get(argc, argv);
    } else if (strcmp(command, "DEL") == 0) {
        return cmd_del(argc, argv);
    } else if (strcmp(command, "EXISTS") == 0) {
        return cmd_exists(argc, argv);
    } else if (strcmp(command, "KEYS") == 0) {
        return cmd_keys(argc, argv);
    } else {
        char err[256];
        snprintf(err, sizeof(err), "ERR unknown command '%s'", command);
        return resp_create_error(err);
    }
}

/* ===== SERVER ===== */

void signal_handler(int sig) {
    (void)sig;
    server_running = 0;
}

void handle_client(int client_fd) {
    char buffer[BUFFER_SIZE];
    char response[BUFFER_SIZE];

    while (1) {
        ssize_t n = recv(client_fd, buffer, sizeof(buffer) - 1, 0);
        if (n <= 0) {
            break;
        }

        buffer[n] = '\0';

        /* Parse RESP command */
        const char *p = buffer;
        RESPValue *cmd = resp_parse(&p);

        if (!cmd) {
            const char *err = "-ERR Protocol error\r\n";
            send(client_fd, err, strlen(err), 0);
            continue;
        }

        /* Execute command */
        RESPValue *result = execute_command(cmd);
        resp_free(cmd);

        /* Serialize and send response */
        int len = resp_serialize(result, response, sizeof(response));
        send(client_fd, response, len, 0);
        resp_free(result);
    }

    close(client_fd);
}

int main(int argc, char *argv[]) {
    int port = DEFAULT_PORT;

    /* Parse command line arguments */
    if (argc > 1) {
        port = atoi(argv[1]);
        if (port <= 0 || port > 65535) {
            fprintf(stderr, "Invalid port number\n");
            return 1;
        }
    }

    /* Initialize data store */
    store_init(&store);

    /* Set up signal handler */
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);

    /* Create socket */
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        perror("socket");
        return 1;
    }

    /* Set socket options */
    int opt = 1;
    if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
        perror("setsockopt");
        close(server_fd);
        return 1;
    }

    /* Bind to port */
    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(port);

    if (bind(server_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        perror("bind");
        close(server_fd);
        return 1;
    }

    /* Listen for connections */
    if (listen(server_fd, MAX_CLIENTS) < 0) {
        perror("listen");
        close(server_fd);
        return 1;
    }

    printf("Redis server listening on port %d\n", port);
    printf("Press Ctrl+C to stop\n");

    /* Accept and handle clients */
    while (server_running) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);

        int client_fd = accept(server_fd, (struct sockaddr*)&client_addr, &client_len);
        if (client_fd < 0) {
            if (errno == EINTR) {
                break;  /* Interrupted by signal */
            }
            perror("accept");
            continue;
        }

        printf("Client connected: %s:%d\n",
               inet_ntoa(client_addr.sin_addr),
               ntohs(client_addr.sin_port));

        /* Handle client (simple single-threaded for now) */
        handle_client(client_fd);

        printf("Client disconnected\n");
    }

    printf("\nShutting down server...\n");
    close(server_fd);

    return 0;
}
