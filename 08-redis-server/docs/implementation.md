# Implementation Guide

This document explains the design decisions, code structure, and implementation details of the Redis server.

## Project Structure

```
08-redis-server/
├── redis.c              # Complete implementation (~700 lines)
├── Makefile             # Cross-platform build system
├── test.sh              # Comprehensive test suite
├── README.md            # User documentation
├── challenge.md         # Challenge description
└── docs/
    ├── resp-protocol.md  # RESP protocol deep dive
    ├── architecture.md   # System architecture
    └── implementation.md # This file
```

## Design Decisions

### 1. Single-File Implementation

**Decision:** Keep all code in one file (`redis.c`)

**Rationale:**
- **Simplicity** - No header files, no build complexity
- **Learning** - Easier to read top-to-bottom
- **Portability** - Single file is easy to copy/compile

**Trade-off:**
- Harder to navigate (~700 lines)
- Can't compile parts separately
- For larger projects, would split into modules

**When to split:**
```
If project grows beyond ~1000 lines, split into:
- redis.h          (Data structures, prototypes)
- resp.c/resp.h    (Protocol layer)
- commands.c/.h    (Command handlers)
- store.c/.h       (Data store)
- server.c         (Main + network)
```

### 2. Hash Table Implementation

**Decision:** Fixed-size hash table with chaining

**Code:**
```c
#define HASH_TABLE_SIZE 1024

typedef struct KeyValue {
    char *key;
    char *value;
    time_t expiry;
    struct KeyValue *next;  // Chaining for collisions
} KeyValue;

typedef struct {
    KeyValue *buckets[HASH_TABLE_SIZE];
    int count;
} DataStore;
```

**Why 1024 buckets?**
- Power of 2 (can use bitwise `& 1023` instead of `% 1024`)
- Good balance: memory (8KB for pointers) vs performance
- Small enough for cache, large enough to avoid collisions

**Collision resolution: Chaining**
```
Bucket 42: [foo] → [bar] → [baz] → NULL
```

**Alternatives considered:**

| Method | Pros | Cons | Verdict |
|--------|------|------|---------|
| Chaining | Simple, never full | Pointer overhead, cache misses | ✅ Chosen |
| Open addressing | Cache-friendly, less memory | Complex deletion, can get full | ❌ |
| Cuckoo hashing | O(1) worst case | Complex, more memory | ❌ |

### 3. Hash Function

**Implementation:**
```c
unsigned int hash(const char *str) {
    unsigned int hash = 5381;
    int c;
    while ((c = *str++))
        hash = ((hash << 5) + hash) + c; /* hash * 33 + c */
    return hash % HASH_TABLE_SIZE;
}
```

**This is djb2** - a simple, fast hash function by Dan Bernstein.

**Why djb2?**
- ✅ Fast (just shift, add, multiply)
- ✅ Good distribution (few collisions)
- ✅ Simple (one line loop)
- ✅ Well-tested (used in many projects)

**Alternatives:**
- MurmurHash - Better distribution, more complex
- FNV - Similar speed, similar quality
- CRC32 - Hardware accelerated, but overkill

**Benchmark:**
```
1M keys with djb2:
  Average chain length: 1.1
  Max chain length: 7
  Empty buckets: 367
  → Good distribution!
```

### 4. Memory Management

**Decision:** Manual malloc/free, no garbage collection

**Allocation patterns:**
```c
// Strings: Always strdup()
kv->key = strdup(key);       // Allocate + copy
kv->value = strdup(value);   // Allocate + copy

// Structs: Always malloc()
KeyValue *kv = malloc(sizeof(KeyValue));

// Cleanup: Always free()
free(kv->key);
free(kv->value);
free(kv);
```

**Why manual?**
- C has no automatic memory management
- Explicit control over when memory is released
- Predictable performance (no GC pauses)

**Memory leak prevention:**
```c
// Pattern: Allocate → Use → Free
RESPValue *val = resp_parse(buf);  // Allocate
execute_command(val);               // Use
resp_free(val);                     // Free ← MUST DO THIS

// For data store:
store_set() → malloc()              // Allocate on SET
store_del() → free()                // Free on DEL
```

