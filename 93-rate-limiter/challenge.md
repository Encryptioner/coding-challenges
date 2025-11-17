# Build Your Own Rate Limiter

This challenge is to build your own rate limiter - a fundamental component of modern web services that controls the rate at which requests are processed to prevent abuse, ensure fair usage, and maintain system stability.

## Challenge Overview

Rate limiters are used everywhere - from API endpoints limiting requests per user, to login systems preventing brute force attacks, to distributed systems managing overall throughput. In this challenge, you'll build a production-ready rate limiting library implementing multiple algorithms.

## The Challenge

Build a rate limiter that can:
1. Limit the number of requests from an identifier (user, IP, API key) within a time window
2. Support multiple rate limiting algorithms
3. Provide rich metadata about rate limit status
4. Work in both single-instance and distributed environments
5. Be easy to integrate into existing applications

## Learning Objectives

By completing this challenge, you will learn:
- Different rate limiting algorithms and their tradeoffs
- Concurrent programming and thread safety
- Time-based windowing techniques
- Abstract interfaces and storage backends
- Decorator patterns in Python
- Production-ready error handling
- Memory vs accuracy tradeoffs

## Step 1: Fixed Window Counter

**Goal:** Implement the simplest rate limiting algorithm - Fixed Window Counter

### Overview

The fixed window counter algorithm divides time into fixed windows and counts requests in each window. For example, with a limit of 100 requests per hour:
- Window 1: 00:00-01:00 (up to 100 requests)
- Window 2: 01:00-02:00 (up to 100 requests)
- Window 3: 02:00-03:00 (up to 100 requests)

### Requirements

1. **Configuration Class**
   - Create a `RateLimitConfig` dataclass with:
     - `max_requests`: Maximum requests allowed
     - `window_seconds`: Time window in seconds
   - Validate that both values are positive

2. **Result Class**
   - Create a `RateLimitResult` class with:
     - `allowed`: Boolean indicating if request is allowed
     - `remaining`: Number of requests remaining in window
     - `reset_at`: Timestamp when the limit resets
     - `retry_after`: Seconds to wait before retrying (if denied)

3. **Storage Backend**
   - Create an abstract `StorageBackend` class with methods:
     - `increment(key, window)`: Increment counter and return new value
     - `get(key)`: Get current counter value
     - `set(key, value, ttl)`: Set value with time-to-live
     - `delete(key)`: Delete a key

4. **In-Memory Storage**
   - Implement `InMemoryStorage` backend:
     - Thread-safe operations using locks
     - Automatic expiration of old entries
     - TTL support for all keys

5. **Fixed Window Limiter**
   - Implement `FixedWindowLimiter` class:
     - Generate window-specific keys (e.g., `"fw:user123:12345"` where 12345 is window ID)
     - Increment counter for current window
     - Return appropriate `RateLimitResult`
     - Set TTL to prevent memory leaks

### Example

```python
config = RateLimitConfig(max_requests=5, window_seconds=10)
storage = InMemoryStorage()
limiter = FixedWindowLimiter(config, storage)

# Make 7 requests
for i in range(7):
    result = limiter.allow('user123')
    print(f"Request {i+1}: {'allowed' if result.allowed else 'denied'}")
    # First 5 allowed, last 2 denied

# After 10 seconds, window resets and requests are allowed again
```

### Edge Cases to Handle

- Multiple requests in same millisecond
- Window boundary transitions
- Concurrent requests from same identifier
- System time changes
- Integer overflow (use appropriate data types)

### Acceptance Criteria

- ✅ Correctly limits requests within time window
- ✅ Resets counter at window boundaries
- ✅ Thread-safe for concurrent requests
- ✅ Returns accurate remaining count
- ✅ Handles edge cases gracefully

### Known Issue: Boundary Problem

The fixed window algorithm has a known issue where twice the limit can be allowed at window boundaries:

