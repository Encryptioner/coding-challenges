#!/usr/bin/env python3
"""
Basic Usage Examples

Demonstrates simple usage patterns for the rate limiter.
Run with: python3 basic_usage.py
"""

import sys
import os
import time

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rate_limiter import (
    RateLimiter,
    RateLimitConfig,
    rate_limit,
    RateLimitExceeded
)


def example_1_basic_usage():
    """Example 1: Basic rate limiting"""
    print("=" * 60)
    print("Example 1: Basic Usage")
    print("=" * 60)

    # Create a rate limiter: 5 requests per 10 seconds
    limiter = RateLimiter(
        algorithm='sliding_window_counter',
        config=RateLimitConfig(max_requests=5, window_seconds=10)
    )

    print("\nMaking 7 requests (limit: 5 per 10 seconds)...\n")

    for i in range(7):
        result = limiter.allow('user123')

        if result.allowed:
            print(f"Request {i+1}: ✓ ALLOWED  (remaining: {result.remaining})")
        else:
            print(f"Request {i+1}: ✗ DENIED   (retry after: {result.retry_after:.2f}s)")

    print()


def example_2_different_users():
    """Example 2: Different users have separate limits"""
    print("=" * 60)
    print("Example 2: Different Users")
    print("=" * 60)

    limiter = RateLimiter(
        algorithm='fixed_window',
        config=RateLimitConfig(max_requests=3, window_seconds=60)
    )

    print("\nEach user has separate rate limit (3 per minute)...\n")

    users = ['alice', 'bob', 'charlie']

    for user in users:
        print(f"User: {user}")
        for i in range(4):
            result = limiter.allow(user)
            status = "✓" if result.allowed else "✗"
            print(f"  Request {i+1}: {status}")
        print()


def example_3_decorator():
    """Example 3: Using @rate_limit decorator"""
    print("=" * 60)
    print("Example 3: Decorator Pattern")
    print("=" * 60)

    @rate_limit(max_requests=3, window_seconds=60)
    def api_endpoint(user_id):
        """Simulated API endpoint"""
        return f"Processing request for {user_id}"

    print("\nCalling decorated function (limit: 3 per minute)...\n")

    for i in range(5):
        try:
            result = api_endpoint('user456')
            print(f"Call {i+1}: ✓ {result}")
        except RateLimitExceeded as e:
            print(f"Call {i+1}: ✗ {e}")

    print()


def example_4_algorithms():
    """Example 4: Comparing different algorithms"""
    print("=" * 60)
    print("Example 4: Different Algorithms")
    print("=" * 60)

    algorithms = ['token_bucket', 'fixed_window', 'sliding_window_counter']
    config = RateLimitConfig(max_requests=3, window_seconds=60)

    print("\nComparing algorithms (3 per minute)...\n")

    for algo in algorithms:
        limiter = RateLimiter(algo, config)
        print(f"{algo}:")

        for i in range(4):
            result = limiter.allow('user789')
            status = "✓" if result.allowed else "✗"
            print(f"  Request {i+1}: {status} (remaining: {result.remaining})")

        print()


def example_5_metadata():
    """Example 5: Using result metadata"""
    print("=" * 60)
    print("Example 5: Result Metadata")
    print("=" * 60)

    limiter = RateLimiter(
        algorithm='token_bucket',
        config=RateLimitConfig(max_requests=10, window_seconds=60)
    )

    print("\nExamining result metadata...\n")

    # Make several requests
    for i in range(3):
        result = limiter.allow('user_xyz')
        print(f"Request {i+1}:")
        print(f"  Allowed: {result.allowed}")
        print(f"  Remaining: {result.remaining}")
        print(f"  Reset at: {result.reset_at:.0f}")
        if result.retry_after:
            print(f"  Retry after: {result.retry_after:.2f}s")
        print()


def example_6_multi_tier():
    """Example 6: Multi-tier rate limiting"""
    print("=" * 60)
    print("Example 6: Multi-Tier Limiting")
    print("=" * 60)

    # Different limits for different user tiers
    limiters = {
        'free': RateLimiter(
            algorithm='sliding_window_counter',
            config=RateLimitConfig(max_requests=10, window_seconds=3600)  # 10/hour
        ),
        'premium': RateLimiter(
            algorithm='token_bucket',
            config=RateLimitConfig(max_requests=100, window_seconds=3600)  # 100/hour
        ),
        'enterprise': RateLimiter(
            algorithm='token_bucket',
            config=RateLimitConfig(max_requests=1000, window_seconds=3600)  # 1000/hour
        )
    }

    print("\nDifferent limits for different tiers...\n")

    users = [
        ('user_free', 'free'),
        ('user_premium', 'premium'),
        ('user_enterprise', 'enterprise')
    ]

    for user_id, tier in users:
        limiter = limiters[tier]
        print(f"{user_id} ({tier} tier - {limiter.config.max_requests}/hour):")

        # Make 5 requests
        for i in range(5):
            result = limiter.allow(user_id)
            status = "✓" if result.allowed else "✗"
            print(f"  Request {i+1}: {status} (remaining: {result.remaining})")

        print()


def example_7_time_based():
    """Example 7: Watching rate limit over time"""
    print("=" * 60)
    print("Example 7: Time-Based Behavior")
    print("=" * 60)

    limiter = RateLimiter(
        algorithm='token_bucket',
        config=RateLimitConfig(max_requests=3, window_seconds=5)
    )

    print("\nToken bucket with refill (3 per 5 seconds = 0.6 tokens/sec)...\n")

    # Use all tokens
    print("Using all tokens:")
    for i in range(3):
        result = limiter.allow('user_time')
        print(f"  Request {i+1}: ✓ (remaining: {result.remaining})")

    # Try immediately
    print("\nTry immediately:")
    result = limiter.allow('user_time')
    print(f"  Request 4: ✗ (retry after: {result.retry_after:.2f}s)")

    # Wait and try again
    print("\nWaiting 2 seconds for refill...")
    time.sleep(2)

    print("After 2 seconds (~1.2 tokens refilled):")
    result = limiter.allow('user_time')
    print(f"  Request 5: {'✓' if result.allowed else '✗'} (remaining: {result.remaining})")

    print()


def main():
    """Run all examples"""
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 15 + "RATE LIMITER EXAMPLES" + " " * 22 + "║")
    print("╚" + "=" * 58 + "╝")
    print()

    examples = [
        example_1_basic_usage,
        example_2_different_users,
        example_3_decorator,
        example_4_algorithms,
        example_5_metadata,
        example_6_multi_tier,
        example_7_time_based
    ]

    for i, example in enumerate(examples, 1):
        example()
        if i < len(examples):
            input("Press Enter to continue to next example...")
            print("\n")

    print("=" * 60)
    print("All examples completed!")
    print("=" * 60)
    print()


if __name__ == '__main__':
    main()
