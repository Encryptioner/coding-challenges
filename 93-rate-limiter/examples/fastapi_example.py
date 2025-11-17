#!/usr/bin/env python3
"""
FastAPI Integration Example

Demonstrates how to integrate the rate limiter with FastAPI applications.
Run with: python3 fastapi_example.py
Then visit: http://localhost:8000/docs for interactive API documentation
Test with: curl http://localhost:8000/api/data
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
import sys
import os
import uvicorn

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rate_limiter import RateLimiter, RateLimitConfig

app = FastAPI(
    title="Rate Limited API",
    description="Example FastAPI application with rate limiting",
    version="1.0.0"
)

# Create rate limiters
global_limiter = RateLimiter(
    algorithm='sliding_window_counter',
    config=RateLimitConfig(max_requests=100, window_seconds=60)
)

strict_limiter = RateLimiter(
    algorithm='sliding_window_log',
    config=RateLimitConfig(max_requests=5, window_seconds=60)
)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Global rate limiting middleware"""

    # Skip rate limiting for docs and root
    if request.url.path in ["/", "/docs", "/openapi.json"]:
        return await call_next(request)

    # Use IP address as identifier
    identifier = request.client.host

    # Check global rate limit
    result = global_limiter.allow(identifier)

    if not result.allowed:
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "message": f"Too many requests. Retry after {result.retry_after:.1f} seconds",
                "retry_after": result.retry_after,
                "reset_at": result.reset_at
            },
            headers={
                "X-RateLimit-Limit": str(global_limiter.config.max_requests),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(int(result.reset_at)),
                "Retry-After": str(int(result.retry_after))
            }
        )

    # Process request
    response = await call_next(request)

    # Add rate limit headers
    response.headers["X-RateLimit-Limit"] = str(global_limiter.config.max_requests)
    response.headers["X-RateLimit-Remaining"] = str(result.remaining)
    response.headers["X-RateLimit-Reset"] = str(int(result.reset_at))

    return response


@app.get("/", response_class=HTMLResponse)
async def root():
    """Documentation page"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Rate Limited FastAPI</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            h1 { color: #333; }
            .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
            code { background: #e0e0e0; padding: 2px 5px; border-radius: 3px; }
            .limit { font-weight: bold; color: #0066cc; }
        </style>
    </head>
    <body>
        <h1>Rate Limited FastAPI Example</h1>
        <p>Interactive API documentation: <a href="/docs">/docs</a></p>

        <div class="endpoint">
            <h3>GET /api/data</h3>
            <p><span class="limit">Global Limit:</span> 100 requests per minute</p>
            <p><code>curl http://localhost:8000/api/data</code></p>
        </div>

        <div class="endpoint">
            <h3>GET /api/users/{user_id}</h3>
            <p><span class="limit">Global Limit:</span> 100 requests per minute</p>
            <p><code>curl http://localhost:8000/api/users/123</code></p>
        </div>

        <div class="endpoint">
            <h3>POST /api/auth/login</h3>
            <p><span class="limit">Strict Limit:</span> 5 attempts per minute</p>
            <p><code>curl -X POST http://localhost:8000/api/auth/login -d '{"username":"user","password":"pass"}'</code></p>
        </div>

        <div class="endpoint">
            <h3>GET /api/status</h3>
            <p><span class="limit">Global Limit:</span> 100 requests per minute</p>
            <p><code>curl http://localhost:8000/api/status</code></p>
        </div>

        <h2>Features</h2>
        <ul>
            <li>Automatic rate limiting via middleware</li>
            <li>Per-endpoint additional limits</li>
            <li>Standard HTTP 429 responses</li>
            <li>Rate limit headers in all responses</li>
        </ul>
    </body>
    </html>
    """


@app.get("/api/data")
async def get_data():
    """
    Get some data

    Rate limit: 100 requests per minute (global)
    """
    return {
        "data": "Hello World",
        "message": "This endpoint uses global rate limiting"
    }


@app.get("/api/users/{user_id}")
async def get_user(user_id: int):
    """
    Get user information

    Rate limit: 100 requests per minute (global)
    """
    return {
        "user_id": user_id,
        "name": f"User {user_id}",
        "message": "This endpoint uses global rate limiting"
    }


@app.post("/api/auth/login")
async def login(request: Request, username: str = "user", password: str = "pass"):
    """
    Login endpoint

    Rate limit: 5 attempts per minute (strict) + 100 per minute (global)
    """
    # Apply additional strict rate limit for auth endpoints
    identifier = request.client.host
    result = strict_limiter.allow(f"auth:{identifier}")

    if not result.allowed:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Too many login attempts",
                "retry_after": result.retry_after,
                "reset_at": result.reset_at
            },
            headers={
                "Retry-After": str(int(result.retry_after))
            }
        )

    # Simulate login logic
    return {
        "message": "Login successful",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "username": username
    }


@app.get("/api/status")
async def status():
    """
    Service status

    Rate limit: 100 requests per minute (global)
    """
    return {
        "status": "ok",
        "message": "Service is running",
        "rate_limiting": "enabled"
    }


@app.get("/api/metrics")
async def metrics():
    """
    Service metrics (example)

    Rate limit: 100 requests per minute (global)
    """
    return {
        "requests_total": 1234,
        "requests_allowed": 1200,
        "requests_denied": 34,
        "denial_rate": 2.75
    }


if __name__ == "__main__":
    print("Starting FastAPI application with rate limiting...")
    print("Visit http://localhost:8000 for documentation")
    print("Visit http://localhost:8000/docs for interactive API docs")
    print("\nTest endpoints:")
    print("  curl http://localhost:8000/api/data")
    print("  curl http://localhost:8000/api/users/123")
    print("  curl -X POST http://localhost:8000/api/auth/login")
    print("\nPress Ctrl+C to stop")

    uvicorn.run(app, host="0.0.0.0", port=8000)
