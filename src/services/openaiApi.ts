const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class OpenAIService {
  private apiKey: string;

  constructor() {
    this.apiKey = OPENAI_API_KEY;
    if (!this.apiKey || this.apiKey === 'your_openai_api_key_here') {
      console.warn('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in .env file');
    }
  }

  async sendMessage(
    text: string,
    conversationHistory: OpenAIMessage[] = []
  ): Promise<string> {
    if (!this.apiKey || this.apiKey === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in .env file');
    }

    const systemMessage: OpenAIMessage = {
      role: 'system',
      content: '你是一个专业的客服助手。请保持友好、专业的态度，耐心解答用户的问题。对于之前对话中提到的内容，你可以记住并在后续回答中引用。'
    };

    const messages: OpenAIMessage[] = [
      systemMessage,
      ...conversationHistory,
      {
        role: 'user',
        content: text
      }
    ];

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from OpenAI API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to communicate with OpenAI API');
    }
  }
}
