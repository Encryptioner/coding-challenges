/**
 * Performance Monitoring and Analytics
 * Track app performance, user interactions, and errors
 */

import { getConfig } from './config';
import { logger } from './logger';

export interface PerformanceMetric {
    name: string;
    value: number;
    unit: 'ms' | 'bytes' | 'count';
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface UserEvent {
    category: string;
    action: string;
    label?: string;
    value?: number;
    timestamp: number;
    metadata?: Record<string, any>;
}

/**
 * Performance Monitor
 */
export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: PerformanceMetric[] = [];
    private maxMetrics = 1000;
    private observers: Map<string, PerformanceObserver> = new Map();

    private constructor() {
        this.setupPerformanceObservers();
    }

    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    private setupPerformanceObservers(): void {
        const config = getConfig();

        if (!config.features.performanceMonitoring || typeof PerformanceObserver === 'undefined') {
            return;
        }

        try {
            // Observe long tasks (>50ms)
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordMetric({
                        name: 'long_task',
                        value: entry.duration,
                        unit: 'ms',
                        timestamp: Date.now(),
                        metadata: {
                            entryType: entry.entryType,
                            startTime: entry.startTime,
                        },
                    });

                    if (entry.duration > 100) {
                        logger.warn('Long task detected', {
                            duration: entry.duration,
                            name: entry.name,
                        });
                    }
                }
            });

            longTaskObserver.observe({ entryTypes: ['longtask'] });
            this.observers.set('longtask', longTaskObserver);
        } catch (error) {
            logger.debug('Long task observer not supported');
        }

        try {
            // Observe layout shifts
            const layoutShiftObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    const layoutShift = entry as any;
                    if (!layoutShift.hadRecentInput) {
                        this.recordMetric({
                            name: 'layout_shift',
                            value: layoutShift.value,
                            unit: 'count',
                            timestamp: Date.now(),
                        });
                    }
                }
            });

            layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
            this.observers.set('layout-shift', layoutShiftObserver);
        } catch (error) {
            logger.debug('Layout shift observer not supported');
        }

        try {
            // Observe paint timing
            const paintObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordMetric({
                        name: entry.name as string,
                        value: entry.startTime,
                        unit: 'ms',
                        timestamp: Date.now(),
                    });
                }
            });

            paintObserver.observe({ entryTypes: ['paint'] });
            this.observers.set('paint', paintObserver);
        } catch (error) {
            logger.debug('Paint observer not supported');
        }
    }

    /**
     * Record a performance metric
     */
    public recordMetric(metric: PerformanceMetric): void {
        this.metrics.push(metric);

        if (this.metrics.length > this.maxMetrics) {
            this.metrics.shift();
        }

        // Log significant metrics
        if (metric.value > 1000 && metric.unit === 'ms') {
            logger.warn('Slow operation detected', {
                name: metric.name,
                duration: metric.value,
            });
        }

        // Send to analytics if configured
        const config = getConfig();
        if (config.features.analytics) {
            this.sendToAnalytics(metric);
        }
    }

    /**
     * Measure async operation
     */
    public async measure<T>(
        name: string,
        operation: () => Promise<T>,
        metadata?: Record<string, any>
    ): Promise<T> {
        const start = performance.now();

        try {
            const result = await operation();
            const duration = performance.now() - start;

            this.recordMetric({
                name,
                value: duration,
                unit: 'ms',
                timestamp: Date.now(),
                metadata: { ...metadata, success: true },
            });

            return result;
        } catch (error) {
            const duration = performance.now() - start;

            this.recordMetric({
                name,
                value: duration,
                unit: 'ms',
                timestamp: Date.now(),
                metadata: { ...metadata, success: false, error: (error as Error).message },
            });

            throw error;
        }
    }

    /**
     * Measure sync operation
     */
    public measureSync<T>(
        name: string,
        operation: () => T,
        metadata?: Record<string, any>
    ): T {
        const start = performance.now();

        try {
            const result = operation();
            const duration = performance.now() - start;

            this.recordMetric({
                name,
                value: duration,
                unit: 'ms',
                timestamp: Date.now(),
                metadata: { ...metadata, success: true },
            });

            return result;
        } catch (error) {
            const duration = performance.now() - start;

            this.recordMetric({
                name,
                value: duration,
                unit: 'ms',
                timestamp: Date.now(),
                metadata: { ...metadata, success: false, error: (error as Error).message },
            });

            throw error;
        }
    }

    /**
     * Get all metrics
     */
    public getMetrics(): PerformanceMetric[] {
        return [...this.metrics];
    }

    /**
     * Get metrics by name
     */
    public getMetricsByName(name: string): PerformanceMetric[] {
        return this.metrics.filter(m => m.name === name);
    }

    /**
     * Get average metric value
     */
    public getAverageMetric(name: string): number {
        const metrics = this.getMetricsByName(name);
        if (metrics.length === 0) return 0;

        const sum = metrics.reduce((acc, m) => acc + m.value, 0);
        return sum / metrics.length;
    }

    /**
     * Clear all metrics
     */
    public clearMetrics(): void {
        this.metrics = [];
    }

    /**
     * Send metric to analytics service
     */
    private sendToAnalytics(metric: PerformanceMetric): void {
        const config = getConfig();

        if (!config.analytics.id) {
            return;
        }

        try {
            // Integration with Google Analytics, Plausible, or similar
            // window.gtag?.('event', 'performance', {
            //     event_category: 'Performance',
            //     event_label: metric.name,
            //     value: metric.value,
            // });
        } catch (error) {
            logger.debug('Failed to send metric to analytics', { error });
        }
    }

    /**
     * Get Web Vitals
     */
    public getWebVitals(): {
        fcp?: number;
        lcp?: number;
        fid?: number;
        cls?: number;
    } {
        const vitals: any = {};

        // First Contentful Paint
        const fcpEntries = performance.getEntriesByName('first-contentful-paint');
        if (fcpEntries.length > 0) {
            vitals.fcp = fcpEntries[0].startTime;
        }

        // Largest Contentful Paint
        const lcpMetrics = this.getMetricsByName('largest-contentful-paint');
        if (lcpMetrics.length > 0) {
            vitals.lcp = lcpMetrics[lcpMetrics.length - 1].value;
        }

        // Cumulative Layout Shift
        const clsMetrics = this.getMetricsByName('layout_shift');
        if (clsMetrics.length > 0) {
            vitals.cls = clsMetrics.reduce((sum, m) => sum + m.value, 0);
        }

        return vitals;
    }

    /**
     * Cleanup observers
     */
    public dispose(): void {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}

