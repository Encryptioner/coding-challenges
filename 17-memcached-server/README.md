# ccmemcached - Coding Challenges Memcached Server

A high-performance, in-memory key-value cache server implementing the Memcached text protocol.

## Overview

`ccmemcached` is an implementation of Memcached, a distributed memory object caching system designed to speed up dynamic web applications by reducing database load. This implementation supports the core Memcached text protocol and provides a simple, fast in-memory cache.

## Features

- ✅ **TCP Socket Server** - Listens on port 11211 (default) or custom port
- ✅ **Text Protocol** - Full Memcached ASCII protocol support
- ✅ **Storage Commands** - SET, ADD, REPLACE, APPEND, PREPEND
- ✅ **Retrieval Commands** - GET (single and multiple keys)
- ✅ **DELETE Command** - Remove keys from cache
- ✅ **Key Expiration** - TTL support with lazy expiration
- ✅ **Statistics** - STATS command for monitoring
- ✅ **FLUSH_ALL** - Clear entire cache
- ✅ **Multi-Client Support** - Handle concurrent connections with threading
- ✅ **Fine-Grained Locking** - Per-bucket locks for better concurrency
- ✅ **Hash Table Storage** - Efficient O(1) average lookup time
- ✅ **noreply Option** - Silent mode for fire-and-forget operations

## Building

### Prerequisites

- GCC compiler (or compatible C compiler)
- POSIX-compliant system (Linux, macOS, BSD)
- pthread support

### Build Commands

```bash
# Standard build (optimized)
make

# Debug build (with AddressSanitizer)
make debug

# Clean build artifacts
make clean

# Check dependencies
make check-deps
```

## Installation

```bash
# Install to /usr/local/bin
make install

# Uninstall
make uninstall
```

## Usage

### Starting the Server

```bash
# Start on default port (11211)
./ccmemcached

# Start on custom port
./ccmemcached -p 9999

# Using make targets
make run          # Port 11211
make run-port     # Port 9999
```

### Connecting to the Server

```bash
# Using telnet
telnet localhost 11211

# Using netcat
nc localhost 11211

# Using Python client
pip install pymemcache
python3 -c "from pymemcache.client import base; client = base.Client(('localhost', 11211)); client.set('key', 'value'); print(client.get('key'))"
```

## Protocol Reference

### Storage Commands

All storage commands follow this format:
```
<command> <key> <flags> <exptime> <bytes> [noreply]\r\n
<data block>\r\n
```

**SET** - Store data unconditionally
```
set mykey 0 0 5\r\n
hello\r\n

Response: STORED\r\n
```

**ADD** - Store only if key doesn't exist
```
add newkey 0 0 5\r\n
value\r\n

Response: STORED\r\n (if key didn't exist)
Response: NOT_STORED\r\n (if key exists)
```

**REPLACE** - Store only if key exists
```
replace existingkey 0 0 7\r\n
newdata\r\n

Response: STORED\r\n (if key existed)
Response: NOT_STORED\r\n (if key didn't exist)
```

**APPEND** - Add data to end of existing value
```
append mykey 0 0 6\r\n
 world\r\n

Response: STORED\r\n (if key existed)
Response: NOT_STORED\r\n (if key didn't exist)
```

**PREPEND** - Add data to beginning of existing value
```
prepend mykey 0 0 6\r\n
hello \r\n

Response: STORED\r\n (if key existed)
Response: NOT_STORED\r\n (if key didn't exist)
```

### Retrieval Commands

**GET** - Retrieve one or more keys
```
get key1\r\n

Response:
VALUE key1 0 5\r\n
value\r\n
END\r\n

get key1 key2 key3\r\n

Response:
VALUE key1 0 5\r\n
value\r\n
VALUE key3 0 4\r\n
data\r\n
END\r\n
```

### Other Commands

**DELETE** - Remove a key
```
delete mykey\r\n

Response: DELETED\r\n (if key existed)
Response: NOT_FOUND\r\n (if key didn't exist)
```

**FLUSH_ALL** - Remove all keys
```
flush_all\r\n

Response: OK\r\n
```