```
Window 1: 00:00-01:00
Window 2: 01:00-02:00

00:59:50 - 100 requests (at end of Window 1)
01:00:10 - 100 requests (at start of Window 2)

Total in 20 seconds: 200 requests (2x the limit!)
```

This is expected behavior and will be addressed in later steps.

## Step 2: Sliding Window Log

**Goal:** Implement a more accurate algorithm that eliminates boundary issues

### Overview

The sliding window log algorithm maintains a log of timestamps for each request. It only counts requests within the sliding time window, providing perfect accuracy.

For example, with a limit of 100 requests per hour:
- Current time: 12:30:00
- Window: 11:30:00 to 12:30:00 (exactly 1 hour ago)
- Count all requests with timestamps in this range

### Requirements

1. **Extend Storage Backend**
   - Add methods to `StorageBackend`:
     - `get_list(key)`: Get list of timestamps
     - `add_to_list(key, value, ttl)`: Add timestamp to list
     - `cleanup_list(key, cutoff)`: Remove timestamps older than cutoff

2. **Update In-Memory Storage**
   - Implement list methods using `deque` for efficiency
   - Support cleanup of old timestamps
   - Maintain thread safety

3. **Sliding Window Log Limiter**
   - Implement `SlidingWindowLogLimiter` class:
     - Store timestamp for each request
     - Clean up timestamps older than window
     - Count requests in current window
     - Return result with accurate metadata

### Example

```python
config = RateLimitConfig(max_requests=3, window_seconds=10)
limiter = SlidingWindowLogLimiter(config, storage)

# Time: 0s
limiter.allow('user123')  # allowed, log: [0]

# Time: 2s
limiter.allow('user123')  # allowed, log: [0, 2]

# Time: 5s
limiter.allow('user123')  # allowed, log: [0, 2, 5]

# Time: 7s
limiter.allow('user123')  # denied (3 requests in last 10s)

# Time: 11s (request at 0s is now outside window)
limiter.allow('user123')  # allowed, log: [2, 5, 11]
```

### Edge Cases to Handle

- Many requests at same timestamp
- Very long request logs (memory management)
- Cleanup of old entries
- Concurrent modifications to log

### Acceptance Criteria

- ✅ Eliminates boundary burst issue
- ✅ Provides exact request counting
- ✅ Efficiently cleans old timestamps
- ✅ Thread-safe log operations
- ✅ Accurate retry_after calculation

### Tradeoffs

**Pros:**
- Most accurate algorithm
- No boundary issues
- Perfect enforcement

**Cons:**
- Higher memory usage (O(n) where n = requests in window)
- More expensive cleanup operations
- May not scale well with very high request rates

## Step 3: Token Bucket

**Goal:** Implement an algorithm that allows controlled bursts

### Overview

The token bucket algorithm maintains a "bucket" of tokens that refills at a constant rate. Each request consumes one token. This allows bursts up to the bucket capacity while ensuring the average rate stays within limits.

**Bucket capacity:** Maximum tokens (= max_requests)
**Refill rate:** tokens/second (= max_requests / window_seconds)

For example, with 100 requests per 60 seconds:
- Bucket capacity: 100 tokens
- Refill rate: 100/60 = 1.67 tokens/second
- A burst of 100 requests can be handled immediately
- After that, requests are allowed at 1.67/second

### Requirements

1. **Token Bucket Limiter**
   - Implement `TokenBucketLimiter` class:
     - Store two values: current tokens and last refill time
     - Calculate refill rate from config
     - On each request:
       - Calculate time passed since last refill
       - Add tokens based on time × refill_rate
       - Cap at bucket capacity
       - Consume token if available
     - Return appropriate result

2. **Refill Logic**
   - Calculate tokens to add: `(current_time - last_refill) × refill_rate`
   - Update tokens: `min(max_requests, tokens + tokens_to_add)`
   - Store current time as last_refill

3. **Retry Calculation**
   - If tokens < 1, calculate when next token arrives
   - `retry_after = (1 - tokens) / refill_rate`

