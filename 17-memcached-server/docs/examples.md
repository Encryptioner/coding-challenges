# Memcached Practical Examples

Hands-on examples demonstrating ccmemcached usage in various scenarios.

## Table of Contents

1. [Basic Operations](#basic-operations)
2. [Session Storage](#session-storage)
3. [Cache Strategies](#cache-strategies)
4. [Real-World Use Cases](#real-world-use-cases)
5. [Client Libraries](#client-libraries)
6. [Performance Testing](#performance-testing)
7. [Debugging](#debugging)

## Basic Operations

### Simple Key-Value Storage

```bash
$ telnet localhost 11211
Connected to localhost.

# Store a value
set greeting 0 0 13
Hello, World!
STORED

# Retrieve it
get greeting
VALUE greeting 0 13
Hello, World!
END

# Update it
set greeting 0 0 8
Hi there
STORED

# Verify
get greeting
VALUE greeting 0 8
Hi there
END
```

### Using Flags for Data Types

```bash
# String (flag 0)
set name 0 0 4
John
STORED

# Integer (flag 1)
set age 1 0 2
25
STORED

# JSON (flag 2)
set user 2 0 26
{"name":"John","age":25}
STORED

# Retrieve with type information
get name age user
VALUE name 0 4
John
VALUE age 1 2
25
VALUE user 2 26
{"name":"John","age":25}
END
```

## Session Storage

### Web Session Example

```bash
# Store session data
set session:abc123 0 3600 47
{"user_id":42,"logged_in":true,"cart_items":3}
STORED

# Later, retrieve session
get session:abc123
VALUE session:abc123 0 47
{"user_id":42,"logged_in":true,"cart_items":3}
END

# Update cart
set session:abc123 0 3600 47
{"user_id":42,"logged_in":true,"cart_items":4}
STORED

# Session expires after 1 hour (3600 seconds)
```

### Shopping Cart

```bash
# Add first item to cart
set cart:user123 0 1800 28
["product_1","product_2"]
STORED

# Add more items by appending
# (Note: This won't work for JSON arrays - need to GET, parse, modify, SET)

# Better approach: Store as separate keys
set cart:user123:items 0 1800 2
3
STORED

set cart:user123:total 0 1800 5
99.99
STORED
```

## Cache Strategies

### Cache-Aside Pattern

```python
# Python example
from pymemcache.client import base

client = base.Client(('localhost', 11211))

def get_user(user_id):
    # Try cache first
    cache_key = f"user:{user_id}"
    user = client.get(cache_key)

    if user:
        print("Cache hit!")
        return user

    # Cache miss - fetch from database
    print("Cache miss - fetching from DB")
    user = database.query(f"SELECT * FROM users WHERE id={user_id}")

    # Store in cache for 5 minutes
    client.set(cache_key, user, expire=300)

    return user
```

### Write-Through Cache

```python
def update_user(user_id, data):
    cache_key = f"user:{user_id}"

    # Update database
    database.update(f"UPDATE users SET ... WHERE id={user_id}", data)

    # Update cache immediately
    client.set(cache_key, data, expire=300)
```

### Time-based Expiration

```bash
# Cache API response for 1 minute
set api:weather:NYC 0 60 42
{"temp":72,"conditions":"sunny","wind":5}
STORED

# Cache hourly data for 1 hour
set stats:hourly:2024-01-15-14 0 3600 25
{"requests":1500,"errors":3}
STORED

# Cache daily data for 24 hours
set stats:daily:2024-01-15 0 86400 28
{"requests":35000,"errors":12}
STORED
```

## Real-World Use Cases

### Page Fragment Caching

```bash
# Cache rendered HTML fragments
set fragment:header 0 300 120
<header><nav>...</nav></header>
STORED

set fragment:sidebar 0 600 85
<aside><ul>...</ul></aside>
STORED

set fragment:footer 0 3600 95
<footer>Copyright...</footer>
STORED

# Assemble page from fragments
get fragment:header fragment:sidebar fragment:footer
VALUE fragment:header 0 120
<header><nav>...</nav></header>
VALUE fragment:sidebar 0 85
<aside><ul>...</ul></aside>
VALUE fragment:footer 0 95
<footer>Copyright...</footer>
END
```

### Database Query Results

```bash
# Cache expensive query
set query:top_products_2024 0 600 65
[{"id":1,"name":"Product A","sales":1500},{"id":2,...}]
STORED

# Cache user's recent orders
set orders:user:456 0 300 85
[{"order_id":789,"total":99.99,"date":"2024-01-15"},...]
STORED
```

### Rate Limiting

```bash
# Track API calls per user per minute
set ratelimit:user:123:2024-01-15-14:30 0 60 2
15
STORED

# Check if under limit (e.g., max 100 per minute)
get ratelimit:user:123:2024-01-15-14:30
VALUE ratelimit:user:123:2024-01-15-14:30 0 2
15
END

# Increment (pseudo-code, would need INCR command)
# For now, GET → increment → SET
```

### Leaderboard Caching

```bash
# Cache top 10 players
set leaderboard:top10 0 60 120
[{"rank":1,"player":"Alice","score":9500},{"rank":2,"player":"Bob","score":9200},...]
STORED

# Update when score changes
replace leaderboard:top10 0 60 125
[{"rank":1,"player":"Charlie","score":9600},...]
STORED
```

## Client Libraries

### Python (pymemcache)

```python
from pymemcache.client import base

# Connect
client = base.Client(('localhost', 11211))

# Set
client.set('key', 'value')
client.set('expires', 'value', expire=60)

# Get
value = client.get('key')
print(value)  # b'value'

# Delete
client.delete('key')

# Multiple gets
results = client.get_many(['key1', 'key2', 'key3'])
print(results)  # {'key1': b'value1', 'key3': b'value3'}

# Stats
stats = client.stats()
print(stats)
```

### Node.js (memjs)

```javascript
const memjs = require('memjs');
const client = memjs.Client.create('localhost:11211');

// Set
await client.set('key', 'value');
await client.set('expires', 'value', { expires: 60 });

// Get
const { value } = await client.get('key');
console.log(value.toString());

// Delete
await client.delete('key');

// Flush all
await client.flush();
```

### Go

```go
package main

import (
    "github.com/bradfitz/gomemcache/memcache"
)

func main() {
    mc := memcache.New("localhost:11211")

    // Set
    mc.Set(&memcache.Item{
        Key:   "key",
        Value: []byte("value"),
    })

    // Get
    item, err := mc.Get("key")
    if err != nil {
        panic(err)
    }
    fmt.Println(string(item.Value))

    // Delete
    mc.Delete("key")
}
```

## Performance Testing

### Benchmarking with memtier_benchmark

```bash
# Install memtier_benchmark
git clone https://github.com/RedisLabs/memtier_benchmark
cd memtier_benchmark
autoreconf -ivf
./configure
make

# Run benchmark
./memtier_benchmark -s localhost -p 11211 \
    --protocol=memcache_text \
    --ratio=1:10 \
    --test-time=60 \
    --key-pattern=R:R \
    --data-size=100

# Results:
# - Requests per second
# - Latency percentiles
# - Bandwidth
```

### Simple Load Test with Python

```python
import time
from pymemcache.client import base
from concurrent.futures import ThreadPoolExecutor

client = base.Client(('localhost', 11211))

def write_test(n):
    start = time.time()
    for i in range(n):
        client.set(f'key{i}', f'value{i}')
    return time.time() - start

# Single-threaded
elapsed = write_test(10000)
print(f"10,000 writes: {elapsed:.2f}s ({10000/elapsed:.0f} ops/sec)")

# Multi-threaded
with ThreadPoolExecutor(max_workers=10) as executor:
    start = time.time()
    futures = [executor.submit(write_test, 1000) for _ in range(10)]
    [f.result() for f in futures]
    elapsed = time.time() - start
    print(f"10 threads × 1,000 writes: {elapsed:.2f}s ({10000/elapsed:.0f} ops/sec)")
```

## Debugging

### Monitoring with telnet

```bash
# Watch server stats in real-time
while true; do
    echo "stats" | nc localhost 11211
    sleep 1
    clear
done
```

### Inspecting Cache Contents

```bash
# List all keys (not standard Memcached, but useful for debugging)
# Note: Real Memcached doesn't have this - you'd need to track keys separately

# Get statistics
echo "stats" | nc localhost 11211
STAT curr_items 150
STAT total_items 500
STAT bytes 15360
...

# Calculate hit rate
# hit_rate = get_hits / (get_hits + get_misses)
# 80 / (80 + 20) = 80% hit rate
```

### Testing Expiration

```bash
$ telnet localhost 11211

# Set with 5-second expiration
set testexp 0 5 4
test
STORED

# Immediately get
get testexp
VALUE testexp 0 4
test
END

# Wait 6 seconds...
(wait)

# Try again
get testexp
END
```

### Testing Concurrent Access

```bash
# Terminal 1
$ telnet localhost 11211
set counter 0 0 1
0
STORED

# Terminal 2 (simultaneously)
$ telnet localhost 11211
get counter
VALUE counter 0 1
0
END

set counter 0 0 1
1
STORED

# Terminal 1
get counter
VALUE counter 0 1
1
END
```

## Advanced Patterns

### Prefix-based Organization

```bash
# Use prefixes for namespacing
set user:123:profile 0 300 ...
set user:123:settings 0 300 ...
set user:123:friends 0 300 ...

set product:456:details 0 600 ...
set product:456:reviews 0 600 ...

set session:abc:data 0 3600 ...
```

### Version Stamping

```bash
# Include version in key to invalidate old cached data
set user:123:profile:v2 0 300 ...

# When schema changes, just increment version
set user:123:profile:v3 0 300 ...

# Old v2 key naturally expires
```

### Conditional SET Operations

```bash
# Try to add (only if doesn't exist)
add lock:resource:xyz 0 10 7
locked
STORED

# If NOT_STORED, someone else has the lock
add lock:resource:xyz 0 10 7
locked
NOT_STORED

# Use replace to update only if exists
replace active:session:abc 0 300 ...
```

## Troubleshooting

### Connection Refused

```bash
$ telnet localhost 11211
telnet: connect to address 127.0.0.1: Connection refused

# Solution: Start the server
./ccmemcached
```

### Values Not Found

```bash
get mykey
END

# Possible causes:
# 1. Key was never set
# 2. Key expired
# 3. Server was restarted (data lost)
# 4. FLUSH_ALL was executed
```

### Memory Issues

```bash
# Monitor memory usage
stats
STAT bytes 104857600  # 100MB in use

# If running low on memory:
# 1. Flush old data: flush_all
# 2. Restart server
# 3. Implement LRU eviction (future feature)
```

## Best Practices

1. **Use meaningful key names**
   ```
   Good: user:123:profile
   Bad:  u123p
   ```

2. **Set reasonable expiration times**
   ```
   set temp:data 0 300 ...  # 5 minutes for volatile data
   set stable:config 0 3600 ...  # 1 hour for stable data
   ```

3. **Handle cache misses gracefully**
   ```python
   data = cache.get(key) or fetch_from_database(key)
   ```

4. **Don't store huge values**
   ```
   # Keep values under 1MB
   # Break large data into smaller chunks if needed
   ```

5. **Monitor cache effectiveness**
   ```bash
   # Check hit rate regularly
   echo "stats" | nc localhost 11211 | grep get_hits
   echo "stats" | nc localhost 11211 | grep get_misses
   ```

## Summary

Memcached excels at:
- ✅ Session storage
- ✅ Database query caching
- ✅ API response caching
- ✅ Fragment caching
- ✅ Rate limiting
- ✅ Temporary data storage

Remember:
- Data is volatile (not persisted)
- Keep values reasonably sized
- Use appropriate expiration times
- Monitor hit rates
- Handle cache misses

For protocol details, see `protocol.md`.
For implementation details, see `implementation.md`.
