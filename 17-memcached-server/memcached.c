/*
 * ccmemcached - Coding Challenges Memcached Server
 * A simple in-memory key-value cache server implementing the Memcached text protocol
 *
 * Features:
 * - Text protocol support
 * - SET, GET, ADD, REPLACE, APPEND, PREPEND, DELETE commands
 * - Key expiration
 * - Multiple concurrent clients
 * - Statistics
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <time.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <pthread.h>
#include <errno.h>
#include <signal.h>

#define DEFAULT_PORT 11211
#define HASH_SIZE 10007  // Prime number for better distribution
#define MAX_KEY_LEN 250
#define MAX_VALUE_LEN (1024 * 1024)  // 1MB
#define BUFFER_SIZE 4096

/* Cache item structure */
typedef struct CacheItem {
    char *key;
    char *data;
    uint32_t flags;
    size_t bytes;
    time_t exptime;
    struct CacheItem *next;  // For chaining in hash table
} CacheItem;

/* Hash table */
typedef struct {
    CacheItem **buckets;
    size_t size;
    pthread_mutex_t *locks;  // One lock per bucket for fine-grained locking
} HashTable;

/* Server statistics */
typedef struct {
    uint64_t curr_items;
    uint64_t total_items;
    uint64_t bytes_used;
    uint64_t curr_connections;
    uint64_t total_connections;
    uint64_t cmd_get;
    uint64_t cmd_set;
    uint64_t get_hits;
    uint64_t get_misses;
    pthread_mutex_t lock;
} Stats;

/* Global variables */
static HashTable *cache = NULL;
static Stats stats = {0};
static volatile bool server_running = true;

/* Function prototypes */
HashTable *hash_table_create(size_t size);
void hash_table_destroy(HashTable *ht);
uint32_t hash(const char *key);
CacheItem *cache_get(HashTable *ht, const char *key);
bool cache_set(HashTable *ht, const char *key, const char *data, size_t bytes, uint32_t flags, time_t exptime);
bool cache_add(HashTable *ht, const char *key, const char *data, size_t bytes, uint32_t flags, time_t exptime);
bool cache_replace(HashTable *ht, const char *key, const char *data, size_t bytes, uint32_t flags, time_t exptime);
bool cache_append(HashTable *ht, const char *key, const char *data, size_t bytes);
bool cache_prepend(HashTable *ht, const char *key, const char *data, size_t bytes);
bool cache_delete(HashTable *ht, const char *key);
void cache_flush_all(HashTable *ht);
bool is_expired(CacheItem *item);
void *handle_client(void *arg);
void handle_command(int client_fd, char *command);
void send_response(int client_fd, const char *response);
void signal_handler(int sig);

/**
 * Create a hash table
 */
HashTable *hash_table_create(size_t size) {
    HashTable *ht = malloc(sizeof(HashTable));
    if (!ht) return NULL;

    ht->size = size;
    ht->buckets = calloc(size, sizeof(CacheItem *));
    ht->locks = malloc(size * sizeof(pthread_mutex_t));

    if (!ht->buckets || !ht->locks) {
        free(ht->buckets);
        free(ht->locks);
        free(ht);
        return NULL;
    }

    for (size_t i = 0; i < size; i++) {
        pthread_mutex_init(&ht->locks[i], NULL);
    }

    return ht;
}

/**
 * Destroy hash table
 */
void hash_table_destroy(HashTable *ht) {
    if (!ht) return;

    for (size_t i = 0; i < ht->size; i++) {
        CacheItem *item = ht->buckets[i];
        while (item) {
            CacheItem *next = item->next;
            free(item->key);
            free(item->data);
            free(item);
            item = next;
        }
        pthread_mutex_destroy(&ht->locks[i]);
    }

    free(ht->buckets);
    free(ht->locks);
    free(ht);
}

/**
 * djb2 hash function
 */
uint32_t hash(const char *key) {
    uint32_t hash = 5381;
    int c;

    while ((c = *key++)) {
        hash = ((hash << 5) + hash) + c;
    }

    return hash;
}

/**
 * Check if item is expired
 */
bool is_expired(CacheItem *item) {
    if (item->exptime == 0) return false;
    return time(NULL) >= item->exptime;
}

/**
 * Get value from cache
 */
