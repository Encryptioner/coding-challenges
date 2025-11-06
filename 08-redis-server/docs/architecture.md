# Redis Server Architecture

## System Overview

This Redis server implementation is designed as a layered architecture, where each layer has a specific responsibility. This separation makes the code easier to understand, test, and extend.

```
┌─────────────────────────────────────────────────┐
│                 User / Client                    │
│              (redis-cli, app, etc.)             │
└────────────────────┬────────────────────────────┘
                     │ TCP Connection
                     │ (Port 6379)
┌────────────────────▼────────────────────────────┐
│                Network Layer                     │
│  • TCP Server (socket, bind, listen, accept)   │
│  • Client connection handling                   │
│  • Send/Receive bytes                           │
└────────────────────┬────────────────────────────┘
                     │ Raw bytes
                     │
┌────────────────────▼────────────────────────────┐
│              Protocol Layer (RESP)               │
│  • Parse RESP messages                          │
│  • Serialize responses                          │
│  • Type conversion                              │
└────────────────────┬────────────────────────────┘
                     │ Structured data
                     │ (RESPValue)
┌────────────────────▼────────────────────────────┐
│              Command Parser                      │
│  • Extract command name                         │
│  • Extract arguments                            │
│  • Validate argument count                      │
│  • Dispatch to handlers                         │
└────────────────────┬────────────────────────────┘
                     │ Command + Args
                     │
┌────────────────────▼────────────────────────────┐
│            Command Handlers                      │
│  • cmd_ping() - Handle PING                     │
│  • cmd_set() - Handle SET                       │
│  • cmd_get() - Handle GET                       │
│  • cmd_del() - Handle DEL                       │
│  • etc...                                       │
└────────────────────┬────────────────────────────┘
                     │ Data operations
                     │
┌────────────────────▼────────────────────────────┐
│              Data Store Layer                    │
│  • Hash table (key-value storage)               │
│  • Expiration tracking                          │
│  • Memory management                            │
└─────────────────────────────────────────────────┘
```

## Layer-by-Layer Breakdown

### 1. Network Layer

**Responsibility:** Handle TCP connections and raw byte I/O

**Key Components:**
```c
int server_fd;              // Server socket
struct sockaddr_in addr;    // Server address
int client_fd;              // Client socket
```

**Flow:**
1. `socket()` - Create server socket
2. `bind()` - Bind to port 6379
3. `listen()` - Start listening
4. `accept()` - Accept client connections (blocking)
5. `recv()` - Receive bytes from client
6. `send()` - Send bytes to client
7. `close()` - Close connection

**Code:**
```c
// Create socket
int server_fd = socket(AF_INET, SOCK_STREAM, 0);

// Bind to port
struct sockaddr_in addr;
addr.sin_family = AF_INET;
addr.sin_addr.s_addr = INADDR_ANY;
addr.sin_port = htons(port);
bind(server_fd, (struct sockaddr*)&addr, sizeof(addr));

// Listen
listen(server_fd, MAX_CLIENTS);

// Accept clients
while (1) {
    int client_fd = accept(server_fd, ...);
    handle_client(client_fd);
}
```

**Why this layer?**
- Separates networking from business logic
- Easy to swap TCP for Unix sockets
- Can add TLS/SSL here without changing other layers

### 2. Protocol Layer (RESP)

**Responsibility:** Convert between RESP bytes and structured data

**Key Components:**
```c
typedef struct RESPValue {
    RESPType type;
    union {
        char *str;
        long integer;
        struct {
            RESPValue **elements;
            int count;
        } array;
    } data;
} RESPValue;
```

**Key Functions:**
- `resp_parse()` - Bytes → RESPValue
- `resp_serialize()` - RESPValue → Bytes
- `resp_free()` - Clean up memory

**Parsing Example:**
```c
Input bytes: "*2\r\n$3\r\nGET\r\n$3\r\nfoo\r\n"

After parsing:
RESPValue {
    type: RESP_ARRAY,
    data: {
        array: {
            count: 2,
            elements: [
                { type: RESP_BULK_STRING, data: { str: "GET" } },
                { type: RESP_BULK_STRING, data: { str: "foo" } }
            ]
        }
    }
}
```

**Why this layer?**
- Protocol independent of commands
- Easy to test in isolation
- Could support multiple protocols (RESP2, RESP3)

### 3. Command Parser

