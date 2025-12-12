class AIService {
  constructor() {
    this.apiKey = null;
    this.baseUrl = 'https://api.anthropic.com/v1/messages';
    this.model = 'claude-sonnet-4-20250514';
    this.conversationHistory = [];
  }
  
  setApiKey(key) {
    this.apiKey = key;
  }
  
  async complete(prompt, options = {}) {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Anthropic API key not set. Please add it in settings.'
      };
    }
    
    const {
      systemPrompt = 'You are a helpful AI coding assistant integrated into a browser-based IDE. Help the user with their code.',
      maxTokens = 4000,
      temperature = 1.0,
      includeHistory = false
    } = options;
    
    try {
      const messages = includeHistory
        ? [...this.conversationHistory, { role: 'user', content: prompt }]
        : [{ role: 'user', content: prompt }];
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }
      
      const data = await response.json();
      const content = data.content[0].text;
      
      // Update conversation history if requested
      if (includeHistory) {
        this.conversationHistory.push({ role: 'user', content: prompt });
        this.conversationHistory.push({ role: 'assistant', content });
        
        // Keep only last 10 messages to avoid token limits
        if (this.conversationHistory.length > 10) {
          this.conversationHistory = this.conversationHistory.slice(-10);
        }
      }
      
      return {
        success: true,
        content,
        usage: data.usage
      };
    } catch (error) {
      console.error('AI completion error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async explainCode(code, language = 'javascript') {
    const prompt = `Please explain the following ${language} code in simple terms:

\`\`\`${language}
${code}
\`\`\`

Provide a clear explanation of what this code does, its purpose, and any important details.`;
    
    return this.complete(prompt);
  }
  
  async fixCode(code, error, language = 'javascript') {
    const prompt = `The following ${language} code has an error:

\`\`\`${language}
${code}
\`\`\`

Error message:
${error}

Please:
1. Identify the problem
2. Explain what's wrong
3. Provide the corrected code

Return only the fixed code in a code block.`;
    
    return this.complete(prompt);
  }
  
  async improveCode(code, language = 'javascript') {
    const prompt = `Please review and improve the following ${language} code:

\`\`\`${language}
${code}
\`\`\`

Suggest improvements for:
- Code quality and readability
- Performance optimization
- Best practices
- Potential bugs

Provide the improved version with explanations.`;
    
    return this.complete(prompt);
  }
  
  async generateCode(description, language = 'javascript') {
    const prompt = `Generate ${language} code for the following requirement:

${description}

Provide clean, well-commented code that follows best practices.`;
    
    return this.complete(prompt);
  }
  
  async addComments(code, language = 'javascript') {
    const prompt = `Add helpful comments to this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Add comments that explain:
- What the code does
- Complex logic
- Function parameters and return values

Return only the commented code.`;
    
    return this.complete(prompt);
  }
  
  async writeTests(code, language = 'javascript') {
    const prompt = `Write unit tests for this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Generate comprehensive test cases that cover:
- Normal cases
- Edge cases
- Error handling

Use appropriate testing framework for ${language}.`;
    
    return this.complete(prompt);
  }
  
  async chat(message) {
    return this.complete(message, {
      includeHistory: true,
      systemPrompt: 'You are a helpful AI coding assistant. Provide concise, practical coding advice.'
    });
  }
  
  clearHistory() {
    this.conversationHistory = [];
  }
  
  getHistory() {
    return this.conversationHistory;
  }
}

export const aiService = new AIService();
