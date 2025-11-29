/**
 * Claude Code Panel
 *
 * Agentic coding interface similar to Claude Code CLI
 * Provides natural language coding assistance with tool execution
 */

import { useState, useRef, useEffect } from 'react';
import { ClaudeCodeAgent, createGLMAgent, createAnthropicAgent } from '@/services/claude-agent';
import { useIDEStore } from '@/store/useIDEStore';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  artifacts?: {
    filesCreated?: string[];
    filesModified?: string[];
    filesDeleted?: string[];
    commandsExecuted?: string[];
  };
}

export function ClaudeCodePanel() {
  const { settings } = useIDEStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: '🚀 Claude Code Agent Ready\n\nI can help you code faster with natural language commands:\n\n• "Create a React component for user authentication"\n• "Add error handling to fetchUser function"\n• "Refactor this code to use async/await"\n• "Find all TODO comments in the project"\n• "Create a git commit for recent changes"\n\nJust type what you need, and I\'ll execute the necessary tasks!',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agent, setAgent] = useState<ClaudeCodeAgent | null>(null);
  const [providerType, setProviderType] = useState<'glm' | 'anthropic'>('glm');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize agent when settings change
  useEffect(() => {
    const apiKey = providerType === 'glm'
      ? settings.ai.glmKey
      : settings.ai.anthropicKey;

    if (apiKey) {
      const newAgent = providerType === 'glm'
        ? createGLMAgent(apiKey)
        : createAnthropicAgent(apiKey);
      setAgent(newAgent);
    }
  }, [settings, providerType]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages((prev) => [
      ...prev,
      {
        ...message,
        id: Date.now().toString(),
        timestamp: Date.now(),
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !agent || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);

    // Add user message
    addMessage({
      role: 'user',
      content: userMessage,
    });

    try {
      // Add progress message
      const progressId = Date.now().toString();
      setMessages((prev) => [
        ...prev,
        {
          id: progressId,
          role: 'system',
          content: '⏳ Processing your request...',
          timestamp: Date.now(),
        },
      ]);

      // Execute task with agent
      const result = await agent.executeTask(userMessage, (progress) => {
        // Update progress message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === progressId
              ? { ...msg, content: `⏳ ${progress}` }
              : msg
          )
        );
      });

      // Remove progress message
      setMessages((prev) => prev.filter((msg) => msg.id !== progressId));

      if (result.success) {
        addMessage({
          role: 'assistant',
          content: result.output || 'Task completed successfully!',
          artifacts: result.artifacts,
        });
      } else {
        addMessage({
          role: 'assistant',
          content: `❌ Error: ${result.error}`,
        });
      }
    } catch (error: any) {
      addMessage({
        role: 'assistant',
        content: `❌ Unexpected error: ${error.message}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearHistory = () => {
    agent?.clearHistory();
    setMessages([
      {
        id: '1',
        role: 'system',
        content: '🔄 History cleared. How can I help you?',
        timestamp: Date.now(),
      },
    ]);
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    return (
      <div
        key={message.id}
        className={`message flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`message-content max-w-3xl px-4 py-3 rounded-lg ${
            isUser
              ? 'bg-blue-600 text-white'
              : isSystem
              ? 'bg-gray-700 text-gray-300 italic'
              : 'bg-gray-800 text-gray-100'
          }`}
        >
          <div className="message-header flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold opacity-75">
              {isUser ? '👤 You' : isSystem ? '💡 System' : '🤖 Claude Code'}
            </span>
            <span className="text-xs opacity-50">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="message-text whitespace-pre-wrap">{message.content}</div>

          {message.artifacts && (
            <div className="artifacts mt-3 pt-3 border-t border-gray-700 text-sm">
              {message.artifacts.filesCreated && message.artifacts.filesCreated.length > 0 && (
                <div className="mb-2">
                  <span className="font-semibold text-green-400">📝 Created:</span>
                  <ul className="ml-4 mt-1">
                    {message.artifacts.filesCreated.map((file, idx) => (
                      <li key={idx} className="text-xs text-gray-400">
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {message.artifacts.filesModified && message.artifacts.filesModified.length > 0 && (
                <div className="mb-2">
                  <span className="font-semibold text-yellow-400">✏️ Modified:</span>
                  <ul className="ml-4 mt-1">
                    {message.artifacts.filesModified.map((file, idx) => (
                      <li key={idx} className="text-xs text-gray-400">
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {message.artifacts.commandsExecuted && message.artifacts.commandsExecuted.length > 0 && (
                <div>
                  <span className="font-semibold text-blue-400">⚡ Executed:</span>
                  <ul className="ml-4 mt-1">
                    {message.artifacts.commandsExecuted.map((cmd, idx) => (
                      <li key={idx} className="text-xs text-gray-400 font-mono">
                        {cmd}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const apiKey = providerType === 'glm' ? settings.ai.glmKey : settings.ai.anthropicKey;
  const isConfigured = !!apiKey;

  if (!isConfigured) {
    return (
      <div className="claude-code-panel flex flex-col h-full bg-gray-900">
        <div className="panel-header px-4 py-3 bg-gray-800 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-100">🤖 Claude Code Agent</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🔑</div>
            <h3 className="text-xl font-semibold text-gray-100 mb-2">
              API Key Required
            </h3>
            <p className="text-gray-400 mb-4">
              Configure your {providerType === 'glm' ? 'GLM-4.6' : 'Anthropic'} API key in
              settings to use Claude Code Agent.
            </p>
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              onClick={() => {
                // Open settings dialog
                // This would be triggered via parent component
              }}
            >
              Open Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="claude-code-panel flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="panel-header px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-100">🤖 Claude Code Agent</h2>
        <div className="flex items-center gap-3">
          {/* Provider selector */}
          <select
            value={providerType}
            onChange={(e) => setProviderType(e.target.value as 'glm' | 'anthropic')}
            className="text-xs px-2 py-1 bg-gray-700 text-gray-100 border border-gray-600 rounded"
            disabled={isProcessing}
          >
            <option value="glm">GLM-4.6 (Z.AI)</option>
            <option value="anthropic">Claude (Anthropic)</option>
          </select>

          {/* Clear button */}
          <button
            onClick={clearHistory}
            disabled={isProcessing}
            className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded disabled:opacity-50"
            title="Clear conversation history"
          >
            🔄 Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container flex-1 overflow-y-auto p-4">
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="input-container p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What would you like me to do? (e.g., 'Create a login component')"
            className="flex-1 px-4 py-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? '⏳' : '➤'}
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          💡 Tip: Be specific! Try "Add error handling to the fetchUser function in src/api/user.ts"
        </div>
      </form>
    </div>
  );
}
