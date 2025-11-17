# Integration Guide

This guide shows how to integrate the rate limiter with popular web frameworks and common use cases.

## Table of Contents

- [Flask Integration](#flask-integration)
- [FastAPI Integration](#fastapi-integration)
- [Django Integration](#django-integration)
- [HTTP Headers](#http-headers)
- [Multi-Tier Limiting](#multi-tier-limiting)
- [Identifier Strategies](#identifier-strategies)
- [Distributed Systems](#distributed-systems)
- [Monitoring and Observability](#monitoring-and-observability)

## Flask Integration

### Basic Decorator

```python
from flask import Flask, request, jsonify
from functools import wraps
from rate_limiter import RateLimiter, RateLimitConfig

app = Flask(__name__)
limiter = RateLimiter(
    algorithm='sliding_window_counter',
    config=RateLimitConfig(max_requests=100, window_seconds=60)
)

def rate_limit_decorator(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Use IP address as identifier
        identifier = request.remote_addr
        result = limiter.allow(identifier)

        if not result.allowed:
            return jsonify({
                'error': 'Rate limit exceeded',
                'retry_after': result.retry_after
            }), 429

        # Execute route
        response = f(*args, **kwargs)

        # Add rate limit headers (if response is JSON)
        if isinstance(response, tuple):
            data, status = response
            data = jsonify(data) if not hasattr(data, 'headers') else data
        else:
            data = jsonify(response) if not hasattr(response, 'headers') else response

        if hasattr(data, 'headers'):
            data.headers['X-RateLimit-Limit'] = str(limiter.config.max_requests)
            data.headers['X-RateLimit-Remaining'] = str(result.remaining)
            data.headers['X-RateLimit-Reset'] = str(int(result.reset_at))

        return data

    return decorated_function

@app.route('/api/data')
@rate_limit_decorator
def get_data():
    return {'data': 'Hello World'}
```

### Per-Route Limits

```python
# Create multiple limiters
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

def rate_limit(tier='free'):
    """Parameterized decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            identifier = request.headers.get('X-API-Key') or request.remote_addr
            result = limiters[tier].allow(identifier)

            if not result.allowed:
                response = jsonify({
                    'error': 'Rate limit exceeded',
                    'retry_after': result.retry_after
                })
                response.status_code = 429
                return response

            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/api/public')
@rate_limit('free')
def public_endpoint():
    return {'data': 'Free tier endpoint'}

@app.route('/api/premium')
@rate_limit('premium')
def premium_endpoint():
    return {'data': 'Premium tier endpoint'}

@app.route('/auth/login', methods=['POST'])
@rate_limit('strict')
def login():
    # Strict rate limit for authentication
    return {'token': 'abc123'}
```

### Application-Wide Middleware

```python
from flask import Flask, g

app = Flask(__name__)
global_limiter = RateLimiter(
    algorithm='sliding_window_counter',
    config=RateLimitConfig(max_requests=1000, window_seconds=60)
)

@app.before_request
def check_rate_limit():
    # Skip rate limiting for static files
    if request.path.startswith('/static'):
        return

    identifier = request.remote_addr
    result = global_limiter.allow(identifier)

    # Store result in g for use in after_request
    g.rate_limit_result = result

    if not result.allowed:
        response = jsonify({
            'error': 'Rate limit exceeded',
            'retry_after': result.retry_after
        })
        response.status_code = 429
        response.headers['Retry-After'] = str(int(result.retry_after))
        return response

@app.after_request
def add_rate_limit_headers(response):
    if hasattr(g, 'rate_limit_result'):
        result = g.rate_limit_result
        response.headers['X-RateLimit-Limit'] = str(global_limiter.config.max_requests)
        response.headers['X-RateLimit-Remaining'] = str(result.remaining)
        response.headers['X-RateLimit-Reset'] = str(int(result.reset_at))
    return response

@app.route('/api/data')
def get_data():
    return {'data': 'Hello World'}
```

## FastAPI Integration

### Middleware Approach

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from rate_limiter import RateLimiter, RateLimitConfig

app = FastAPI()
limiter = RateLimiter(
    algorithm='sliding_window_counter',
    config=RateLimitConfig(max_requests=100, window_seconds=60)
)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip docs
    if request.url.path in ["/docs", "/openapi.json"]:
        return await call_next(request)

    # Check rate limit
    identifier = request.client.host
    result = limiter.allow(identifier)

    if not result.allowed:
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "retry_after": result.retry_after
            },
            headers={
                "X-RateLimit-Limit": str(limiter.config.max_requests),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(int(result.reset_at)),
                "Retry-After": str(int(result.retry_after))
            }
        )

    # Process request
    response = await call_next(request)

    # Add headers
    response.headers["X-RateLimit-Limit"] = str(limiter.config.max_requests)
    response.headers["X-RateLimit-Remaining"] = str(result.remaining)
    response.headers["X-RateLimit-Reset"] = str(int(result.reset_at))

    return response

@app.get("/api/data")
async def get_data():
    return {"data": "Hello World"}
```

### Dependency Injection

```python
from fastapi import Depends, HTTPException, Request
from typing import Annotated

limiter = RateLimiter(
    algorithm='sliding_window_counter',
    config=RateLimitConfig(max_requests=100, window_seconds=60)
)

async def check_rate_limit(request: Request):
    """Dependency that checks rate limit"""
    identifier = request.client.host
    result = limiter.allow(identifier)

    if not result.allowed:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "retry_after": result.retry_after
            },
            headers={
                "Retry-After": str(int(result.retry_after))
            }
        )

    return result

@app.get("/api/data")
async def get_data(
    rate_limit: Annotated[RateLimitResult, Depends(check_rate_limit)]
):
    return {
        "data": "Hello World",
        "rate_limit": {
            "remaining": rate_limit.remaining,
            "reset_at": rate_limit.reset_at
        }
    }
```

### Per-Endpoint Limits

```python
from fastapi import FastAPI, Request, HTTPException

app = FastAPI()

# Different limiters for different endpoints
strict_limiter = RateLimiter(
    algorithm='sliding_window_log',
    config=RateLimitConfig(max_requests=5, window_seconds=60)
)

def create_rate_limiter_dependency(limiter: RateLimiter):
    async def rate_limiter_dependency(request: Request):
        identifier = request.client.host
        result = limiter.allow(identifier)

        if not result.allowed:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "retry_after": result.retry_after
                }
            )
        return result
    return rate_limiter_dependency

@app.post("/auth/login")
async def login(
    rate_limit: Annotated[RateLimitResult, Depends(create_rate_limiter_dependency(strict_limiter))]
):
    # Strict rate limit for login
    return {"token": "abc123"}
```

## Django Integration

### Middleware

```python
# middleware.py
from django.http import JsonResponse
from rate_limiter import RateLimiter, RateLimitConfig
import time

class RateLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.limiter = RateLimiter(
            algorithm='sliding_window_counter',
            config=RateLimitConfig(max_requests=100, window_seconds=60)
        )

    def __call__(self, request):
        # Get identifier (IP address or user ID)
        if request.user.is_authenticated:
            identifier = f"user:{request.user.id}"
        else:
            identifier = self.get_client_ip(request)

        # Check rate limit
        result = self.limiter.allow(identifier)

        if not result.allowed:
            return JsonResponse({
                'error': 'Rate limit exceeded',
                'retry_after': result.retry_after
            }, status=429, headers={
                'Retry-After': str(int(result.retry_after)),
                'X-RateLimit-Limit': str(self.limiter.config.max_requests),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': str(int(result.reset_at))
            })

        # Process request
        response = self.get_response(request)

        # Add headers
        response['X-RateLimit-Limit'] = str(self.limiter.config.max_requests)
        response['X-RateLimit-Remaining'] = str(result.remaining)
        response['X-RateLimit-Reset'] = str(int(result.reset_at))

        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

# settings.py
MIDDLEWARE = [
    # ... other middleware
    'myapp.middleware.RateLimitMiddleware',
]
```

### Decorator for Views

```python
# decorators.py
from functools import wraps
from django.http import JsonResponse
from rate_limiter import RateLimiter, RateLimitConfig

limiter = RateLimiter(
    algorithm='sliding_window_counter',
    config=RateLimitConfig(max_requests=100, window_seconds=60)
)

def rate_limit(max_requests=100, window_seconds=60, algorithm='sliding_window_counter'):
    """Decorator for Django views"""
    view_limiter = RateLimiter(
        algorithm=algorithm,
        config=RateLimitConfig(max_requests=max_requests, window_seconds=window_seconds)
    )

    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            # Get identifier
            if request.user.is_authenticated:
                identifier = f"user:{request.user.id}"
            else:
                identifier = request.META.get('REMOTE_ADDR')

            # Check rate limit
            result = view_limiter.allow(identifier)

            if not result.allowed:
                response = JsonResponse({
                    'error': 'Rate limit exceeded',
                    'retry_after': result.retry_after
                }, status=429)
                response['Retry-After'] = str(int(result.retry_after))
                return response

            # Execute view
            response = view_func(request, *args, **kwargs)

            # Add headers
            if hasattr(response, '__setitem__'):
                response['X-RateLimit-Limit'] = str(max_requests)
                response['X-RateLimit-Remaining'] = str(result.remaining)
                response['X-RateLimit-Reset'] = str(int(result.reset_at))

            return response
        return wrapped_view
    return decorator

# views.py
from django.http import JsonResponse
from .decorators import rate_limit

@rate_limit(max_requests=10, window_seconds=60)
def api_view(request):
    return JsonResponse({'data': 'Hello World'})

@rate_limit(max_requests=3, window_seconds=60, algorithm='sliding_window_log')
def login_view(request):
    # Strict rate limit for authentication
    return JsonResponse({'token': 'abc123'})
```

## HTTP Headers

### Standard Headers

Following RFC 6585 and common practices:

```python
# Success response (200 OK)
HTTP/1.1 200 OK
X-RateLimit-Limit: 100          # Maximum requests per window
X-RateLimit-Remaining: 45        # Requests remaining
X-RateLimit-Reset: 1234567890    # Unix timestamp when limit resets

# Rate limited response (429 Too Many Requests)
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1234567890
Retry-After: 30                  # Seconds to wait before retrying
```

### Implementation

```python
def add_rate_limit_headers(response, result, config):
    """Add rate limit headers to response"""
    response.headers['X-RateLimit-Limit'] = str(config.max_requests)
    response.headers['X-RateLimit-Remaining'] = str(result.remaining)
    response.headers['X-RateLimit-Reset'] = str(int(result.reset_at))

    if not result.allowed and result.retry_after:
        response.headers['Retry-After'] = str(int(result.retry_after))

    return response
```

### Client Usage

```python
import requests
import time

def make_request_with_retry(url):
    response = requests.get(url)

    if response.status_code == 429:
        # Rate limited
        retry_after = int(response.headers.get('Retry-After', 60))
        print(f"Rate limited. Retrying after {retry_after} seconds...")
        time.sleep(retry_after)
        return make_request_with_retry(url)

    # Check remaining requests
    remaining = int(response.headers.get('X-RateLimit-Remaining', 0))
    if remaining < 10:
        print(f"Warning: Only {remaining} requests remaining")

    return response
```

## Multi-Tier Limiting

### Different Limits for Different Users

```python
class TieredRateLimiter:
    def __init__(self):
        self.limiters = {
            'free': RateLimiter(
                algorithm='sliding_window_counter',
                config=RateLimitConfig(max_requests=100, window_seconds=3600)  # 100/hour
            ),
            'premium': RateLimiter(
                algorithm='token_bucket',
                config=RateLimitConfig(max_requests=1000, window_seconds=3600)  # 1000/hour
            ),
            'enterprise': RateLimiter(
                algorithm='token_bucket',
                config=RateLimitConfig(max_requests=10000, window_seconds=3600)  # 10K/hour
            )
        }

    def check_limit(self, user_id, tier='free'):
        limiter = self.limiters.get(tier, self.limiters['free'])
        return limiter.allow(user_id)

# Usage
tiered_limiter = TieredRateLimiter()

@app.route('/api/data')
def get_data():
    user = get_current_user()
    tier = user.subscription_tier  # 'free', 'premium', or 'enterprise'

    result = tiered_limiter.check_limit(user.id, tier)

    if not result.allowed:
        return jsonify({'error': 'Rate limit exceeded'}), 429

    return jsonify({'data': 'Hello World'})
```

### Per-User and Global Limits

```python
class MultiLevelLimiter:
    def __init__(self):
        # Per-user limit
        self.user_limiter = RateLimiter(
            algorithm='sliding_window_counter',
            config=RateLimitConfig(max_requests=100, window_seconds=3600)
        )
        # Global system limit
        self.global_limiter = RateLimiter(
            algorithm='fixed_window',
            config=RateLimitConfig(max_requests=10000, window_seconds=60)
        )

    def check_limits(self, user_id):
        # Check global limit first (cheaper, fails fast)
        global_result = self.global_limiter.allow('global')
        if not global_result.allowed:
            return False, 'System capacity reached', global_result

        # Check per-user limit
        user_result = self.user_limiter.allow(user_id)
        if not user_result.allowed:
            return False, 'User rate limit exceeded', user_result

        return True, 'OK', user_result

# Usage
limiter = MultiLevelLimiter()

@app.route('/api/data')
def get_data():
    user_id = get_user_id()
    allowed, message, result = limiter.check_limits(user_id)

    if not allowed:
        return jsonify({
            'error': message,
            'retry_after': result.retry_after
        }), 429

    return jsonify({'data': 'Hello World'})
```

## Identifier Strategies

### IP Address

```python
def get_identifier_ip(request):
    """Use IP address as identifier"""
    # Check for proxy headers
    x_forwarded_for = request.headers.get('X-Forwarded-For')
    if x_forwarded_for:
        # X-Forwarded-For can contain multiple IPs
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.remote_addr
    return ip
```

**Pros:**
- No authentication required
- Works for all requests
- Simple to implement

**Cons:**
- Multiple users behind same NAT/proxy share limit
- Can be spoofed (use with X-Forwarded-For validation)

### API Key

```python
def get_identifier_api_key(request):
    """Use API key as identifier"""
    api_key = request.headers.get('X-API-Key')
    if not api_key:
        raise ValueError("API key required")
    return f"apikey:{api_key}"
```

**Pros:**
- Accurate per-client tracking
- Can associate with account/billing
- Hard to spoof

**Cons:**
- Requires API key system
- Doesn't work for unauthenticated endpoints

### User ID

```python
def get_identifier_user(request):
    """Use authenticated user ID as identifier"""
    if not request.user.is_authenticated:
        # Fall back to IP for unauthenticated requests
        return f"ip:{get_identifier_ip(request)}"
    return f"user:{request.user.id}"
```

**Pros:**
- Accurate per-user tracking
- Works across devices/IPs
- Easy to manage per-user limits

**Cons:**
- Requires authentication
- Need fallback for unauthenticated requests

### Composite Identifier

```python
def get_identifier_composite(request):
    """Use endpoint-specific identifier"""
    user_id = request.user.id if request.user.is_authenticated else 'anon'
    endpoint = request.path
    return f"{user_id}:{endpoint}"

# Example identifiers:
# "user123:/api/search"   (user 123 hitting search)
# "user123:/api/upload"   (user 123 hitting upload)
# "anon:/api/public"      (anonymous user hitting public)
```

**Pros:**
- Different limits per endpoint
- Prevents one endpoint from affecting others
- Flexible

**Cons:**
- More complex
- Higher memory usage

## Distributed Systems

### Using Redis

```python
import redis
from rate_limiter import StorageBackend, RateLimiter, RateLimitConfig

class RedisStorage(StorageBackend):
    def __init__(self, host='localhost', port=6379, db=0, password=None):
        self.client = redis.Redis(
            host=host,
            port=port,
            db=db,
            password=password,
            decode_responses=True
        )

    def increment(self, key: str, window: int) -> int:
        pipe = self.client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window)
        result = pipe.execute()
        return result[0]

    def get(self, key: str):
        value = self.client.get(key)
        return int(value) if value else None

    def set(self, key: str, value, ttl: int):
        self.client.setex(key, ttl, value)

    # ... implement other methods

# Usage
storage = RedisStorage(host='localhost', port=6379)
limiter = RateLimiter(
    algorithm='sliding_window_counter',
    config=RateLimitConfig(max_requests=100, window_seconds=60),
    storage=storage
)
```

### Connection Pooling

```python
import redis

# Create connection pool (shared across app)
pool = redis.ConnectionPool(
    host='localhost',
    port=6379,
    max_connections=50,
    decode_responses=True
)

class RedisStorage(StorageBackend):
    def __init__(self, pool):
        self.client = redis.Redis(connection_pool=pool)

# Use in application
storage = RedisStorage(pool)
limiter = RateLimiter('sliding_window_counter', storage=storage)
```

### Error Handling

```python
class ResilientRedisStorage(RedisStorage):
    """Redis storage with fallback"""

    def __init__(self, pool, fallback_storage=None):
        super().__init__(pool)
        self.fallback = fallback_storage or InMemoryStorage()

    def increment(self, key: str, window: int) -> int:
        try:
            return super().increment(key, window)
        except redis.RedisError as e:
            logger.error(f"Redis error: {e}, falling back to in-memory")
            return self.fallback.increment(key, window)

    # ... wrap other methods similarly
```

## Monitoring and Observability

### Logging

```python
import logging

logger = logging.getLogger(__name__)

class MonitoredRateLimiter:
    def __init__(self, limiter):
        self.limiter = limiter
        self.total_requests = 0
        self.denied_requests = 0

    def allow(self, identifier):
        self.total_requests += 1
        result = self.limiter.allow(identifier)

        if not result.allowed:
            self.denied_requests += 1
            logger.warning(
                f"Rate limit exceeded for {identifier}. "
                f"Retry after {result.retry_after}s"
            )
        else:
            logger.debug(
                f"Request allowed for {identifier}. "
                f"{result.remaining} remaining"
            )

        return result

    def get_stats(self):
        return {
            'total_requests': self.total_requests,
            'denied_requests': self.denied_requests,
            'denial_rate': self.denied_requests / self.total_requests
                          if self.total_requests > 0 else 0
        }
```

### Metrics (Prometheus)

```python
from prometheus_client import Counter, Histogram

requests_total = Counter(
    'rate_limit_requests_total',
    'Total rate limit checks',
    ['identifier', 'allowed']
)

denial_rate = Counter(
    'rate_limit_denials_total',
    'Total rate limit denials',
    ['identifier']
)

class PrometheusMonitoredLimiter:
    def __init__(self, limiter):
        self.limiter = limiter

    def allow(self, identifier):
        result = self.limiter.allow(identifier)

        # Record metrics
        requests_total.labels(
            identifier=identifier,
            allowed=str(result.allowed)
        ).inc()

        if not result.allowed:
            denial_rate.labels(identifier=identifier).inc()

        return result
```

### Health Checks

```python
@app.route('/health/rate-limiter')
def rate_limiter_health():
    """Health check endpoint"""
    try:
        # Test storage connectivity
        test_key = '_health_check'
        storage.set(test_key, 1, 1)
        value = storage.get(test_key)
        storage.delete(test_key)

        if value != 1:
            raise ValueError("Storage test failed")

        return jsonify({
            'status': 'healthy',
            'storage': 'connected'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500
```

## Conclusion

This guide covers the most common integration patterns. Choose the approach that best fits your:
- Framework (Flask, FastAPI, Django)
- Architecture (single instance, distributed)
- Requirements (simple, multi-tier, monitored)

For more details, see:
- [algorithms.md](algorithms.md) - Algorithm deep dive
- [implementation.md](implementation.md) - Implementation details
- [../examples/](../examples/) - Working code examples

---

Part of the [CodingChallenges.fyi Rate Limiter](https://codingchallenges.fyi/challenges/challenge-rate-limiter) implementation.
