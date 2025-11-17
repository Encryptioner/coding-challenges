#!/usr/bin/env python3
"""
Comprehensive test suite for rate limiter
"""

import pytest
import time
import threading
from dataclasses import FrozenInstanceError
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rate_limiter import (
    RateLimiter,
    RateLimitConfig,
    RateLimitResult,
    RateLimitExceeded,
    InMemoryStorage,
    TokenBucketLimiter,
    SlidingWindowLogLimiter,
    FixedWindowLimiter,
    SlidingWindowCounterLimiter,
    rate_limit
)


class TestRateLimitConfig:
    """Test configuration validation"""

    def test_valid_config(self):
        config = RateLimitConfig(max_requests=100, window_seconds=60)
        assert config.max_requests == 100
        assert config.window_seconds == 60

    def test_invalid_max_requests(self):
        with pytest.raises(ValueError, match="max_requests must be positive"):
            RateLimitConfig(max_requests=0, window_seconds=60)

        with pytest.raises(ValueError, match="max_requests must be positive"):
            RateLimitConfig(max_requests=-1, window_seconds=60)

    def test_invalid_window_seconds(self):
        with pytest.raises(ValueError, match="window_seconds must be positive"):
            RateLimitConfig(max_requests=100, window_seconds=0)

        with pytest.raises(ValueError, match="window_seconds must be positive"):
            RateLimitConfig(max_requests=100, window_seconds=-1)


class TestRateLimitResult:
    """Test result object"""

    def test_result_creation(self):
        result = RateLimitResult(
            allowed=True,
            remaining=5,
            reset_at=time.time() + 60,
            retry_after=None
        )
        assert result.allowed is True
        assert result.remaining == 5
        assert result.retry_after is None

    def test_result_bool(self):
        allowed_result = RateLimitResult(True, 5, time.time(), None)
        denied_result = RateLimitResult(False, 0, time.time(), 10.0)

        assert bool(allowed_result) is True
        assert bool(denied_result) is False

    def test_result_repr(self):
        result = RateLimitResult(True, 5, 1234567890.0, None)
        repr_str = repr(result)
        assert "allowed=True" in repr_str
        assert "remaining=5" in repr_str