CacheItem *cache_get(HashTable *ht, const char *key) {
    uint32_t idx = hash(key) % ht->size;

    pthread_mutex_lock(&ht->locks[idx]);

    CacheItem *item = ht->buckets[idx];
    CacheItem *prev = NULL;

    while (item) {
        if (strcmp(item->key, key) == 0) {
            // Check if expired
            if (is_expired(item)) {
                // Remove expired item
                if (prev) {
                    prev->next = item->next;
                } else {
                    ht->buckets[idx] = item->next;
                }

                pthread_mutex_lock(&stats.lock);
                stats.curr_items--;
                stats.bytes_used -= item->bytes;
                pthread_mutex_unlock(&stats.lock);

                free(item->key);
                free(item->data);
                free(item);

                pthread_mutex_unlock(&ht->locks[idx]);
                return NULL;
            }

            pthread_mutex_unlock(&ht->locks[idx]);
            return item;
        }
        prev = item;
        item = item->next;
    }

    pthread_mutex_unlock(&ht->locks[idx]);
    return NULL;
}

/**
 * Set value in cache (unconditionally)
 */
bool cache_set(HashTable *ht, const char *key, const char *data, size_t bytes, uint32_t flags, time_t exptime) {
    uint32_t idx = hash(key) % ht->size;

    pthread_mutex_lock(&ht->locks[idx]);

    // Check if key exists
    CacheItem *item = ht->buckets[idx];
    while (item) {
        if (strcmp(item->key, key) == 0) {
            // Update existing item
            char *new_data = malloc(bytes);
            if (!new_data) {
                pthread_mutex_unlock(&ht->locks[idx]);
                return false;
            }

            memcpy(new_data, data, bytes);

            pthread_mutex_lock(&stats.lock);
            stats.bytes_used -= item->bytes;
            stats.bytes_used += bytes;
            pthread_mutex_unlock(&stats.lock);

            free(item->data);
            item->data = new_data;
            item->bytes = bytes;
            item->flags = flags;
            item->exptime = exptime;

            pthread_mutex_unlock(&ht->locks[idx]);
            return true;
        }
        item = item->next;
    }

    // Create new item
    CacheItem *new_item = malloc(sizeof(CacheItem));
    if (!new_item) {
        pthread_mutex_unlock(&ht->locks[idx]);
        return false;
    }

    new_item->key = strdup(key);
    new_item->data = malloc(bytes);
    if (!new_item->key || !new_item->data) {
        free(new_item->key);
        free(new_item->data);
        free(new_item);
        pthread_mutex_unlock(&ht->locks[idx]);
        return false;
    }

    memcpy(new_item->data, data, bytes);
    new_item->bytes = bytes;
    new_item->flags = flags;
    new_item->exptime = exptime;
    new_item->next = ht->buckets[idx];
    ht->buckets[idx] = new_item;

    pthread_mutex_lock(&stats.lock);
    stats.curr_items++;
    stats.total_items++;
    stats.bytes_used += bytes;
    pthread_mutex_unlock(&stats.lock);

    pthread_mutex_unlock(&ht->locks[idx]);
    return true;
}

/**
 * Add value only if key doesn't exist
 */
bool cache_add(HashTable *ht, const char *key, const char *data, size_t bytes, uint32_t flags, time_t exptime) {
    uint32_t idx = hash(key) % ht->size;

    pthread_mutex_lock(&ht->locks[idx]);

    // Check if key exists
    CacheItem *item = ht->buckets[idx];
    while (item) {
        if (strcmp(item->key, key) == 0) {
            // Key exists
            if (!is_expired(item)) {
                pthread_mutex_unlock(&ht->locks[idx]);
                return false;
            }
            // Key expired, will be overwritten below
            break;
        }
        item = item->next;
    }

    pthread_mutex_unlock(&ht->locks[idx]);

    // Use cache_set to add the item
    return cache_set(ht, key, data, bytes, flags, exptime);
}

/**
 * Replace value only if key exists
 */
bool cache_replace(HashTable *ht, const char *key, const char *data, size_t bytes, uint32_t flags, time_t exptime) {
    CacheItem *item = cache_get(ht, key);
    if (!item) return false;

    return cache_set(ht, key, data, bytes, flags, exptime);
}

