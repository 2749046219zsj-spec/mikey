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

    // 方法2: 智能提取多行段落
    // 将内容按行分割，识别编号开始的行，然后收集直到下一个编号
    const lines = content.split('\n');
    let currentPrompt = '';
    let currentNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 检查是否是编号开始的行 (支持 1. 或 1、 或 1。)
      const numberMatch = line.match(/^(\d+)[.、。]\s*(.*)$/);

      if (numberMatch) {
        const lineNumber = parseInt(numberMatch[1]);
        const lineContent = numberMatch[2].trim();

        // 如果有之前积累的提示词，先保存
        if (currentPrompt.trim().length > 20) {
          prompts.push(currentPrompt.trim());
        }

        // 开始新的提示词
        currentNumber = lineNumber;
        currentPrompt = lineContent;
      } else if (currentNumber > 0 && line.length > 0) {
        // 如果当前行不为空，且我们正在收集提示词，则追加到当前提示词
        // 去除markdown格式符号
        const cleanLine = line
          .replace(/^\*\*/, '')  // 去除开头的 **
          .replace(/\*\*$/, '')  // 去除结尾的 **
          .replace(/^\|\|/, '')  // 去除开头的 ||
          .trim();

        if (cleanLine) {
          currentPrompt += (currentPrompt ? ' ' : '') + cleanLine;
        }
      } else if (line.length === 0 && currentPrompt.trim().length > 20) {
        // 遇到空行，如果当前提示词足够长，保存它
        prompts.push(currentPrompt.trim());
        currentPrompt = '';
        currentNumber = 0;
      }
    }

    // 保存最后一个提示词
    if (currentPrompt.trim().length > 20) {
      prompts.push(currentPrompt.trim());
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
