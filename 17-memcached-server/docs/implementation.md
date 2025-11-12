# Memcached Server Implementation Guide

This guide walks through the implementation of a Memcached server from scratch, explaining design decisions and implementation details.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Structures](#data-structures)
3. [Hash Table Implementation](#hash-table-implementation)
4. [Command Processing](#command-processing)
5. [Threading Model](#threading-model)
6. [Memory Management](#memory-management)
7. [Expiration Strategy](#expiration-strategy)
8. [Protocol Parsing](#protocol-parsing)

## Architecture Overview

### System Design

```
┌─────────────────────────────────────┐
│         Client Connections          │
│   (Telnet, Libraries, Applications) │
└──────────────┬──────────────────────┘
               │ TCP Socket
               ▼
┌─────────────────────────────────────┐
│          Socket Server              │
│    - Accept connections             │
│    - Create thread per client       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Command Processor             │
│    - Parse text protocol            │
│    - Execute commands               │
│    - Send responses                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Hash Table Cache            │
│    - Store key-value pairs          │
│    - Handle collisions (chaining)   │
│    - Per-bucket locking             │
└─────────────────────────────────────┘
```

### Key Components

1. **TCP Socket Server**: Listens on port 11211, accepts connections
2. **Thread Pool**: One thread per client connection
3. **Hash Table**: Core storage with 10,007 buckets
4. **Protocol Parser**: Handles Memcached text protocol
5. **Statistics Tracker**: Monitors server metrics

## Data Structures

### Cache Item

Each cached item is represented by:

```c
typedef struct CacheItem {
    char *key;              // Key string
    char *data;             // Value data
    uint32_t flags;         // Client flags
    size_t bytes;           // Data size
    time_t exptime;         // Expiration time
    struct CacheItem *next; // Next in chain (for collisions)
} CacheItem;
```

**Design decisions:**

- **Dynamic allocation**: Keys and data allocated on heap for flexibility
- **Chaining**: `next` pointer for collision resolution
- **Metadata**: Flags and exptime stored for protocol compliance

### Hash Table

```c
typedef struct {
    CacheItem **buckets;          // Array of bucket heads
    size_t size;                  // Number of buckets
    pthread_mutex_t *locks;       // One lock per bucket
} HashTable;
```

**Why this design:**

- **Separate chaining**: Simple collision resolution
- **Prime bucket count**: 10,007 for better distribution
- **Fine-grained locking**: Per-bucket locks for concurrency

### Statistics

```c
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
```

Single global stats structure with its own lock.

## Hash Table Implementation

### Hash Function

Using djb2 algorithm for good distribution:

```c
uint32_t hash(const char *key) {
    uint32_t hash = 5381;
    int c;

    while ((c = *key++)) {
        hash = ((hash << 5) + hash) + c;  // hash * 33 + c
    }

    return hash;
}
```

**Properties:**
- Fast: Simple arithmetic operations
- Good distribution: Few collisions
- Deterministic: Same key → same hash

### Bucket Selection

```c
uint32_t idx = hash(key) % ht->size;
```

Using modulo with prime number (10,007) for uniform distribution.

### Collision Resolution

Separate chaining with linked lists:

```
Bucket 0: → [key1, data1] → [key2, data2] → NULL
Bucket 1: → [key3, data3] → NULL
Bucket 2: → NULL
...
```

### Locking Strategy

**Per-bucket locks** instead of global lock:

```c
pthread_mutex_lock(&ht->locks[idx]);
// Access bucket idx
pthread_mutex_unlock(&ht->locks[idx]);
```

**Benefits:**
- Higher concurrency: Multiple threads can access different buckets
- Lower contention: Locks only conflict on same bucket
- Scalability: Performance scales with number of buckets

**Trade-offs:**
- More memory: One mutex per bucket
- Complexity: Must ensure correct lock ordering

## Command Processing

### Command Flow

```
1. Receive data from client socket
   ↓
2. Parse command line
   ↓
3. Execute command
   ↓
4. Send response
```

### Storage Commands (SET, ADD, REPLACE, etc.)

```c
// 1. Parse command line
char *cmd = strtok_r(command, " \r\n", &saveptr);
char *key = strtok_r(NULL, " \r\n", &saveptr);
char *flags_str = strtok_r(NULL, " \r\n", &saveptr);
char *exptime_str = strtok_r(NULL, " \r\n", &saveptr);
char *bytes_str = strtok_r(NULL, " \r\n", &saveptr);

// 2. Read data block
char *data = malloc(bytes);
recv(client_fd, data, bytes, 0);

// 3. Execute operation
bool success = cache_set(cache, key, data, bytes, flags, exptime);

// 4. Send response
send_response(client_fd, success ? "STORED\r\n" : "NOT_STORED\r\n");
```

### Retrieval Commands (GET)

```c
// Support multiple keys: get key1 key2 key3
while ((key = strtok_r(NULL, " \r\n", &saveptr)) != NULL) {
    CacheItem *item = cache_get(cache, key);

    if (item) {
        // Send VALUE response
        snprintf(response, sizeof(response), "VALUE %s %u %zu\r\n",
                key, item->flags, item->bytes);
        send_response(client_fd, response);
        send(client_fd, item->data, item->bytes, 0);
        send_response(client_fd, "\r\n");
    }
}
send_response(client_fd, "END\r\n");
```

## Threading Model

### One Thread Per Client

```c
// Main accept loop
while (server_running) {
    int *client_fd = malloc(sizeof(int));
    *client_fd = accept(server_fd, ...);

    // Create detached thread
    pthread_t thread;
    pthread_attr_t attr;
    pthread_attr_init(&attr);
    pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);
    pthread_create(&thread, &attr, handle_client, client_fd);
}
```

**Why detached threads:**
- Automatic cleanup when thread exits
- No need to join threads
- Simpler resource management

### Client Handler

```c
void *handle_client(void *arg) {
    int client_fd = *(int *)arg;
    free(arg);

    // Update stats
    pthread_mutex_lock(&stats.lock);
    stats.curr_connections++;
    pthread_mutex_unlock(&stats.lock);

    // Process commands
    while (recv(client_fd, buffer, ...) > 0) {
        handle_command(client_fd, buffer);
    }

    // Cleanup
    close(client_fd);
    pthread_mutex_lock(&stats.lock);
    stats.curr_connections--;
    pthread_mutex_unlock(&stats.lock);

    return NULL;
}
```

## Memory Management

### Allocation Strategy

**Per-item allocation:**
```c
CacheItem *item = malloc(sizeof(CacheItem));
item->key = strdup(key);
item->data = malloc(bytes);
```

**Benefits:**
- Flexible: Any key/value size
- Simple: Standard malloc/free
- Portable: Works everywhere

**Trade-offs:**
- Fragmentation: Many small allocations
- Overhead: malloc metadata per allocation
- Performance: Not as fast as slab allocator

### Deallocation

```c
void free_item(CacheItem *item) {
    free(item->key);
    free(item->data);
    free(item);
}
```

### APPEND/PREPEND Optimization

**APPEND uses realloc:**
```c
size_t new_size = item->bytes + bytes;
char *new_data = realloc(item->data, new_size);
memcpy(new_data + item->bytes, data, bytes);
item->data = new_data;
```

**PREPEND needs new allocation:**
```c
size_t new_size = item->bytes + bytes;
char *new_data = malloc(new_size);
memcpy(new_data, data, bytes);              // New data first
memcpy(new_data + bytes, item->data, item->bytes);  // Old data after
free(item->data);
item->data = new_data;
```

## Expiration Strategy

### Lazy Expiration

Items are **not** actively removed when they expire. Instead:

```c
bool is_expired(CacheItem *item) {
    if (item->exptime == 0) return false;  // Never expires
    return time(NULL) >= item->exptime;
}
```

Items are checked and removed during:
- GET operations
- REPLACE operations
- Any operation that accesses the item

### Expiration Time Calculation

```c
time_t exptime = 0;
if (exptime_val > 0) {
    if (exptime_val <= 2592000) {  // 30 days
        // Relative: seconds from now
        exptime = time(NULL) + exptime_val;
    } else {
        // Absolute: Unix timestamp
        exptime = exptime_val;
    }
} else if (exptime_val < 0) {
    exptime = 1;  // Immediate expiration
}
// exptime_val == 0: never expires (exptime stays 0)
```

### Removal on Access

```c
CacheItem *cache_get(HashTable *ht, const char *key) {
    // Find item
    while (item) {
        if (strcmp(item->key, key) == 0) {
            // Check expiration
            if (is_expired(item)) {
                // Remove from chain
                if (prev) {
                    prev->next = item->next;
                } else {
                    ht->buckets[idx] = item->next;
                }
                free_item(item);
                return NULL;
            }
            return item;
        }
        prev = item;
        item = item->next;
    }
    return NULL;
}
```

## Protocol Parsing

### Command Line Format

```
<command> <key> <flags> <exptime> <bytes> [noreply]\r\n
```

### Parsing with strtok_r

```c
char *saveptr;
char *cmd = strtok_r(command, " \r\n", &saveptr);
char *key = strtok_r(NULL, " \r\n", &saveptr);
// ... parse remaining fields
```

**Why strtok_r:**
- Thread-safe (unlike strtok)
- Simple API
- Handles whitespace automatically

### Reading Data Block

After command line, read exact number of bytes:

```c
size_t bytes = atoi(bytes_str);
char *data = malloc(bytes);

ssize_t total_read = 0;
while (total_read < (ssize_t)bytes) {
    ssize_t n = recv(client_fd, data + total_read,
                     bytes - total_read, 0);
    if (n <= 0) break;  // Error or EOF
    total_read += n;
}

// Read trailing \r\n
char trailing[2];
recv(client_fd, trailing, 2, 0);
```

**Important:** Must read exact byte count, not rely on \r\n terminator (binary data may contain \r\n).

### Response Format

```c
void send_response(int client_fd, const char *response) {
    send(client_fd, response, strlen(response), 0);
}

// Usage:
send_response(client_fd, "STORED\r\n");
send_response(client_fd, "NOT_FOUND\r\n");
```

## Performance Optimizations

### 1. Fine-Grained Locking

Per-bucket locks allow concurrent access to different buckets:

```c
// Thread A accessing bucket 100
pthread_mutex_lock(&ht->locks[100]);
// ...
pthread_mutex_unlock(&ht->locks[100]);

// Thread B can simultaneously access bucket 200
pthread_mutex_lock(&ht->locks[200]);
// ...
pthread_mutex_unlock(&ht->locks[200]);
```

### 2. Efficient Hash Function

djb2 is fast (no expensive operations) and produces good distribution.

### 3. Detached Threads

No need to track or join threads - automatic cleanup.

### 4. Buffered Socket I/O

Kernel buffers socket data, reducing syscalls.

## Limitations and Extensions

### Current Limitations

1. **No size limit**: Memory can grow unbounded
2. **No LRU eviction**: Old items never removed automatically
3. **Fixed hash table**: Cannot resize at runtime
4. **No persistence**: Data lost on restart

### Possible Extensions

**1. LRU Eviction:**
```c
typedef struct {
    CacheItem *head, *tail;  // Doubly-linked list
    size_t max_bytes;
    // ... evict from tail when full
} LRUCache;
```

**2. Dynamic Resizing:**
```c
void hash_table_resize(HashTable *ht, size_t new_size) {
    // Allocate new buckets
    // Rehash all items
    // Free old buckets
}
```

**3. Slab Allocator:**
```c
// Pre-allocate memory pools for common sizes
SlabAllocator *slab = slab_create();
void *mem = slab_alloc(slab, 64);  // From 64-byte pool
```

**4. Binary Protocol:**
```c
// More efficient than text protocol
// Fixed-size headers, no parsing overhead
typedef struct {
    uint8_t magic;
    uint8_t opcode;
    uint16_t key_len;
    uint32_t body_len;
    // ...
} BinaryHeader;
```

## Testing Strategy

### Unit Tests

Test individual functions:
- Hash function distribution
- Bucket selection
- Expiration logic
- Command parsing

### Integration Tests

Test complete operations:
- SET → GET → DELETE
- ADD vs REPLACE behavior
- APPEND/PREPEND correctness
- Expiration timing

### Concurrent Tests

Test thread safety:
- Multiple clients simultaneously
- Race conditions
- Deadlock prevention

### Performance Tests

Measure:
- Requests per second
- Latency percentiles
- Memory usage
- Thread scalability

## Summary

Key implementation highlights:

| Aspect | Implementation | Rationale |
|--------|----------------|-----------|
| **Storage** | Hash table with chaining | O(1) average lookup |
| **Concurrency** | Per-bucket locks | High parallelism |
| **Threading** | One thread per client | Simple, scalable |
| **Expiration** | Lazy deletion | Low overhead |
| **Protocol** | Text parsing | Simple, debuggable |
| **Memory** | malloc/free | Flexible, portable |

The implementation balances simplicity, correctness, and performance while remaining easy to understand and extend.

For protocol details, see `protocol.md`.
For usage examples, see `examples.md`.
