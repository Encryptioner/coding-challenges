# Build Your Own Memcached Server

This challenge is to build your own version of Memcached - a high-performance, distributed memory object caching system!

## Background

Memcached is an in-memory key-value store for small chunks of arbitrary data (strings, objects) from results of database calls, API calls, or page rendering. It's widely used to speed up dynamic web applications by alleviating database load.

### Key Features of Memcached

- **Simple**: Key-value store with a simple text-based protocol
- **Fast**: All data stored in memory for rapid access
- **Distributed**: Can run across multiple servers
- **LRU Eviction**: Automatically removes least recently used items when memory is full
- **Expiration**: Keys can have TTL (time to live)

### Why Build This?

Building a Memcached server teaches you:
- Network programming with sockets
- Protocol design and implementation
- In-memory data structures
- Concurrent client handling
- Cache eviction strategies
- Text protocol parsing

## The Challenge - Building a Memcached Server

The Memcached protocol is a simple text-based protocol that makes it an ideal learning project. You'll implement a subset of the Memcached commands using the ASCII protocol.

## Protocol Overview

Memcached uses a simple text-based protocol over TCP. Commands and responses are line-oriented, terminated by `\r\n`.

### General Command Format

**Storage commands:**
```
<command> <key> <flags> <exptime> <bytes> [noreply]\r\n
<data block>\r\n
```

**Retrieval commands:**
```
<command> <key>\r\n
```

### Protocol Fields

- **key**: The key under which data is stored/retrieved (up to 250 characters)
- **flags**: 32-bit unsigned integer to store with the data (client-specific)
- **exptime**: Expiration time in seconds (0 = never expire)
- **bytes**: Number of bytes in the data block
- **noreply**: Optional - server won't send a reply if specified
- **data block**: The actual data to store

## Step Zero

Set up your development environment:

1. Choose your programming language (C, Go, Python, Rust, etc.)
2. Set up your IDE/editor
3. Read about Memcached basics
4. Familiarize yourself with socket programming in your language

## Step One: Basic Socket Server

Create a TCP server that:
- Listens on port 11211 (default Memcached port)
- Accepts client connections
- Reads text-based commands
- Sends text-based responses

**Test it:**
```bash
telnet localhost 11211
```

You should be able to connect successfully.

## Step Two: Implement SET and GET Commands

### SET Command

Store data in the cache.

**Format:**
```
set <key> <flags> <exptime> <bytes>\r\n
<data>\r\n
```

