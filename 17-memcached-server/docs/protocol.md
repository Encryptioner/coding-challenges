# Memcached Protocol Specification

Complete reference for the Memcached text protocol implemented in ccmemcached.

## Table of Contents

1. [Protocol Overview](#protocol-overview)
2. [Storage Commands](#storage-commands)
3. [Retrieval Commands](#retrieval-commands)
4. [Deletion Commands](#deletion-commands)
5. [Statistics Commands](#statistics-commands)
6. [Error Responses](#error-responses)
7. [Protocol Examples](#protocol-examples)

## Protocol Overview

### Connection

- **Protocol**: TCP
- **Port**: 11211 (default)
- **Format**: Line-oriented text
- **Line Terminator**: `\r\n` (CRLF)
- **Character Set**: ASCII

### Command Structure

Commands consist of:
1. **Command line**: Space-separated fields ending with \r\n
2. **Data block**: (optional) Raw bytes followed by \r\n

### Response Structure

Responses are:
- Single-line acknowledgments: `STORED\r\n`, `DELETED\r\n`, etc.
- Multi-line data: `VALUE ... \r\n<data>\r\nEND\r\n`
- Error messages: `ERROR\r\n`, `CLIENT_ERROR ...\r\n`, etc.

## Storage Commands

### SET

Store data unconditionally.

**Syntax:**
```
set <key> <flags> <exptime> <bytes> [noreply]\r\n
<data block>\r\n
```

**Parameters:**
- `key`: Key under which to store (max 250 chars)
- `flags`: 32-bit unsigned integer for client use
- `exptime`: Expiration time (see [Expiration](#expiration))
- `bytes`: Number of bytes in data block
- `noreply`: (optional) Suppress response

**Responses:**
- `STORED\r\n` - Success
- `NOT_STORED\r\n` - Failure (shouldn't happen for set)
- `CLIENT_ERROR bad command line format\r\n` - Syntax error
- `SERVER_ERROR out of memory\r\n` - Memory allocation failed

**Example:**
```
C: set mykey 0 0 5\r\n
C: hello\r\n
S: STORED\r\n
```

**With noreply:**
```
C: set mykey 0 0 5 noreply\r\n
C: hello\r\n
(no response from server)
```

### ADD

Store data only if key doesn't already exist.

**Syntax:**
```
add <key> <flags> <exptime> <bytes> [noreply]\r\n
<data block>\r\n
```

**Responses:**
- `STORED\r\n` - Success (key didn't exist)
- `NOT_STORED\r\n` - Failure (key already exists)

**Example:**
```
C: add newkey 0 0 5\r\n
C: value\r\n
S: STORED\r\n

C: add newkey 0 0 5\r\n
C: other\r\n
S: NOT_STORED\r\n
```

### REPLACE

Store data only if key already exists.

**Syntax:**
```
replace <key> <flags> <exptime> <bytes> [noreply]\r\n
<data block>\r\n
```

**Responses:**
- `STORED\r\n` - Success (key existed)
- `NOT_STORED\r\n` - Failure (key didn't exist)

**Example:**
```
C: replace existingkey 0 0 7\r\n
C: newdata\r\n
S: STORED\r\n

C: replace nonexistent 0 0 4\r\n
C: data\r\n
S: NOT_STORED\r\n
```

### APPEND

Add data to the end of an existing value.

**Syntax:**
```
append <key> <flags> <exptime> <bytes> [noreply]\r\n
<data block>\r\n
```

**Behavior:**
- If key exists: Appends data to existing value
- If key doesn't exist: Returns NOT_STORED
- Flags and exptime in command are ignored (existing values kept)

**Responses:**
- `STORED\r\n` - Success
- `NOT_STORED\r\n` - Key doesn't exist

**Example:**
```
C: set mykey 0 0 5\r\n
C: hello\r\n
S: STORED\r\n

C: append mykey 0 0 6\r\n
C:  world\r\n
S: STORED\r\n

C: get mykey\r\n
S: VALUE mykey 0 11\r\n
S: hello world\r\n
S: END\r\n
```

### PREPEND

Add data to the beginning of an existing value.

**Syntax:**
```
prepend <key> <flags> <exptime> <bytes> [noreply]\r\n
<data block>\r\n
```

**Behavior:**
- If key exists: Prepends data to existing value
- If key doesn't exist: Returns NOT_STORED
- Flags and exptime in command are ignored

**Responses:**
- `STORED\r\n` - Success
- `NOT_STORED\r\n` - Key doesn't exist

**Example:**
```
C: set mykey 0 0 5\r\n
C: world\r\n
S: STORED\r\n

C: prepend mykey 0 0 6\r\n
C: hello \r\n
S: STORED\r\n

C: get mykey\r\n
S: VALUE mykey 0 11\r\n
S: hello world\r\n
S: END\r\n
```

## Retrieval Commands

### GET

Retrieve one or more keys.

**Syntax:**
```
get <key>*\r\n
```

Multiple keys separated by spaces.

**Response:**
```
VALUE <key> <flags> <bytes>\r\n
<data block>\r\n
[additional VALUE responses for other keys]
END\r\n
```

If no keys found:
```
END\r\n
```

**Single Key Example:**
```
C: get mykey\r\n
S: VALUE mykey 0 5\r\n
S: hello\r\n
S: END\r\n
```

**Multiple Keys Example:**
```
C: get key1 key2 key3\r\n
S: VALUE key1 0 6\r\n
S: value1\r\n
S: VALUE key3 0 6\r\n
S: value3\r\n
S: END\r\n
```
(key2 not found, so not included in response)

**No Keys Found:**
```
C: get nonexistent\r\n
S: END\r\n
```

## Deletion Commands

### DELETE

Remove a key from cache.

**Syntax:**
```
delete <key> [noreply]\r\n
```

**Responses:**
- `DELETED\r\n` - Key was found and deleted
- `NOT_FOUND\r\n` - Key doesn't exist

**Example:**
```
C: delete mykey\r\n
S: DELETED\r\n

C: delete nonexistent\r\n
S: NOT_FOUND\r\n
```

### FLUSH_ALL

Remove all keys from cache.

**Syntax:**
```
flush_all\r\n
```

**Response:**
```
OK\r\n
```

**Example:**
```
C: flush_all\r\n
S: OK\r\n
```

## Statistics Commands

### STATS

Display server statistics.

**Syntax:**
```
stats\r\n
```

**Response:**
```
STAT <name> <value>\r\n
[additional STAT lines]
END\r\n
```

**Statistics Returned:**

| Stat Name | Type | Description |
|-----------|------|-------------|
| `curr_items` | uint64 | Current number of items in cache |
| `total_items` | uint64 | Total items stored since start |
| `bytes` | uint64 | Current bytes used by items |
| `curr_connections` | uint64 | Current active connections |
| `total_connections` | uint64 | Total connections since start |
| `cmd_get` | uint64 | GET commands executed |
| `cmd_set` | uint64 | SET commands executed |
| `get_hits` | uint64 | GET requests that found data |
| `get_misses` | uint64 | GET requests that didn't find data |

**Example:**
```
C: stats\r\n
S: STAT curr_items 10\r\n
S: STAT total_items 25\r\n
S: STAT bytes 1024\r\n
S: STAT curr_connections 2\r\n
S: STAT total_connections 15\r\n
S: STAT cmd_get 100\r\n
S: STAT cmd_set 50\r\n
S: STAT get_hits 80\r\n
S: STAT get_misses 20\r\n
S: END\r\n
```

## Other Commands

### QUIT

Close the connection.

**Syntax:**
```
quit\r\n
```

**Response:**
None (server closes connection)

**Example:**
```
C: quit\r\n
(connection closed)
```

## Expiration

The `exptime` parameter specifies when an item expires:

| Value | Meaning |
|-------|---------|
| `0` | Never expires |
| `1` to `2592000` (30 days) | Relative time in seconds from now |
| `> 2592000` | Absolute Unix timestamp |
| `< 0` | Immediate expiration |

**Examples:**

```
# Never expires
set key1 0 0 5
value

# Expires in 60 seconds
set key2 0 60 5
value

# Expires at specific Unix timestamp
set key3 0 1699564800 5
value

# Expires immediately
set key4 0 -1 5
value
```

**Expiration Behavior:**
- Items are not actively removed when they expire
- Expired items are removed when accessed (lazy expiration)
- GET of expired key returns `END\r\n` as if key doesn't exist

## Error Responses

### ERROR

Generic error message.

```
ERROR\r\n
```

Used when command is not recognized.

### CLIENT_ERROR

Client sent bad data.

```
CLIENT_ERROR <error description>\r\n
```

Examples:
- `CLIENT_ERROR bad command line format\r\n`
- `CLIENT_ERROR bad data chunk\r\n`

### SERVER_ERROR

Server encountered an error.

```
SERVER_ERROR <error description>\r\n
```

Examples:
- `SERVER_ERROR out of memory\r\n`
- `SERVER_ERROR temporary failure\r\n`

## Protocol Examples

### Complete Session

```
C: <connect to localhost:11211>
S: (connection accepted)

C: set user:1:name 0 0 4\r\n
C: John\r\n
S: STORED\r\n

C: set user:1:email 0 0 14\r\n
C: john@email.com\r\n
S: STORED\r\n

C: get user:1:name user:1:email\r\n
S: VALUE user:1:name 0 4\r\n
S: John\r\n
S: VALUE user:1:email 0 14\r\n
S: john@email.com\r\n
S: END\r\n

C: add user:1:name 0 0 4\r\n
C: Jane\r\n
S: NOT_STORED\r\n

C: replace user:1:name 0 0 4\r\n
C: Jane\r\n
S: STORED\r\n

C: append user:1:name 0 0 4\r\n
C:  Doe\r\n
S: STORED\r\n

C: get user:1:name\r\n
S: VALUE user:1:name 0 8\r\n
S: Jane Doe\r\n
S: END\r\n

C: delete user:1:email\r\n
S: DELETED\r\n

C: get user:1:email\r\n
S: END\r\n

C: stats\r\n
S: STAT curr_items 1\r\n
S: STAT total_items 3\r\n
S: STAT bytes 8\r\n
S: STAT curr_connections 1\r\n
S: STAT total_connections 1\r\n
S: STAT cmd_get 3\r\n
S: STAT cmd_set 3\r\n
S: STAT get_hits 4\r\n
S: STAT get_misses 1\r\n
S: END\r\n

C: flush_all\r\n
S: OK\r\n

C: quit\r\n
S: (connection closed)
```

### Binary Data

The protocol supports binary data (not just text):

```
C: set image:logo 0 0 6\r\n
C: \x89PNG\r\n\r\n  (6 bytes of binary PNG data)
S: STORED\r\n

C: get image:logo\r\n
S: VALUE image:logo 0 6\r\n
S: \x89PNG\r\n\r\n
S: END\r\n
```

**Important:** The byte count must be exact. Don't rely on \r\n to terminate data, as binary data may contain those bytes.

### Using Flags

Flags are arbitrary 32-bit integers for client use (e.g., data type hints):

```
# Flag 0 = string
C: set data:string 0 0 5\r\n
C: hello\r\n
S: STORED\r\n

# Flag 1 = JSON
C: set data:json 1 0 15\r\n
C: {"user":"john"}\r\n
S: STORED\r\n

# Flag 2 = serialized object
C: set data:object 2 0 10\r\n
C: <binary>\r\n
S: STORED\r\n

# Client can use flags to determine deserialization
C: get data:json\r\n
S: VALUE data:json 1 15\r\n
S: {"user":"john"}\r\n
S: END\r\n

Client sees flag=1, knows to JSON.parse() the data.
```

## Protocol Limitations

Current implementation does not support:

1. **CAS (Compare-And-Swap)**: No `gets`/`cas` commands
2. **Increment/Decrement**: No `incr`/`decr` commands
3. **Touch**: No command to update exptime without fetching
4. **Stats items**: No per-slab statistics
5. **Binary protocol**: Only text protocol supported
6. **SASL authentication**: No authentication mechanism

These are opportunities for extension!

## Summary

The Memcached text protocol is:
- **Simple**: Easy to implement and debug
- **Human-readable**: Can test with telnet
- **Line-oriented**: Parse line-by-line
- **Stateless**: Each command is independent
- **Efficient**: Minimal overhead for simple operations

For implementation details, see `implementation.md`.
For usage examples, see `examples.md`.