### Example

```python
config = RateLimitConfig(max_requests=10, window_seconds=10)
limiter = TokenBucketLimiter(config, storage)
# Refill rate: 10/10 = 1 token/second

# Burst of 10 requests (all allowed immediately)
for i in range(10):
    result = limiter.allow('user123')  # all allowed

# 11th request denied (no tokens)
result = limiter.allow('user123')  # denied, retry_after ≈ 1.0

# Wait 2 seconds
time.sleep(2)

# 2 tokens refilled, 2 requests allowed
limiter.allow('user123')  # allowed
limiter.allow('user123')  # allowed
limiter.allow('user123')  # denied
```

### Edge Cases to Handle

- Fractional tokens (use float)
- Very small refill rates
- Long idle periods (bucket fills to capacity)
- Clock adjustments

### Acceptance Criteria

- ✅ Allows bursts up to capacity
- ✅ Refills at constant rate
- ✅ Accurate token calculations
- ✅ Correct retry_after values
- ✅ Handles fractional tokens

### Use Cases

- APIs that allow occasional bursts
- Systems with variable load
- User-facing features (better UX than strict limiting)

## Step 4: Sliding Window Counter

**Goal:** Implement a hybrid algorithm balancing accuracy and efficiency

### Overview

The sliding window counter combines fixed windows with interpolation to approximate a true sliding window while using minimal memory.

It uses two counters:
- Previous window count
- Current window count

Then calculates a weighted count based on position in current window:

```
weighted_count = (previous_count × (1 - elapsed%)) + current_count
```

For example, with 100 requests per 60 seconds:
```
Previous window [0-60s]: 80 requests
Current window [60-120s]: 30 requests
Current time: 70s (10s into current window)

Elapsed %: 10/60 = 16.67%
Weighted count: (80 × 83.33%) + 30 = 66.67 + 30 = 96.67

Request allowed? 96.67 < 100 ✓
```

### Requirements

1. **Sliding Window Counter Limiter**
   - Implement `SlidingWindowCounterLimiter` class:
     - Calculate current window ID: `int(current_time / window_seconds)`
     - Generate keys for current and previous windows
     - Get counts from both windows
     - Calculate position in window (0.0 to 1.0)
     - Calculate weighted count
     - Allow if weighted count < max_requests

2. **Window Key Generation**
   - Current window: `f"swc:{identifier}:{window_id}"`
   - Previous window: `f"swc:{identifier}:{window_id - 1}"`

3. **Weighted Calculation**
   - `elapsed_percentage = (current_time - window_start) / window_seconds`
   - `weighted_count = (prev_count × (1 - elapsed%)) + curr_count`

### Example

```python
config = RateLimitConfig(max_requests=10, window_seconds=60)
limiter = SlidingWindowCounterLimiter(config, storage)

# Previous window [0-60s]: 8 requests
# Current time: 70s (10s into window [60-120s])
# Current window [60-120s]: 3 requests

# Elapsed: 10/60 = 16.67%
# Weight: (8 × 83.33%) + 3 = 6.67 + 3 = 9.67
# Request allowed? 9.67 < 10 ✓

result = limiter.allow('user123')  # allowed, remaining ≈ 0
```

### Edge Cases to Handle

- Start of first window (no previous window)
- Exactly at window boundary
- Very small windows
- Fractional weighted counts

### Acceptance Criteria

- ✅ Reduces boundary burst issue
- ✅ Low memory usage (2 counters per user)
- ✅ Fast computation
- ✅ Good accuracy (better than fixed window)
- ✅ Smooth rate limiting

### Tradeoffs

**Pros:**
- Low memory (O(1) per identifier)
- Fast computation
- Better than fixed window
- Good enough for most use cases

**Cons:**
- Approximate, not exact
- Slightly more complex than fixed window
- May allow 1-2 extra requests in edge cases

## Step 5: Unified Interface and Decorator

**Goal:** Create a clean API for easy integration

### Requirements

