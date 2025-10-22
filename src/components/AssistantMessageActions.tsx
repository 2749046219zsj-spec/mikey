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

    const quotedNumberedMatches = content.match(/\d+\.\s*[""]([^""]+)[""]/g);
    if (quotedNumberedMatches && quotedNumberedMatches.length > 0) {
      quotedNumberedMatches.forEach(match => {
        const promptMatch = match.match(/[""]([^""]+)[""]/);
        if (promptMatch) prompts.push(promptMatch[1].trim());
      });
      return prompts.filter(prompt => prompt.trim().length > 20);
    }

    const lines = content.split('\n');
    const numberedLines: string[] = [];
    lines.forEach(line => {
      const trimmedLine = line.trim();
      const match = trimmedLine.match(/^(\d+)[.、。]\s*(.+)$/);
      if (match && match[2]) numberedLines.push(match[2].trim());
    });
    if (numberedLines.length > 0) return numberedLines.filter(prompt => prompt.trim().length > 20);

    return [];
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