**STATS** - Display server statistics
```
stats\r\n

Response:
STAT curr_items 10\r\n
STAT total_items 25\r\n
STAT bytes 1024\r\n
STAT curr_connections 2\r\n
STAT total_connections 15\r\n
STAT cmd_get 100\r\n
STAT cmd_set 50\r\n
STAT get_hits 80\r\n
STAT get_misses 20\r\n
END\r\n
```

**QUIT** - Close connection
```
quit\r\n
```

## Command-Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p <port>` | Port number to listen on | 11211 |

## Protocol Fields

| Field | Description | Type | Notes |
|-------|-------------|------|-------|
| **key** | Cache key | String | Max 250 characters |
| **flags** | Client-specific flags | uint32 | Stored and returned with value |
| **exptime** | Expiration time | int | 0=never, 1-2592000=relative seconds, >2592000=Unix timestamp |
| **bytes** | Data size | size_t | Number of bytes in data block |
| **noreply** | Silent mode | Flag | Optional, suppresses server reply |

## Expiration Behavior

The server implements **lazy expiration**:

1. **exptime = 0**: Key never expires
2. **exptime = 1 to 2592000** (30 days): Relative seconds from now
3. **exptime > 2592000**: Absolute Unix timestamp
4. **exptime < 0**: Immediate expiration

Keys are not actively removed when they expire. Instead, expired keys are removed when:
- A client attempts to access them (GET, REPLACE, etc.)
- The check happens during the operation

## Statistics

The `stats` command provides server metrics:

| Stat | Description |
|------|-------------|
| `curr_items` | Current number of items in cache |
| `total_items` | Total items stored since server start |
| `bytes` | Current bytes used by items |
| `curr_connections` | Current active connections |
| `total_connections` | Total connections since server start |
| `cmd_get` | Number of GET commands executed |
| `cmd_set` | Number of SET commands executed |
| `get_hits` | GET requests that found data |
| `get_misses` | GET requests that didn't find data |

## Examples

### Basic Operations

```bash
$ telnet localhost 11211
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.

# Store a value
set user:1:name 0 0 4
John
STORED

# Retrieve the value
get user:1:name
VALUE user:1:name 0 4
John
END

# Update the value
set user:1:name 0 0 7
Jessica
STORED

# Verify update
get user:1:name
VALUE user:1:name 0 7
Jessica
END
```

### Using Flags

```bash
# Store with flags (e.g., for data type hints)
set data:json 1 0 15
{"user":"john"}
STORED

get data:json
VALUE data:json 1 15
{"user":"john"}
END
```

### Expiration

```bash
# Store with 5-second TTL
set temp:key 0 5 5
hello
STORED

# Immediately retrieve
get temp:key
VALUE temp:key 0 5
hello
END

# Wait 6 seconds...
get temp:key
END
```

### ADD and REPLACE

```bash
# ADD only works if key doesn't exist
add counter 0 0 1
0
STORED

add counter 0 0 1
1
NOT_STORED

# REPLACE only works if key exists
replace nonexistent 0 0 4
data
NOT_STORED

replace counter 0 0 1
1
STORED
```

### APPEND and PREPEND

```bash
# Build a value incrementally
set log 0 0 6
Line 1
STORED

append log 0 0 6
Line 2
STORED

append log 0 0 6
Line 3
STORED

get log
VALUE log 0 18
Line 1Line 2Line 3
END

# Prepend example
set message 0 0 6
world!
STORED

prepend message 0 0 6
Hello
STORED

get message
VALUE message 0 12
Hello world!
END
```

### Multiple GET

```bash
# Store multiple keys
set key1 0 0 6
value1
STORED

set key2 0 0 6
value2
STORED

set key3 0 0 6
value3
STORED

# Retrieve all at once
get key1 key2 key3
VALUE key1 0 6
value1
VALUE key2 0 6
value2
VALUE key3 0 6
value3
END
```

### noreply Option

```bash
# Fire and forget (no response from server)
set key1 0 0 5 noreply
value

set key2 0 0 5 noreply
other

# Responses are suppressed for speed
```

## Architecture

