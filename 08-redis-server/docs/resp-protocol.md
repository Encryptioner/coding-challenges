# RESP Protocol - Redis Serialization Protocol

## Overview

RESP (REdis Serialization Protocol) is the protocol used by Redis clients and servers to communicate. It's designed to be:
- **Simple to implement** - Text-based, human-readable
- **Fast to parse** - Minimal overhead
- **Binary-safe** - Can transmit any data

## Why RESP?

Before RESP, protocols were either:
- **Too complex** (HTTP, SMTP) - Hard to implement, lots of overhead
- **Too simple** (plain text) - Ambiguous parsing, no type information
- **Binary** (Protocol Buffers) - Not human-readable, harder to debug

RESP strikes a balance: simple enough to implement in an afternoon, yet powerful enough for production use.

## The Five Data Types

RESP has five data types, each identified by the first byte:

```
+  Simple Strings
-  Errors
:  Integers
$  Bulk Strings
*  Arrays
```

### 1. Simple Strings

**Format:** `+{string}\r\n`

Used for short, single-line strings without special characters.

**Examples:**
```
+OK\r\n
+PONG\r\n
+QUEUED\r\n
```

**When to use:**
- Status messages (OK, PONG)
- Short responses
- No newlines or binary data needed

**Parsing:**
```c
if (*p == '+') {
    p++;  // Skip '+'
    const char *start = p;
    while (*p != '\r') p++;  // Find \r
    int len = p - start;
    char *str = malloc(len + 1);
    memcpy(str, start, len);
    str[len] = '\0';
    p += 2;  // Skip \r\n
}
```

### 2. Errors

**Format:** `-{error message}\r\n`

Similar to simple strings but indicates an error.

**Examples:**
```
-ERR unknown command\r\n
-WRONGTYPE Operation against a key holding the wrong kind of value\r\n
-ERR syntax error\r\n
```

**Convention:**
- First word is error type (ERR, WRONGTYPE, etc.)
- Rest is human-readable message

**When to use:**
- Command failures
- Invalid arguments
- Server errors

### 3. Integers

**Format:** `:{number}\r\n`

Used for numeric responses.

**Examples:**
```
:0\r\n          # Zero
:1000\r\n       # Thousand
:-1\r\n         # Negative one
```

**When to use:**
- Count of deleted keys (DEL)
- Boolean results (EXISTS: 1 or 0)
- Numeric values

**Parsing:**
```c
if (*p == ':') {
    p++;  // Skip ':'
    long num = atol(p);
    while (*p != '\r') p++;
    p += 2;  // Skip \r\n
}
```

### 4. Bulk Strings

**Format:** `${length}\r\n{data}\r\n`

Binary-safe strings with explicit length.

**Examples:**
```
$6\r\nfoobar\r\n          # "foobar" (6 bytes)
$0\r\n\r\n                # Empty string
$-1\r\n                   # Null (no data follows)
$11\r\nhello\nworld\r\n   # String with newline
```

**Null Bulk String:**
```
$-1\r\n
```

**When to use:**
- Key and value data
- Any binary data
- Strings with newlines
- Default for most string data

**Parsing:**
```c
if (*p == '$') {
    p++;  // Skip '$'
    int len = atoi(p);
    while (*p != '\r') p++;
    p += 2;  // Skip \r\n

    if (len == -1) {
        // Null bulk string
        return NULL;
    }

    char *str = malloc(len + 1);
    memcpy(str, p, len);
    str[len] = '\0';
    p += len + 2;  // Skip data and \r\n
}
```

### 5. Arrays

**Format:** `*{count}\r\n{elements...}`

Collection of RESP values (any type).

**Examples:**

**Empty array:**
```
*0\r\n
```

**Array of bulk strings:**
```
*2\r\n
$3\r\n
foo\r\n
$3\r\n
bar\r\n
```

**Array of integers:**
```
*3\r\n
:1\r\n
:2\r\n
:3\r\n
```

