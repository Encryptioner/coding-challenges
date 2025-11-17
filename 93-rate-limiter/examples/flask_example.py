#!/usr/bin/env python3
"""
Flask Integration Example

Demonstrates how to integrate the rate limiter with Flask applications.
Run with: python3 flask_example.py
Test with: curl http://localhost:5000/api/data
"""

from flask import Flask, request, jsonify
from functools import wraps
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rate_limiter import RateLimiter, RateLimitConfig

app = Flask(__name__)

# Create rate limiters for different tiers
limiters = {
    'free': RateLimiter(
        algorithm='sliding_window_counter',
        config=RateLimitConfig(max_requests=10, window_seconds=60)
    ),
    'premium': RateLimiter(
        algorithm='token_bucket',
        config=RateLimitConfig(max_requests=100, window_seconds=60)
    ),
    'strict': RateLimiter(
        algorithm='sliding_window_log',
        config=RateLimitConfig(max_requests=3, window_seconds=60)
    )
}


def rate_limit_decorator(tier='free'):
    """
    Decorator to apply rate limiting to Flask routes

    Args:
        tier: Rate limit tier ('free', 'premium', 'strict')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get identifier from request (IP address or API key)
            identifier = request.headers.get('X-API-Key') or request.remote_addr

            # Check rate limit
            limiter = limiters[tier]
            result = limiter.allow(identifier)

            # Add rate limit headers
            def add_headers(response):
                if hasattr(response, 'headers'):
                    response.headers['X-RateLimit-Limit'] = str(limiter.config.max_requests)
                    response.headers['X-RateLimit-Remaining'] = str(result.remaining)
                    response.headers['X-RateLimit-Reset'] = str(int(result.reset_at))
                    if result.retry_after:
                        response.headers['Retry-After'] = str(int(result.retry_after))
                return response

            if not result.allowed:
                response = jsonify({
                    'error': 'Rate limit exceeded',
                    'message': f'Too many requests. Retry after {result.retry_after:.1f} seconds',
                    'retry_after': result.retry_after,
                    'reset_at': result.reset_at
                })
                response.status_code = 429
                return add_headers(response)

            # Execute the route handler
            response = f(*args, **kwargs)

            # Convert response if needed
            if not hasattr(response, 'headers'):
                response = jsonify(response)

            return add_headers(response)

        return decorated_function
    return decorator


# Routes with different rate limits

@app.route('/api/data')
@rate_limit_decorator('free')
def get_data():
    """Free tier endpoint: 10 requests per minute"""
    return {
        'data': 'Hello World',
        'message': 'Free tier endpoint'
    }


@app.route('/api/premium')
@rate_limit_decorator('premium')
def get_premium():
    """Premium tier endpoint: 100 requests per minute"""
    return {
        'data': 'Premium data',
        'message': 'Premium tier endpoint'
    }


@app.route('/api/auth/login', methods=['POST'])
@rate_limit_decorator('strict')
def login():
    """Authentication endpoint: 3 attempts per minute"""
    # Simulate login logic
    return {
        'message': 'Login successful',
        'token': 'abc123'
    }


@app.route('/api/status')
def status():
    """Status endpoint (no rate limit)"""
    return {
        'status': 'ok',
        'message': 'Service is running'
    }


@app.route('/')
def index():
    """Documentation page"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Rate Limited API</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            h1 { color: #333; }
            .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
            code { background: #e0e0e0; padding: 2px 5px; border-radius: 3px; }
            .tier { font-weight: bold; color: #0066cc; }
        </style>
    </head>
    <body>
        <h1>Rate Limited API Example</h1>

        <div class="endpoint">
            <h3>GET /api/data</h3>
            <p><span class="tier">Free Tier:</span> 10 requests per minute</p>
            <p><code>curl http://localhost:5000/api/data</code></p>
        </div>

        <div class="endpoint">
            <h3>GET /api/premium</h3>
            <p><span class="tier">Premium Tier:</span> 100 requests per minute</p>
            <p><code>curl -H "X-API-Key: premium-key" http://localhost:5000/api/premium</code></p>
        </div>

        <div class="endpoint">
            <h3>POST /api/auth/login</h3>
            <p><span class="tier">Strict Tier:</span> 3 attempts per minute</p>
            <p><code>curl -X POST http://localhost:5000/api/auth/login</code></p>
        </div>

        <div class="endpoint">
            <h3>GET /api/status</h3>
            <p><span class="tier">No Rate Limit</span></p>
            <p><code>curl http://localhost:5000/api/status</code></p>
        </div>

        <h2>Rate Limit Headers</h2>
        <ul>
            <li><code>X-RateLimit-Limit</code>: Maximum requests allowed</li>
            <li><code>X-RateLimit-Remaining</code>: Requests remaining in current window</li>
            <li><code>X-RateLimit-Reset</code>: Unix timestamp when limit resets</li>
            <li><code>Retry-After</code>: Seconds to wait before retrying (when limited)</li>
        </ul>
    </body>
    </html>
    """


if __name__ == '__main__':
    print("Starting Flask application with rate limiting...")
    print("Visit http://localhost:5000 for documentation")
    print("\nTest endpoints:")
    print("  curl http://localhost:5000/api/data")
    print("  curl http://localhost:5000/api/premium")
    print("  curl -X POST http://localhost:5000/api/auth/login")
    print("\nPress Ctrl+C to stop")
    app.run(debug=True, port=5000)
