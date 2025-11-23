/**
 * Production-Ready Configuration Manager
 * Centralizes all environment configuration with validation and type safety
 */

export interface AppConfig {
    env: 'development' | 'staging' | 'production';
    app: {
        name: string;
        version: string;
        host: string;
        port: number;
    };
    build: {
        mode: 'development' | 'production';
        sourceMaps: boolean;
        minify: boolean;
    };
    features: {
        analytics: boolean;
        errorTracking: boolean;
        performanceMonitoring: boolean;
        debugLogging: boolean;
    };
    security: {
        enableCSP: boolean;
        enableRateLimiting: boolean;
        maxFileSizeMB: number;
        maxWorkspaceSizeMB: number;
        allowedCommands: string[];
    };
    github: {
        apiUrl: string;
        token?: string;
        rateLimitPerHour: number;
    };
    sentry: {
        dsn?: string;
        environment: string;
        tracesSampleRate: number;
    };
    analytics: {
        id?: string;
        enabled: boolean;
    };
    performance: {
        maxConcurrentOperations: number;
        requestTimeoutMs: number;
        idleTimeoutMs: number;
    };
    cache: {
        enableServiceWorker: boolean;
        maxAgeSeconds: number;
        maxSizeMB: number;
    };
    mobile: {
        keyboardAutoHideDelayMs: number;
        gestureSensitivity: 'low' | 'medium' | 'high';
        hapticFeedback: boolean;
    };
    logging: {
        level: 'error' | 'warn' | 'info' | 'debug';
        format: 'json' | 'text';
        toFile: boolean;
        filePath?: string;
    };
    cors: {
        enabled: boolean;
        allowedOrigins: string | string[];
    };
    session: {
        timeoutMinutes: number;
        autoSaveIntervalMs: number;
    };
    execution: {
        maxExecutionTimeMs: number;
        maxOutputSizeKB: number;
    };
}

class ConfigManager {
    private config: AppConfig;
    private static instance: ConfigManager;

    private constructor() {
        this.config = this.loadConfig();
        this.validateConfig();
    }

    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    private getEnv(key: string, defaultValue: string = ''): string {
        if (typeof process !== 'undefined' && process.env) {
            return process.env[key] || defaultValue;
        }
        return defaultValue;
    }

    private getBoolEnv(key: string, defaultValue: boolean = false): boolean {
        const value = this.getEnv(key);
        if (value === '') return defaultValue;
        return value.toLowerCase() === 'true' || value === '1';
    }

    private getNumEnv(key: string, defaultValue: number = 0): number {
        const value = this.getEnv(key);
        const num = parseInt(value, 10);
        return isNaN(num) ? defaultValue : num;
    }

