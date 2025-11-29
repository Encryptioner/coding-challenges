import { useEffect, useRef } from 'react';

export function Terminal() {
  const terminalRef = useRef(null);
  
  return (
    <div className="terminal" ref={terminalRef}>
      <div className="terminal-header">
        <span>Terminal</span>
      </div>
      <div className="terminal-content">
        <div className="terminal-line">$ Ready to execute commands...</div>
        <div className="terminal-line hint">Use WebContainer API for npm commands</div>
      </div>
    </div>
  );
}