1. **RateLimiter Class**
   - Create main `RateLimiter` class with:
     - Dictionary mapping algorithm names to classes
     - Constructor accepting algorithm name, config, storage
     - `allow(identifier)` method delegating to chosen algorithm
     - `__call__` method for callable interface

2. **Algorithm Selection**
   ```python
   ALGORITHMS = {
       'token_bucket': TokenBucketLimiter,
       'sliding_window_log': SlidingWindowLogLimiter,
       'fixed_window': FixedWindowLimiter,
       'sliding_window_counter': SlidingWindowCounterLimiter,
   }
   ```

3. **Decorator Pattern**
   - Implement `@rate_limit` decorator:
     - Accept max_requests, window_seconds, algorithm, key_func
     - Create limiter instance
     - Wrap function to check rate limit before execution
     - Raise `RateLimitExceeded` exception if denied
     - Extract identifier from function arguments

4. **Exception Class**
   - Create `RateLimitExceeded` exception:
     - Inherit from `Exception`
     - Store `RateLimitResult` for metadata access
     - Useful for error handling in applications

### Example

```python
# Direct usage
limiter = RateLimiter(
    algorithm='sliding_window_counter',
    config=RateLimitConfig(max_requests=100, window_seconds=60)
)

result = limiter.allow('user123')
if not result.allowed:
    print(f"Rate limited! Retry after {result.retry_after}s")

# Decorator usage
@rate_limit(max_requests=10, window_seconds=60)
def api_endpoint(user_id):
    return f"Processing request for {user_id}"

try:
    result = api_endpoint('user123')
except RateLimitExceeded as e:
    print(f"Rate limited: {e}")
    print(f"Retry after: {e.result.retry_after}s")
```

### Edge Cases to Handle

- Invalid algorithm names
- Missing function arguments for identifier
- Multiple decorator stacking
- Async functions (future enhancement)

### Acceptance Criteria

- ✅ Clean, intuitive API
- ✅ Easy algorithm switching
- ✅ Decorator works with any function
- ✅ Proper exception handling
- ✅ Comprehensive documentation

## Step 6: Testing and Examples

**Goal:** Ensure correctness and provide usage examples

### Requirements

1. **Unit Tests**
   - Test each algorithm independently
   - Test boundary conditions
   - Test concurrent access
   - Test storage backends
   - Test decorator functionality

2. **Integration Tests**
   - Test with Flask
   - Test with FastAPI
   - Test multi-tier limiting
   - Test different identifier strategies

3. **Example Scripts**
   - Basic usage examples
   - Web framework integration
   - Complex multi-limiter setups
   - Monitoring and observability

4. **Performance Testing**
   - Measure throughput for each algorithm
   - Memory usage benchmarks
   - Concurrent access stress tests

### Test Cases

```python
# Test 1: Basic allow/deny
def test_basic_limiting():
    config = RateLimitConfig(max_requests=3, window_seconds=10)
    limiter = RateLimiter('fixed_window', config)

    # First 3 allowed
    assert limiter.allow('user1').allowed
    assert limiter.allow('user1').allowed
    assert limiter.allow('user1').allowed

    # 4th denied
    assert not limiter.allow('user1').allowed

# Test 2: Different users
def test_different_users():
    limiter = RateLimiter('fixed_window',
                         RateLimitConfig(max_requests=1, window_seconds=10))

    # Each user gets their own limit
    assert limiter.allow('user1').allowed
    assert limiter.allow('user2').allowed
    assert not limiter.allow('user1').allowed

# Test 3: Window reset
def test_window_reset():
    limiter = RateLimiter('fixed_window',
                         RateLimitConfig(max_requests=2, window_seconds=1))

    # Use up limit
    assert limiter.allow('user1').allowed
    assert limiter.allow('user1').allowed
    assert not limiter.allow('user1').allowed

    # Wait for window reset
    time.sleep(1.1)

    # Limit reset
    assert limiter.allow('user1').allowed

# Test 4: Thread safety
def test_thread_safety():
    limiter = RateLimiter('sliding_window_counter',
                         RateLimitConfig(max_requests=100, window_seconds=10))
    results = []

    def make_requests():
        for _ in range(50):
            results.append(limiter.allow('user1'))

    threads = [threading.Thread(target=make_requests) for _ in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    # Exactly 100 allowed, rest denied
    allowed = sum(1 for r in results if r.allowed)
    assert allowed == 100
```