**Response:**
- `STORED\r\n` - Success
- `NOT_STORED\r\n` - Failure (shouldn't happen for set)
- `ERROR\r\n` - Command line error

**Example:**
```
set mykey 0 0 5\r\n
hello\r\n

Response: STORED\r\n
```

### GET Command

Retrieve data from the cache.

**Format:**
```
get <key>\r\n
```

**Response:**
```
VALUE <key> <flags> <bytes>\r\n
<data>\r\n
END\r\n
```

Or if key not found:
```
END\r\n
```

**Example:**
```
get mykey\r\n

Response:
VALUE mykey 0 5\r\n
hello\r\n
END\r\n
```

**Test it:**
```bash
$ telnet localhost 11211
set foo 0 0 3
bar
STORED
get foo
VALUE foo 0 3
bar
END
```

## Step Three: Implement ADD Command

Add data only if the key doesn't already exist.

**Format:**
```
add <key> <flags> <exptime> <bytes>\r\n
<data>\r\n
```

**Response:**
- `STORED\r\n` - Success (key didn't exist)
- `NOT_STORED\r\n` - Failure (key already exists)

**Example:**
```
add newkey 0 0 5\r\n
value\r\n

Response: STORED\r\n

add newkey 0 0 5\r\n
other\r\n

Response: NOT_STORED\r\n
```

## Step Four: Implement REPLACE Command

Replace data only if the key already exists.

**Format:**
```
replace <key> <flags> <exptime> <bytes>\r\n
<data>\r\n
```

**Response:**
- `STORED\r\n` - Success (key existed)
- `NOT_STORED\r\n` - Failure (key didn't exist)

**Example:**
```
replace existingkey 0 0 8\r\n
newvalue\r\n

Response: STORED\r\n

replace nonexistent 0 0 5\r\n
value\r\n

Response: NOT_STORED\r\n
```

## Step Five: Implement APPEND and PREPEND Commands

### APPEND

Add data to the end of an existing value.

**Format:**
```
append <key> <flags> <exptime> <bytes>\r\n
<data>\r\n
```

**Response:**
- `STORED\r\n` - Success (key existed)
- `NOT_STORED\r\n` - Failure (key didn't exist)

**Example:**
```
set mykey 0 0 5\r\n
hello\r\n
STORED

append mykey 0 0 6\r\n
 world\r\n
STORED

get mykey\r\n
VALUE mykey 0 11\r\n
hello world\r\n
END\r\n
```

### PREPEND

Add data to the beginning of an existing value.

**Format:**
```
prepend <key> <flags> <exptime> <bytes>\r\n
<data>\r\n
```

**Example:**
```
set mykey 0 0 5\r\n
world\r\n
STORED

prepend mykey 0 0 6\r\n
hello \r\n
STORED

get mykey\r\n
VALUE mykey 0 11\r\n
hello world\r\n
END\r\n
```

## Step Six: Implement DELETE Command

Remove a key from the cache.

**Format:**
```
delete <key>\r\n
```

**Response:**
- `DELETED\r\n` - Success
- `NOT_FOUND\r\n` - Key didn't exist

**Example:**
```
delete mykey\r\n

Response: DELETED\r\n

delete nonexistent\r\n

Response: NOT_FOUND\r\n
```

## Step Seven: Implement Expiration

Keys with non-zero exptime should automatically expire.

**Time formats:**
- `0` - Never expire
- `1-2592000` (30 days) - Relative seconds from now
- `>2592000` - Absolute Unix timestamp

**Example:**
```
set tempkey 0 5 5\r\n
hello\r\n
STORED

# Immediately after:
get tempkey\r\n
VALUE tempkey 0 5\r\n
hello\r\n
END\r\n

# After 5+ seconds:
get tempkey\r\n
END\r\n
```

## Step Eight: Implement Additional Commands

### FLUSH_ALL

Remove all keys from the cache.

**Format:**
```
flush_all\r\n
```

**Response:**
```
OK\r\n
```

### STATS

Display server statistics.

**Format:**
```
stats\r\n
```

**Response:**
```
STAT <name> <value>\r\n
...
END\r\n
```

**Example stats:**
- `curr_items` - Current number of items
- `total_items` - Total items stored since start
- `bytes` - Current bytes used
- `curr_connections` - Current connections
- `total_connections` - Total connections since start
- `cmd_get` - GET commands executed
- `cmd_set` - SET commands executed
- `get_hits` - GET requests that found data
- `get_misses` - GET requests that didn't find data

## Step Nine: Handle Multiple Clients

Use threading or async I/O to handle multiple concurrent clients.

**Test it:**
```bash
# Terminal 1
$ telnet localhost 11211
set key1 0 0 5
value
STORED

# Terminal 2 (simultaneously)
$ telnet localhost 11211
set key2 0 0 5
other
STORED
```

Both clients should work without interfering with each other.

## Step Ten: Implement GET with Multiple Keys

Support retrieving multiple keys in one command.

**Format:**
```
get <key1> <key2> ... <keyN>\r\n
```

**Response:**
```
VALUE <key1> <flags> <bytes>\r\n
<data>\r\n
VALUE <key2> <flags> <bytes>\r\n
<data>\r\n
...
END\r\n
```

**Example:**
```
get key1 key2 key3\r\n

Response:
VALUE key1 0 5\r\n
value\r\n
VALUE key3 0 5\r\n
other\r\n
END\r\n
```

(key2 not found, so not included)

## Extension Ideas

Once you have the basics working, consider adding:

1. **LRU Eviction**: Remove least recently used items when memory limit reached
2. **Binary Protocol**: Implement the binary protocol (more efficient)
3. **CAS (Compare and Swap)**: Implement cas, gets commands for optimistic locking
4. **Increment/Decrement**: Implement incr/decr for atomic counter operations
5. **Touch Command**: Update expiration time without fetching data
6. **Persistence**: Save cache to disk and reload on startup
7. **Replication**: Implement master-slave replication
8. **Clustering**: Distribute keys across multiple servers

## Testing

Test your implementation:

```bash
# Using telnet
telnet localhost 11211

# Using netcat
nc localhost 11211

# Using the official memcached client
pip install pymemcache
python3 -c "from pymemcache.client import base; client = base.Client(('localhost', 11211)); client.set('key', 'value'); print(client.get('key'))"
```

## References

- [Memcached Protocol Specification](https://github.com/memcached/memcached/blob/master/doc/protocol.txt)
- [Memcached Wiki](https://github.com/memcached/memcached/wiki)
- [Build Your Own Memcached Server](https://codingchallenges.fyi/challenges/challenge-memcached)
- [Memcached Official Site](https://memcached.org/)

## Success Criteria

Your Memcached server should:
- ✅ Listen on TCP port 11211
- ✅ Implement set, get, add, replace, append, prepend, delete commands
- ✅ Support key expiration
- ✅ Handle multiple concurrent clients
- ✅ Parse the text protocol correctly
- ✅ Send proper responses
- ✅ Implement basic statistics
- ✅ Match the behavior of real Memcached for basic operations

Congratulations if you've made it this far! You've built a functional in-memory cache server.