### Hash Table Implementation

- **Size**: 10,007 buckets (prime number for better distribution)
- **Collision Resolution**: Chaining with linked lists
- **Hash Function**: djb2 algorithm
- **Locking**: One mutex per bucket for fine-grained concurrency

### Threading Model

- **One thread per client**: Each client connection gets its own thread
- **Detached threads**: Threads clean up automatically when client disconnects
- **Concurrent access**: Multiple clients can operate simultaneously
- **Thread-safe**: All cache operations are protected by locks

### Memory Management

- **Dynamic allocation**: Values allocated on heap
- **Lazy expiration**: Expired items removed on access, not proactively
- **No eviction policy**: Currently no LRU or size limits (extension opportunity)

## Performance Characteristics

| Operation | Average Case | Worst Case | Notes |
|-----------|-------------|------------|-------|
| **SET** | O(1) | O(n) | n = chain length at hash bucket |
| **GET** | O(1) | O(n) | Includes expiration check |
| **DELETE** | O(1) | O(n) | Requires bucket traversal |
| **APPEND/PREPEND** | O(1) + O(m) | O(n) + O(m) | m = data size for memory copy |
| **FLUSH_ALL** | O(k) | O(k) | k = total items in cache |

## Testing

```bash
# Run test suite
make test

# Manual testing with telnet
telnet localhost 11211

# Manual testing with netcat
nc localhost 11211
```

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| **Linux** | ✅ Fully supported | Tested on Ubuntu, Debian, CentOS |
| **macOS** | ✅ Fully supported | Requires Xcode Command Line Tools |
| **FreeBSD** | ✅ Fully supported | Standard build works |
| **OpenBSD** | ✅ Fully supported | Standard build works |
| **NetBSD** | ✅ Fully supported | Standard build works |

## Limitations

Current implementation limitations:

1. **No LRU eviction**: Memory can grow unbounded
2. **No persistence**: Data lost on server restart
3. **No replication**: Single server, no failover
4. **No binary protocol**: Only text protocol supported
5. **No CAS operations**: Compare-And-Swap not implemented
6. **No increment/decrement**: Atomic counters not implemented
7. **Fixed hash table size**: Cannot resize dynamically

These are opportunities for extension!

## Extension Ideas

Enhance the server with:

1. **LRU Eviction** - Remove least recently used items when memory limit reached
2. **Max Memory Limit** - Set maximum cache size with command-line option
3. **Binary Protocol** - Implement more efficient binary protocol
4. **CAS Operations** - Add gets/cas commands for optimistic locking
5. **Atomic Counters** - Implement incr/decr commands
6. **Persistence** - Save/load cache state to/from disk
7. **Stats Reset** - Add command to reset statistics
8. **Per-Key Stats** - Track access counts per key
9. **Slab Allocator** - Implement memory pools like real Memcached
10. **Replication** - Master-slave replication for high availability

## Troubleshooting

### Server won't start

```bash
# Check if port is already in use
netstat -an | grep 11211

# Try a different port
./ccmemcached -p 9999
```

### Can't connect to server

```bash
# Check if server is running
ps aux | grep ccmemcached

# Check firewall settings
sudo iptables -L

# Try connecting to localhost explicitly
telnet 127.0.0.1 11211
```

### Values not persisting

Remember: Memcached is an in-memory cache. Data is lost when:
- Server is restarted
- Keys expire
- FLUSH_ALL is executed

## References

- [Memcached Protocol Specification](https://github.com/memcached/memcached/blob/master/doc/protocol.txt)
- [Memcached Official Site](https://memcached.org/)
- [Build Your Own Memcached Server Challenge](https://codingchallenges.fyi/challenges/challenge-memcached)
- [Memcached Wiki](https://github.com/memcached/memcached/wiki)

## See Also

- `challenge.md` - Original challenge description and requirements
- `docs/implementation.md` - Detailed implementation guide
- `docs/protocol.md` - Complete protocol specification
- `docs/examples.md` - More examples and use cases

## License

This is a learning project based on the [Coding Challenges](https://codingchallenges.fyi/) series.
