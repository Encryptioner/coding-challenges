import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { webContainer } from '@/services/webcontainer';
import '@xterm/xterm/css/xterm.css';

export function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isWebContainerReady, setIsWebContainerReady] = useState(false);
  const [bootStatus, setBootStatus] = useState<'booting' | 'ready' | 'error'>('booting');
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const currentProcessRef = useRef<string | null>(null);

  // Initialize WebContainer
  useEffect(() => {
    let cancelled = false;

    async function initWebContainer() {
      // Check if already booted (prevents React 18 StrictMode double-boot)
      if (webContainer.isBooted()) {
        if (!cancelled) {
          setIsWebContainerReady(true);
          setBootStatus('ready');
        }
        return;
      }

      setBootStatus('booting');
      const result = await webContainer.boot();

      if (!cancelled) {
        if (result.success) {
          setIsWebContainerReady(true);
          setBootStatus('ready');
          console.log('✅ WebContainer ready');
        } else {
          setBootStatus('error');
          console.error('❌ WebContainer failed to boot:', result.error);
        }
      }
    }

    initWebContainer();

    return () => {
      cancelled = true;
      // Cleanup any running processes
      if (currentProcessRef.current) {
        webContainer.killProcess(currentProcessRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    // Create terminal instance
    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, Monaco, monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',
      },
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);

    // Open terminal
    xterm.open(terminalRef.current);

    // Fit after a short delay to ensure DOM is ready
    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (err) {
        console.warn('Terminal fit failed, will retry on resize:', err);
      }
    }, 100);

    // Write welcome message
    xterm.writeln('Browser IDE Terminal');
    xterm.writeln('');
    xterm.writeln('WebContainer VM Ready');
    xterm.writeln('Supports: npm, pnpm, node, git, and bash commands');
    xterm.writeln('');
    xterm.write('$ ');

    let currentLine = '';

    // Execute command
    async function executeCommand(command: string) {
      if (!command.trim()) {
        xterm.write('\r\n$ ');
        return;
      }

      // Add to command history
      commandHistoryRef.current.push(command.trim());
      historyIndexRef.current = commandHistoryRef.current.length;

      xterm.write('\r\n');

      // Parse command
      const parts = command.trim().split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1);

      try {
        // Special handling for 'clear'
        if (cmd === 'clear') {
          xterm.clear();
          xterm.write('$ ');
          return;
        }

        // Special handling for 'help'
        if (cmd === 'help') {
          xterm.writeln('Available commands:');
          xterm.writeln('  clear    - Clear terminal');
          xterm.writeln('  help     - Show this help');
          xterm.writeln('  node     - Run Node.js');
          xterm.writeln('  npm      - Node package manager');
          xterm.writeln('  pnpm     - Fast npm alternative');
          xterm.writeln('  git      - Git version control');
          xterm.writeln('');
          xterm.writeln('Use ↑/↓ arrows to navigate command history');
          xterm.writeln('Use Ctrl+C to cancel running command');
          xterm.write('\r\n$ ');
          return;
        }

        // Execute via WebContainer
        if (!isWebContainerReady) {
          xterm.writeln('⚠️  WebContainer is still booting...');
          xterm.write('$ ');
          return;
        }

        const result = await webContainer.spawn(cmd, args);

        if (result.success && result.process && result.processId) {
          const process = result.process;
          currentProcessRef.current = result.processId;

          // Create abort controller for timeout
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => {
            abortController.abort();
            xterm.writeln('\r\n⚠️  Command timeout after 5 minutes');
            if (currentProcessRef.current) {
              webContainer.killProcess(currentProcessRef.current);
              currentProcessRef.current = null;
            }
          }, 300000); // 5 minute timeout

          try {
            // Stream output with better buffering
            const outputReader = process.output.getReader();
            const decoder = new TextDecoder();

            while (!abortController.signal.aborted) {
              const { done, value } = await outputReader.read();
              if (done) break;

              // value is already a string from WebContainer
              if (typeof value === 'string') {
                xterm.write(value);
              } else {
                // If it's a Uint8Array, decode it
                const text = decoder.decode(value, { stream: true });
                xterm.write(text);
              }
            }

            // Wait for exit
            const exitCode = await process.exit;
            clearTimeout(timeoutId);
            currentProcessRef.current = null;

            if (exitCode !== 0) {
              xterm.writeln(`\r\n❌ Process exited with code ${exitCode}`);
            }
          } catch (streamError: any) {
            clearTimeout(timeoutId);
            currentProcessRef.current = null;
            if (streamError.name !== 'AbortError') {
              xterm.writeln(`\r\n❌ Stream error: ${streamError.message}`);
            }
          }
        } else {
          xterm.writeln(`❌ Error: ${result.error || 'Command failed'}`);
        }
      } catch (error: any) {
        xterm.writeln(`❌ Error: ${error.message}`);
        if (currentProcessRef.current) {
          webContainer.killProcess(currentProcessRef.current);
          currentProcessRef.current = null;
        }
      }

      xterm.write('\r\n$ ');
    }

    // Handle input
    xterm.onData((data) => {
      const code = data.charCodeAt(0);

      // Enter key
      if (code === 13) {
        executeCommand(currentLine);
        currentLine = '';
        return;
      }

      // Backspace
      if (code === 127) {
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          xterm.write('\b \b');
        }
        return;
      }

      // Ctrl+C - Cancel current command
      if (code === 3) {
        if (currentProcessRef.current) {
          webContainer.killProcess(currentProcessRef.current);
          currentProcessRef.current = null;
          xterm.writeln('^C');
        }
        xterm.write('\r\n$ ');
        currentLine = '';
        return;
      }

      // Ctrl+L (clear)
      if (code === 12) {
        xterm.clear();
        xterm.write('$ ');
        currentLine = '';
        return;
      }

      // Arrow keys (ANSI escape sequences)
      if (data === '\x1b[A') {
        // Up arrow - previous command
        if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
          const historyCommand = commandHistoryRef.current[historyIndexRef.current];

          // Clear current line
          xterm.write('\r\x1b[K$ ');
          currentLine = historyCommand;
          xterm.write(historyCommand);
        }
        return;
      }

      if (data === '\x1b[B') {
        // Down arrow - next command
        if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
          historyIndexRef.current++;
          const historyCommand = commandHistoryRef.current[historyIndexRef.current];

          // Clear current line
          xterm.write('\r\x1b[K$ ');
          currentLine = historyCommand;
          xterm.write(historyCommand);
        } else if (historyIndexRef.current === commandHistoryRef.current.length - 1) {
          // At end of history, clear line
          historyIndexRef.current = commandHistoryRef.current.length;
          xterm.write('\r\x1b[K$ ');
          currentLine = '';
        }
        return;
      }

      // Regular character
      if (code >= 32) {
        currentLine += data;
        xterm.write(data);
      }
    });

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Fit on resize
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current && terminalRef.current) {
        try {
          // Only fit if terminal has dimensions
          const rect = terminalRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            fitAddonRef.current.fit();
          }
        } catch (err) {
          // Ignore fit errors during resize
        }
      }
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      xterm.dispose();
    };
  }, []);

  return (
    <div className="terminal flex flex-col h-full bg-gray-900">
      <div className="terminal-header px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <span className="text-gray-300 text-sm">Terminal</span>
        <div className="flex items-center gap-2">
          {bootStatus === 'booting' && (
            <div className="flex items-center gap-2 text-xs text-yellow-400">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span>Booting WebContainer...</span>
            </div>
          )}
          {bootStatus === 'ready' && (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>Ready</span>
            </div>
          )}
          {bootStatus === 'error' && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <span>Boot Failed</span>
            </div>
          )}
        </div>
      </div>
      <div
        ref={terminalRef}
        className="terminal-content flex-1 p-2"
        style={{ height: '100%' }}
      />
    </div>
  );
}