/**
 * Append data to existing value
 */
bool cache_append(HashTable *ht, const char *key, const char *data, size_t bytes) {
    uint32_t idx = hash(key) % ht->size;

    pthread_mutex_lock(&ht->locks[idx]);

    CacheItem *item = ht->buckets[idx];
    while (item) {
        if (strcmp(item->key, key) == 0) {
            if (is_expired(item)) {
                pthread_mutex_unlock(&ht->locks[idx]);
                return false;
            }

            size_t new_size = item->bytes + bytes;
            char *new_data = realloc(item->data, new_size);
            if (!new_data) {
                pthread_mutex_unlock(&ht->locks[idx]);
                return false;
            }

            memcpy(new_data + item->bytes, data, bytes);
            item->data = new_data;

            pthread_mutex_lock(&stats.lock);
            stats.bytes_used += bytes;
            pthread_mutex_unlock(&stats.lock);

            item->bytes = new_size;

            pthread_mutex_unlock(&ht->locks[idx]);
            return true;
        }
        item = item->next;
    }

    pthread_mutex_unlock(&ht->locks[idx]);
    return false;
}

/**
 * Prepend data to existing value
 */
bool cache_prepend(HashTable *ht, const char *key, const char *data, size_t bytes) {
    uint32_t idx = hash(key) % ht->size;

    pthread_mutex_lock(&ht->locks[idx]);

    CacheItem *item = ht->buckets[idx];
    while (item) {
        if (strcmp(item->key, key) == 0) {
            if (is_expired(item)) {
                pthread_mutex_unlock(&ht->locks[idx]);
                return false;
            }

            size_t new_size = item->bytes + bytes;
            char *new_data = malloc(new_size);
            if (!new_data) {
                pthread_mutex_unlock(&ht->locks[idx]);
                return false;
            }

            memcpy(new_data, data, bytes);
            memcpy(new_data + bytes, item->data, item->bytes);
            free(item->data);
            item->data = new_data;

            pthread_mutex_lock(&stats.lock);
            stats.bytes_used += bytes;
            pthread_mutex_unlock(&stats.lock);

            item->bytes = new_size;

            pthread_mutex_unlock(&ht->locks[idx]);
            return true;
        }
        item = item->next;
    }

    pthread_mutex_unlock(&ht->locks[idx]);
    return false;
}

/**
 * Delete key from cache
 */
bool cache_delete(HashTable *ht, const char *key) {
    uint32_t idx = hash(key) % ht->size;

    pthread_mutex_lock(&ht->locks[idx]);

    CacheItem *item = ht->buckets[idx];
    CacheItem *prev = NULL;

    while (item) {
        if (strcmp(item->key, key) == 0) {
            if (prev) {
                prev->next = item->next;
            } else {
                ht->buckets[idx] = item->next;
            }

            pthread_mutex_lock(&stats.lock);
            stats.curr_items--;
            stats.bytes_used -= item->bytes;
            pthread_mutex_unlock(&stats.lock);

            free(item->key);
            free(item->data);
            free(item);

            pthread_mutex_unlock(&ht->locks[idx]);
            return true;
        }
        prev = item;
        item = item->next;
    }

    pthread_mutex_unlock(&ht->locks[idx]);
    return false;
}

/**
 * Flush all items from cache
 */
void cache_flush_all(HashTable *ht) {
    for (size_t i = 0; i < ht->size; i++) {
        pthread_mutex_lock(&ht->locks[i]);

        CacheItem *item = ht->buckets[i];
        while (item) {
            CacheItem *next = item->next;
            free(item->key);
            free(item->data);
            free(item);
            item = next;
        }
        ht->buckets[i] = NULL;

        pthread_mutex_unlock(&ht->locks[i]);
    }

    pthread_mutex_lock(&stats.lock);
    stats.curr_items = 0;
    stats.bytes_used = 0;
    pthread_mutex_unlock(&stats.lock);
}

/**
 * Send response to client
 */
void send_response(int client_fd, const char *response) {
    send(client_fd, response, strlen(response), 0);
}

/**
 * Handle a command from client
 */