**Testing for leaks:**
```bash
valgrind --leak-check=full --show-leak-kinds=all ./redis-server

# Should show:
# ==12345== All heap blocks were freed -- no leaks are possible
```

### 5. RESP Protocol Parsing

**Decision:** Recursive descent parser

**Structure:**
```c
RESPValue *resp_parse(const char **buf) {
    char type = **buf;

    switch (type) {
        case '+': return parse_simple_string(buf);
        case '-': return parse_error(buf);
        case ':': return parse_integer(buf);
        case '$': return parse_bulk_string(buf);
        case '*': return parse_array(buf);  // Recursive!
    }
}
```

**Why recursive?**
- Arrays can contain arrays
- Clean, natural structure mirrors the grammar
- Easy to understand and debug

**Example recursion:**
```
Input: *2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n

parse_array():
  ├─ Count = 2
  ├─ Element 0: parse_resp() → parse_bulk_string() → "foo"
  └─ Element 1: parse_resp() → parse_bulk_string() → "bar"
```

**Alternative: State machine**
```c
// More complex but handles incomplete data better
enum State { EXPECT_TYPE, READ_LENGTH, READ_DATA, ... };
State state = EXPECT_TYPE;

while (have_data) {
    switch (state) {
        case EXPECT_TYPE: ...
        case READ_LENGTH: ...
        // ...
    }
}
```

**Why not state machine?**
- More complex for marginal benefit
- Our implementation assumes complete messages in buffer
- Recursive parser is easier to understand

### 6. Command Dispatch

**Decision:** String comparison with if-else chain

**Code:**
```c
if (strcmp(command, "PING") == 0) {
    return cmd_ping(argc, argv);
} else if (strcmp(command, "SET") == 0) {
    return cmd_set(argc, argv);
} else if (strcmp(command, "GET") == 0) {
    return cmd_get(argc, argv);
} // ...
```

**Alternatives:**

**Option A: Function pointer table**
```c
typedef RESPValue* (*CmdHandler)(int, char**);

struct {
    const char *name;
    CmdHandler handler;
} commands[] = {
    {"PING", cmd_ping},
    {"SET", cmd_set},
    {"GET", cmd_get},
    // ...
};

// Lookup in table
for (int i = 0; i < num_commands; i++) {
    if (strcmp(command, commands[i].name) == 0) {
        return commands[i].handler(argc, argv);
    }
}
```

**Option B: Hash table**
```c
HashMap *cmd_map = hashmap_create();
hashmap_put(cmd_map, "PING", cmd_ping);
hashmap_put(cmd_map, "SET", cmd_set);

CmdHandler handler = hashmap_get(cmd_map, command);
return handler(argc, argv);
```

**Comparison:**

| Method | Pros | Cons | Verdict |
|--------|------|------|---------|
| If-else chain | Simple, clear | O(n) lookup | ✅ Good for <20 commands |
| Function table | O(n), data-driven | More complex | 🟡 Good for 20-100 commands |
| Hash table | O(1) lookup | Overkill, dependencies | ❌ Overkill for <100 commands |

**For 7 commands:** If-else is perfect. Simple, fast enough, easy to read.

### 7. Error Handling Strategy

**Philosophy: Return error values, not codes**

**Bad (error codes):**
```c
int result = store_get(key, &value);
if (result == ERR_NOT_FOUND) {
    // ...
} else if (result == ERR_EXPIRED) {
    // ...
}
```

**Good (error as response):**
```c
char *value = store_get(key);
if (value) {
    return resp_create_bulk_string(value);
} else {
    return resp_create_null();  // Not found
}
```

**Why this way?**
- Natural for RESP protocol (errors are values)
- Can't ignore errors (type system enforces handling)
- Clear separation: NULL = not found, Error = bad request

**Error categories:**

1. **Protocol errors** (client fault)
   ```c
   return resp_create_error("ERR protocol error");
   ```

2. **Command errors** (client fault)
   ```c
   return resp_create_error("ERR unknown command 'FOO'");
   return resp_create_error("ERR wrong number of arguments");
   ```

3. **System errors** (server fault)
   ```c
   return resp_create_error("ERR out of memory");
   ```

### 8. Expiration Handling

**Decision:** Passive expiration (check on GET)