**Responsibility:** Extract command and arguments, dispatch to handlers

**Flow:**
```
Input: RESPValue (array of bulk strings)
  ↓
Extract command name (first element)
  ↓
Extract arguments (remaining elements)
  ↓
Validate argument types
  ↓
Convert command to uppercase
  ↓
Dispatch to handler function
  ↓
Output: RESPValue (response)
```

**Code:**
```c
RESPValue *execute_command(RESPValue *cmd) {
    // Extract command and args
    char *command = cmd->data.array.elements[0]->data.str;
    char **argv = ...;  // All elements
    int argc = cmd->data.array.count;

    // Normalize command (uppercase)
    for (char *p = command; *p; p++) {
        *p = toupper(*p);
    }

    // Dispatch
    if (strcmp(command, "GET") == 0) {
        return cmd_get(argc, argv);
    } else if (strcmp(command, "SET") == 0) {
        return cmd_set(argc, argv);
    }
    // ...
}
```

**Why this layer?**
- Clean separation: parsing vs execution
- Easy to add new commands
- Centralized validation and error handling

### 4. Command Handlers

**Responsibility:** Implement Redis command logic

**Handler Pattern:**
```c
RESPValue *cmd_name(int argc, char **argv) {
    // 1. Validate arguments
    if (argc < required) {
        return resp_create_error("ERR wrong number of arguments");
    }

    // 2. Execute command logic
    char *result = store_get(&store, argv[1]);

    // 3. Return RESP response
    if (result) {
        return resp_create_bulk_string(result);
    } else {
        return resp_create_null();
    }
}
```

**Implemented Commands:**

| Command | Args | Returns | Example |
|---------|------|---------|---------|
| PING | [message] | Simple string or bulk string | `PING` → `+PONG\r\n` |
| ECHO | message | Bulk string | `ECHO hi` → `$2\r\nhi\r\n` |
| SET | key value [EX seconds] | Simple string | `SET k v` → `+OK\r\n` |
| GET | key | Bulk string or null | `GET k` → `$1\r\nv\r\n` |
| DEL | key [key ...] | Integer | `DEL k` → `:1\r\n` |
| EXISTS | key [key ...] | Integer | `EXISTS k` → `:1\r\n` |
| KEYS | * | Array | `KEYS *` → `*2\r\n...` |

**Why this layer?**
- Each command is independent
- Easy to unit test
- Clear interface (argc/argv → RESPValue)

### 5. Data Store Layer

**Responsibility:** Manage in-memory key-value storage

**Data Structure:**
```c
typedef struct KeyValue {
    char *key;
    char *value;
    time_t expiry;           // 0 = no expiry
    struct KeyValue *next;   // For collision handling
} KeyValue;

typedef struct {
    KeyValue *buckets[HASH_TABLE_SIZE];  // 1024 buckets
    int count;                            // Number of keys
} DataStore;
```

**Hash Table Design:**

```
Hash("foo") = 42
Hash("bar") = 42  ← Collision!
Hash("baz") = 7

buckets[7]:  → [baz: "value3"] → NULL

buckets[42]: → [foo: "value1"] → [bar: "value2"] → NULL
                ↑                  ↑
                First entry        Collision chain
```

**Core Operations:**

**SET (Insert/Update):**
```c
1. Hash the key → bucket index
2. Search bucket for existing key
3. If found: Update value
4. If not found: Create new entry, add to front of chain
```

**GET (Lookup):**
```c
1. Hash the key → bucket index
2. Walk the chain, comparing keys
3. If found: Check expiry, return value
4. If not found: Return NULL
```

**DEL (Delete):**
```c
1. Hash the key → bucket index
2. Walk the chain, find key
3. If found: Unlink from chain, free memory
4. Return 1 if deleted, 0 if not found
```

**Time Complexity:**
- Average case: O(1) for all operations
- Worst case: O(n) if all keys hash to same bucket
- With good hash function: chains are short (~1-3 entries)

**Why this design?**
- Simple to implement
- Fast O(1) operations
- No external dependencies
- Easy to extend (e.g., add LRU eviction)

## Data Flow Example

Let's trace a complete request: `SET foo bar`

### Step 1: Client sends RESP
```
*3\r\n$3\r\nSET\r\n$3\r\nfoo\r\n$3\r\nbar\r\n
```