void handle_command(int client_fd, char *command) {
    char *saveptr;
    char *cmd = strtok_r(command, " \r\n", &saveptr);

    if (!cmd) return;

    if (strcmp(cmd, "set") == 0 || strcmp(cmd, "add") == 0 ||
        strcmp(cmd, "replace") == 0 || strcmp(cmd, "append") == 0 ||
        strcmp(cmd, "prepend") == 0) {

        char *key = strtok_r(NULL, " \r\n", &saveptr);
        char *flags_str = strtok_r(NULL, " \r\n", &saveptr);
        char *exptime_str = strtok_r(NULL, " \r\n", &saveptr);
        char *bytes_str = strtok_r(NULL, " \r\n", &saveptr);
        char *noreply = strtok_r(NULL, " \r\n", &saveptr);

        if (!key || !flags_str || !exptime_str || !bytes_str) {
            send_response(client_fd, "ERROR\r\n");
            return;
        }

        uint32_t flags = atoi(flags_str);
        int exptime_val = atoi(exptime_str);
        size_t bytes = atoi(bytes_str);

        // Calculate expiration time
        time_t exptime = 0;
        if (exptime_val > 0) {
            if (exptime_val <= 2592000) {  // 30 days in seconds
                exptime = time(NULL) + exptime_val;
            } else {
                exptime = exptime_val;  // Unix timestamp
            }
        } else if (exptime_val < 0) {
            exptime = 1;  // Immediate expiration
        }

        // Read data block
        char *data = malloc(bytes + 1);
        if (!data) {
            send_response(client_fd, "SERVER_ERROR out of memory\r\n");
            return;
        }

        ssize_t total_read = 0;
        while (total_read < (ssize_t)bytes) {
            ssize_t n = recv(client_fd, data + total_read, bytes - total_read, 0);
            if (n <= 0) {
                free(data);
                return;
            }
            total_read += n;
        }

        // Read trailing \r\n
        char trailing[2];
        recv(client_fd, trailing, 2, 0);

        bool success = false;
        bool should_reply = true;

        if (noreply && strcmp(noreply, "noreply") == 0) {
            should_reply = false;
        }

        if (strcmp(cmd, "set") == 0) {
            success = cache_set(cache, key, data, bytes, flags, exptime);
            pthread_mutex_lock(&stats.lock);
            stats.cmd_set++;
            pthread_mutex_unlock(&stats.lock);
        } else if (strcmp(cmd, "add") == 0) {
            success = cache_add(cache, key, data, bytes, flags, exptime);
        } else if (strcmp(cmd, "replace") == 0) {
            success = cache_replace(cache, key, data, bytes, flags, exptime);
        } else if (strcmp(cmd, "append") == 0) {
            success = cache_append(cache, key, data, bytes);
        } else if (strcmp(cmd, "prepend") == 0) {
            success = cache_prepend(cache, key, data, bytes);
        }

        free(data);

        if (should_reply) {
            if (success) {
                send_response(client_fd, "STORED\r\n");
            } else {
                send_response(client_fd, "NOT_STORED\r\n");
            }
        }

    } else if (strcmp(cmd, "get") == 0) {
        char response[BUFFER_SIZE];
        char *key;

        pthread_mutex_lock(&stats.lock);
        stats.cmd_get++;
        pthread_mutex_unlock(&stats.lock);

        while ((key = strtok_r(NULL, " \r\n", &saveptr)) != NULL) {
            CacheItem *item = cache_get(cache, key);

            if (item) {
                pthread_mutex_lock(&stats.lock);
                stats.get_hits++;
                pthread_mutex_unlock(&stats.lock);

                snprintf(response, sizeof(response), "VALUE %s %u %zu\r\n",
                        key, item->flags, item->bytes);
                send_response(client_fd, response);
                send(client_fd, item->data, item->bytes, 0);
                send_response(client_fd, "\r\n");
            } else {
                pthread_mutex_lock(&stats.lock);
                stats.get_misses++;
                pthread_mutex_unlock(&stats.lock);
            }
        }

        send_response(client_fd, "END\r\n");

    } else if (strcmp(cmd, "delete") == 0) {
        char *key = strtok_r(NULL, " \r\n", &saveptr);

        if (!key) {
            send_response(client_fd, "ERROR\r\n");
            return;
        }

        if (cache_delete(cache, key)) {
            send_response(client_fd, "DELETED\r\n");
        } else {
            send_response(client_fd, "NOT_FOUND\r\n");
        }

    } else if (strcmp(cmd, "flush_all") == 0) {
        cache_flush_all(cache);
        send_response(client_fd, "OK\r\n");

    } else if (strcmp(cmd, "stats") == 0) {
        char response[BUFFER_SIZE];
        pthread_mutex_lock(&stats.lock);

        snprintf(response, sizeof(response),
                "STAT curr_items %lu\r\n"
                "STAT total_items %lu\r\n"
                "STAT bytes %lu\r\n"
                "STAT curr_connections %lu\r\n"
                "STAT total_connections %lu\r\n"
                "STAT cmd_get %lu\r\n"
                "STAT cmd_set %lu\r\n"
                "STAT get_hits %lu\r\n"
                "STAT get_misses %lu\r\n"
                "END\r\n",
                stats.curr_items, stats.total_items, stats.bytes_used,
                stats.curr_connections, stats.total_connections,
                stats.cmd_get, stats.cmd_set, stats.get_hits, stats.get_misses);

        pthread_mutex_unlock(&stats.lock);
        send_response(client_fd, response);

    } else if (strcmp(cmd, "quit") == 0) {
        // Client wants to close connection
        close(client_fd);

    } else {
        send_response(client_fd, "ERROR\r\n");
    }
}