**Mixed types:**
```
*3\r\n
$3\r\n
foo\r\n
:42\r\n
+OK\r\n
```

**Nested arrays:**
```
*2\r\n
*2\r\n
$3\r\n
foo\r\n
$3\r\n
bar\r\n
*2\r\n
:1\r\n
:2\r\n
```

**When to use:**
- Commands (array of bulk strings)
- Multi-key responses (KEYS, MGET)
- Complex data structures

**Parsing (recursive):**
```c
if (*p == '*') {
    p++;  // Skip '*'
    int count = atoi(p);
    while (*p != '\r') p++;
    p += 2;  // Skip \r\n

    RESPValue **elements = malloc(count * sizeof(RESPValue*));
    for (int i = 0; i < count; i++) {
        elements[i] = parse_resp(&p);  // Recursive!
    }
}
```

## Client-Server Protocol

### Sending Commands

Clients send commands as **arrays of bulk strings**.

**Example: PING**
```
*1\r\n
$4\r\n
PING\r\n
```

Breakdown:
- `*1\r\n` - Array with 1 element
- `$4\r\n` - Bulk string of length 4
- `PING\r\n` - The command

**Example: SET key value**
```
*3\r\n
$3\r\n
SET\r\n
$3\r\n
key\r\n
$5\r\n
value\r\n
```

Breakdown:
- `*3\r\n` - Array with 3 elements
- `$3\r\n SET\r\n` - Command "SET"
- `$3\r\n key\r\n` - First arg "key"
- `$5\r\n value\r\n` - Second arg "value"

**Why arrays of bulk strings?**
1. **Binary safe** - Arguments can contain any bytes
2. **Explicit length** - No escaping needed
3. **Uniform** - All commands follow same format

### Receiving Responses

Servers respond with any RESP type:

**Simple response:**
```
Command: PING
Response: +PONG\r\n
```

**Value response:**
```
Command: GET mykey
Response: $5\r\nHello\r\n
```

**Null response:**
```
Command: GET missing
Response: $-1\r\n
```

**Error response:**
```
Command: INVALID
Response: -ERR unknown command 'INVALID'\r\n
```

**Integer response:**
```
Command: DEL key1 key2
Response: :2\r\n
```

**Array response:**
```
Command: KEYS *
Response: *2\r\n$4\r\nkey1\r\n$4\r\nkey2\r\n
```

## Complete Examples

### Example 1: PING

**Client sends:**
```
*1\r\n$4\r\nPING\r\n
```

**Server responds:**
```
+PONG\r\n
```

**Visualization:**
```
Client                          Server
  │                               │
  │  *1\r\n$4\r\nPING\r\n        │
  ├──────────────────────────────>│
  │                               │
  │          +PONG\r\n            │
  │<──────────────────────────────┤
  │                               │
```

### Example 2: SET and GET

**Client sends SET:**
```
*3\r\n
$3\r\n
SET\r\n
$4\r\n
name\r\n
$4\r\n
John\r\n
```

**Server responds:**
```
+OK\r\n
```

**Client sends GET:**
```
*2\r\n
$3\r\n
GET\r\n
$4\r\n
name\r\n
```

**Server responds:**
```
$4\r\n
John\r\n
```

### Example 3: Multi-key DEL

**Client sends:**
```
*4\r\n
$3\r\n
DEL\r\n
$4\r\n
key1\r\n
$4\r\n
key2\r\n
$4\r\n
key3\r\n
```

**Server responds:**
```
:2\r\n
```
(Indicates 2 keys were deleted)

## Implementation Tips

### Parsing Strategy

**Option 1: Character-by-character**
```c
char c = *p++;
if (c == '+') {
    // Parse simple string
} else if (c == '-') {
    // Parse error
}
// ... etc
```

**Option 2: Type-first**
```c
switch (*p) {
    case '+': return parse_simple_string(&p);
    case '-': return parse_error(&p);
    case ':': return parse_integer(&p);
    case '$': return parse_bulk_string(&p);
    case '*': return parse_array(&p);
}
```

### Serialization Strategy

