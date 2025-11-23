/**
 * Security Utilities Tests
 */

import {
    InputValidator,
    ContentSanitizer,
    RateLimiter,
} from '../security';

describe('InputValidator', () => {
    describe('validateFilePath', () => {
        it('should accept valid relative paths', () => {
            expect(InputValidator.validateFilePath('src/index.ts')).toBe(true);
            expect(InputValidator.validateFilePath('components/Button.tsx')).toBe(true);
        });

        it('should reject directory traversal attempts', () => {
            expect(InputValidator.validateFilePath('../../../etc/passwd')).toBe(false);
            expect(InputValidator.validateFilePath('..\\..\\windows\\system32')).toBe(false);
            expect(InputValidator.validateFilePath('%2e%2e/etc/passwd')).toBe(false);
        });

        it('should reject absolute paths', () => {
            expect(InputValidator.validateFilePath('/etc/passwd')).toBe(false);
            expect(InputValidator.validateFilePath('C:\\Windows\\System32')).toBe(false);
        });

        it('should reject invalid input', () => {
            expect(InputValidator.validateFilePath('')).toBe(false);
            expect(InputValidator.validateFilePath(null as any)).toBe(false);
            expect(InputValidator.validateFilePath(undefined as any)).toBe(false);
        });
    });

    describe('validateCommand', () => {
        it('should accept allowed commands', () => {
            expect(InputValidator.validateCommand('npm install')).toBe(true);
            expect(InputValidator.validateCommand('node index.js')).toBe(true);
        });

        it('should reject command injection attempts', () => {
            expect(InputValidator.validateCommand('ls; rm -rf /')).toBe(false);
            expect(InputValidator.validateCommand('ls && cat /etc/passwd')).toBe(false);
            expect(InputValidator.validateCommand('ls | grep secret')).toBe(false);
            expect(InputValidator.validateCommand('echo $(whoami)')).toBe(false);
        });

        it('should reject disallowed commands', () => {
            expect(InputValidator.validateCommand('rm -rf /')).toBe(false);
            expect(InputValidator.validateCommand('curl malicious.com')).toBe(false);
        });
    });

    describe('validateUrl', () => {
        it('should accept valid HTTPS URLs', () => {
            expect(InputValidator.validateUrl('https://github.com')).toBe(true);
            expect(InputValidator.validateUrl('https://api.github.com/repos')).toBe(true);
        });

        it('should accept valid HTTP URLs', () => {
            expect(InputValidator.validateUrl('http://example.com')).toBe(true);
        });

        it('should reject dangerous protocols', () => {
            expect(InputValidator.validateUrl('javascript:alert(1)')).toBe(false);
            expect(InputValidator.validateUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
            expect(InputValidator.validateUrl('file:///etc/passwd')).toBe(false);
        });

        it('should reject invalid URLs', () => {
            expect(InputValidator.validateUrl('not-a-url')).toBe(false);
            expect(InputValidator.validateUrl('')).toBe(false);
        });
    });

    describe('validateEmail', () => {
        it('should accept valid emails', () => {
            expect(InputValidator.validateEmail('user@example.com')).toBe(true);
            expect(InputValidator.validateEmail('test.user+tag@domain.co.uk')).toBe(true);
        });

        it('should reject invalid emails', () => {
            expect(InputValidator.validateEmail('invalid')).toBe(false);
            expect(InputValidator.validateEmail('@example.com')).toBe(false);
            expect(InputValidator.validateEmail('user@')).toBe(false);
            expect(InputValidator.validateEmail('')).toBe(false);
        });
    });
});

describe('ContentSanitizer', () => {
    describe('sanitizeHtml', () => {
        it('should escape HTML characters', () => {
            const input = '<script>alert("XSS")</script>';
            const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;';
            expect(ContentSanitizer.sanitizeHtml(input)).toBe(expected);
        });

        it('should handle empty input', () => {
            expect(ContentSanitizer.sanitizeHtml('')).toBe('');
            expect(ContentSanitizer.sanitizeHtml(null as any)).toBe('');
        });
    });

    describe('sanitizeFilename', () => {
        it('should remove dangerous characters', () => {
            expect(ContentSanitizer.sanitizeFilename('test<>file.txt')).toBe('test__file.txt');
            expect(ContentSanitizer.sanitizeFilename('file|with:bad*chars?.txt')).toBe('file_with_bad_chars_.txt');
        });

        it('should remove leading dots', () => {
            expect(ContentSanitizer.sanitizeFilename('...hidden')).toBe('hidden');
        });

        it('should limit length', () => {
            const longName = 'a'.repeat(300);
            expect(ContentSanitizer.sanitizeFilename(longName).length).toBe(255);
        });

        it('should handle empty input', () => {
            expect(ContentSanitizer.sanitizeFilename('')).toBe('untitled');
        });
    });

    describe('sanitizeForLog', () => {
        it('should redact passwords', () => {
            const input = 'Login with password=secret123';
            expect(ContentSanitizer.sanitizeForLog(input)).toContain('password=[REDACTED]');
        });

        it('should redact tokens', () => {
            const input = 'API token=abc123';
            expect(ContentSanitizer.sanitizeForLog(input)).toContain('token=[REDACTED]');
        });

        it('should handle objects', () => {
            const input = { password: 'secret', username: 'user' };
            const result = ContentSanitizer.sanitizeForLog(input);
            expect(result.password).toBe('[REDACTED]');
            expect(result.username).toBe('user');
        });
    });
});

describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
        rateLimiter = new RateLimiter(5, 1000); // 5 requests per second
    });

    it('should allow requests within limit', () => {
        for (let i = 0; i < 5; i++) {
            expect(rateLimiter.checkLimit('test-user')).toBe(true);
        }
    });

    it('should block requests exceeding limit', () => {
        for (let i = 0; i < 5; i++) {
            rateLimiter.checkLimit('test-user');
        }
        expect(rateLimiter.checkLimit('test-user')).toBe(false);
    });

    it('should reset limits', () => {
        for (let i = 0; i < 5; i++) {
            rateLimiter.checkLimit('test-user');
        }
        rateLimiter.reset('test-user');
        expect(rateLimiter.checkLimit('test-user')).toBe(true);
    });

    it('should track different identifiers separately', () => {
        for (let i = 0; i < 5; i++) {
            rateLimiter.checkLimit('user1');
        }
        expect(rateLimiter.checkLimit('user1')).toBe(false);
        expect(rateLimiter.checkLimit('user2')).toBe(true);
    });
});
