/**
 * Jest Configuration for Mobile IDE
 * Comprehensive testing setup for unit, integration, and component tests
 */

module.exports = {
    // Use ts-jest for TypeScript support
    preset: 'ts-jest',

    // Test environment
    testEnvironment: 'jsdom',

    // Roots for test discovery
    roots: ['<rootDir>/src', '<rootDir>/extensions'],

    // Test match patterns
    testMatch: [
        '**/__tests__/**/*.+(ts|tsx|js)',
        '**/?(*.)+(spec|test).+(ts|tsx|js)',
    ],

    // Transform files
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },

    // Module name mapper for imports
    moduleNameMapper: {
        // Handle CSS imports
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',

        // Handle image imports
        '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/__mocks__/fileMock.js',

        // Handle module aliases
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@extensions/(.*)$': '<rootDir>/extensions/$1',
    },

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        'extensions/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.spec.{ts,tsx}',
        '!src/**/*.test.{ts,tsx}',
        '!src/**/__tests__/**',
        '!**/node_modules/**',
        '!**/lib/**',
        '!**/dist/**',
    ],

    coverageThresholds: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },

    coverageDirectory: '<rootDir>/coverage',

    coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

    // Module file extensions
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

    // Ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/lib/',
        '/dist/',
        '/.git/',
    ],

    // Watch plugins
    watchPlugins: [
        'jest-watch-typeahead/filename',
        'jest-watch-typeahead/testname',
    ],

    // Globals for ts-jest
    globals: {
        'ts-jest': {
            tsconfig: {
                jsx: 'react',
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
            },
        },
    },

    // Verbose output
    verbose: true,

    // Timeout
    testTimeout: 10000,

    // Clear mocks between tests
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
};
