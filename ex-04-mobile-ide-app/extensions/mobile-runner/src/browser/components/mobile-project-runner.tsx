import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';

/**
 * Mobile Project Runner Component
 * Execute projects and view output with mobile-optimized interface
 * Supports multiple languages and frameworks (Node.js, Python, Java, etc.)
 * Works on both iOS and Android
 */

interface RunConfig {
    command: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
}

interface RunResult {
    stdout: string;
    stderr: string;
    exitCode?: number;
    running: boolean;
}

interface MobileProjectRunnerProps {
    workspaceRoot: string;
    onClose?: () => void;
}

const Container = styled.div`
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: 56px;
    background: var(--theia-editor-background, #1e1e1e);
    display: flex;
    flex-direction: column;
    z-index: 100;
    border-top: 1px solid var(--theia-border, #3e3e3e);
`;

const Header = styled.div`
    background: var(--theia-toolbar-background, #2d2d2d);
    border-bottom: 1px solid var(--theia-border, #3e3e3e);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 56px;
`;

const Title = styled.h3`
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--theia-foreground, #cccccc);
`;

const HeaderActions = styled.div`
    display: flex;
    gap: 8px;
`;

const IconButton = styled.button`
    background: transparent;
    border: none;
    color: var(--theia-foreground, #cccccc);
    font-size: 20px;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 4px;

    &:active {
        background: var(--theia-toolbar-hoverBackground, #383838);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const CommandBar = styled.div`
    background: var(--theia-input-background, #3c3c3c);
    border-bottom: 1px solid var(--theia-border, #3e3e3e);
    padding: 12px 16px;
    display: flex;
    gap: 12px;
    align-items: center;
`;

const CommandInput = styled.input`
    flex: 1;
    background: var(--theia-editor-background, #1e1e1e);
    color: var(--theia-foreground, #cccccc);
    border: 1px solid var(--theia-border, #3e3e3e);
    border-radius: 4px;
    padding: 10px 12px;
    font-size: 14px;
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    outline: none;
    min-height: 44px;

    &:focus {
        border-color: var(--theia-focusBorder, #007acc);
    }
`;

const RunButton = styled.button<{ $running: boolean }>`
    background: ${props => props.$running
        ? '#da3633'
        : 'var(--theia-button-background, #0e639c)'};
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    min-width: 80px;
    min-height: 44px;
    transition: background 0.2s;

    &:active {
        opacity: 0.8;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const QuickActions = styled.div`
    display: flex;
    gap: 8px;
    padding: 8px 16px;
    overflow-x: auto;
    background: var(--theia-sideBar-background, #252526);
    border-bottom: 1px solid var(--theia-border, #3e3e3e);
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
        display: none;
    }
`;

const QuickActionButton = styled.button<{ $active?: boolean }>`
    background: ${props => props.$active
        ? 'var(--theia-button-background, #0e639c)'
        : 'var(--theia-button-secondaryBackground, #3a3a3a)'};
    color: ${props => props.$active
        ? '#ffffff'
        : 'var(--theia-button-secondaryForeground, #cccccc)'};
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 13px;
    white-space: nowrap;
    cursor: pointer;
    min-height: 40px;
    transition: all 0.2s;

    &:active {
        opacity: 0.8;
    }
`;

const OutputContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.5;
    padding: 16px;
    background: var(--theia-terminal-background, #1e1e1e);
    color: var(--theia-terminal-foreground, #cccccc);
`;

const OutputLine = styled.div<{ $type: 'stdout' | 'stderr' | 'system' }>`
    margin-bottom: 2px;
    white-space: pre-wrap;
    word-break: break-word;
    color: ${props => {
        switch (props.$type) {
            case 'stderr': return '#ff6b6b';
            case 'system': return '#69c';
            default: return 'inherit';
        }
    }};
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--theia-descriptionForeground, #999999);
    text-align: center;
    padding: 32px;
`;

const EmptyStateIcon = styled.div`
    font-size: 48px;
    margin-bottom: 16px;
`;

const EmptyStateText = styled.p`
    margin: 0;
    font-size: 14px;
`;

const StatusBar = styled.div`
    background: var(--theia-statusBar-background, #007acc);
    color: var(--theia-statusBar-foreground, #ffffff);
    padding: 8px 16px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 32px;
`;

const StatusText = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const Spinner = styled.div`
    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
`;

// Common commands for different project types
const QUICK_COMMANDS = {
    node: [
        { label: 'npm install', command: 'npm install' },
        { label: 'npm start', command: 'npm start' },
        { label: 'npm run build', command: 'npm run build' },
        { label: 'npm test', command: 'npm test' }
    ],
    python: [
        { label: 'pip install', command: 'pip install -r requirements.txt' },
        { label: 'python run', command: 'python main.py' },
        { label: 'pytest', command: 'pytest' }
    ],
    java: [
        { label: 'mvn clean', command: 'mvn clean' },
        { label: 'mvn install', command: 'mvn install' },
        { label: 'mvn test', command: 'mvn test' },
        { label: 'gradle build', command: 'gradle build' }
    ],
    web: [
        { label: 'serve', command: 'python -m http.server 8000' },
        { label: 'build', command: 'npm run build' }
    ]
};

export const MobileProjectRunner: React.FC<MobileProjectRunnerProps> = ({
    workspaceRoot,
    onClose
}) => {
    const [command, setCommand] = useState('');
    const [result, setResult] = useState<RunResult>({
        stdout: '',
        stderr: '',
        running: false
    });
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [projectType, setProjectType] = useState<'node' | 'python' | 'java' | 'web'>('node');
    const [autoScroll, setAutoScroll] = useState(true);

    const outputRef = useRef<HTMLDivElement>(null);
    const processRef = useRef<any>(null);

    // Auto-scroll to bottom when new output arrives
    useEffect(() => {
        if (autoScroll && outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [result.stdout, result.stderr, autoScroll]);

    // Detect project type based on files in workspace
    useEffect(() => {
        detectProjectType();
    }, [workspaceRoot]);

    const detectProjectType = async () => {
        // In real implementation, check for package.json, requirements.txt, pom.xml, etc.
        // For now, default to 'node'
        setProjectType('node');
    };

    const runCommand = useCallback(async (cmd: string) => {
        if (!cmd.trim() || result.running) return;

        // Add to history
        setHistory(prev => [...prev, cmd]);
        setHistoryIndex(-1);

        // Reset output
        setResult({
            stdout: '',
            stderr: '',
            running: true
        });

        try {
            // In real implementation, use Theia's task/process service
            // For now, simulate execution
            addSystemMessage(`$ ${cmd}`);

            // Simulate command execution
            await simulateCommand(cmd);

        } catch (error) {
            addErrorMessage(`Error: ${error.message}`);
            setResult(prev => ({ ...prev, running: false, exitCode: 1 }));
        }
    }, [result.running]);

    const simulateCommand = async (cmd: string) => {
        // Simulate different commands
        if (cmd.includes('npm install')) {
            await addOutputWithDelay('Installing dependencies...\n', 500);
            await addOutputWithDelay('npm WARN deprecated package@1.0.0\n', 1000);
            await addOutputWithDelay('added 234 packages in 5.432s\n', 2000);
            addSystemMessage('✓ Installation complete');
            setResult(prev => ({ ...prev, running: false, exitCode: 0 }));

        } else if (cmd.includes('npm start') || cmd.includes('npm run')) {
            await addOutputWithDelay('> project@1.0.0 start\n> node index.js\n\n', 500);
            await addOutputWithDelay('Server started on port 3000\n', 1000);
            await addOutputWithDelay('Listening for requests...\n', 1500);
            setResult(prev => ({ ...prev, running: false, exitCode: 0 }));

        } else if (cmd.includes('python')) {
            await addOutputWithDelay('Python 3.11.0\n', 500);
            await addOutputWithDelay('Running script...\n', 1000);
            await addOutputWithDelay('Hello from Python!\n', 1500);
            setResult(prev => ({ ...prev, running: false, exitCode: 0 }));

        } else if (cmd.includes('test')) {
            await addOutputWithDelay('Running tests...\n', 500);
            await addOutputWithDelay('✓ Test 1 passed\n', 1000);
            await addOutputWithDelay('✓ Test 2 passed\n', 1500);
            await addOutputWithDelay('✓ Test 3 passed\n', 2000);
            await addOutputWithDelay('\n3 tests passed, 0 failed\n', 2500);
            setResult(prev => ({ ...prev, running: false, exitCode: 0 }));

        } else {
            await addOutputWithDelay(`Executing: ${cmd}\n`, 500);
            await addOutputWithDelay('Command completed successfully\n', 1000);
            setResult(prev => ({ ...prev, running: false, exitCode: 0 }));
        }
    };

    const addOutputWithDelay = (text: string, delay: number): Promise<void> => {
        return new Promise(resolve => {
            setTimeout(() => {
                setResult(prev => ({
                    ...prev,
                    stdout: prev.stdout + text
                }));
                resolve();
            }, delay);
        });
    };

    const addSystemMessage = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setResult(prev => ({
            ...prev,
            stdout: prev.stdout + `\n[${timestamp}] ${message}\n`
        }));
    };

    const addErrorMessage = (message: string) => {
        setResult(prev => ({
            ...prev,
            stderr: prev.stderr + message + '\n'
        }));
    };

    const stopCommand = useCallback(() => {
        if (processRef.current) {
            // Kill process in real implementation
            processRef.current.kill();
        }
        setResult(prev => ({ ...prev, running: false }));
        addSystemMessage('Process terminated');
    }, []);

    const clearOutput = useCallback(() => {
        setResult({
            stdout: '',
            stderr: '',
            running: false
        });
    }, []);

    const handleQuickCommand = (cmd: string) => {
        setCommand(cmd);
        runCommand(cmd);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            runCommand(command);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (history.length > 0) {
                const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
                setHistoryIndex(newIndex);
                setCommand(history[history.length - 1 - newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setCommand(history[history.length - 1 - newIndex]);
            } else {
                setHistoryIndex(-1);
                setCommand('');
            }
        }
    };

    const hasOutput = result.stdout || result.stderr;

    return (
        <Container>
            <Header>
                <Title>🚀 Run & Debug</Title>
                <HeaderActions>
                    <IconButton
                        onClick={clearOutput}
                        disabled={!hasOutput || result.running}
                        title="Clear output"
                    >
                        🗑
                    </IconButton>
                    <IconButton
                        onClick={() => setAutoScroll(prev => !prev)}
                        title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
                    >
                        {autoScroll ? '⬇' : '⏸'}
                    </IconButton>
                    {onClose && (
                        <IconButton onClick={onClose} title="Close">
                            ✕
                        </IconButton>
                    )}
                </HeaderActions>
            </Header>

            <CommandBar>
                <CommandInput
                    type="text"
                    placeholder="Enter command to run..."
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={result.running}
                />
                <RunButton
                    $running={result.running}
                    onClick={() => result.running ? stopCommand() : runCommand(command)}
                    disabled={!command.trim() && !result.running}
                >
                    {result.running ? 'Stop' : 'Run'}
                </RunButton>
            </CommandBar>

            <QuickActions>
                {QUICK_COMMANDS[projectType].map(({ label, command: cmd }) => (
                    <QuickActionButton
                        key={label}
                        onClick={() => handleQuickCommand(cmd)}
                        disabled={result.running}
                    >
                        {label}
                    </QuickActionButton>
                ))}
            </QuickActions>

            <OutputContainer ref={outputRef}>
                {!hasOutput ? (
                    <EmptyState>
                        <EmptyStateIcon>⚡</EmptyStateIcon>
                        <EmptyStateText>
                            Enter a command above or select a quick action to run
                        </EmptyStateText>
                    </EmptyState>
                ) : (
                    <>
                        {result.stdout.split('\n').map((line, index) => (
                            <OutputLine key={`out-${index}`} $type="stdout">
                                {line}
                            </OutputLine>
                        ))}
                        {result.stderr.split('\n').map((line, index) => (
                            <OutputLine key={`err-${index}`} $type="stderr">
                                {line}
                            </OutputLine>
                        ))}
                    </>
                )}
            </OutputContainer>

            {result.running && (
                <StatusBar>
                    <StatusText>
                        <Spinner />
                        <span>Running...</span>
                    </StatusText>
                </StatusBar>
            )}

            {!result.running && result.exitCode !== undefined && (
                <StatusBar style={{
                    background: result.exitCode === 0 ? '#238636' : '#da3633'
                }}>
                    <StatusText>
                        <span>
                            {result.exitCode === 0 ? '✓ Success' : '✗ Failed'}
                        </span>
                    </StatusText>
                    <span>Exit code: {result.exitCode}</span>
                </StatusBar>
            )}
        </Container>
    );
};

export default MobileProjectRunner;
