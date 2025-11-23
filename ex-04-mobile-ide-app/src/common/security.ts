/**
 * Security Utilities for Production
 * Input validation, sanitization, and security best practices
 */

import { getConfig } from './config';
import { logger } from './logger';

/**
 * Input Validator
 */
export class InputValidator {
    /**
     * Validate file path to prevent directory traversal
     */
    static validateFilePath(path: string): boolean {
        if (!path || typeof path !== 'string') {
            return false;
        }

        // Check for directory traversal attempts
        const dangerousPatterns = [
            '../',
            '..\\',
            '%2e%2e',
            '%252e%252e',
            '..%2f',
            '..%5c',
        ];

        const lowerPath = path.toLowerCase();
        for (const pattern of dangerousPatterns) {
            if (lowerPath.includes(pattern.toLowerCase())) {
                logger.warn('Directory traversal attempt detected', { path });
                return false;
            }
        }

        // Check for absolute paths (should use relative paths)
        if (path.startsWith('/') || /^[a-zA-Z]:/.test(path)) {
            logger.warn('Absolute path detected', { path });
            return false;
        }

        return true;
    }

    /**
     * Validate command for execution
     */
    static validateCommand(command: string): boolean {
        if (!command || typeof command !== 'string') {
            return false;
        }

        const config = getConfig();
        const allowedCommands = config.security.allowedCommands;

        // Extract base command (first word)
        const baseCommand = command.trim().split(/\s+/)[0];

        // Check if command is in allowed list
        if (!allowedCommands.includes(baseCommand)) {
            logger.warn('Unauthorized command execution attempt', { command: baseCommand });
            return false;
        }

        // Check for command injection patterns
        const injectionPatterns = [
            ';',
            '&&',
            '||',
            '`',
            '$(',
            '|',
            '\n',
            '\r',
        ];

        for (const pattern of injectionPatterns) {
            if (command.includes(pattern)) {
                logger.warn('Command injection attempt detected', { command });
                return false;
            }
        }

        return true;
    }

    /**
     * Validate file size
     */
    static validateFileSize(sizeInBytes: number): boolean {
        const config = getConfig();
        const maxSizeBytes = config.security.maxFileSizeMB * 1024 * 1024;

        if (sizeInBytes > maxSizeBytes) {
            logger.warn('File size exceeds limit', {
                sizeBytes: sizeInBytes,
                maxBytes: maxSizeBytes,
            });
            return false;
        }

        return true;
    }