/**
 * Analytics Tracker
 */
export class AnalyticsTracker {
    private static instance: AnalyticsTracker;
    private events: UserEvent[] = [];
    private maxEvents = 1000;
    private sessionId: string;

    private constructor() {
        this.sessionId = this.generateSessionId();
        this.setupAnalytics();
    }

    public static getInstance(): AnalyticsTracker {
        if (!AnalyticsTracker.instance) {
            AnalyticsTracker.instance = new AnalyticsTracker();
        }
        return AnalyticsTracker.instance;
    }

    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private setupAnalytics(): void {
        const config = getConfig();

        if (!config.features.analytics || !config.analytics.id) {
            return;
        }

        try {
            // Setup Google Analytics, Plausible, or similar
            // This is a placeholder for actual analytics setup
        } catch (error) {
            logger.debug('Failed to setup analytics', { error });
        }
    }

    /**
     * Track user event
     */
    public trackEvent(
        category: string,
        action: string,
        label?: string,
        value?: number,
        metadata?: Record<string, any>
    ): void {
        const config = getConfig();

        if (!config.features.analytics) {
            return;
        }

        const event: UserEvent = {
            category,
            action,
            label,
            value,
            timestamp: Date.now(),
            metadata: {
                ...metadata,
                sessionId: this.sessionId,
            },
        };

        this.events.push(event);

        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }

        // Send to analytics service
        this.sendEventToAnalytics(event);

        // Log in debug mode
        logger.debug('User event tracked', event);
    }

    /**
     * Track page view
     */
    public trackPageView(path: string, title?: string): void {
        this.trackEvent('Navigation', 'page_view', path, undefined, { title });
    }

    /**
     * Track user action
     */
    public trackAction(action: string, label?: string, value?: number): void {
        this.trackEvent('User Action', action, label, value);
    }

    /**
     * Track error
     */
    public trackError(error: Error, context?: Record<string, any>): void {
        this.trackEvent('Error', error.name, error.message, undefined, context);
    }

    /**
     * Get all events
     */
    public getEvents(): UserEvent[] {
        return [...this.events];
    }

    /**
     * Clear all events
     */
    public clearEvents(): void {
        this.events = [];
    }

    /**
     * Send event to analytics service
     */
    private sendEventToAnalytics(event: UserEvent): void {
        const config = getConfig();

        if (!config.analytics.id) {
            return;
        }

        try {
            // Integration with analytics service
            // window.gtag?.('event', event.action, {
            //     event_category: event.category,
            //     event_label: event.label,
            //     value: event.value,
            // });
        } catch (error) {
            logger.debug('Failed to send event to analytics', { error });
        }
    }
}

// Export singleton instances
export const performanceMonitor = PerformanceMonitor.getInstance();
export const analyticsTracker = AnalyticsTracker.getInstance();

// Convenience exports
export const recordMetric = (metric: PerformanceMetric) => performanceMonitor.recordMetric(metric);
export const measure = <T>(name: string, operation: () => Promise<T>, metadata?: Record<string, any>) =>
    performanceMonitor.measure(name, operation, metadata);
export const measureSync = <T>(name: string, operation: () => T, metadata?: Record<string, any>) =>
    performanceMonitor.measureSync(name, operation, metadata);

export const trackEvent = (
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
) => analyticsTracker.trackEvent(category, action, label, value, metadata);
export const trackPageView = (path: string, title?: string) => analyticsTracker.trackPageView(path, title);
export const trackAction = (action: string, label?: string, value?: number) =>
    analyticsTracker.trackAction(action, label, value);
