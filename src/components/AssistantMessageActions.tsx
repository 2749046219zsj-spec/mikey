import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface AssistantMessageActionsProps {
  messageContent: string;
  messageId: string;
  onSendToGenerate: (prompts: string[]) => void;
  alreadySent?: boolean;
}

export const AssistantMessageActions: React.FC<AssistantMessageActionsProps> = ({
  messageContent,
  messageId,
  onSendToGenerate,
  alreadySent = false
}) => {
  const extractPrompts = (content: string): string[] => {
    const prompts: string[] = [];

    // 方法1: 匹配双引号格式 1. "内容"
    const quotedNumberedMatches = content.match(/\d+\.\s*[""]([^""]+)[""]/g);
    if (quotedNumberedMatches && quotedNumberedMatches.length > 0) {
      quotedNumberedMatches.forEach(match => {
        const promptMatch = match.match(/[""]([^""]+)[""]/);
        if (promptMatch) prompts.push(promptMatch[1].trim());
      });
      return prompts.filter(prompt => prompt.trim().length > 20);
    }

    // 方法2: 直接按编号分割，支持单行长文本格式
    // 使用正则匹配所有 "数字. " 或 "数字、" 开头的段落
    const paragraphPattern = /(\d+)[.、。]\s*([^\n]*(?:\n(?!\d+[.、。]\s)[^\n]*)*)/g;
    const matches = content.matchAll(paragraphPattern);

    for (const match of matches) {
      let promptText = match[2].trim();

      // 清理markdown格式符号
      promptText = promptText
        // 移除 **标题**: 或 **标题**:
        .replace(/\*\*([^*]+)\*\*[:：]\s*/g, '$1: ')
        // 移除其他 ** 包裹
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        // 移除【】包裹
        .replace(/【([^】]+)】[:：]?\s*/g, '$1: ')
        // 移除多余的换行
        .replace(/\n+/g, ' ')
        // 移除多余空格
        .replace(/\s+/g, ' ')
        .trim();

      if (promptText.length > 20) {
        prompts.push(promptText);
      }
    }

    // 如果方法2没有找到，尝试方法3: 按行分割的传统方式
    if (prompts.length === 0) {
      const lines = content.split('\n');
      let currentPrompt = '';
      let currentNumber = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 检查是否是编号开始的行 (支持 1. 或 1、 或 1。)
        const numberMatch = line.match(/^(\d+)[.、。]\s*(.*)$/);

        if (numberMatch) {
          const lineNumber = parseInt(numberMatch[1]);
          let lineContent = numberMatch[2].trim();

          // 如果有之前积累的提示词，先保存
          if (currentPrompt.trim().length > 20) {
            prompts.push(currentPrompt.trim());
          }

          // 清理标题中的markdown符号
          lineContent = lineContent
            .replace(/^\*\*([^*]+)\*\*[:：]?\s*/, '$1: ')
            .replace(/^\*\*([^*]+)\*\*\s*/, '$1 ')
            .replace(/^【([^】]+)】[:：]?\s*/, '$1: ')
            .trim();

          // 开始新的提示词
          currentNumber = lineNumber;
          currentPrompt = lineContent;
        } else if (currentNumber > 0 && line.length > 0) {
          // 追加内容到当前提示词
          const cleanLine = line
            .replace(/^\*\*/, '')
            .replace(/\*\*$/, '')
            .replace(/^\*\*([^*]+)\*\*[:：]?\s*/, '$1: ')
            .replace(/^\|\|/, '')
            .trim();

          if (cleanLine) {
            currentPrompt += (currentPrompt ? ' ' : '') + cleanLine;
          }
        } else if (line.length === 0 && currentPrompt.trim().length > 20) {
          // 遇到空行，保存当前提示词
          prompts.push(currentPrompt.trim());
          currentPrompt = '';
          currentNumber = 0;
        }
      }

      // 保存最后一个提示词
      if (currentPrompt.trim().length > 20) {
        prompts.push(currentPrompt.trim());
      }
    }

    return prompts.filter(prompt => prompt.trim().length > 20);
  };

  const prompts = extractPrompts(messageContent);

  if (prompts.length === 0 || alreadySent) {
    return null;
  }

  return (
    <button
      onClick={() => onSendToGenerate(prompts)}
      className="mt-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
    >
      <CheckCircle2 size={14} />
      发现 {prompts.length} 个提示词，点击选择参考图
    </button>
  );
};