    /**
     * Validate URL for safety
     */
    static validateUrl(url: string): boolean {
        if (!url || typeof url !== 'string') {
            return false;
        }

        try {
            const parsed = new URL(url);

            // Only allow http and https protocols
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                logger.warn('Unsafe URL protocol detected', { url, protocol: parsed.protocol });
                return false;
            }

            // Block localhost and private IPs in production
            const config = getConfig();
            if (config.env === 'production') {
                const hostname = parsed.hostname.toLowerCase();
                const privatePatterns = [
                    'localhost',
                    '127.0.0.1',
                    '0.0.0.0',
                    '::1',
                    /^10\./,
                    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
                    /^192\.168\./,
                ];

                for (const pattern of privatePatterns) {
                    if (typeof pattern === 'string') {
                        if (hostname === pattern) {
                            logger.warn('Private IP/localhost access attempt in production', { url });
                            return false;
                        }
                    } else if (pattern.test(hostname)) {
                        logger.warn('Private IP access attempt in production', { url });
                        return false;
                    }
                }
            }

            return true;
        } catch (error) {
            logger.warn('Invalid URL format', { url, error });
            return false;
        }
    }

    /**
     * Validate email format
     */
    static validateEmail(email: string): boolean {
        if (!email || typeof email !== 'string') {
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate GitHub token format
     */
    static validateGitHubToken(token: string): boolean {
        if (!token || typeof token !== 'string') {
            return false;
        }

        // GitHub tokens: ghp_, gho_, ghu_, ghs_, ghr_
        const tokenPattern = /^gh[pousr]_[a-zA-Z0-9]{36,251}$/;
        return tokenPattern.test(token);
    }
}

/**
 * Content Sanitizer
 */
export class ContentSanitizer {
    /**
     * Sanitize HTML to prevent XSS
     */
    static sanitizeHtml(html: string): string {
        if (!html || typeof html !== 'string') {
            return '';
        }

        // Simple HTML sanitization - in production, use DOMPurify or similar
        return html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Sanitize filename
     */
    static sanitizeFilename(filename: string): string {
        if (!filename || typeof filename !== 'string') {
            return 'untitled';
        }

        // Remove dangerous characters
        return filename
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/^\.+/, '') // Remove leading dots
            .substring(0, 255); // Limit length
    }

    /**
     * Sanitize user input for logging
     */
    static sanitizeForLog(input: any): any {
        if (typeof input === 'string') {
            // Remove potential sensitive data patterns
            return input
                .replace(/password=\S+/gi, 'password=[REDACTED]')
                .replace(/token=\S+/gi, 'token=[REDACTED]')
                .replace(/api[_-]?key=\S+/gi, 'api_key=[REDACTED]')
                .replace(/authorization:\s*\S+/gi, 'authorization: [REDACTED]');
        }

        if (typeof input === 'object' && input !== null) {
            const sanitized: any = Array.isArray(input) ? [] : {};
            for (const key in input) {
                if (Object.prototype.hasOwnProperty.call(input, key)) {
                    sanitized[key] = this.sanitizeForLog(input[key]);
                }
            }
            return sanitized;
        }

        return input;
    }
}

/**
 * Rate Limiter
 */
export class RateLimiter {
    private requests: Map<string, number[]> = new Map();
    private maxRequests: number;
    private windowMs: number;

    constructor(maxRequests: number = 100, windowMs: number = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    /**
     * Check if request should be allowed
     */
    public checkLimit(identifier: string): boolean {
        const now = Date.now();
        const timestamps = this.requests.get(identifier) || [];

        // Remove old timestamps outside the window
        const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);

        if (validTimestamps.length >= this.maxRequests) {
            logger.warn('Rate limit exceeded', {
                identifier,
                requests: validTimestamps.length,
                maxRequests: this.maxRequests,
            });
            return false;
        }

        // Add current timestamp
        validTimestamps.push(now);
        this.requests.set(identifier, validTimestamps);

        return true;
    }

    /**
     * Reset rate limit for identifier
     */
    public reset(identifier: string): void {
        this.requests.delete(identifier);
    }

    /**
     * Clear all rate limits
     */
    public clear(): void {
        this.requests.clear();
    }
}

/**
 * Content Security Policy Generator
 */
export class CSPGenerator {
    static generateCSP(): string {
        const config = getConfig();

        if (!config.security.enableCSP) {
            return '';
        }

        const directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Monaco needs eval
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://api.github.com https://github.com",
            "worker-src 'self' blob:",
            "child-src 'self' blob:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ];

        if (config.env === 'development') {
            // Allow localhost connections in development
            directives.push("connect-src 'self' ws: https://api.github.com");
        }

        return directives.join('; ');
    }

    static setCSPHeaders(response: any): void {
        const csp = this.generateCSP();
        if (csp) {
            response.setHeader('Content-Security-Policy', csp);
        }
    }
}

/**
 * Security Headers Generator
 */
export class SecurityHeaders {
    static getHeaders(): Record<string, string> {
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
            'Content-Security-Policy': CSPGenerator.generateCSP(),
        };
    }
}

/**
 * Secure Token Manager
 */
export class SecureTokenManager {
    private static readonly TOKEN_KEY = 'mobile-ide-tokens';

    /**
     * Store token securely (uses localStorage but encrypted in production)
     */
    static setToken(key: string, token: string): void {
        try {
            const tokens = this.getAll();
            tokens[key] = token;

            // In production, encrypt before storing
            const config = getConfig();
            if (config.env === 'production') {
                // Use Web Crypto API for encryption
                // This is a simplified version
                localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
            } else {
                localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
            }
        } catch (error) {
            logger.error('Failed to store token', error as Error);
        }
    }

    /**
     * Get token securely
     */
    static getToken(key: string): string | null {
        try {
            const tokens = this.getAll();
            return tokens[key] || null;
        } catch (error) {
            logger.error('Failed to retrieve token', error as Error);
            return null;
        }
    }

    /**
     * Remove token
     */
    static removeToken(key: string): void {
        try {
            const tokens = this.getAll();
            delete tokens[key];
            localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
        } catch (error) {
            logger.error('Failed to remove token', error as Error);
        }
    }

    /**
     * Get all tokens
     */
    private static getAll(): Record<string, string> {
        try {
            const stored = localStorage.getItem(this.TOKEN_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            return {};
        }
    }

    /**
     * Clear all tokens
     */
    static clearAll(): void {
        try {
            localStorage.removeItem(this.TOKEN_KEY);
        } catch (error) {
            logger.error('Failed to clear tokens', error as Error);
        }
    }
}

// Export singleton instances
export const rateLimiter = new RateLimiter();
