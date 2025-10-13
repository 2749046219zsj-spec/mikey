import { create } from 'zustand';

interface ImageSelectorState {
  isOpen: boolean;
  prompts: string[];
  selectedImageUrl: string | null;
  onConfirm: ((imageUrl: string) => void) | null;
  openSelector: (prompts: string[], onConfirm: (imageUrl: string) => void) => void;
  closeSelector: () => void;
  selectImage: (imageUrl: string) => void;
}

export const useImageSelector = create<ImageSelectorState>((set) => ({
  isOpen: false,
  prompts: [],
  selectedImageUrl: null,
  onConfirm: null,

  openSelector: (prompts: string[], onConfirm: (imageUrl: string) => void) => set(() => ({
    isOpen: true,
    prompts,
    selectedImageUrl: null,
    onConfirm
  })),

  closeSelector: () => set(() => ({
    isOpen: false,
    prompts: [],
    selectedImageUrl: null,
    onConfirm: null
  })),

  selectImage: (imageUrl: string) => set(() => ({
    selectedImageUrl: imageUrl
  }))
}));
