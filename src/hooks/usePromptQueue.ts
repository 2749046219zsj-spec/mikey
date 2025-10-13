import { create } from 'zustand';

interface PromptQueueState {
  queue: string[];
  referenceImages: File[];
  isProcessing: boolean;
  isStopped: boolean;
  currentIndex: number;
  totalCount: number;
  addPrompts: (prompts: string[], images?: File[]) => void;
  processNext: () => void;
  stopQueue: () => void;
  clearQueue: () => void;
  setProcessing: (processing: boolean) => void;
}

export const usePromptQueue = create<PromptQueueState>((set, get) => ({
  queue: [],
  referenceImages: [],
  isProcessing: false,
  isStopped: false,
  currentIndex: 0,
  totalCount: 0,

  addPrompts: (prompts: string[], images: File[] = []) => {
    set({
      queue: prompts,
      referenceImages: images,
      currentIndex: 0,
      totalCount: prompts.length,
      isProcessing: false,
      isStopped: false
    });
  },

  processNext: () => {
    const state = get();
    if (state.isStopped) {
      return false;
    }
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
        isProcessing: false,
        isStopped: false
      });
      return false;
    }
  },

  stopQueue: () => {
    set({
      isStopped: true,
      isProcessing: false
    });
  },

  clearQueue: () => {
    set({
      queue: [],
      referenceImages: [],
      currentIndex: 0,
      totalCount: 0,
      isProcessing: false,
      isStopped: false
    });
  },

  setProcessing: (processing: boolean) => {
    set({ isProcessing: processing });
  }
}));