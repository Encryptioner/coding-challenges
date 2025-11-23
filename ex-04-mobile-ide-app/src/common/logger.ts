/**
 * Production-Ready Logger
 * Centralized logging with levels, formatting, and external service integration
 */

import { getConfig } from './config';

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
}

export interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    context?: Record<string, any>;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    userId?: string;
    sessionId?: string;
    userAgent?: string;
}

class Logger {
    private static instance: Logger;
    private logLevel: LogLevel;
    private sessionId: string;
    private logs: LogEntry[] = [];
    private maxLogsInMemory = 1000;

    private constructor() {
        const config = getConfig();
        this.logLevel = this.parseLogLevel(config.logging.level);
        this.sessionId = this.generateSessionId();

        // Setup global error handlers
        if (typeof window !== 'undefined') {
            this.setupGlobalErrorHandlers();
        }
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private parseLogLevel(level: string): LogLevel {
        const levelMap: Record<string, LogLevel> = {
            error: LogLevel.ERROR,
            warn: LogLevel.WARN,
            info: LogLevel.INFO,
            debug: LogLevel.DEBUG,
        };
        return levelMap[level.toLowerCase()] ?? LogLevel.INFO;
    }

    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private setupGlobalErrorHandlers(): void {
        // Catch unhandled errors
        window.addEventListener('error', (event) => {
            this.error('Unhandled error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
            });
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Unhandled promise rejection', {
                reason: event.reason,
                promise: String(event.promise),
            });
        });

        // Catch console errors (for debugging)
        const originalError = console.error;
        console.error = (...args: any[]) => {
            this.error('Console error', { args });
            originalError.apply(console, args);
        };
    }

    private createLogEntry(
        level: string,
        message: string,
        context?: Record<string, any>,
        error?: Error
    ): LogEntry {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            sessionId: this.sessionId,
        };

        if (context) {
            entry.context = this.sanitizeContext(context);
        }

        if (error) {
            entry.error = {
                name: error.name,
                message: error.message,
                stack: error.stack,
            };
        }

        if (typeof navigator !== 'undefined') {
            entry.userAgent = navigator.userAgent;
        }

        return entry;
    }

    private sanitizeContext(context: Record<string, any>): Record<string, any> {
        // Remove sensitive data
        const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization'];
        const sanitized: Record<string, any> = {};

        for (const [key, value] of Object.entries(context)) {
            if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeContext(value as Record<string, any>);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    private shouldLog(level: LogLevel): boolean {
        return level <= this.logLevel;
    }

    private formatLog(entry: LogEntry): string {
        const config = getConfig();

        if (config.logging.format === 'json') {
            return JSON.stringify(entry);
        }

        // Text format
        let formatted = `[${entry.timestamp}] [${entry.level}] ${entry.message}`;

        if (entry.context) {
            formatted += ` | Context: ${JSON.stringify(entry.context)}`;
        }

        if (entry.error) {
            formatted += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
            if (entry.error.stack) {
                formatted += `\n  Stack: ${entry.error.stack}`;
            }
        }

        return formatted;
    }

    private writeLog(entry: LogEntry): void {
        const config = getConfig();
        const formatted = this.formatLog(entry);

        // Console output
        const consoleFn = entry.level === 'ERROR' ? console.error :
                         entry.level === 'WARN' ? console.warn :
                         console.log;
        consoleFn(formatted);

        // Store in memory
        this.logs.push(entry);
        if (this.logs.length > this.maxLogsInMemory) {
            this.logs.shift();
        }

        // Send to external services if configured
        if (config.features.errorTracking && entry.level === 'ERROR') {
            this.sendToSentry(entry);
        }

        // File logging (Node.js only)
        if (config.logging.toFile && typeof process !== 'undefined') {
            this.writeToFile(formatted);
        }
    }

    private sendToSentry(entry: LogEntry): void {
        // Integration with Sentry or similar error tracking service
        const config = getConfig();

        if (!config.sentry.dsn) {
            return;
        }

        try {
            // This would be replaced with actual Sentry SDK call
            // Sentry.captureException(entry.error, { contexts: entry.context });
            console.debug('Would send to Sentry:', entry);
        } catch (error) {
            console.error('Failed to send to Sentry:', error);
        }
    }

    private writeToFile(formatted: string): void {
        // File writing implementation (Node.js only)
        const config = getConfig();

        if (!config.logging.filePath) {
            return;
        }

        try {
            // This would use fs.appendFileSync or a logging library
            console.debug('Would write to file:', formatted);
        } catch (error) {
            console.error('Failed to write log to file:', error);
        }
    }

    public debug(message: string, context?: Record<string, any>): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            const entry = this.createLogEntry('DEBUG', message, context);
            this.writeLog(entry);
        }
    }

    public info(message: string, context?: Record<string, any>): void {
        if (this.shouldLog(LogLevel.INFO)) {
            const entry = this.createLogEntry('INFO', message, context);
            this.writeLog(entry);
        }
    }

    public warn(message: string, context?: Record<string, any>): void {
        if (this.shouldLog(LogLevel.WARN)) {
            const entry = this.createLogEntry('WARN', message, context);
            this.writeLog(entry);
        }
    }

    public error(message: string, contextOrError?: Record<string, any> | Error, error?: Error): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            let context: Record<string, any> | undefined;
            let err: Error | undefined;

            if (contextOrError instanceof Error) {
                err = contextOrError;
            } else {
                context = contextOrError;
                err = error;
            }

            const entry = this.createLogEntry('ERROR', message, context, err);
            this.writeLog(entry);
        }
    }

    public getLogs(): LogEntry[] {
        return [...this.logs];
    }

    public clearLogs(): void {
        this.logs = [];
    }

    public getSessionId(): string {
        return this.sessionId;
    }

    /**
     * Performance logging
     */
    public performance(name: string, duration: number, metadata?: Record<string, any>): void {
        this.info(`Performance: ${name}`, {
            duration,
            ...metadata,
        });
    }

    /**
     * Create a timer for performance measurement
     */
    public startTimer(name: string): () => void {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            this.performance(name, duration);
        };
    }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience exports
export const debug = (message: string, context?: Record<string, any>) => logger.debug(message, context);
export const info = (message: string, context?: Record<string, any>) => logger.info(message, context);
export const warn = (message: string, context?: Record<string, any>) => logger.warn(message, context);
export const error = (message: string, contextOrError?: Record<string, any> | Error, err?: Error) =>
    logger.error(message, contextOrError, err);
export const startTimer = (name: string) => logger.startTimer(name);
