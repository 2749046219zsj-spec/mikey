import { ApiResponse } from '../types/chat';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = '/api/v1/chat/completions';

export class GeminiApiService {
  private async convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async sendMessage(text: string, images: File[] = []): Promise<string> {
    try {
      const content = [];
      
      // Add text content
      if (text.trim()) {
        content.push({
          type: "text",
          text: text
        });
      }

      // Add image content
      for (const image of images) {
        const base64Data = await this.convertImageToBase64(image);
        content.push({
          type: "image_url",
          image_url: {
            url: base64Data
          }
        });
      }

      const requestBody = {
        model: "Gemini-2.5-Flash-Image",
        messages: [
          {
            role: "user",
            content: content
          }
        ]
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response generated');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('Poe API Error:', error);
      throw error;
    }
  }
}