### Step 2: Network Layer receives bytes
```c
recv(client_fd, buffer, size, 0);
// buffer now contains the bytes above
```

### Step 3: Protocol Layer parses RESP
```c
const char *p = buffer;
RESPValue *cmd = resp_parse(&p);

// Results in:
RESPValue {
    type: RESP_ARRAY,
    data: {
        array: {
            count: 3,
            elements: [
                {type: RESP_BULK_STRING, data: {str: "SET"}},
                {type: RESP_BULK_STRING, data: {str: "foo"}},
                {type: RESP_BULK_STRING, data: {str: "bar"}}
            ]
        }
    }
}
```

### Step 4: Command Parser extracts and dispatches
```c
char *command = "SET";  // from elements[0]
char *argv[] = {"SET", "foo", "bar"};
int argc = 3;

// Dispatch to handler
result = cmd_set(argc, argv);
```

### Step 5: Command Handler executes
```c
RESPValue *cmd_set(int argc, char **argv) {
    // argv[0] = "SET"
    // argv[1] = "foo" (key)
    // argv[2] = "bar" (value)

    store_set(&store, "foo", "bar", 0);
    return resp_create_simple_string("OK");
}
```

### Step 6: Data Store updates
```c
unsigned int idx = hash("foo");  // → 42
buckets[42] = new KeyValue {
    key: "foo",
    value: "bar",
    expiry: 0,
    next: buckets[42]  // Insert at front
};
```

### Step 7: Protocol Layer serializes response
```c
RESPValue response = {
    type: RESP_SIMPLE_STRING,
    data: {str: "OK"}
};

resp_serialize(&response, buffer);
// buffer = "+OK\r\n"
```

### Step 8: Network Layer sends response
```c
send(client_fd, buffer, strlen(buffer), 0);
```

### Step 9: Client receives
```
+OK\r\n
```

## Concurrency Model

### Current: Single-Threaded

```
Main Thread:
  ├─ accept() client1
  ├─ handle_client(client1)  ← Blocks until client1 disconnects
  ├─ accept() client2
  ├─ handle_client(client2)
  └─ ...
```

**Pros:**
- Simple, no race conditions
- No locking needed
- Predictable behavior

**Cons:**
- One client at a time
- Slow client blocks everyone
- Poor CPU utilization

### Future: Multi-Threaded

```
Main Thread:
  ├─ accept() client1 → spawn thread1
  ├─ accept() client2 → spawn thread2
  ├─ accept() client3 → spawn thread3
  └─ ...

Thread1: handle_client(client1)
Thread2: handle_client(client2)
Thread3: handle_client(client3)
```

**Required changes:**
- Add thread creation: `pthread_create()`
- Add mutex around data store
- Handle thread cleanup

**Code:**
```c
pthread_mutex_t store_lock = PTHREAD_MUTEX_INITIALIZER;

void store_set(...) {
    pthread_mutex_lock(&store_lock);
    // ... update data ...
    pthread_mutex_unlock(&store_lock);
}
```

### Future: Event-Driven (epoll/kqueue)

```
Main Loop:
  ├─ epoll_wait() → events
  │   ├─ Event: New connection → accept()
  │   ├─ Event: Data on client1 → read() + process()
  │   ├─ Event: Data on client2 → read() + process()
  │   └─ Event: Write ready → send()
  └─ Repeat
```

**Pros:**
- Scales to thousands of clients
- Single-threaded (no locking)
- Efficient CPU usage

**Cons:**
- More complex code
- Platform-specific (epoll vs kqueue)
- Requires non-blocking I/O

## Memory Management

### Allocation Strategy

**Stack vs Heap:**
```c
// Stack (fast, automatic cleanup)
char buffer[4096];           // Fixed-size buffer
RESPValue value;            // Temporary value

// Heap (flexible, manual cleanup)
char *key = strdup(str);    // Dynamic string
KeyValue *kv = malloc(...); // Data store entry
```

**When to use each:**
- Stack: Temporary buffers, local variables
- Heap: Stored data (keys, values), dynamic sizes

### Memory Lifecycle

**Request handling:**
```c
1. Receive bytes → stack buffer
2. Parse RESP → heap RESPValue
3. Execute command → may allocate data store entries
4. Create response → heap RESPValue
5. Serialize → stack buffer
6. Free request RESPValue
7. Free response RESPValue
```

