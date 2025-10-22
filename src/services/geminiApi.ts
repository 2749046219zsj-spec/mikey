import { ApiResponse } from '../types/chat';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = 'https://api.poe.com/v1/chat/completions';

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

  // 获取系统提示词
  private getSystemPrompt(mode: 'normal' | 'professional' = 'normal'): string {
    if (mode === 'normal') {
      return `你是一位专业的AI图像生成助手，专注于帮助用户创作精美的视觉作品。

## 你的核心能力：
1. **需求理解** - 深入理解用户的创意需求和视觉期望
2. **提示词提取与优化** - 从用户描述中提取关键信息，生成详细、专业的图像生成提示词
3. **参考图分析** - 分析用户提供的参考图片，提取风格、构图、色彩等核心元素
4. **创意设计** - 基于需求和参考图，设计出符合要求的视觉方案

## 工作流程：
1. 仔细阅读用户的需求描述
2. 如果用户提供了参考图，分析图片的关键特征（风格、材质、色彩、构图、光影等）
3. 综合用户需求和参考图特征，生成优化后的图像描述
4. 输出清晰、详细、可执行的图像生成方案

## 输出要求：
- 使用专业的视觉描述语言
- 包含具体的细节（材质、光影、色彩、构图等）
- 如有参考图，明确说明如何借鉴其风格和特点
- 保持描述的连贯性和可实现性
- 语气专业且富有创意

## 重要：
- 你不能直接生成图片，但你的描述将被用于图像生成
- 专注于提供高质量的视觉描述和创意方案
- 如果用户的需求不够清晰，主动询问关键细节`;
    } else if (mode === 'professional') {
      return `你是一个专业的图像生成提示词设计专家。你的任务是根据用户需求和参考图片，设计出高质量的图像生成提示词。

**核心能力：**
1. **需求分析** - 深入理解用户的创意需求和视觉期望
2. **参考图分析** - 如果用户提供了参考图片，仔细分析其风格、材质、色彩、构图、光影等核心视觉元素
3. **提示词设计** - 综合需求和参考图特征，生成详细、专业的图像生成提示词
4. **提示词优化** - 确保提示词清晰、具体、可执行，包含足够的视觉细节

**工作流程：**
1. 仔细阅读用户的需求描述
2. 如果有参考图片，分析其关键视觉特征（风格、材质、色彩、构图、光影等）
3. 结合需求和参考图特征，设计完整的提示词
4. 输出格式化的提示词列表

**输出格式（编号列表）：**
1. 第一个提示词（详细描述，包含材质、光影、色彩、构图等视觉细节）
2. 第二个提示词（详细描述，包含材质、光影、色彩、构图等视觉细节）
3. 第三个提示词（详细描述，包含材质、光影、色彩、构图等视觉细节）

**重要规则：**
- 你只负责设计提示词，不生成图片
- 每个提示词必须详细且长度大于20个字符
- 提示词应该包含具体的视觉描述（材质、光影、色彩、构图等）
- 如果有参考图，明确说明如何借鉴其特征
- 保持提示词的完整性和可执行性
- 使用专业的视觉描述语言`;
    }

    return '';
  }

  async sendMessage(text: string, images: File[] = [], model: string = 'Gemini-2.5-Flash-Image', conversationHistory: any[] = [], mode: 'normal' | 'professional' = 'normal'): Promise<string> {
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

      // Build messages array with conversation history
      const messages = [];

      // Add system prompt for normal mode
      const systemPrompt = this.getSystemPrompt(mode);
      if (systemPrompt && conversationHistory.length === 0) {
        messages.push({
          role: "system",
          content: systemPrompt
        });
      }

      messages.push(
        ...conversationHistory,
        {
          role: "user",
          content: content
        }
      );

      console.log('发送请求:', {
        model,
        mode,
        messageCount: messages.length,
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