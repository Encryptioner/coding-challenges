# Redis Server

A lightweight, Redis-compatible server implementation in C. This project demonstrates network programming, protocol implementation, and in-memory data structures by building a simplified version of Redis.

## Challenge

This is Challenge #8 from [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/challenge-redis).

## Features

- ✅ **RESP Protocol**: Full Redis Serialization Protocol support
- ✅ **TCP Server**: Listens on port 6379 (configurable)
- ✅ **In-Memory Storage**: Fast hash table-based key-value store
- ✅ **Basic Commands**: PING, ECHO, SET, GET, DEL, EXISTS, KEYS
- ✅ **Expiration Support**: SET with EX option for TTL
- ✅ **Error Handling**: Proper error messages for invalid operations
- ✅ **Case Insensitive**: Commands work in any case
- ✅ **Compatible**: Works with redis-cli and standard Redis clients

## How It Works

### Architecture

The Redis server is built in layers:

```
┌─────────────────────────────────────┐
│         TCP Server (Port 6379)      │
│  - Accept connections               │
│  - Handle multiple clients          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       RESP Protocol Layer           │
│  - Parse RESP messages              │
│  - Serialize responses              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Command Parser                │
│  - Extract command and arguments    │
│  - Dispatch to handlers             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Command Handlers              │
│  - PING, ECHO, SET, GET, etc.       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Data Store                  │
│  - Hash table (O(1) operations)     │
│  - Linked lists for collisions      │
│  - Expiration tracking              │
└─────────────────────────────────────┘
```

### RESP Protocol

Redis uses the **RESP (REdis Serialization Protocol)** for client-server communication. It's a simple, text-based protocol.

**Data Types:**

1. **Simple String**: `+OK\r\n`
2. **Error**: `-Error message\r\n`
3. **Integer**: `:1000\r\n`
4. **Bulk String**: `$6\r\nfoobar\r\n`
5. **Array**: `*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n`

**Example Conversation:**

```
Client → *1\r\n$4\r\nPING\r\n
Server → +PONG\r\n

Client → *3\r\n$3\r\nSET\r\n$3\r\nfoo\r\n$3\r\nbar\r\n
Server → +OK\r\n

Client → *2\r\n$3\r\nGET\r\n$3\r\nfoo\r\n
Server → $3\r\nbar\r\n
```

## Building

### Requirements
- GCC or Clang compiler
- Make
- Standard C library with networking support
- Netcat (nc) for testing

### Build Commands

```bash
# Standard release build
make

# Debug build with symbols
make debug

# Static binary (Linux/BSD only)
make static

# Run tests
make test

# Clean build artifacts
make clean

# Install system-wide
sudo make install

# Check dependencies
make check-deps
```

## Usage

### Starting the Server

```bash
# Default port (6379)
./redis-server

# Custom port
./redis-server 6380
```

Output:
```
Redis server listening on port 6379
Press Ctrl+C to stop
```

### Connecting with redis-cli

```bash
# Install redis-cli (if not already installed)
# Ubuntu/Debian: sudo apt-get install redis-tools
# macOS: brew install redis

# Connect to server
redis-cli -p 6379

# Or if using custom port
redis-cli -p 6380
```

### Connecting with telnet or netcat

```bash
telnet localhost 6379

# Or
nc localhost 6379
```

## Supported Commands

### PING
Test server connectivity.

```bash
127.0.0.1:6379> PING
PONG

127.0.0.1:6379> PING "Hello"
"Hello"
```

**RESP Format:**
```
Request:  *1\r\n$4\r\nPING\r\n
Response: +PONG\r\n
```

### ECHO
Echo the given string.

```bash
127.0.0.1:6379> ECHO "Hello World"
"Hello World"
```

**RESP Format:**
```
Request:  *2\r\n$4\r\nECHO\r\n$5\r\nhello\r\n
Response: $5\r\nhello\r\n
```

### SET
Set the value of a key.

```bash
127.0.0.1:6379> SET mykey "Hello"
OK

127.0.0.1:6379> SET counter 100
OK

# With expiration (10 seconds)
127.0.0.1:6379> SET session:123 "user-data" EX 10
OK
```

**RESP Format:**
```
Request:  *3\r\n$3\r\nSET\r\n$5\r\nmykey\r\n$5\r\nHello\r\n
Response: +OK\r\n
```

### GET
Get the value of a key.

```bash
127.0.0.1:6379> GET mykey
"Hello"

127.0.0.1:6379> GET nonexistent
(nil)
```

**RESP Format:**
```
Request:  *2\r\n$3\r\nGET\r\n$5\r\nmykey\r\n
Response: $5\r\nHello\r\n

# For non-existent key:
Response: $-1\r\n
```

### DEL
Delete one or more keys.

```bash
127.0.0.1:6379> DEL mykey
(integer) 1

127.0.0.1:6379> DEL key1 key2 key3
(integer) 2
```

**RESP Format:**
```
Request:  *2\r\n$3\r\nDEL\r\n$5\r\nmykey\r\n
Response: :1\r\n
```

### EXISTS
Check if keys exist.

```bash
127.0.0.1:6379> EXISTS mykey
(integer) 1

127.0.0.1:6379> EXISTS key1 key2 key3
(integer) 2
```