**Data store:**
```c
// On SET:
malloc(sizeof(KeyValue));
strdup(key);
strdup(value);

// On DEL:
free(kv->key);
free(kv->value);
free(kv);
```

### Avoiding Memory Leaks

**Pattern: RAII-style cleanup**
```c
RESPValue *cmd = resp_parse(buffer);
if (!cmd) return;

RESPValue *result = execute_command(cmd);
resp_free(cmd);  // ← Always free request

int len = resp_serialize(result, buffer);
resp_free(result);  // ← Always free response

send(client_fd, buffer, len, 0);
```

**Common leak sources:**
1. Forgetting to free RESP values
2. Error paths that skip cleanup
3. Strdup'd strings not freed

**Solution: Valgrind**
```bash
valgrind --leak-check=full ./redis-server
```

## Performance Characteristics

### Time Complexity

| Operation | Average | Worst | Notes |
|-----------|---------|-------|-------|
| SET | O(1) | O(n) | n = keys in same bucket |
| GET | O(1) | O(n) | n = keys in same bucket |
| DEL | O(1) | O(n) | n = keys in same bucket |
| EXISTS | O(1) | O(n) | n = keys in same bucket |
| KEYS | O(n) | O(n) | n = total keys |

### Space Complexity

**Per key-value pair:**
```c
sizeof(KeyValue) +        // ~32 bytes (struct)
strlen(key) + 1 +         // key string
strlen(value) + 1 +       // value string
sizeof(void*) * 2         // malloc overhead
≈ 50 + len(key) + len(value) bytes
```

**Total memory:**
```
Memory = (num_keys * avg_entry_size) + (HASH_TABLE_SIZE * sizeof(void*))
       = (100,000 * 100 bytes) + (1024 * 8 bytes)
       ≈ 10 MB for 100k keys
```

### Throughput

**Single-threaded (approximate):**
- SET: ~10,000 ops/sec
- GET: ~15,000 ops/sec
- PING: ~20,000 ops/sec

**Bottlenecks:**
1. Network I/O (recv/send)
2. Memory allocation (malloc/free)
3. String copying (strdup)

**Optimizations:**
- Buffer pooling (reuse buffers)
- String interning (share common strings)
- Better hash function (fewer collisions)
- Multi-threading (parallel processing)

## Error Handling Philosophy

### Fail Fast, Fail Clearly

**Bad:**
```c
result = store_get(key);
// What if key not found? Return NULL? Empty string? Error code?
```

**Good:**
```c
char *value = store_get(&store, key);
if (value) {
    return resp_create_bulk_string(value);
} else {
    return resp_create_null();  // Clear: key doesn't exist
}
```

### Errors as Values

```c
// Don't throw exceptions (C doesn't have them)
// Don't use error codes (easy to ignore)
// Return error RESP values

if (argc < 2) {
    return resp_create_error("ERR wrong number of arguments");
}
```

### Validate Early

```c
// At command parser level
if (cmd->type != RESP_ARRAY) {
    return resp_create_error("ERR protocol error");
}

// At handler level
if (argc < required_args) {
    return resp_create_error("ERR wrong number of arguments");
}

// At data layer
// (No validation - assume command layer validated)
```

## Extensibility

### Adding a New Command

**Step 1: Add handler function**
```c
RESPValue *cmd_incr(int argc, char **argv) {
    if (argc < 2) {
        return resp_create_error("ERR wrong number of arguments");
    }

    char *value = store_get(&store, argv[1]);
    long num = value ? atol(value) : 0;
    num++;

    char buf[32];
    snprintf(buf, sizeof(buf), "%ld", num);
    store_set(&store, argv[1], buf, 0);

    return resp_create_integer(num);
}
```

**Step 2: Add dispatch case**
```c
if (strcmp(command, "INCR") == 0) {
    return cmd_incr(argc, argv);
}
```

**Done!** The layered architecture means:
- No changes to network layer
- No changes to protocol layer
- No changes to data store
- Just add handler + dispatch

## Summary

This architecture provides:
- ✅ **Clear separation** - Each layer has one job
- ✅ **Testability** - Test each layer independently
- ✅ **Extensibility** - Add commands easily
- ✅ **Maintainability** - Easy to understand and modify
- ✅ **Performance** - O(1) operations, efficient memory use

The design balances simplicity (single-threaded, simple hash table) with real-world usability (RESP protocol, multiple commands, expiration support).
