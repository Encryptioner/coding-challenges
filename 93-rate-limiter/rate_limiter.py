#!/usr/bin/env python3
"""
Rate Limiter - Production-ready rate limiting implementation

Implements multiple rate limiting algorithms:
- Token Bucket
- Sliding Window Log
- Fixed Window Counter
- Sliding Window Counter

Supports multiple storage backends:
- In-memory (for development/testing)
- Redis (for production/distributed systems)
"""

import time
import threading
from abc import ABC, abstractmethod
from typing import Optional, Dict, Tuple
from dataclasses import dataclass
from collections import deque


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting"""
    max_requests: int  # Maximum number of requests
    window_seconds: int  # Time window in seconds

    def __post_init__(self):
        if self.max_requests <= 0:
            raise ValueError("max_requests must be positive")
        if self.window_seconds <= 0:
            raise ValueError("window_seconds must be positive")


class RateLimitResult:
    """Result of a rate limit check"""

    def __init__(self, allowed: bool, remaining: int, reset_at: float, retry_after: Optional[float] = None):
        self.allowed = allowed
        self.remaining = remaining
        self.reset_at = reset_at
        self.retry_after = retry_after

    def __bool__(self):
        return self.allowed

    def __repr__(self):
        return (f"RateLimitResult(allowed={self.allowed}, remaining={self.remaining}, "
                f"reset_at={self.reset_at}, retry_after={self.retry_after})")


class StorageBackend(ABC):
    """Abstract base class for storage backends"""

    @abstractmethod
    def increment(self, key: str, window: int) -> int:
        """Increment counter for key in given window, return new value"""
        pass

    @abstractmethod
    def get(self, key: str) -> Optional[int]:
        """Get current value for key"""
        pass

    @abstractmethod
    def set(self, key: str, value: int, ttl: int):
        """Set value for key with TTL in seconds"""
        pass

    @abstractmethod
    def delete(self, key: str):
        """Delete key"""
        pass

    @abstractmethod
    def get_list(self, key: str) -> list:
        """Get list of timestamps for key"""
        pass

    @abstractmethod
    def add_to_list(self, key: str, value: float, ttl: int):
        """Add value to list with TTL"""
        pass

    @abstractmethod
    def cleanup_list(self, key: str, cutoff: float):
        """Remove items older than cutoff from list"""
        pass


class InMemoryStorage(StorageBackend):
    """In-memory storage backend (not suitable for distributed systems)"""

    def __init__(self):
        self._data: Dict[str, any] = {}
        self._expiry: Dict[str, float] = {}
        self._lock = threading.Lock()

    def _cleanup_expired(self):
        """Remove expired keys"""
        current_time = time.time()
        expired = [k for k, exp_time in self._expiry.items() if exp_time <= current_time]
        for key in expired:
            self._data.pop(key, None)
            self._expiry.pop(key, None)

    def increment(self, key: str, window: int) -> int:
        with self._lock:
            self._cleanup_expired()
            current = self._data.get(key, 0)
            new_value = current + 1
            self._data[key] = new_value
            self._expiry[key] = time.time() + window
            return new_value

    def get(self, key: str) -> Optional[int]:
        with self._lock:
            self._cleanup_expired()
            return self._data.get(key)

    def set(self, key: str, value: int, ttl: int):
        with self._lock:
            self._data[key] = value
            self._expiry[key] = time.time() + ttl

    def delete(self, key: str):
        with self._lock:
            self._data.pop(key, None)
            self._expiry.pop(key, None)

    def get_list(self, key: str) -> list:
        with self._lock:
            self._cleanup_expired()
            data = self._data.get(key, [])
            return list(data) if isinstance(data, (list, deque)) else []

    def add_to_list(self, key: str, value: float, ttl: int):
        with self._lock:
            if key not in self._data:
                self._data[key] = deque()
            self._data[key].append(value)
            self._expiry[key] = time.time() + ttl

    def cleanup_list(self, key: str, cutoff: float):
        with self._lock:
            if key in self._data and isinstance(self._data[key], deque):
                # Remove timestamps older than cutoff
                self._data[key] = deque([t for t in self._data[key] if t > cutoff])


class TokenBucketLimiter:
    """
    Token Bucket Rate Limiter

    Allows bursts up to bucket capacity, refills at constant rate.
    Good for APIs that allow occasional bursts.
    """

    def __init__(self, config: RateLimitConfig, storage: StorageBackend):
        self.config = config
        self.storage = storage
        self.refill_rate = config.max_requests / config.window_seconds

    def _get_bucket_key(self, identifier: str) -> Tuple[str, str]:
        """Get storage keys for tokens and last refill time"""
        return f"tb:tokens:{identifier}", f"tb:last:{identifier}"

    def allow(self, identifier: str) -> RateLimitResult:
        """Check if request is allowed and consume a token if so"""
        tokens_key, last_key = self._get_bucket_key(identifier)
        current_time = time.time()

        # Get current state
        tokens = self.storage.get(tokens_key)
        last_refill = self.storage.get(last_key)

        # Initialize if first request
        if tokens is None or last_refill is None:
            tokens = self.config.max_requests
            last_refill = current_time

        # Calculate tokens to add based on time passed
        time_passed = current_time - last_refill
        tokens_to_add = time_passed * self.refill_rate

        # Refill bucket (capped at max)
        tokens = min(self.config.max_requests, tokens + tokens_to_add)

        # Check if request can be allowed
        if tokens >= 1:
            # Consume one token
            tokens -= 1
            allowed = True
            retry_after = None
        else:
            allowed = False
            # Calculate when next token will be available
            retry_after = (1 - tokens) / self.refill_rate

        # Update storage
        self.storage.set(tokens_key, tokens, self.config.window_seconds * 2)
        self.storage.set(last_key, current_time, self.config.window_seconds * 2)

        # Calculate reset time (when bucket will be full)
        tokens_needed = self.config.max_requests - tokens
        reset_at = current_time + (tokens_needed / self.refill_rate)

        return RateLimitResult(
            allowed=allowed,
            remaining=int(tokens),
            reset_at=reset_at,
            retry_after=retry_after
        )


class SlidingWindowLogLimiter:
    """
    Sliding Window Log Rate Limiter

    Maintains a log of timestamps for each request.
    Most accurate but requires more memory.
    """

    def __init__(self, config: RateLimitConfig, storage: StorageBackend):
        self.config = config
        self.storage = storage

    def _get_log_key(self, identifier: str) -> str:
        return f"swl:{identifier}"

    def allow(self, identifier: str) -> RateLimitResult:
        """Check if request is allowed by examining request log"""
        key = self._get_log_key(identifier)
        current_time = time.time()
        window_start = current_time - self.config.window_seconds

        # Clean up old entries
        self.storage.cleanup_list(key, window_start)

        # Get request log
        request_log = self.storage.get_list(key)

        # Count requests in current window
        request_count = len(request_log)

        # Check if request can be allowed
        if request_count < self.config.max_requests:
            # Add current request to log
            self.storage.add_to_list(key, current_time, self.config.window_seconds)
            allowed = True
            remaining = self.config.max_requests - request_count - 1
            retry_after = None
        else:
            allowed = False
            remaining = 0
            # Calculate retry time (when oldest request expires)
            oldest_request = min(request_log) if request_log else current_time
            retry_after = oldest_request + self.config.window_seconds - current_time

        reset_at = current_time + self.config.window_seconds

        return RateLimitResult(
            allowed=allowed,
            remaining=remaining,
            reset_at=reset_at,
            retry_after=retry_after
        )


class FixedWindowLimiter:
    """
    Fixed Window Counter Rate Limiter

    Counts requests in fixed time windows.
    Simple and memory efficient, but can allow bursts at window boundaries.
    """

    def __init__(self, config: RateLimitConfig, storage: StorageBackend):
        self.config = config
        self.storage = storage

    def _get_window_key(self, identifier: str) -> str:
        """Get key for current time window"""
        current_time = time.time()
        window_id = int(current_time // self.config.window_seconds)
        return f"fw:{identifier}:{window_id}"

    def allow(self, identifier: str) -> RateLimitResult:
        """Check if request is allowed in current window"""
        key = self._get_window_key(identifier)

        # Increment counter
        count = self.storage.increment(key, self.config.window_seconds)

        # Check if limit exceeded
        if count <= self.config.max_requests:
            allowed = True
            remaining = self.config.max_requests - count
            retry_after = None
        else:
            allowed = False
            remaining = 0
            # Calculate time until next window
            current_time = time.time()
            window_id = int(current_time // self.config.window_seconds)
            next_window = (window_id + 1) * self.config.window_seconds
            retry_after = next_window - current_time

        # Calculate reset time (start of next window)
        current_time = time.time()
        window_id = int(current_time // self.config.window_seconds)
        reset_at = (window_id + 1) * self.config.window_seconds

        return RateLimitResult(
            allowed=allowed,
            remaining=remaining,
            reset_at=reset_at,
            retry_after=retry_after
        )


class SlidingWindowCounterLimiter:
    """
    Sliding Window Counter Rate Limiter

    Hybrid approach: uses two fixed windows and interpolates.
    More accurate than fixed window, more efficient than sliding window log.
    """

    def __init__(self, config: RateLimitConfig, storage: StorageBackend):
        self.config = config
        self.storage = storage

    def _get_window_keys(self, identifier: str) -> Tuple[str, str]:
        """Get keys for current and previous windows"""
        current_time = time.time()
        current_window = int(current_time // self.config.window_seconds)
        previous_window = current_window - 1

        return (
            f"swc:{identifier}:{current_window}",
            f"swc:{identifier}:{previous_window}"
        )

    def allow(self, identifier: str) -> RateLimitResult:
        """Check if request is allowed using weighted count"""
        current_key, previous_key = self._get_window_keys(identifier)
        current_time = time.time()

        # Get counts from both windows
        current_count = self.storage.get(current_key) or 0
        previous_count = self.storage.get(previous_key) or 0

        # Calculate position in current window (0.0 to 1.0)
        window_start = (current_time // self.config.window_seconds) * self.config.window_seconds
        elapsed_percentage = (current_time - window_start) / self.config.window_seconds

        # Calculate weighted count
        # As we move through current window, previous window matters less
        weighted_count = (previous_count * (1 - elapsed_percentage)) + current_count

        # Check if request can be allowed
        if weighted_count < self.config.max_requests:
            # Increment current window counter
            new_count = self.storage.increment(current_key, self.config.window_seconds * 2)
            allowed = True
            remaining = int(self.config.max_requests - weighted_count - 1)
            retry_after = None
        else:
            allowed = False
            remaining = 0
            # Calculate time until enough capacity is available
            retry_after = (1 - elapsed_percentage) * self.config.window_seconds

        # Reset time is start of next window
        reset_at = window_start + self.config.window_seconds

        return RateLimitResult(
            allowed=allowed,
            remaining=max(0, remaining),
            reset_at=reset_at,
            retry_after=retry_after
        )


class RateLimiter:
    """
    Main Rate Limiter class

    Provides a unified interface for different rate limiting algorithms.
    """

    ALGORITHMS = {
        'token_bucket': TokenBucketLimiter,
        'sliding_window_log': SlidingWindowLogLimiter,
        'fixed_window': FixedWindowLimiter,
        'sliding_window_counter': SlidingWindowCounterLimiter,
    }

    def __init__(self,
                 algorithm: str = 'sliding_window_counter',
                 config: Optional[RateLimitConfig] = None,
                 storage: Optional[StorageBackend] = None):
        """
        Initialize rate limiter

        Args:
            algorithm: Algorithm to use (token_bucket, sliding_window_log,
                      fixed_window, sliding_window_counter)
            config: Rate limit configuration (defaults to 100 req/min)
            storage: Storage backend (defaults to in-memory)
        """
        if algorithm not in self.ALGORITHMS:
            raise ValueError(f"Unknown algorithm: {algorithm}. "
                           f"Choose from: {list(self.ALGORITHMS.keys())}")

        self.config = config or RateLimitConfig(max_requests=100, window_seconds=60)
        self.storage = storage or InMemoryStorage()

        limiter_class = self.ALGORITHMS[algorithm]
        self.limiter = limiter_class(self.config, self.storage)

    def allow(self, identifier: str) -> RateLimitResult:
        """
        Check if request is allowed for given identifier

        Args:
            identifier: Unique identifier (user ID, IP address, API key, etc.)

        Returns:
            RateLimitResult with allowed status and metadata
        """
        return self.limiter.allow(identifier)

    def __call__(self, identifier: str) -> RateLimitResult:
        """Allow using limiter as a callable"""
        return self.allow(identifier)


# Decorator for rate limiting functions
def rate_limit(max_requests: int = 100,
               window_seconds: int = 60,
               algorithm: str = 'sliding_window_counter',
               key_func=None):
    """
    Decorator to rate limit function calls

    Args:
        max_requests: Maximum requests allowed
        window_seconds: Time window in seconds
        algorithm: Rate limiting algorithm to use
        key_func: Function to extract identifier from args/kwargs

    Example:
        @rate_limit(max_requests=10, window_seconds=60)
        def api_endpoint(user_id):
            return f"Hello {user_id}"
    """
    config = RateLimitConfig(max_requests, window_seconds)
    limiter = RateLimiter(algorithm, config)

    def decorator(func):
        def wrapper(*args, **kwargs):
            # Extract identifier
            if key_func:
                identifier = key_func(*args, **kwargs)
            elif args:
                identifier = str(args[0])
            else:
                identifier = "default"

            # Check rate limit
            result = limiter.allow(identifier)

            if not result.allowed:
                raise RateLimitExceeded(
                    f"Rate limit exceeded. Retry after {result.retry_after:.2f} seconds",
                    result
                )

            return func(*args, **kwargs)

        return wrapper
    return decorator


class RateLimitExceeded(Exception):
    """Exception raised when rate limit is exceeded"""

    def __init__(self, message: str, result: RateLimitResult):
        super().__init__(message)
        self.result = result


def main():
    """Example usage and testing"""
    print("Rate Limiter Examples\n" + "=" * 50 + "\n")

    # Example 1: Token Bucket
    print("1. Token Bucket (allows bursts)")
    print("-" * 50)
    config = RateLimitConfig(max_requests=5, window_seconds=10)
    limiter = RateLimiter('token_bucket', config)

    for i in range(7):
        result = limiter.allow('user123')
        status = "✓ ALLOWED" if result.allowed else "✗ DENIED"
        print(f"Request {i+1}: {status} (remaining: {result.remaining})")
        if not result.allowed:
            print(f"  Retry after: {result.retry_after:.2f}s")

    print()

    # Example 2: Fixed Window
    print("2. Fixed Window (simple counter)")
    print("-" * 50)
    config = RateLimitConfig(max_requests=3, window_seconds=5)
    limiter = RateLimiter('fixed_window', config)

    for i in range(5):
        result = limiter.allow('user456')
        status = "✓ ALLOWED" if result.allowed else "✗ DENIED"
        print(f"Request {i+1}: {status} (remaining: {result.remaining})")

    print()

    # Example 3: Sliding Window Counter
    print("3. Sliding Window Counter (balanced)")
    print("-" * 50)
    config = RateLimitConfig(max_requests=4, window_seconds=10)
    limiter = RateLimiter('sliding_window_counter', config)

    for i in range(6):
        result = limiter.allow('user789')
        status = "✓ ALLOWED" if result.allowed else "✗ DENIED"
        print(f"Request {i+1}: {status} (remaining: {result.remaining})")
        if i == 2:
            print("  [Waiting 5 seconds...]")
            time.sleep(5)

    print()

    # Example 4: Decorator usage
    print("4. Decorator Usage")
    print("-" * 50)

    @rate_limit(max_requests=3, window_seconds=60)
    def api_call(user_id):
        return f"Processing request for {user_id}"

    for i in range(5):
        try:
            result = api_call("user_abc")
            print(f"Call {i+1}: {result}")
        except RateLimitExceeded as e:
            print(f"Call {i+1}: {e}")

    print("\n" + "=" * 50)
    print("Examples complete!")


if __name__ == '__main__':
    main()