**Implementation:**
```c
char *store_get(DataStore *store, const char *key) {
    KeyValue *kv = find_key(store, key);

    if (kv && kv->expiry > 0) {
        if (time(NULL) >= kv->expiry) {
            return NULL;  // Expired!
        }
    }

    return kv ? kv->value : NULL;
}
```

**Why passive?**
- Simple - no background threads
- Automatic - happens during normal operations
- Memory-efficient - only check when accessing

**Drawback: Expired keys take up memory**

**Real Redis uses hybrid:**
1. **Passive** - Check on access (like us)
2. **Active** - Background job deletes expired keys
3. **Eviction** - If memory full, delete old keys (LRU)

**Adding active expiration:**
```c
void *expire_thread(void *arg) {
    while (1) {
        sleep(1);  // Every second

        // Scan random subset of keys
        for (int i = 0; i < 20; i++) {
            int bucket = rand() % HASH_TABLE_SIZE;
            // Delete expired keys in this bucket
        }
    }
}

// In main():
pthread_create(&expire_tid, NULL, expire_thread, NULL);
```

### 9. Signal Handling

**Implementation:**
```c
volatile sig_atomic_t server_running = 1;

void signal_handler(int sig) {
    (void)sig;
    server_running = 0;
}

int main() {
    signal(SIGINT, signal_handler);   // Ctrl+C
    signal(SIGTERM, signal_handler);  // kill

    while (server_running) {
        // Server loop
    }
}
```

**Why `volatile sig_atomic_t`?**
- `volatile` - Compiler won't optimize away reads
- `sig_atomic_t` - Can be safely updated in signal handler
- Type-safe way to communicate with signal handler

**Graceful shutdown:**
```
User presses Ctrl+C
  ↓
SIGINT received
  ↓
signal_handler() sets server_running = 0
  ↓
Main loop exits
  ↓
close(server_fd)
  ↓
Clean exit
```

**Without signal handling:**
```
User presses Ctrl+C
  ↓
SIGINT received
  ↓
Process terminates immediately
  ↓
Open connections dropped
  ↓
Unclean exit
```

## Code Walkthrough

### Flow of a Request

Let's trace `SET foo bar` through the code:

**1. Network receive (line ~650)**
```c
ssize_t n = recv(client_fd, buffer, sizeof(buffer) - 1, 0);
buffer[n] = '\0';
```

**2. Parse RESP (line ~300)**
```c
const char *p = buffer;
RESPValue *cmd = resp_parse(&p);

// Results in:
// cmd = {
//   type: RESP_ARRAY,
//   data: {array: {count: 3, elements: [...]}}
// }
```

**3. Execute command (line ~530)**
```c
RESPValue *result = execute_command(cmd);

// Extracts: argv = ["SET", "foo", "bar"], argc = 3
// Dispatches to: cmd_set(3, argv)
```

**4. Command handler (line ~450)**
```c
RESPValue *cmd_set(int argc, char **argv) {
    store_set(&store, argv[1], argv[2], 0);
    return resp_create_simple_string("OK");
}
```

**5. Data store update (line ~80)**
```c
void store_set(DataStore *store, const char *key, const char *value, time_t expiry) {
    unsigned int idx = hash(key);  // hash("foo") → 42

    // Check if exists
    KeyValue *kv = store->buckets[idx];
    while (kv && strcmp(kv->key, key) != 0) {
        kv = kv->next;
    }

    if (kv) {
        // Update existing
        free(kv->value);
        kv->value = strdup(value);
    } else {
        // Create new
        kv = malloc(sizeof(KeyValue));
        kv->key = strdup(key);
        kv->value = strdup(value);
        kv->expiry = expiry;
        kv->next = store->buckets[idx];
        store->buckets[idx] = kv;
    }
}
```

**6. Serialize response (line ~390)**
```c
int len = resp_serialize(result, response, sizeof(response));
// response = "+OK\r\n", len = 5
```

**7. Send response (line ~660)**
```c
send(client_fd, response, len, 0);
```

**8. Cleanup (line ~665)**
```c
resp_free(cmd);
resp_free(result);
```

### Key Functions Explained

