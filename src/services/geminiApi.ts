import { ApiResponse } from '../types/chat';

// 使用国内可访问的 AI API 服务
const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

export class GeminiApiService {
  private async convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // 移除 data:image/jpeg;base64, 前缀，只保留 base64 数据
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async sendMessage(text: string, images: File[] = []): Promise<string> {
    if (!API_KEY) {
      throw new Error('请在 .env 文件中设置 VITE_DEEPSEEK_API_KEY');
    }

    try {
      const content = [];
      
      // 添加文本内容
      if (text.trim()) {
        content.push({
          type: "text",
          text: text
        });
      }

      // 添加图片内容（如果支持）
      if (images.length > 0) {
        for (const image of images) {
          const base64Data = await this.convertImageToBase64(image);
          content.push({
            type: "image_url",
            image_url: {
              url: `data:${image.type};base64,${base64Data}`
            }
          });
        }
      }

      const requestBody = {
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: images.length > 0 ? content : text
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
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
        let errorMessage = `请求失败: ${response.status}`;
        
        if (errorText.trim()) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorMessage;
          } catch {
            errorMessage = `${errorMessage} - ${errorText}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      
      if (!responseText.trim()) {
        throw new Error('API 返回空响应');
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`无效的 JSON 响应: ${responseText}`);
      }
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('API 未生成响应');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API 错误:', error);
      throw error;
    }
  }
}