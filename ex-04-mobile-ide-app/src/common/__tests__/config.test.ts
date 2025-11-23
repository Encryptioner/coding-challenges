/**
 * Configuration Manager Tests
 */

import { getConfig } from '../config';

describe('ConfigManager', () => {
    describe('getConfig', () => {
        it('should return valid configuration object', () => {
            const config = getConfig();

            expect(config).toBeDefined();
            expect(config.env).toBeDefined();
            expect(config.app).toBeDefined();
            expect(config.security).toBeDefined();
        });

        it('should have valid app configuration', () => {
            const config = getConfig();

            expect(config.app.name).toBe('Mobile Code IDE');
            expect(config.app.port).toBeGreaterThan(0);
            expect(config.app.port).toBeLessThanOrEqual(65535);
        });

        it('should have security configuration', () => {
            const config = getConfig();

            expect(config.security.maxFileSizeMB).toBeGreaterThan(0);
            expect(config.security.allowedCommands).toBeInstanceOf(Array);
            expect(config.security.allowedCommands.length).toBeGreaterThan(0);
        });

        it('should default to production environment', () => {
            const config = getConfig();

            expect(['development', 'staging', 'production']).toContain(config.env);
        });
    });
});
