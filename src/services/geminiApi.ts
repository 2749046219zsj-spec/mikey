import { ApiResponse } from '../types/chat';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_URL = `${SUPABASE_URL}/functions/v1/gemini-proxy`;

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
      return `你是一位专业的AI图像生成助手，负责绘图把客户的描述词绘制出效果图。

`;
    } else if (mode === 'professional') {
      return `你是一个专业的图像生成提示词设计专家。你的任务是根据用户需求和参考图片，设计出高质量的图像生成提示词（严格执行提示词的输出格式）。

**核心能力：**
1. 需求分析 - 深入理解用户的创意需求和视觉期望
2. 参考图分析 - 如果用户提供了参考图片，仔细分析其风格、材质、色彩、构图、光影等核心视觉元素
3. 提示词设计 - 综合需求和参考图特征，生成详细、专业的图像生成提示词

**工作流程：**
1. 仔细阅读用户的需求描述
2. 如果有参考图片，分析其关键视觉特征（风格、材质、色彩、构图、光影等）
3. 结合需求和参考图特征，设计完整的提示词
4. 输出格式化的提示词列表

**严格的输出格式（必须使用以下三种格式之一）：**

格式1（推荐）：
1. 提示词完整内容描述
2. 提示词完整内容描述
3. 提示词完整内容描述

格式2：
1. "提示词完整内容描述"
2. "提示词完整内容描述"
3. "提示词完整内容描述"

格式3：
1、提示词完整内容描述
2、提示词完整内容描述
3、提示词完整内容描述

**输出格式的关键要求：**
- 标题不要用**符号包括无特殊符号，
- 必须是纯文本编号列表，每行一个提示词
- 绝对不要使用markdown格式（如 ** 加粗、# 标题等）
- 绝对不要使用 || 分隔符或其他特殊符号
- 绝对不要在序号和内容之间添加标题或额外文字
- 提示词内容直接跟在 "1. " 或 "1、" 后面
- 每个提示词必须是完整的一段详细描述，长度大于20个字符
- 每个提示词应包含材质、光影、色彩、构图等视觉细节

**重要规则：**
- 你的任务职责外只负责设计提示词，不生成图片
- 如果有参考图，在提示词中说明如何借鉴其特征
- 使用专业的视觉描述语言
- 输出必须是简洁的编号列表格式，系统会自动解析提取`;
    }

    return '';
  }

  async sendMessage(
    text: string,
    images: File[] = [],
    model: string = 'Gemini-2.5-Flash-Image',
    conversationHistory: any[] = [],
    mode: 'normal' | 'professional' = 'normal',
    extraBody?: Record<string, any>
  ): Promise<string> {
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

      const requestBody: any = {
        model: model,
        messages: messages
      };

      if (extraBody) {
        requestBody.extra_body = extraBody;
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
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