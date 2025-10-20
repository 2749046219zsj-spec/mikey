import { ApiResponse } from '../types/chat';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = 'https://api.poe.com/v1/chat/completions';

export class GeminiApiService {
  // 检测是否是绘图请求
  private isDrawingRequest(text: string): boolean {
    const drawingKeywords = [
      '画', '绘', '生成', '创作', 'draw', 'generate', 'create',
      '图片', '图像', 'image', 'picture', 'photo',
      '一张', '一个', '一幅'
    ];

    return drawingKeywords.some(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }
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

  async sendMessage(text: string, images: File[] = [], model: string = 'Gemini-2.5-Flash-Image', conversationHistory: any[] = []): Promise<string> {
    try {
      const content = [];

      // 检测是否是绘图请求
      const isDrawingRequest = this.isDrawingRequest(text);

      // Add text content
      if (text.trim()) {
        // 如果是绘图请求，加强提示
        let finalText = text;
        if (isDrawingRequest && model.toLowerCase().includes('image')) {
          finalText = `${text}\n\n重要：请必须生成一张图片。`;
        }

        content.push({
          type: "text",
          text: finalText
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

      // Build messages array with conversation history
      const messages = [
        ...conversationHistory,
        {
          role: "user",
          content: content
        }
      ];

      console.log('发送请求:', {
        model,
        messageCount: messages.length,
        isDrawingRequest,
        userText: text
      });

      const requestBody = {
        model: model,
        messages: messages
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
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        if (errorText.trim()) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorMessage;
          } catch {
            errorMessage = `${errorMessage} - Response: ${errorText}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      
      if (!responseText.trim()) {
        throw new Error('Empty response received from API');
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response generated');
      }

      const responseContent = data.choices[0].message.content;

      console.log('收到响应:', {
        contentLength: responseContent.length,
        hasImageUrl: responseContent.includes('poecdn.net'),
        preview: responseContent.substring(0, 200)
      });

      return responseContent;
    } catch (error) {
      console.error('Poe API Error:', error);
      throw error;
    }
  }
}