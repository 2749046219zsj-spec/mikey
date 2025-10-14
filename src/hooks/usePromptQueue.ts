import { create } from 'zustand';

interface PromptQueueState {
  queue: string[];
  isProcessing: boolean;
  currentIndex: number;
  totalCount: number;
  addPrompts: (prompts: string[]) => void;
  processNext: () => void;
  clearQueue: () => void;
  setProcessing: (processing: boolean) => void;
}

export const usePromptQueue = create<PromptQueueState>((set, get) => ({
  queue: [],
  isProcessing: false,
  currentIndex: 0,
  totalCount: 0,
  
  addPrompts: (prompts: string[]) => {
    set({
      queue: prompts,
      currentIndex: 0,
      totalCount: prompts.length,
      isProcessing: false
    });
  },
  
  processNext: () => {
    const state = get();
    if (state.currentIndex < state.queue.length - 1) {
      set({
        currentIndex: state.currentIndex + 1,
        isProcessing: false
      });
      return true;
    } else {
      // 队列处理完成
      set({
        queue: [],
        currentIndex: 0,
        totalCount: 0,
        isProcessing: false
      });
      return false;
    }
  },
  
  clearQueue: () => {
    set({
      queue: [],
      currentIndex: 0,
      totalCount: 0,
      isProcessing: false
    });
  },
  
  setProcessing: (processing: boolean) => {
    set({ isProcessing: processing });
  }
}));