/**
 * Handle client connection
 */
void *handle_client(void *arg) {
    int client_fd = *(int *)arg;
    free(arg);

    pthread_mutex_lock(&stats.lock);
    stats.curr_connections++;
    stats.total_connections++;
    pthread_mutex_unlock(&stats.lock);

    char buffer[BUFFER_SIZE];
    ssize_t n;

    while ((n = recv(client_fd, buffer, sizeof(buffer) - 1, 0)) > 0) {
        buffer[n] = '\0';
        handle_command(client_fd, buffer);
    }

    close(client_fd);

    pthread_mutex_lock(&stats.lock);
    stats.curr_connections--;
    pthread_mutex_unlock(&stats.lock);

    return NULL;
}

/**
 * Signal handler
 */
void signal_handler(int sig) {
    (void)sig;
    server_running = false;
}

/**
 * Main entry point
 */
int main(int argc, char *argv[]) {
    int port = DEFAULT_PORT;

    // Parse command line arguments
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-p") == 0 && i + 1 < argc) {
            port = atoi(argv[i + 1]);
            i++;
        }
    }

    // Initialize cache
    cache = hash_table_create(HASH_SIZE);
    if (!cache) {
        fprintf(stderr, "Failed to create hash table\n");
        return 1;
    }

    // Initialize stats lock
    pthread_mutex_init(&stats.lock, NULL);

    // Setup signal handling
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);

    // Create socket
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        perror("socket");
        hash_table_destroy(cache);
        return 1;
    }

    // Set socket options
    int opt = 1;
    if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
        perror("setsockopt");
        close(server_fd);
        hash_table_destroy(cache);
        return 1;
    }

    // Bind socket
    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(port);

    if (bind(server_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind");
        close(server_fd);
        hash_table_destroy(cache);
        return 1;
    }

    // Listen
    if (listen(server_fd, 10) < 0) {
        perror("listen");
        close(server_fd);
        hash_table_destroy(cache);
        return 1;
    }

    printf("Memcached server listening on port %d\n", port);

    // Accept connections
    while (server_running) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);

        int *client_fd = malloc(sizeof(int));
        if (!client_fd) continue;

        *client_fd = accept(server_fd, (struct sockaddr *)&client_addr, &client_len);
        if (*client_fd < 0) {
            free(client_fd);
            if (errno == EINTR) continue;  // Interrupted by signal
            perror("accept");
            break;
        }

        // Create thread to handle client
        pthread_t thread;
        pthread_attr_t attr;
        pthread_attr_init(&attr);
        pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);

        if (pthread_create(&thread, &attr, handle_client, client_fd) != 0) {
            perror("pthread_create");
            close(*client_fd);
            free(client_fd);
        }

        pthread_attr_destroy(&attr);
    }

    // Cleanup
    close(server_fd);
    hash_table_destroy(cache);
    pthread_mutex_destroy(&stats.lock);

    printf("\nServer shutting down...\n");
    return 0;
}