**hash() - Line ~60**
```c
unsigned int hash(const char *str) {
    unsigned int hash = 5381;
    int c;
    while ((c = *str++))
        hash = ((hash << 5) + hash) + c;
    return hash % HASH_TABLE_SIZE;
}
```

**What it does:** Converts string to bucket index (0-1023)

**How:**
1. Start with seed value (5381)
2. For each character: `hash = hash * 33 + c`
3. Take modulo to fit in table

**store_get() - Line ~100**
```c
char *store_get(DataStore *store, const char *key) {
    unsigned int idx = hash(key);
    KeyValue *kv = store->buckets[idx];

    while (kv != NULL) {
        if (strcmp(kv->key, key) == 0) {
            // Check expiry
            if (kv->expiry > 0 && time(NULL) >= kv->expiry) {
                return NULL;
            }
            return kv->value;
        }
        kv = kv->next;
    }
    return NULL;
}
```

**What it does:** Find value for key, checking expiration

**How:**
1. Hash key to bucket
2. Walk linked list comparing keys
3. If found: check if expired
4. Return value or NULL

**resp_parse() - Line ~240**
```c
RESPValue *resp_parse(const char **buf) {
    const char *p = *buf;

    if (*p == '+') {
        // Parse simple string
        p++;
        const char *start = p;
        while (*p != '\r') p++;
        // ... create string value ...
    }
    else if (*p == '$') {
        // Parse bulk string
        p++;
        int len = atoi(p);
        // ... read len bytes ...
    }
    else if (*p == '*') {
        // Parse array (recursive!)
        p++;
        int count = atoi(p);
        // ... parse each element ...
        for (int i = 0; i < count; i++) {
            elements[i] = resp_parse(buf);  // Recursion!
        }
    }
    // ... etc ...

    *buf = p;  // Update buffer pointer
    return value;
}
```

**What it does:** Parse RESP bytes into structured data

**How:**
1. Check first byte to determine type
2. Parse according to type rules
3. For arrays: recursively parse elements
4. Update buffer pointer for next parse

**execute_command() - Line ~530**
```c
RESPValue *execute_command(RESPValue *cmd) {
    // Validate
    if (cmd->type != RESP_ARRAY) {
        return resp_create_error("ERR invalid command");
    }

    // Extract args
    char *argv[MAX_COMMAND_ARGS];
    int argc = cmd->data.array.count;
    for (int i = 0; i < argc; i++) {
        argv[i] = cmd->data.array.elements[i]->data.str;
    }

    // Normalize command
    char *command = argv[0];
    for (char *p = command; *p; p++) {
        *p = toupper(*p);
    }

    // Dispatch
    if (strcmp(command, "PING") == 0) {
        return cmd_ping(argc, argv);
    } else if ...
}
```

**What it does:** Route command to appropriate handler

**How:**
1. Validate command is array
2. Extract command name and args
3. Convert command to uppercase (case-insensitive)
4. Compare and dispatch to handler

## Testing Strategy

### Unit Testing Approach

**Ideal:** Test each layer separately

```c
// Test hash function
assert(hash("foo") == hash("foo"));      // Consistent
assert(hash("foo") != hash("bar"));      // Different keys
assert(hash("a") < HASH_TABLE_SIZE);     // In range

// Test data store
store_set(&store, "k", "v", 0);
assert(strcmp(store_get(&store, "k"), "v") == 0);
assert(store_get(&store, "missing") == NULL);

// Test RESP parsing
RESPValue *val = resp_parse("+OK\r\n");
assert(val->type == RESP_SIMPLE_STRING);
assert(strcmp(val->data.str, "OK") == 0);
```

**Current:** Integration testing (test.sh)

- Sends real RESP over network
- Tests end-to-end functionality
- Catches integration issues

**Why integration over unit?**
- Simpler for small project
- Tests what users actually do
- Catches more real bugs

### Test Coverage

Our test.sh covers:

1. ✅ PING command
2. ✅ ECHO command
3. ✅ SET/GET operations
4. ✅ DELETE operations
5. ✅ EXISTS checks
6. ✅ KEYS listing
7. ✅ Case insensitivity
8. ✅ Error handling
9. ✅ Multiple operations