**RESP Format:**
```
Request:  *2\r\n$6\r\nEXISTS\r\n$5\r\nmykey\r\n
Response: :1\r\n
```

### KEYS
Get all keys (simplified - returns all keys).

```bash
127.0.0.1:6379> KEYS *
1) "mykey"
2) "counter"
3) "session:123"
```

**RESP Format:**
```
Request:  *1\r\n$4\r\nKEYS\r\n
Response: *3\r\n$5\r\nmykey\r\n$7\r\ncounter\r\n...
```

## Examples

### Basic Key-Value Operations

```bash
# Set some keys
redis-cli SET name "John Doe"
redis-cli SET age 30
redis-cli SET city "New York"

# Get values
redis-cli GET name
# "John Doe"

redis-cli GET age
# "30"

# Check existence
redis-cli EXISTS name
# (integer) 1

redis-cli EXISTS missing
# (integer) 0

# Delete keys
redis-cli DEL age
# (integer) 1

# List all keys
redis-cli KEYS \*
# 1) "name"
# 2) "city"
```

### Expiration

```bash
# Set a key with 60 second expiration
redis-cli SET session:abc123 "user-token" EX 60

# Get immediately
redis-cli GET session:abc123
# "user-token"

# Wait 61 seconds...
redis-cli GET session:abc123
# (nil)
```

### Using Raw RESP Protocol

```bash
# Connect with netcat
nc localhost 6379

# Send PING (type this)
*1
$4
PING

# Server responds
+PONG

# Send SET command
*3
$3
SET
$3
foo
$3
bar

# Server responds
+OK

# Send GET command
*2
$3
GET
$3
foo

# Server responds
$3
bar
```

## Testing

Run the comprehensive test suite:

```bash
make test
```

The test suite includes:
- RESP protocol parsing
- PING command
- ECHO command
- SET and GET operations
- EXISTS checks
- DEL operations
- KEYS listing
- Case insensitivity
- Error handling
- Multiple operations

## Implementation Details

### Data Structures

**Hash Table:**
```c
typedef struct KeyValue {
    char *key;
    char *value;
    time_t expiry;           // 0 = no expiry
    struct KeyValue *next;   // Collision handling
} KeyValue;

typedef struct {
    KeyValue *buckets[1024];  // Hash table
    int count;                // Number of keys
} DataStore;
```

**Time Complexity:**
- SET: O(1) average, O(n) worst case
- GET: O(1) average, O(n) worst case
- DEL: O(1) average, O(n) worst case
- EXISTS: O(1) average, O(n) worst case
- KEYS: O(n) where n is total keys

### RESP Protocol Implementation

The protocol layer handles:
1. **Parsing**: Converting RESP bytes to structured data
2. **Serialization**: Converting responses to RESP format
3. **Type Safety**: Ensuring correct data types

### Memory Management

- All strings are dynamically allocated with `strdup()`
- Keys and values are freed on deletion
- RESP values are properly freed after use
- No memory leaks in normal operation

### Concurrency

Current implementation:
- Single-threaded event loop
- Handles one client at a time
- Simple and predictable

Can be extended to:
- Multi-threaded (one thread per client)
- Event-driven (epoll/kqueue)
- Hybrid (thread pool + epoll)

## Performance

**Benchmarks** (approximate, single-threaded):

- SET operations: ~10,000/sec
- GET operations: ~15,000/sec
- Memory usage: ~100 bytes per key-value pair
- Startup time: < 1ms

## Limitations and Future Enhancements

### Current Limitations
- Single-threaded (no concurrent clients)
- No persistence (data lost on restart)
- Simple pattern matching for KEYS
- No pub/sub support
- No transactions
- No data types beyond strings

### Potential Enhancements
- **Multi-threading**: Handle concurrent clients
- **Persistence**: AOF (Append Only File) or RDB snapshots
- **More Data Types**: Lists, sets, sorted sets, hashes
- **Pub/Sub**: Message broadcasting
- **Transactions**: MULTI/EXEC support
- **Replication**: Master-slave setup
- **Cluster Mode**: Distributed Redis
- **TTL Command**: Get time to live
- **INCR/DECR**: Atomic increment/decrement
- **Pattern Matching**: Full glob pattern support for KEYS

## Learning Resources

For detailed explanations, see:
- [docs/resp-protocol.md](docs/resp-protocol.md) - RESP protocol deep dive
- [docs/architecture.md](docs/architecture.md) - System architecture
- [docs/implementation.md](docs/implementation.md) - Implementation details

## References

- [Redis Protocol Specification](https://redis.io/docs/reference/protocol-spec/)
- [Redis Commands Documentation](https://redis.io/commands/)
- [CodingChallenges.fyi - Redis Challenge](https://codingchallenges.fyi/challenges/challenge-redis)
- [Build Your Own Redis Course](https://codingchallenges.fyi/live-courses/redis/)

## License

This implementation is part of the [CodingChallenges.fyi](https://codingchallenges.fyi) series and is provided for educational purposes.

## Contributing

This is a learning project. Feel free to:
- Add more Redis commands
- Improve error handling
- Add persistence
- Implement concurrency
- Optimize performance
- Add more tests

## Platform Support

Tested and working on:
- **Linux** (Ubuntu, Debian, CentOS, RHEL, Fedora, Arch)
- **macOS** (Darwin)
- **BSD** (FreeBSD, OpenBSD, NetBSD)
