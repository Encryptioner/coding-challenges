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

  // Initialize WebContainer
  useEffect(() => {
    async function initWebContainer() {
      const result = await webContainer.boot();
      if (result.success) {
        setIsWebContainerReady(true);
        console.log('✅ WebContainer ready');
      } else {
        console.error('❌ WebContainer failed to boot:', result.error);
      }
    }
    initWebContainer();
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

        // Execute via WebContainer
        if (!isWebContainerReady) {
          xterm.writeln('⚠️  WebContainer is still booting...');
          xterm.write('$ ');
          return;
        }

        const result = await webContainer.spawn(cmd, args);

        if (result.success && result.process) {
          const process = result.process;

          // Stream output
          process.output.pipeTo(
            new WritableStream({
              write(data) {
                xterm.write(data);
              },
            })
          );

          // Wait for exit
          const exitCode = await process.exit;

          if (exitCode !== 0) {
            xterm.writeln(`\r\n❌ Process exited with code ${exitCode}`);
          }
        } else {
          xterm.writeln(`❌ Error: ${result.error || 'Command failed'}`);
        }
      } catch (error: any) {
        xterm.writeln(`❌ Error: ${error.message}`);
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

      // Ctrl+C
      if (code === 3) {
        xterm.write('^C\r\n$ ');
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
      <div className="terminal-header px-4 py-2 bg-gray-800 border-b border-gray-700 text-gray-300 text-sm">
        Terminal
      </div>
      <div
        ref={terminalRef}
        className="terminal-content flex-1 p-2"
        style={{ height: '100%' }}
      />
    </div>
  );
}