### Acceptance Criteria

- ✅ All tests pass
- ✅ >90% code coverage
- ✅ Examples run successfully
- ✅ Documentation is clear
- ✅ Edge cases covered

## Step 7: Production Features (Bonus)

### Distributed Systems Support

1. **Redis Storage Backend**
   - Implement `RedisStorage` class
   - Use Redis atomic operations
   - Handle connection failures
   - Support Redis cluster

2. **Distributed Algorithm Considerations**
   - Clock synchronization requirements
   - Network latency impact
   - Consistency vs availability tradeoffs

### Advanced Features

1. **Rate Limit Headers**
   - Add methods to generate HTTP headers:
     - `X-RateLimit-Limit`
     - `X-RateLimit-Remaining`
     - `X-RateLimit-Reset`
     - `Retry-After`

2. **Monitoring and Metrics**
   - Request count tracking
   - Denial rate calculation
   - Algorithm performance metrics
   - Logging integration

3. **Dynamic Rate Limits**
   - Support changing limits at runtime
   - Per-user custom limits
   - Time-based limits (lower at night)

4. **Leaky Bucket Algorithm**
   - Implement as alternative to token bucket
   - Smooth request processing
   - Queue-based approach

### Example: Redis Backend

```python
import redis

class RedisStorage(StorageBackend):
    def __init__(self, host='localhost', port=6379, db=0):
        self.client = redis.Redis(host=host, port=port, db=db)

    def increment(self, key: str, window: int) -> int:
        pipe = self.client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window)
        result = pipe.execute()
        return result[0]

    def get(self, key: str) -> Optional[int]:
        value = self.client.get(key)
        return int(value) if value else None

    # ... implement other methods
```

### Acceptance Criteria (Bonus)

- ✅ Redis backend works with all algorithms
- ✅ Handles Redis failures gracefully
- ✅ Rate limit headers generated correctly
- ✅ Monitoring provides useful metrics
- ✅ Dynamic limits work seamlessly

## Summary

You now have a production-ready rate limiter with:

1. ✅ **4 Algorithms**: Token Bucket, Sliding Window Log, Fixed Window, Sliding Window Counter
2. ✅ **Pluggable Storage**: Abstract backend supporting in-memory and Redis
3. ✅ **Thread Safety**: Safe for concurrent use
4. ✅ **Clean API**: Easy integration with decorator pattern
5. ✅ **Rich Metadata**: Full visibility into rate limit status
6. ✅ **Production Ready**: Comprehensive error handling and testing

## Next Steps

- Integrate with your web framework (Flask, FastAPI, Django)
- Deploy with Redis for distributed systems
- Add monitoring and alerting
- Customize for your specific use cases
- Contribute improvements back to the community

## Resources

- [Token Bucket Algorithm - Wikipedia](https://en.wikipedia.org/wiki/Token_bucket)
- [Rate Limiting Strategies - Cloudflare](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/)
- [Distributed Rate Limiting - Figma](https://www.figma.com/blog/an-alternative-approach-to-rate-limiting/)
- [Redis Rate Limiting - Redis.io](https://redis.io/commands/incr#pattern-rate-limiter)
- [RFC 6585 - HTTP Status Code 429](https://tools.ietf.org/html/rfc6585)

## Credits

Challenge from [CodingChallenges.fyi](https://codingchallenges.fyi/challenges/challenge-rate-limiter)

---

Built with ❤️ as part of [CodingChallenges.fyi](https://codingchallenges.fyi)
