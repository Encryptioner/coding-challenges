# Implementation Guide

This document provides a deep dive into the implementation of the rate limiter library, explaining design decisions, code architecture, and how all the pieces fit together.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Components](#core-components)
- [Storage Backend Design](#storage-backend-design)
- [Algorithm Implementations](#algorithm-implementations)
- [Thread Safety](#thread-safety)
- [Error Handling](#error-handling)
- [Memory Management](#memory-management)
- [Testing Strategy](#testing-strategy)

## Architecture Overview

### High-Level Design

The library follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────┐
│           User-Facing Layer                 │
│  - RateLimiter (main class)                 │
│  - @rate_limit decorator                    │
│  - RateLimitResult                          │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         Algorithm Layer                     │
│  - TokenBucketLimiter                       │
│  - SlidingWindowLogLimiter                  │
│  - FixedWindowLimiter                       │
│  - SlidingWindowCounterLimiter              │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         Storage Layer                       │
│  - StorageBackend (abstract)                │
│  - InMemoryStorage                          │
│  - RedisStorage (future)                    │
└─────────────────────────────────────────────┘
```

### Design Principles

1. **Single Responsibility**: Each class has one job
2. **Open/Closed**: Open for extension (new algorithms), closed for modification
3. **Dependency Inversion**: Algorithms depend on abstract storage, not concrete implementations
4. **Interface Segregation**: Clean, minimal interfaces
5. **Don't Repeat Yourself**: Shared logic in base classes

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| Python dataclasses | Clean, typed configuration objects |
| Abstract storage | Support multiple backends (memory, Redis, etc.) |
| Separate algorithm classes | Easy to add new algorithms |
| Thread-safe by default | Safe for concurrent use out-of-the-box |
| No external dependencies | Easy to install and use |

## Core Components

### RateLimitConfig

**Purpose**: Type-safe configuration for rate limits

```python
@dataclass
class RateLimitConfig:
    max_requests: int      # Maximum requests allowed
    window_seconds: int    # Time window in seconds

    def __post_init__(self):
        # Validation runs after __init__
        if self.max_requests <= 0:
            raise ValueError("max_requests must be positive")
        if self.window_seconds <= 0:
            raise ValueError("window_seconds must be positive")
```

**Design Choices:**

1. **Dataclass**: Auto-generates `__init__`, `__repr__`, `__eq__`
2. **Post-init validation**: Fail fast on invalid config
3. **Immutable**: Once created, can't be changed (prevents bugs)
4. **Explicit types**: Makes IDE autocomplete work well

**Usage:**

```python
# Valid
config = RateLimitConfig(max_requests=100, window_seconds=60)

# Invalid - raises ValueError immediately
config = RateLimitConfig(max_requests=0, window_seconds=60)
```

### RateLimitResult

**Purpose**: Encapsulate the result of a rate limit check

```python
class RateLimitResult:
    def __init__(self, allowed: bool, remaining: int,
                 reset_at: float, retry_after: Optional[float] = None):
        self.allowed = allowed          # Was request allowed?
        self.remaining = remaining      # Requests remaining
        self.reset_at = reset_at       # When limit resets (unix timestamp)
        self.retry_after = retry_after  # Seconds to wait (if denied)

    def __bool__(self):
        # Allows: if result: ...
        return self.allowed

    def __repr__(self):
        # Nice string representation for debugging
        return (f"RateLimitResult(allowed={self.allowed}, "
                f"remaining={self.remaining}, ...")
```

**Design Choices:**

1. **Not a dataclass**: Need custom `__bool__` for convenience
2. **Optional retry_after**: Only set when denied
3. **Unix timestamps**: Standard, works across systems
4. **Boolean conversion**: Enables `if result:` pattern

**Rich Metadata:**

The result includes everything needed for proper HTTP responses:

```python
result = limiter.allow('user123')

# For HTTP headers
headers = {
    'X-RateLimit-Limit': config.max_requests,
    'X-RateLimit-Remaining': result.remaining,
    'X-RateLimit-Reset': int(result.reset_at),
}

if not result.allowed:
    headers['Retry-After'] = int(result.retry_after)
```

### RateLimiter (Main Class)

**Purpose**: Unified interface to all algorithms

```python
class RateLimiter:
    # Map algorithm names to classes
    ALGORITHMS = {
        'token_bucket': TokenBucketLimiter,
        'sliding_window_log': SlidingWindowLogLimiter,
        'fixed_window': FixedWindowLimiter,
        'sliding_window_counter': SlidingWindowCounterLimiter,
    }

    def __init__(self, algorithm='sliding_window_counter',
                 config=None, storage=None):
        # Validate algorithm
        if algorithm not in self.ALGORITHMS:
            raise ValueError(f"Unknown algorithm: {algorithm}")

        # Use defaults if not provided
        self.config = config or RateLimitConfig(100, 60)
        self.storage = storage or InMemoryStorage()

        # Instantiate chosen algorithm
        limiter_class = self.ALGORITHMS[algorithm]
        self.limiter = limiter_class(self.config, self.storage)

    def allow(self, identifier: str) -> RateLimitResult:
        # Delegate to algorithm implementation
        return self.limiter.allow(identifier)

    def __call__(self, identifier: str) -> RateLimitResult:
        # Allow: limiter('user123') syntax
        return self.allow(identifier)
```

**Design Choices:**

1. **Strategy Pattern**: Choose algorithm at runtime
2. **Sensible defaults**: Works out-of-the-box
3. **Delegation**: Main class doesn't implement algorithms
4. **Extensible**: Add new algorithms by updating ALGORITHMS dict

**Adding New Algorithms:**

```python
class MyCustomLimiter:
    def __init__(self, config, storage):
        self.config = config
        self.storage = storage

    def allow(self, identifier):
        # Your implementation
        pass

# Register it
RateLimiter.ALGORITHMS['my_custom'] = MyCustomLimiter

# Use it
limiter = RateLimiter('my_custom')
```

## Storage Backend Design

### Abstract Base Class

**Purpose**: Define interface for all storage backends

```python
class StorageBackend(ABC):
    @abstractmethod
    def increment(self, key: str, window: int) -> int:
        """Increment counter, return new value"""
        pass

    @abstractmethod
    def get(self, key: str) -> Optional[int]:
        """Get value"""
        pass

    @abstractmethod
    def set(self, key: str, value: int, ttl: int):
        """Set value with TTL"""
        pass

    # ... more methods
```

**Why Abstract Base Class?**

1. **Interface Contract**: Guarantees all backends implement required methods
2. **Type Checking**: IDEs can verify correct usage
3. **Documentation**: Clear API for implementers
4. **Extensibility**: Easy to add new backends

### InMemoryStorage

**Purpose**: Thread-safe in-memory storage for single-instance deployments

```python
class InMemoryStorage(StorageBackend):
    def __init__(self):
        self._data: Dict[str, any] = {}          # Actual data
        self._expiry: Dict[str, float] = {}      # Expiration times
        self._lock = threading.Lock()             # Thread safety

    def _cleanup_expired(self):
        """Remove expired keys"""
        current_time = time.time()
        expired = [k for k, exp_time in self._expiry.items()
                   if exp_time <= current_time]
        for key in expired:
            self._data.pop(key, None)
            self._expiry.pop(key, None)

    def increment(self, key: str, window: int) -> int:
        with self._lock:  # Thread-safe
            self._cleanup_expired()
            current = self._data.get(key, 0)
            new_value = current + 1
            self._data[key] = new_value
            self._expiry[key] = time.time() + window
            return new_value
```

**Design Choices:**

1. **Two dictionaries**: Separate data and expiry for clarity
2. **Thread lock**: Ensures thread safety
3. **Lazy cleanup**: Clean on access (simple, effective)
4. **TTL support**: Prevents memory leaks

**Thread Safety:**

```python
# Without lock (UNSAFE):
current = self._data.get(key, 0)
# ← Another thread could modify here!
self._data[key] = current + 1

# With lock (SAFE):
with self._lock:
    current = self._data.get(key, 0)
    self._data[key] = current + 1
    # No other thread can interfere
```

**Memory Management:**

TTL ensures old keys are cleaned up:

```python
# Set with TTL of 10 seconds
self._expiry[key] = time.time() + 10

# After 10 seconds
current_time = time.time()
if self._expiry[key] <= current_time:
    # Expired! Remove it
    del self._data[key]
    del self._expiry[key]
```

### RedisStorage (Future)

**Purpose**: Distributed storage for multi-instance deployments

```python
class RedisStorage(StorageBackend):
    def __init__(self, host='localhost', port=6379):
        import redis
        self.client = redis.Redis(host=host, port=port)

    def increment(self, key: str, window: int) -> int:
        # Use Redis pipeline for atomicity
        pipe = self.client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window)
        result = pipe.execute()
        return result[0]

    def get(self, key: str) -> Optional[int]:
        value = self.client.get(key)
        return int(value) if value else None
```

**Why Redis?**

1. **Shared State**: Multiple app instances can share limits
2. **Atomic Operations**: INCR is atomic (thread-safe across machines)
3. **TTL Support**: Built-in key expiration
4. **High Performance**: Millions of operations per second

## Algorithm Implementations

### Common Pattern

All algorithm classes follow the same pattern:

```python
class SomeAlgorithmLimiter:
    def __init__(self, config: RateLimitConfig, storage: StorageBackend):
        self.config = config
        self.storage = storage
        # Algorithm-specific initialization

    def allow(self, identifier: str) -> RateLimitResult:
        # 1. Get current state from storage
        # 2. Apply algorithm logic
        # 3. Update storage
        # 4. Return result
        pass
```

### Fixed Window Implementation

**Key Design Decisions:**

1. **Window ID from timestamp**: Deterministic, no coordination needed
2. **Atomic increment**: Single storage operation
3. **TTL prevents memory leaks**: Old windows auto-expire

**Code Walkthrough:**

```python
def allow(self, identifier: str) -> RateLimitResult:
    # Step 1: Calculate current window ID
    current_time = time.time()
    window_id = int(current_time // self.config.window_seconds)

    # Example: window_seconds=60
    # Time 0-59s → window_id=0
    # Time 60-119s → window_id=1
    # Time 120-179s → window_id=2

    # Step 2: Generate storage key
    key = f"fw:{identifier}:{window_id}"

    # Step 3: Increment counter (atomic operation)
    count = self.storage.increment(key, self.config.window_seconds)

    # Step 4: Check if over limit
    if count <= self.config.max_requests:
        allowed = True
        remaining = self.config.max_requests - count
        retry_after = None
    else:
        allowed = False
        remaining = 0

        # Calculate time until next window
        next_window_start = (window_id + 1) * self.config.window_seconds
        retry_after = next_window_start - current_time

    # Step 5: Calculate reset time
    reset_at = (window_id + 1) * self.config.window_seconds

    return RateLimitResult(allowed, remaining, reset_at, retry_after)
```

**Why this works:**

- **Deterministic windows**: All instances calculate same window_id
- **Atomic increment**: No race conditions
- **Self-cleaning**: TTL removes old windows automatically

### Token Bucket Implementation

**Key Design Decisions:**

1. **Fractional tokens**: Use floats for accuracy
2. **Lazy refill**: Calculate on-demand, not background job
3. **Two values**: Store tokens and last_refill separately

**Refill Logic:**

```python
def allow(self, identifier: str) -> RateLimitResult:
    current_time = time.time()

    # Get current state (or initialize)
    tokens = self.storage.get(f"tb:tokens:{identifier}")
    last_refill = self.storage.get(f"tb:last:{identifier}")

    if tokens is None:
        # First request - start with full bucket
        tokens = self.config.max_requests
        last_refill = current_time

    # Calculate tokens to add
    time_passed = current_time - last_refill
    refill_rate = self.config.max_requests / self.config.window_seconds
    tokens_to_add = time_passed * refill_rate

    # Refill bucket (capped at capacity)
    tokens = min(self.config.max_requests, tokens + tokens_to_add)

    # Try to consume token
    if tokens >= 1:
        tokens -= 1
        allowed = True
        retry_after = None
    else:
        allowed = False
        # Calculate when next token available
        retry_after = (1 - tokens) / refill_rate

    # Save updated state
    self.storage.set(f"tb:tokens:{identifier}", tokens, ttl)
    self.storage.set(f"tb:last:{identifier}", current_time, ttl)

    # ... return result
```

**Why lazy refill?**

Alternative: Background job that refills tokens every second

```python
# Background job approach (NOT USED)
def refill_job():
    while True:
        time.sleep(1)
        for user in all_users:
            tokens = get_tokens(user)
            tokens = min(capacity, tokens + refill_rate)
            set_tokens(user, tokens)
```

Problems:
- Need to track all users
- Wastes CPU on inactive users
- Coordination issues in distributed systems

**Lazy refill solves all these:**
- Only calculates when user makes request
- No background jobs needed
- Works perfectly in distributed systems

### Sliding Window Log Implementation

**Key Design Decisions:**

1. **Use deque**: Efficient append and filter operations
2. **Store as list**: Simple, works with any storage backend
3. **Cleanup on check**: Remove old timestamps on every request

**List Operations:**

```python
def allow(self, identifier: str) -> RateLimitResult:
    current_time = time.time()
    window_start = current_time - self.config.window_seconds

    # Step 1: Clean up old entries
    # Remove timestamps < window_start
    self.storage.cleanup_list(key, window_start)

    # Step 2: Get current log
    request_log = self.storage.get_list(key)
    # Example: [12.5, 15.3, 18.9, 20.1] (timestamps)

    # Step 3: Count requests in window
    request_count = len(request_log)

    # Step 4: Check limit
    if request_count < self.config.max_requests:
        # Add current timestamp
        self.storage.add_to_list(key, current_time, ttl)
        allowed = True
        remaining = self.config.max_requests - request_count - 1
    else:
        allowed = False
        remaining = 0
        # Retry when oldest request expires
        oldest = min(request_log)
        retry_after = oldest + self.config.window_seconds - current_time

    # ... return result
```

**Cleanup Strategy:**

```python
# In InMemoryStorage
def cleanup_list(self, key: str, cutoff: float):
    with self._lock:
        if key in self._data:
            # Keep only timestamps > cutoff
            self._data[key] = deque([t for t in self._data[key]
                                    if t > cutoff])
```

**Why deque?**

```python
# List operations
timestamps = [1.0, 2.0, 3.0, 4.0, 5.0]
timestamps.append(6.0)  # O(1) - fast
timestamps = [t for t in timestamps if t > 3.0]  # O(n) - needs full scan

# Deque operations (more efficient)
timestamps = deque([1.0, 2.0, 3.0, 4.0, 5.0])
timestamps.append(6.0)  # O(1) - fast
# Can also efficiently pop from left if needed
```

### Sliding Window Counter Implementation

**Key Design Decisions:**

1. **Two counters**: Current and previous window
2. **Weighted calculation**: Linear interpolation
3. **Integer math for window ID**: Deterministic, consistent

**Weighted Count Calculation:**

```python
def allow(self, identifier: str) -> RateLimitResult:
    current_time = time.time()

    # Step 1: Calculate window IDs
    current_window = int(current_time // self.config.window_seconds)
    previous_window = current_window - 1

    # Step 2: Get counts from both windows
    current_count = self.storage.get(f"swc:{identifier}:{current_window}") or 0
    previous_count = self.storage.get(f"swc:{identifier}:{previous_window}") or 0

    # Step 3: Calculate position in current window (0.0 to 1.0)
    window_start = current_window * self.config.window_seconds
    elapsed_percentage = (current_time - window_start) / self.config.window_seconds

    # Step 4: Weighted average
    # As we progress through current window, previous matters less
    weighted_count = (previous_count * (1 - elapsed_percentage)) + current_count

    # Step 5: Check limit
    if weighted_count < self.config.max_requests:
        # Increment current window
        self.storage.increment(f"swc:{identifier}:{current_window}", ttl)
        allowed = True
        remaining = int(self.config.max_requests - weighted_count - 1)
    else:
        allowed = False
        remaining = 0
        retry_after = (1 - elapsed_percentage) * self.config.window_seconds

    # ... return result
```

**Why it approximates sliding window:**

```
True sliding window at time t:
  Count all requests in [t - window, t]

Sliding window counter:
  Previous window [w-1]: P requests
  Current window [w]: C requests
  Position in current: p (0.0 to 1.0)

  Estimated count: P × (1 - p) + C

This approximation is good when requests are roughly uniform.
```

## Thread Safety

### Why It Matters

```python
# Without thread safety (BROKEN)
count = storage.get('counter')  # Thread A reads: 5
count = storage.get('counter')  # Thread B reads: 5
storage.set('counter', count + 1)  # Thread A writes: 6
storage.set('counter', count + 1)  # Thread B writes: 6
# Lost one increment! Should be 7
```

### Lock-Based Approach

```python
class InMemoryStorage:
    def __init__(self):
        self._lock = threading.Lock()

    def increment(self, key, window):
        with self._lock:  # Only one thread at a time
            current = self._data.get(key, 0)
            new_value = current + 1
            self._data[key] = new_value
            return new_value
```

**Lock Granularity:**

```python
# Coarse-grained lock (our approach)
with self._lock:
    # Lock entire storage for duration of operation
    result = do_operation()

# Fine-grained lock (more complex)
with self._locks[key]:  # Separate lock per key
    result = do_operation()
```

We use coarse-grained because:
- Simpler implementation
- Operations are fast (no lock contention)
- Easier to reason about correctness

### Redis Atomic Operations

Redis provides atomic operations without explicit locks:

```python
# Atomic increment in Redis
result = redis.incr(key)  # Atomic!

# vs in-memory (needs lock)
with lock:
    value = storage[key]
    value += 1
    storage[key] = value
```

## Error Handling

### Validation Errors

Fail fast on invalid configuration:

```python
@dataclass
class RateLimitConfig:
    def __post_init__(self):
        if self.max_requests <= 0:
            raise ValueError("max_requests must be positive")
        if self.window_seconds <= 0:
            raise ValueError("window_seconds must be positive")
```

### RateLimitExceeded Exception

```python
class RateLimitExceeded(Exception):
    def __init__(self, message: str, result: RateLimitResult):
        super().__init__(message)
        self.result = result  # Attach metadata

# Usage
try:
    api_call('user123')
except RateLimitExceeded as e:
    print(f"Error: {e}")
    print(f"Retry after: {e.result.retry_after}s")
```

**Why attach result?**

Allows proper error handling with full context:

```python
except RateLimitExceeded as e:
    return JSONResponse(
        status_code=429,
        content={'error': str(e)},
        headers={
            'Retry-After': str(int(e.result.retry_after)),
            'X-RateLimit-Reset': str(int(e.result.reset_at))
        }
    )
```

## Memory Management

### TTL-Based Expiration

All storage operations set TTL:

```python
# Fixed Window
self.storage.increment(key, window=self.config.window_seconds)

# Token Bucket
self.storage.set(key, value, ttl=self.config.window_seconds * 2)
```

**Why 2× window for token bucket?**

- Window: Time to refill from empty to full
- After 1× window: Bucket may not be empty yet
- After 2× window: Definitely refilled, safe to expire

### Cleanup Strategies

1. **Lazy cleanup** (our approach):
   - Clean on access
   - Simple, no background jobs
   - Small overhead per request

2. **Background cleanup**:
   - Separate thread/process
   - No request overhead
   - More complex

3. **No cleanup**:
   - Rely on TTL only
   - Works for Redis (built-in TTL)
   - Not suitable for in-memory (unbounded growth)

## Testing Strategy

### Unit Tests

Test each component in isolation:

```python
def test_fixed_window_basic():
    config = RateLimitConfig(max_requests=3, window_seconds=10)
    storage = InMemoryStorage()
    limiter = FixedWindowLimiter(config, storage)

    # First 3 allowed
    assert limiter.allow('user1').allowed
    assert limiter.allow('user1').allowed
    assert limiter.allow('user1').allowed

    # 4th denied
    assert not limiter.allow('user1').allowed
```

### Integration Tests

Test full system:

```python
def test_decorator_integration():
    @rate_limit(max_requests=3, window_seconds=60)
    def api_call(user_id):
        return f"Hello {user_id}"

    # First 3 succeed
    api_call('user1')
    api_call('user1')
    api_call('user1')

    # 4th raises exception
    with pytest.raises(RateLimitExceeded):
        api_call('user1')
```

### Concurrency Tests

Test thread safety:

```python
def test_thread_safety():
    limiter = RateLimiter('fixed_window',
                         RateLimitConfig(max_requests=100, window_seconds=10))
    results = []

    def make_requests():
        for _ in range(50):
            results.append(limiter.allow('user1'))

    # 5 threads × 50 requests = 250 total
    threads = [threading.Thread(target=make_requests) for _ in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    # Exactly 100 should be allowed (with tolerance for sliding window)
    allowed = sum(1 for r in results if r.allowed)
    assert 98 <= allowed <= 102
```

## Conclusion

The implementation prioritizes:
1. **Correctness**: Thread-safe, well-tested
2. **Simplicity**: Clean architecture, easy to understand
3. **Extensibility**: Easy to add new algorithms/backends
4. **Performance**: Efficient operations, minimal overhead
5. **Usability**: Intuitive API, good defaults

---

For algorithm details, see [algorithms.md](algorithms.md).
For integration examples, see [integration.md](integration.md).
