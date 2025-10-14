import { create } from 'zustand';

interface PromptQueueState {
  queue: string[];
  referenceImages: File[];
  isProcessing: boolean;
  currentIndex: number;
  totalCount: number;
  addPrompts: (prompts: string[], images?: File[]) => void;
  processNext: () => void;
  clearQueue: () => void;
  setProcessing: (processing: boolean) => void;
}

export const usePromptQueue = create<PromptQueueState>((set, get) => ({
  queue: [],
  referenceImages: [],
  isProcessing: false,
  currentIndex: 0,
  totalCount: 0,

  addPrompts: (prompts: string[], images: File[] = []) => {
    set({
      queue: prompts,
      referenceImages: images,
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
        referenceImages: [],
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
      referenceImages: [],
      currentIndex: 0,
      totalCount: 0,
      isProcessing: false
    });
  },

  setProcessing: (processing: boolean) => {
    set({ isProcessing: processing });
  }
}));