**Structured approach:**
```c
int serialize(RESPValue *val, char *buf) {
    switch (val->type) {
        case RESP_SIMPLE_STRING:
            return sprintf(buf, "+%s\r\n", val->str);
        case RESP_ERROR:
            return sprintf(buf, "-%s\r\n", val->str);
        case RESP_INTEGER:
            return sprintf(buf, ":%ld\r\n", val->integer);
        // ... etc
    }
}
```

### Error Handling

**Common errors:**
1. **Protocol error** - Invalid first byte
2. **Incomplete data** - Buffer ends mid-message
3. **Invalid length** - Negative length for bulk string (except -1)
4. **Type mismatch** - Expected array, got string

**Error response format:**
```
-ERR {message}\r\n
-WRONGTYPE {message}\r\n
-SYNTAXERR {message}\r\n
```

### Performance Optimization

**Buffer size:**
- Too small → Multiple recv() calls
- Too large → Wasted memory
- Sweet spot: 4KB - 16KB

**Parsing:**
- Don't validate UTF-8 (binary safe!)
- Use `memcpy()` not `strcpy()` (faster)
- Pre-allocate arrays when possible

**Memory:**
- Reuse buffers
- Free RESP values after use
- Watch for leaks in error paths

## Testing RESP

### Manual Testing with netcat

```bash
# Connect
nc localhost 6379

# Type (each line is what you type)
*1
$4
PING

# Server responds
+PONG
```

### Creating Test Messages

**Helper function:**
```c
char *create_command(int argc, char **argv) {
    char *buf = malloc(4096);
    int pos = 0;

    pos += sprintf(buf + pos, "*%d\r\n", argc);
    for (int i = 0; i < argc; i++) {
        int len = strlen(argv[i]);
        pos += sprintf(buf + pos, "$%d\r\n%s\r\n", len, argv[i]);
    }

    return buf;
}

// Usage:
char *cmd = create_command(3, (char*[]){"SET", "key", "value"});
```

## Common Pitfalls

### 1. Forgetting \r\n

❌ Wrong:
```c
sprintf(buf, "+OK\n");  // Missing \r
```

✅ Correct:
```c
sprintf(buf, "+OK\r\n");
```

### 2. Not handling binary data

❌ Wrong:
```c
char *str = strdup(data);  // Stops at first \0
```

✅ Correct:
```c
char *str = malloc(len + 1);
memcpy(str, data, len);  // Copy exact bytes
str[len] = '\0';
```

### 3. Buffer overflow

❌ Wrong:
```c
sprintf(buf, "$%d\r\n%s\r\n", len, str);  // No bounds check
```

✅ Correct:
```c
snprintf(buf, buf_size, "$%d\r\n%s\r\n", len, str);
```

### 4. Memory leaks

❌ Wrong:
```c
RESPValue *val = parse_resp(buf);
// ... use val ...
// Forgot to free!
```

✅ Correct:
```c
RESPValue *val = parse_resp(buf);
// ... use val ...
resp_free(val);  // Always free
```

## RESP vs Other Protocols

### HTTP
- RESP: Binary-safe, simple parsing
- HTTP: Text headers, complex parsing, overhead

### JSON
- RESP: Types built-in (integer, array)
- JSON: Everything is text, need parsing

### Protocol Buffers
- RESP: Human-readable, debug-friendly
- Protobuf: Binary, efficient but opaque

### MessagePack
- RESP: Simpler spec
- MessagePack: More compact, more complex

## Summary

RESP is:
- ✅ **Simple** - 5 types, clear rules
- ✅ **Fast** - Minimal parsing overhead
- ✅ **Binary-safe** - Handle any data
- ✅ **Human-readable** - Easy debugging
- ✅ **Extensible** - Can add new types

Perfect for Redis's use case: fast, simple, reliable client-server communication.

## References

- [Official RESP Specification](https://redis.io/docs/reference/protocol-spec/)
- [Redis Protocol Tutorial](https://redis.io/topics/protocol)
