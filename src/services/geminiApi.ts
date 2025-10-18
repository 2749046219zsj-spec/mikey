import { ApiResponse } from '../types/chat';
import { useAuthStore } from '../stores/authStore';
import { creditsService } from './creditsService';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = 'https://api.poe.com/v1/chat/completions';

const CREDITS_COST = 10;

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

  async sendMessage(text: string, images: File[] = [], model: string = 'Gemini-2.5-Flash-Image', conversationHistory: any[] = []): Promise<string> {
    const { user, profile } = useAuthStore.getState();

    if (!user) {
      throw new Error('请先登录后再使用AI功能');
    }

    if (!profile || profile.credits_balance < CREDITS_COST) {
      throw new Error(`积分不足，需要 ${CREDITS_COST} 积分，请先充值`);
    }

    try {
      await creditsService.deductCredits(user.id, CREDITS_COST, 'AI对话生成');
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

      // Build messages array with conversation history
      const messages = [
        ...conversationHistory,
        {
          role: "user",
          content: content
        }
      ];

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

      return data.choices[0].message.content;
    } catch (error: any) {
      if (error.message && !error.message.includes('积分')) {
        try {
          if (user) {
            await creditsService.addCredits(user.id, CREDITS_COST, 'refund', 'API调用失败，退还积分');
          }
        } catch (refundError) {
          console.error('Failed to refund credits:', refundError);
        }
      }
      console.error('Poe API Error:', error);
      throw error;
    }
  }
}