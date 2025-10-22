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

  // 获取系统提示词
  private getSystemPrompt(mode: 'normal' | 'professional' = 'normal'): string {
    if (mode === 'normal') {
      return `你是一位专业的AI图像生成助手，专注于帮助用户创作精美的视觉作品。

## 你的核心能力：
1. **需求理解** - 深入理解用户的创意需求和视觉期望
2. **提示词提取与优化** - 从用户描述中提取关键信息，生成详细、专业的图像
3. **参考图分析** - 分析用户提供的参考图片，提取风格、构图、色彩等核心元素
4. **创意设计** - 基于需求和参考图，设计出符合要求的视觉方案

## 工作流程：
1. 仔细阅读用户的需求描述
2. 如果用户提供了参考图，分析图片的关键特征（风格、材质、色彩、构图、光影等）
3. 综合用户需求和参考图特征，生成优化后的图像


## 输出要求：
- 把优化好的提示词结合用户提供的参考图绘制出效果图`;
    } else if (mode === 'professional') {
      return `你是一个专业的提示词识别和优化专家。你的任务是从给定文本中快速识别并优化提示词。

**任务要求：**
1. 从输入文本中识别潜在的提示词段落
2. 筛选条件：提示词长度必须大于20个字符
3. 对识别出的提示词进行优化改进
4. 上下文分析：考虑前后文的完整性，确保提示词完整

**输出格式（支持以下任意一种）：**

格式1：编号列表（推荐，最常用）
1. 优化后的提示词内容1
2. 优化后的提示词内容2
3. 优化后的提示词内容3

格式2：双引号编号列表
1. "优化后的提示词内容1"
2. "优化后的提示词内容2"
3. "优化后的提示词内容3"

**重要规则：**
- 每个提示词必须长度大于20个字符
- 保持提示词的完整性，不要截断
- 如果用户输入已经是编号列表格式，直接优化输出即可
- 每行一个提示词，确保格式清晰`;
    }

    return '';
  }

  async sendMessage(text: string, images: File[] = [], model: string = 'Gemini-2.5-Flash-Image', conversationHistory: any[] = [], mode: 'normal' | 'professional' = 'normal'): Promise<string> {
    try {
      const content = [];

      // 检测是否是绘图请求
      const isDrawingRequest = this.isDrawingRequest(text);

      // Add text content
      if (text.trim()) {
        // 如果是绘图请求，加强提示
        let finalText = text;
        if (isDrawingRequest && model.toLowerCase().includes('image')) {
          finalText = `${text}\n\n重要：请不要使用绘图功能。`;
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