class TestInMemoryStorage:
    """Test in-memory storage backend"""

    def test_increment(self):
        storage = InMemoryStorage()
        assert storage.increment('key1', 10) == 1
        assert storage.increment('key1', 10) == 2
        assert storage.increment('key1', 10) == 3

    def test_get_set(self):
        storage = InMemoryStorage()
        storage.set('key1', 42, 10)
        assert storage.get('key1') == 42

    def test_delete(self):
        storage = InMemoryStorage()
        storage.set('key1', 42, 10)
        storage.delete('key1')
        assert storage.get('key1') is None

    def test_expiration(self):
        storage = InMemoryStorage()
        storage.set('key1', 42, 1)  # 1 second TTL
        assert storage.get('key1') == 42
        time.sleep(1.1)
        assert storage.get('key1') is None

    def test_list_operations(self):
        storage = InMemoryStorage()
        storage.add_to_list('key1', 1.0, 10)
        storage.add_to_list('key1', 2.0, 10)
        storage.add_to_list('key1', 3.0, 10)

        items = storage.get_list('key1')
        assert len(items) == 3
        assert items == [1.0, 2.0, 3.0]

    def test_list_cleanup(self):
        storage = InMemoryStorage()
        storage.add_to_list('key1', 1.0, 10)
        storage.add_to_list('key1', 2.0, 10)
        storage.add_to_list('key1', 5.0, 10)
        storage.add_to_list('key1', 8.0, 10)

        storage.cleanup_list('key1', 3.0)  # Remove items < 3.0

        items = storage.get_list('key1')
        assert len(items) == 2
        assert items == [5.0, 8.0]

    def test_thread_safety(self):
        storage = InMemoryStorage()
        results = []

        def increment_many():
            for _ in range(100):
                results.append(storage.increment('counter', 10))

        threads = [threading.Thread(target=increment_many) for _ in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # Should have exactly 500 increments
        assert max(results) == 500
        assert len(results) == 500


class TestFixedWindowLimiter:
    """Test fixed window counter algorithm"""

    def test_basic_limiting(self):
        config = RateLimitConfig(max_requests=3, window_seconds=10)
        storage = InMemoryStorage()
        limiter = FixedWindowLimiter(config, storage)

        # First 3 requests allowed
        assert limiter.allow('user1').allowed
        assert limiter.allow('user1').allowed
        assert limiter.allow('user1').allowed

        # 4th request denied
        result = limiter.allow('user1')
        assert not result.allowed
        assert result.remaining == 0

    def test_different_users(self):
        config = RateLimitConfig(max_requests=1, window_seconds=10)
        storage = InMemoryStorage()
        limiter = FixedWindowLimiter(config, storage)

        # Each user gets their own limit
        assert limiter.allow('user1').allowed
        assert limiter.allow('user2').allowed
        assert not limiter.allow('user1').allowed
        assert not limiter.allow('user2').allowed

    def test_remaining_count(self):
        config = RateLimitConfig(max_requests=5, window_seconds=10)
        storage = InMemoryStorage()
        limiter = FixedWindowLimiter(config, storage)

        result1 = limiter.allow('user1')
        assert result1.remaining == 4

        result2 = limiter.allow('user1')
        assert result2.remaining == 3

        result3 = limiter.allow('user1')
        assert result3.remaining == 2

    def test_window_reset(self):
        config = RateLimitConfig(max_requests=2, window_seconds=1)
        storage = InMemoryStorage()
        limiter = FixedWindowLimiter(config, storage)

        # Use up limit
        assert limiter.allow('user1').allowed
        assert limiter.allow('user1').allowed
        assert not limiter.allow('user1').allowed

        # Wait for window reset
        time.sleep(1.1)

        # Limit reset
        assert limiter.allow('user1').allowed


class TestSlidingWindowLogLimiter:
    """Test sliding window log algorithm"""

    def test_basic_limiting(self):
        config = RateLimitConfig(max_requests=3, window_seconds=10)
        storage = InMemoryStorage()
        limiter = SlidingWindowLogLimiter(config, storage)

        # First 3 requests allowed
        assert limiter.allow('user1').allowed
        assert limiter.allow('user1').allowed
        assert limiter.allow('user1').allowed

        # 4th request denied
        assert not limiter.allow('user1').allowed

    def test_sliding_window(self):
        config = RateLimitConfig(max_requests=2, window_seconds=2)
        storage = InMemoryStorage()
        limiter = SlidingWindowLogLimiter(config, storage)

        # Two requests at time 0
        assert limiter.allow('user1').allowed
        assert limiter.allow('user1').allowed
        assert not limiter.allow('user1').allowed

        # Wait 1 second, still in window
        time.sleep(1)
        assert not limiter.allow('user1').allowed

        # Wait another 1.1 seconds, first requests expired
        time.sleep(1.1)
        assert limiter.allow('user1').allowed

    def test_accurate_counting(self):
        config = RateLimitConfig(max_requests=3, window_seconds=5)
        storage = InMemoryStorage()
        limiter = SlidingWindowLogLimiter(config, storage)

        # Request at t=0
        assert limiter.allow('user1').allowed
        time.sleep(1)

        # Request at t=1
        assert limiter.allow('user1').allowed
        time.sleep(1)

        # Request at t=2
        assert limiter.allow('user1').allowed

        # Request at t=3 (3 requests in last 5s)
        time.sleep(1)
        assert not limiter.allow('user1').allowed

        # Wait until t=6 (first request expired)
        time.sleep(3)
        assert limiter.allow('user1').allowed


class TestTokenBucketLimiter:
    """Test token bucket algorithm"""

    def test_basic_limiting(self):
        config = RateLimitConfig(max_requests=5, window_seconds=10)
        storage = InMemoryStorage()
        limiter = TokenBucketLimiter(config, storage)

        # Burst of 5 requests
        for i in range(5):
            result = limiter.allow('user1')
            assert result.allowed, f"Request {i+1} should be allowed"

        # 6th request denied
        result = limiter.allow('user1')
        assert not result.allowed

    def test_token_refill(self):
        config = RateLimitConfig(max_requests=10, window_seconds=10)
        storage = InMemoryStorage()
        limiter = TokenBucketLimiter(config, storage)
        # Refill rate: 10/10 = 1 token/second

        # Use all tokens
        for _ in range(10):
            assert limiter.allow('user1').allowed

        # No tokens left
        assert not limiter.allow('user1').allowed

        # Wait 2 seconds, 2 tokens refilled
        time.sleep(2)

        assert limiter.allow('user1').allowed
        assert limiter.allow('user1').allowed
        assert not limiter.allow('user1').allowed

    def test_burst_capacity(self):
        config = RateLimitConfig(max_requests=100, window_seconds=100)
        storage = InMemoryStorage()
        limiter = TokenBucketLimiter(config, storage)

        # Should handle burst of 100 immediately
        for _ in range(100):
            assert limiter.allow('user1').allowed

        assert not limiter.allow('user1').allowed

    def test_retry_after(self):
        config = RateLimitConfig(max_requests=2, window_seconds=10)
        storage = InMemoryStorage()
        limiter = TokenBucketLimiter(config, storage)
        # Refill rate: 2/10 = 0.2 token/second

        # Use all tokens
        assert limiter.allow('user1').allowed
        assert limiter.allow('user1').allowed

        # Get retry time
        result = limiter.allow('user1')
        assert not result.allowed
        assert result.retry_after is not None
        assert result.retry_after > 0


class TestSlidingWindowCounterLimiter:
    """Test sliding window counter algorithm"""

    def test_basic_limiting(self):
        config = RateLimitConfig(max_requests=3, window_seconds=10)
        storage = InMemoryStorage()
        limiter = SlidingWindowCounterLimiter(config, storage)

        # First 3 requests allowed
        assert limiter.allow('user1').allowed
        assert limiter.allow('user1').allowed
        assert limiter.allow('user1').allowed

        # 4th request denied
        assert not limiter.allow('user1').allowed

    def test_weighted_counting(self):
        config = RateLimitConfig(max_requests=10, window_seconds=10)
        storage = InMemoryStorage()
        limiter = SlidingWindowCounterLimiter(config, storage)

        # Make 5 requests
        for _ in range(5):
            assert limiter.allow('user1').allowed

        # Wait half the window
        time.sleep(5)

        # Previous window (5 requests) is weighted at 50%
        # 5 * 0.5 = 2.5
        # Should allow 10 - 2.5 = 7-8 more requests
        allowed_count = 0
        for _ in range(10):
            if limiter.allow('user1').allowed:
                allowed_count += 1

        # Should allow ~7-8 requests
        assert 6 <= allowed_count <= 8

    def test_window_transition(self):
        config = RateLimitConfig(max_requests=5, window_seconds=2)
        storage = InMemoryStorage()
        limiter = SlidingWindowCounterLimiter(config, storage)

        # Use up current window
        for _ in range(5):
            assert limiter.allow('user1').allowed

        assert not limiter.allow('user1').allowed

        # Wait for new window
        time.sleep(2.1)

        # Should allow requests again
        assert limiter.allow('user1').allowed


class TestRateLimiter:
    """Test main RateLimiter class"""

    def test_algorithm_selection(self):
        config = RateLimitConfig(max_requests=10, window_seconds=60)

        limiter_tb = RateLimiter('token_bucket', config)
        assert isinstance(limiter_tb.limiter, TokenBucketLimiter)

        limiter_swl = RateLimiter('sliding_window_log', config)
        assert isinstance(limiter_swl.limiter, SlidingWindowLogLimiter)

        limiter_fw = RateLimiter('fixed_window', config)
        assert isinstance(limiter_fw.limiter, FixedWindowLimiter)

        limiter_swc = RateLimiter('sliding_window_counter', config)
        assert isinstance(limiter_swc.limiter, SlidingWindowCounterLimiter)

    def test_invalid_algorithm(self):
        config = RateLimitConfig(max_requests=10, window_seconds=60)

        with pytest.raises(ValueError, match="Unknown algorithm"):
            RateLimiter('invalid_algorithm', config)

    def test_default_config(self):
        limiter = RateLimiter()
        assert limiter.config.max_requests == 100
        assert limiter.config.window_seconds == 60

    def test_callable_interface(self):
        limiter = RateLimiter(
            algorithm='fixed_window',
            config=RateLimitConfig(max_requests=2, window_seconds=10)
        )

        # Use as callable
        result1 = limiter('user1')
        assert result1.allowed

        result2 = limiter('user1')
        assert result2.allowed

        result3 = limiter('user1')
        assert not result3.allowed


class TestRateLimitDecorator:
    """Test @rate_limit decorator"""

    def test_basic_decorator(self):
        call_count = 0

        @rate_limit(max_requests=3, window_seconds=60)
        def api_call(user_id):
            nonlocal call_count
            call_count += 1
            return f"Hello {user_id}"

        # First 3 calls succeed
        assert api_call('user1') == "Hello user1"
        assert api_call('user1') == "Hello user1"
        assert api_call('user1') == "Hello user1"
        assert call_count == 3

        # 4th call raises exception
        with pytest.raises(RateLimitExceeded):
            api_call('user1')

        assert call_count == 3  # Function not called

    def test_exception_details(self):
        @rate_limit(max_requests=1, window_seconds=60)
        def api_call(user_id):
            return f"Hello {user_id}"

        api_call('user1')  # Use up limit

        try:
            api_call('user1')
            assert False, "Should have raised RateLimitExceeded"
        except RateLimitExceeded as e:
            assert "Rate limit exceeded" in str(e)
            assert e.result.allowed is False
            assert e.result.retry_after is not None

    def test_different_users(self):
        @rate_limit(max_requests=2, window_seconds=60)
        def api_call(user_id):
            return f"Hello {user_id}"

        # Each user gets separate limit
        api_call('user1')
        api_call('user1')

        api_call('user2')
        api_call('user2')

        # Both users now limited
        with pytest.raises(RateLimitExceeded):
            api_call('user1')

        with pytest.raises(RateLimitExceeded):
            api_call('user2')

    def test_custom_key_func(self):
        @rate_limit(
            max_requests=2,
            window_seconds=60,
            key_func=lambda user, action: f"{user}:{action}"
        )
        def perform_action(user, action):
            return f"{user} performed {action}"

        # Different actions have separate limits
        perform_action('user1', 'read')
        perform_action('user1', 'read')

        perform_action('user1', 'write')
        perform_action('user1', 'write')

        # Read limit exceeded
        with pytest.raises(RateLimitExceeded):
            perform_action('user1', 'read')

        # Write limit exceeded
        with pytest.raises(RateLimitExceeded):
            perform_action('user1', 'write')


class TestConcurrency:
    """Test thread safety and concurrent access"""

    def test_concurrent_requests(self):
        limiter = RateLimiter(
            algorithm='sliding_window_counter',
            config=RateLimitConfig(max_requests=100, window_seconds=10)
        )

        results = []
        lock = threading.Lock()

        def make_requests():
            for _ in range(50):
                result = limiter.allow('user1')
                with lock:
                    results.append(result)

        threads = [threading.Thread(target=make_requests) for _ in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # Count allowed requests
        allowed = sum(1 for r in results if r.allowed)

        # Should allow exactly 100 (with some tolerance for sliding window)
        assert 98 <= allowed <= 102

    def test_multiple_users_concurrent(self):
        limiter = RateLimiter(
            algorithm='fixed_window',
            config=RateLimitConfig(max_requests=10, window_seconds=60)
        )

        results = {}

        def user_requests(user_id):
            results[user_id] = []
            for _ in range(15):
                result = limiter.allow(user_id)
                results[user_id].append(result.allowed)

        threads = [
            threading.Thread(target=user_requests, args=(f'user{i}',))
            for i in range(10)
        ]

        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # Each user should have exactly 10 allowed
        for user_id, user_results in results.items():
            allowed = sum(user_results)
            assert allowed == 10, f"{user_id} had {allowed} allowed requests"


class TestEdgeCases:
    """Test edge cases and error conditions"""

    def test_zero_window(self):
        # Should raise error
        with pytest.raises(ValueError):
            RateLimitConfig(max_requests=10, window_seconds=0)

    def test_negative_limit(self):
        with pytest.raises(ValueError):
            RateLimitConfig(max_requests=-1, window_seconds=60)

    def test_very_small_window(self):
        config = RateLimitConfig(max_requests=2, window_seconds=0.1)
        limiter = RateLimiter('fixed_window', config)

        assert limiter.allow('user1').allowed
        assert limiter.allow('user1').allowed
        assert not limiter.allow('user1').allowed

        time.sleep(0.15)
        assert limiter.allow('user1').allowed

    def test_very_large_limit(self):
        config = RateLimitConfig(max_requests=1000000, window_seconds=60)
        limiter = RateLimiter('fixed_window', config)

        # Should handle large limits
        for _ in range(100):
            assert limiter.allow('user1').allowed

    def test_empty_identifier(self):
        limiter = RateLimiter(
            algorithm='fixed_window',
            config=RateLimitConfig(max_requests=2, window_seconds=60)
        )

        # Empty string is valid identifier
        assert limiter.allow('').allowed
        assert limiter.allow('').allowed
        assert not limiter.allow('').allowed


def test_all_algorithms_basic():
    """Integration test: all algorithms should enforce basic limit"""
    algorithms = ['token_bucket', 'sliding_window_log', 'fixed_window', 'sliding_window_counter']

    for algo in algorithms:
        config = RateLimitConfig(max_requests=3, window_seconds=60)
        limiter = RateLimiter(algo, config)

        # First 3 allowed
        assert limiter.allow('user1').allowed, f"{algo}: request 1 failed"
        assert limiter.allow('user1').allowed, f"{algo}: request 2 failed"
        assert limiter.allow('user1').allowed, f"{algo}: request 3 failed"

        # 4th denied
        result = limiter.allow('user1')
        assert not result.allowed, f"{algo}: request 4 should be denied"
        assert result.remaining == 0, f"{algo}: remaining should be 0"


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