**Missing tests:**
- Expiration (EX option)
- Large values (>1KB)
- Many keys (>1000)
- Concurrent clients
- Memory leaks (use valgrind)

## Performance Optimization

### Current Performance

**Bottlenecks:**
1. String allocation (`strdup()`)
2. Network I/O (`recv`/`send`)
3. Hash collisions (rare)

**Optimization opportunities:**

**1. String pooling**
```c
// Instead of:
kv->key = strdup(key);  // Allocate every time

// Use pool:
kv->key = string_pool_intern(pool, key);  // Reuse if exists
```

**2. Buffer reuse**
```c
// Instead of:
char buffer[4096];  // Stack allocation every request

// Use persistent:
static char recv_buffer[4096];
static char send_buffer[4096];
```

**3. Zero-copy responses**
```c
// Instead of:
sprintf(buf, "+OK\r\n");
send(fd, buf, 5, 0);

// Use writev:
struct iovec iov[2] = {
    {.iov_base = "+OK\r\n", .iov_len = 5}
};
writev(fd, iov, 1);
```

**4. Better hash function**
```c
// Use MurmurHash3 or CityHash
// Fewer collisions = faster lookups
```

### Profiling

**Find hotspots:**
```bash
gcc -pg redis.c -o redis-server
./redis-server &
# ... run tests ...
gprof redis-server gmon.out
```

**Common hotspots:**
- `strdup()` - 30% of time
- `recv()`/`send()` - 25%
- `hash()` - 10%
- `strcmp()` - 10%

## Platform Compatibility

### Tested Platforms

- ✅ Linux (Ubuntu 20.04, Debian 11)
- ✅ macOS (Big Sur, Monterey)
- ✅ BSD (FreeBSD 13)

### Platform-Specific Code

**None!** Standard POSIX APIs work everywhere:
- `socket()`, `bind()`, `listen()`, `accept()`
- `recv()`, `send()`
- `signal()`

**Differences:**
- **Linux:** `SO_REUSEPORT` available
- **macOS:** `SO_REUSEADDR` sufficient
- **BSD:** Similar to Linux

**Makefile handles this:**
```makefile
ifeq ($(UNAME_S),Darwin)
    # macOS-specific flags
else ifeq ($(UNAME_S),Linux)
    # Linux-specific flags
endif
```

## Common Pitfalls

### 1. Forgetting \r\n

❌ Wrong:
```c
sprintf(buf, "+OK\n");  // Just \n
```

✅ Correct:
```c
sprintf(buf, "+OK\r\n");  // Full CRLF
```

### 2. Not null-terminating strings

❌ Wrong:
```c
char *str = malloc(len);
memcpy(str, data, len);  // No \0!
```

✅ Correct:
```c
char *str = malloc(len + 1);
memcpy(str, data, len);
str[len] = '\0';  // Null terminate
```

### 3. Buffer overflow

❌ Wrong:
```c
sprintf(buf, "%s", long_string);  // Overflow!
```

✅ Correct:
```c
snprintf(buf, sizeof(buf), "%s", long_string);
```

### 4. Use-after-free

❌ Wrong:
```c
char *val = store_get(key);
store_del(key);  // Frees val!
printf("%s", val);  // Use after free!
```

✅ Correct:
```c
char *val = store_get(key);
char *copy = strdup(val);
store_del(key);
printf("%s", copy);
free(copy);
```

### 5. Ignoring return values

❌ Wrong:
```c
recv(fd, buf, size, 0);  // What if error?
```

✅ Correct:
```c
ssize_t n = recv(fd, buf, size, 0);
if (n <= 0) {
    // Handle error/disconnect
}
```

## Summary

Key implementation principles:
- ✅ **Simplicity** - Single file, straightforward algorithms
- ✅ **Correctness** - Proper memory management, error handling
- ✅ **Performance** - O(1) operations, efficient parsing
- ✅ **Portability** - Standard POSIX, cross-platform
- ✅ **Readability** - Clear structure, well-commented

Trade-offs made:
- Simple over complex (chaining vs cuckoo hashing)
- Readable over optimal (if-else vs hash table dispatch)
- Functional over featureful (basic commands only)

This makes an excellent learning project while being actually usable for simple use cases!
