# Challenge: Build Your Own Redis Server

**Source:** [CodingChallenges.fyi - Redis Server Challenge](https://codingchallenges.fyi/challenges/challenge-redis)

## Overview

Build a lite version of Redis - an in-memory data structure server. Redis is widely used for caching, session storage, pub/sub messaging, and more. This challenge will teach you about network programming, protocols, and in-memory data structures.

## Challenge Description

Redis is an in-memory data structure server which supports storing strings, hashes, lists, sets, sorted sets and more. For this challenge, we'll build a simplified version that implements the core functionality.

## Requirements

### Step 0: Setup
Pick a tech stack that you're comfortable doing both:
- Network programming (we're building a server)
- Test-driven development (TDD)

### Step 1: RESP Protocol
Build the functionality to serialize and deserialize Redis Serialization Protocol (RESP) messages.

**RESP Data Types:**
- Simple Strings: `+OK\r\n`
- Errors: `-Error message\r\n`
- Integers: `:1000\r\n`
- Bulk Strings: `$6\r\nfoobar\r\n`
- Arrays: `*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n`

### Step 2: Server Setup
Create the Redis server that should:
- Start up and begin listening for clients
- Default port: 6379
- Accept TCP connections
- Handle client requests

### Step 3: SET and GET
Implement the core functionality:
- `SET key value` - Set the value of a key
- `GET key` - Get the value of a key
- Return `$-1\r\n` (null bulk string) if key doesn't exist

**Example:**
```
Client: *3\r\n$3\r\nSET\r\n$3\r\nfoo\r\n$3\r\nbar\r\n
Server: +OK\r\n

Client: *2\r\n$3\r\nGET\r\n$3\r\nfoo\r\n
Server: $3\r\nbar\r\n
```

### Step 4: Additional Commands
Implement more Redis commands:
- `PING` - Returns PONG
- `ECHO message` - Returns the message
- `DEL key [key ...]` - Delete one or more keys
- `EXISTS key [key ...]` - Check if keys exist
- `KEYS pattern` - Find all keys (simple version)

### Step 5: Concurrency
Handle multiple concurrent clients:
- Multi-threaded or event-driven architecture
- Ensure thread-safe access to data structures
- Support simultaneous connections

### Step 6: Expiration (Bonus)
Add support for key expiration:
- `SET key value EX seconds` - Set with expiration
- `TTL key` - Get time to live
- Automatic cleanup of expired keys

### Step 7: Persistence (Bonus)
Implement persistence:
- AOF (Append Only File) - Log all write operations
- Reload state on startup
- Background saves

## RESP Protocol Details

### Simple String
Format: `+{string}\r\n`
Example: `+OK\r\n`

### Error
Format: `-{error message}\r\n`
Example: `-ERR unknown command\r\n`

### Integer
Format: `:{number}\r\n`
Example: `:1000\r\n`

### Bulk String
Format: `${length}\r\n{data}\r\n`
Example: `$6\r\nfoobar\r\n`
Null: `$-1\r\n`

### Array
Format: `*{count}\r\n{elements...}`
Example:
```
*2\r\n
$3\r\n
foo\r\n
$3\r\n
bar\r\n
```

## Test Cases

### PING Command
```
Request:  *1\r\n$4\r\nPING\r\n
Response: +PONG\r\n
```

### ECHO Command
```
Request:  *2\r\n$4\r\nECHO\r\n$5\r\nhello\r\n
Response: $5\r\nhello\r\n
```

### SET Command
```
Request:  *3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$5\r\nvalue\r\n
Response: +OK\r\n
```

### GET Command (exists)
```
Request:  *2\r\n$3\r\nGET\r\n$3\r\nkey\r\n
Response: $5\r\nvalue\r\n
```

### GET Command (not exists)
```
Request:  *2\r\n$3\r\nGET\r\n$7\r\nmissing\r\n
Response: $-1\r\n
```

### DEL Command
```
Request:  *2\r\n$3\r\nDEL\r\n$3\r\nkey\r\n
Response: :1\r\n
```

## Example Client Interaction

Using `redis-cli` or `telnet`:

```bash
$ redis-cli -p 6379

127.0.0.1:6379> PING
PONG

127.0.0.1:6379> SET mykey "Hello"
OK

127.0.0.1:6379> GET mykey
"Hello"

127.0.0.1:6379> DEL mykey
(integer) 1

127.0.0.1:6379> GET mykey
(nil)
```

## Architecture Overview

A typical Redis server implementation includes:

1. **Network Layer** - TCP server accepting connections
2. **Protocol Layer** - RESP parser and serializer
3. **Command Layer** - Command parsing and dispatch
4. **Data Layer** - In-memory data structures
5. **Storage Layer** - Optional persistence

## Data Structures

For a simple implementation:
- **Hash Table** - For key-value storage
- **Linked List** - For hash collision handling
- **Expiration Tracking** - Timestamp for each key

## Learning Objectives

This challenge teaches:
- **Network Programming** - TCP sockets, client-server architecture
- **Protocol Design** - Understanding and implementing RESP
- **Concurrency** - Handling multiple clients
- **Data Structures** - Hash tables, memory management
- **Systems Programming** - Low-level I/O, memory management

## Resources

- [Redis Protocol Specification](https://redis.io/docs/reference/protocol-spec/)
- [Redis Commands](https://redis.io/commands/)
- [Build Your Own Redis Course](https://codingchallenges.fyi/live-courses/redis/)

## Implementation Notes

This implementation:
- Uses C for performance and systems programming practice
- Implements RESP protocol parsing and serialization
- Single-threaded event loop (can be extended to multi-threaded)
- Hash table for O(1) key-value operations
- Support for basic Redis commands
- Cross-platform support

## Testing

Test your implementation using:
1. **redis-cli** - Official Redis CLI tool
2. **telnet** - Raw TCP connections
3. **Custom test scripts** - Automated testing
4. **Unit tests** - Test each component separately

## Extension Ideas

- **More Data Types** - Lists, sets, sorted sets, hashes
- **Pub/Sub** - Message broadcasting
- **Transactions** - MULTI/EXEC commands
- **Pipelining** - Batch command execution
- **Replication** - Master-slave setup
- **Cluster Mode** - Distributed Redis
