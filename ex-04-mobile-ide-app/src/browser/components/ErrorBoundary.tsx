/**
 * React Error Boundary for Production
 * Catches and handles React component errors gracefully
 */

import * as React from 'react';
import styled from 'styled-components';
import { logger } from '../../common/logger';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

const ErrorContainer = styled.div`
    padding: 24px;
    background: var(--theia-editor-background, #1e1e1e);
    color: var(--theia-foreground, #cccccc);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
`;

const ErrorIcon = styled.div`
    font-size: 48px;
    margin-bottom: 16px;
`;

const ErrorTitle = styled.h1`
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--theia-errorForeground, #f48771);
`;

const ErrorMessage = styled.p`
    font-size: 16px;
    line-height: 1.6;
    margin-bottom: 24px;
    max-width: 600px;
    color: var(--theia-foreground, #cccccc);
    opacity: 0.9;
`;

const ErrorDetails = styled.details`
    margin-top: 24px;
    max-width: 800px;
    width: 100%;
    text-align: left;
    background: var(--theia-editor-background, #252526);
    border: 1px solid var(--theia-border, #3e3e3e);
    border-radius: 4px;
    padding: 16px;

    summary {
        cursor: pointer;
        font-weight: 600;
        margin-bottom: 12px;
        user-select: none;
        color: var(--theia-textLink-foreground, #3794ff);

        &:hover {
            text-decoration: underline;
        }
    }
`;

const ErrorStack = styled.pre`
    background: var(--theia-editor-background, #1e1e1e);
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 12px;
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    color: var(--theia-foreground, #cccccc);
    border: 1px solid var(--theia-border, #3e3e3e);
`;

const ActionButton = styled.button`
    background: var(--theia-button-background, #0e639c);
    color: var(--theia-button-foreground, #ffffff);
    border: none;
    border-radius: 4px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: var(--theia-button-hoverBackground, #1177bb);
    }

    &:active {
        background: var(--theia-button-hoverBackground, #0d5a8f);
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 12px;
    margin-top: 24px;
`;

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log error
        logger.error('React component error caught by boundary', {
            error: error.message,
            componentStack: errorInfo.componentStack,
        }, error);

        // Update state
        this.setState({
            error,
            errorInfo,
        });

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Send to error tracking service
        this.reportError(error, errorInfo);
    }

    private reportError(error: Error, errorInfo: React.ErrorInfo): void {
        // Integration with error tracking service (Sentry, etc.)
        try {
            // Sentry.captureException(error, {
            //     contexts: {
            //         react: {
            //             componentStack: errorInfo.componentStack,
            //         },
            //     },
            // });
        } catch (reportError) {
            logger.error('Failed to report error', reportError as Error);
        }
    }

    private handleReload = (): void => {
        window.location.reload();
    };

    private handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    private handleReportIssue = (): void {
        const { error, errorInfo } = this.state;

        const issueBody = encodeURIComponent(
            `## Error Report\n\n` +
            `**Error:** ${error?.message}\n\n` +
            `**Stack Trace:**\n\`\`\`\n${error?.stack}\n\`\`\`\n\n` +
            `**Component Stack:**\n\`\`\`\n${errorInfo?.componentStack}\n\`\`\`\n\n` +
            `**User Agent:** ${navigator.userAgent}\n` +
            `**Timestamp:** ${new Date().toISOString()}\n`
        );

        const issueUrl = `https://github.com/Encryptioner/acmp-4.0-for-engineers/issues/new?title=${encodeURIComponent('Error: ' + (error?.message || 'Unknown error'))}&body=${issueBody}`;

        window.open(issueUrl, '_blank');
    };

    render(): React.ReactNode {
        if (this.state.hasError) {
            // Custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            const { error, errorInfo } = this.state;

            return (
                <ErrorContainer>
                    <ErrorIcon>⚠️</ErrorIcon>
                    <ErrorTitle>Oops! Something went wrong</ErrorTitle>
                    <ErrorMessage>
                        An unexpected error occurred in the application. We apologize for the inconvenience.
                        You can try reloading the page or resetting the component.
                    </ErrorMessage>

                    <ButtonGroup>
                        <ActionButton onClick={this.handleReset}>
                            Try Again
                        </ActionButton>
                        <ActionButton onClick={this.handleReload}>
                            Reload Page
                        </ActionButton>
                        <ActionButton onClick={this.handleReportIssue}>
                            Report Issue
                        </ActionButton>
                    </ButtonGroup>

                    {error && (
                        <ErrorDetails>
                            <summary>Error Details (for debugging)</summary>
                            <div>
                                <strong>Error:</strong> {error.toString()}
                            </div>
                            {error.stack && (
                                <div style={{ marginTop: '12px' }}>
                                    <strong>Stack Trace:</strong>
                                    <ErrorStack>{error.stack}</ErrorStack>
                                </div>
                            )}
                            {errorInfo?.componentStack && (
                                <div style={{ marginTop: '12px' }}>
                                    <strong>Component Stack:</strong>
                                    <ErrorStack>{errorInfo.componentStack}</ErrorStack>
                                </div>
                            )}
                        </ErrorDetails>
                    )}
                </ErrorContainer>
            );
        }

        return this.props.children;
    }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: React.ReactNode
): React.FC<P> {
    return (props: P) => (
        <ErrorBoundary fallback={fallback}>
            <Component {...props} />
        </ErrorBoundary>
    );
}
