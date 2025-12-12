import { useState } from 'react';
import { aiService } from '../services/ai';
import { useStore } from '../store/useStore';

export function AIAssistant({ onClose }) {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useStore();
  
  async function handleSend() {
    if (!message.trim()) return;
    if (!settings.anthropicKey) {
      alert('Please set Anthropic API key in settings');
      return;
    }
    
    setIsLoading(true);
    aiService.setApiKey(settings.anthropicKey);
    const result = await aiService.chat(message);
    
    if (result.success) {
      setResponse(result.content);
    } else {
      setResponse('Error: ' + result.error);
    }
    setIsLoading(false);
  }
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal large" onClick={(e) => e.stopPropagation()}>
        <h2>🤖 AI Assistant</h2>
        <div className="ai-chat">
          <div className="ai-response">
            {response || 'Ask me anything about your code...'}
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your question..."
            rows={4}
          />
        </div>
        <div className="modal-actions">
          <button onClick={handleSend} disabled={isLoading}>
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