    private loadConfig(): AppConfig {
        const nodeEnv = this.getEnv('NODE_ENV', 'production');
        const env = ['development', 'staging', 'production'].includes(nodeEnv)
            ? nodeEnv as AppConfig['env']
            : 'production';

        return {
            env,
            app: {
                name: this.getEnv('APP_NAME', 'Mobile Code IDE'),
                version: this.getEnv('APP_VERSION', '1.0.0'),
                host: this.getEnv('APP_HOST', '0.0.0.0'),
                port: this.getNumEnv('APP_PORT', 3000),
            },
            build: {
                mode: this.getEnv('BUILD_MODE', 'production') as 'development' | 'production',
                sourceMaps: this.getBoolEnv('SOURCE_MAPS', false),
                minify: this.getBoolEnv('MINIFY', true),
            },
            features: {
                analytics: this.getBoolEnv('ENABLE_ANALYTICS', true),
                errorTracking: this.getBoolEnv('ENABLE_ERROR_TRACKING', true),
                performanceMonitoring: this.getBoolEnv('ENABLE_PERFORMANCE_MONITORING', true),
                debugLogging: this.getBoolEnv('ENABLE_DEBUG_LOGGING', false),
            },
            security: {
                enableCSP: this.getBoolEnv('ENABLE_CSP', true),
                enableRateLimiting: this.getBoolEnv('ENABLE_RATE_LIMITING', true),
                maxFileSizeMB: this.getNumEnv('MAX_FILE_SIZE_MB', 50),
                maxWorkspaceSizeMB: this.getNumEnv('MAX_WORKSPACE_SIZE_MB', 500),
                allowedCommands: this.getEnv(
                    'ALLOWED_COMMANDS',
                    'npm,node,python,python3,java,javac,gcc,g++,make'
                ).split(',').map(cmd => cmd.trim()),
            },
            github: {
                apiUrl: this.getEnv('GITHUB_API_URL', 'https://api.github.com'),
                token: this.getEnv('GITHUB_TOKEN') || undefined,
                rateLimitPerHour: this.getNumEnv('GITHUB_RATE_LIMIT_PER_HOUR', 5000),
            },
            sentry: {
                dsn: this.getEnv('SENTRY_DSN') || undefined,
                environment: this.getEnv('SENTRY_ENVIRONMENT', env),
                tracesSampleRate: parseFloat(this.getEnv('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
            },
            analytics: {
                id: this.getEnv('ANALYTICS_ID') || undefined,
                enabled: this.getBoolEnv('ANALYTICS_ENABLED', true),
            },
            performance: {
                maxConcurrentOperations: this.getNumEnv('MAX_CONCURRENT_OPERATIONS', 5),
                requestTimeoutMs: this.getNumEnv('REQUEST_TIMEOUT_MS', 30000),
                idleTimeoutMs: this.getNumEnv('IDLE_TIMEOUT_MS', 1800000),
            },
            cache: {
                enableServiceWorker: this.getBoolEnv('ENABLE_SERVICE_WORKER', true),
                maxAgeSeconds: this.getNumEnv('CACHE_MAX_AGE_SECONDS', 3600),
                maxSizeMB: this.getNumEnv('CACHE_MAX_SIZE_MB', 100),
            },
            mobile: {
                keyboardAutoHideDelayMs: this.getNumEnv('KEYBOARD_AUTO_HIDE_DELAY_MS', 5000),
                gestureSensitivity: this.getEnv('GESTURE_SENSITIVITY', 'medium') as AppConfig['mobile']['gestureSensitivity'],
                hapticFeedback: this.getBoolEnv('HAPTIC_FEEDBACK', true),
            },
            logging: {
                level: this.getEnv('LOG_LEVEL', 'info') as AppConfig['logging']['level'],
                format: this.getEnv('LOG_FORMAT', 'json') as 'json' | 'text',
                toFile: this.getBoolEnv('LOG_TO_FILE', false),
                filePath: this.getEnv('LOG_FILE_PATH') || undefined,
            },
            cors: {
                enabled: this.getBoolEnv('CORS_ENABLED', true),
                allowedOrigins: this.getEnv('CORS_ALLOWED_ORIGINS', '*'),
            },
            session: {
                timeoutMinutes: this.getNumEnv('SESSION_TIMEOUT_MINUTES', 60),
                autoSaveIntervalMs: this.getNumEnv('AUTO_SAVE_INTERVAL_MS', 30000),
            },
            execution: {
                maxExecutionTimeMs: this.getNumEnv('MAX_EXECUTION_TIME_MS', 60000),
                maxOutputSizeKB: this.getNumEnv('MAX_OUTPUT_SIZE_KB', 1024),
            },
        };
    }

    private validateConfig(): void {
        const errors: string[] = [];

        // Validate numeric ranges
        if (this.config.app.port < 1 || this.config.app.port > 65535) {
            errors.push('APP_PORT must be between 1 and 65535');
        }

        if (this.config.security.maxFileSizeMB < 1 || this.config.security.maxFileSizeMB > 1000) {
            errors.push('MAX_FILE_SIZE_MB must be between 1 and 1000');
        }

        if (this.config.sentry.tracesSampleRate < 0 || this.config.sentry.tracesSampleRate > 1) {
            errors.push('SENTRY_TRACES_SAMPLE_RATE must be between 0 and 1');
        }

        // Validate required fields in production
        if (this.config.env === 'production') {
            if (this.config.features.errorTracking && !this.config.sentry.dsn) {
                console.warn('SENTRY_DSN not set but error tracking is enabled');
            }

            if (this.config.features.analytics && !this.config.analytics.id) {
                console.warn('ANALYTICS_ID not set but analytics is enabled');
            }
        }

        if (errors.length > 0) {
            throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
        }
    }

    public get(): AppConfig {
        return { ...this.config };
    }

    public isProduction(): boolean {
        return this.config.env === 'production';
    }

    public isDevelopment(): boolean {
        return this.config.env === 'development';
    }

    public isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
        return this.config.features[feature];
    }
}

// Export singleton instance
export const config = ConfigManager.getInstance();

// Export getter for convenience
export const getConfig = (): AppConfig => config.get();
