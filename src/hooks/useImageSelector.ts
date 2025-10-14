import { create } from 'zustand';

interface ImageSelectorState {
  isOpen: boolean;
  prompts: string[];
  selectedImageUrl: string | null;
  selectedImageFile: File | null;
  onConfirm: ((imageFile: File) => void) | null;
  openSelector: (prompts: string[], onConfirm: (imageFile: File) => void) => void;
  closeSelector: () => void;
  selectImage: (imageUrl: string, imageFile?: File) => void;
  selectUploadedImage: (file: File) => void;
}

export const useImageSelector = create<ImageSelectorState>((set) => ({
  isOpen: false,
  prompts: [],
  selectedImageUrl: null,
  selectedImageFile: null,
  onConfirm: null,

  openSelector: (prompts: string[], onConfirm: (imageFile: File) => void) => set(() => ({
    isOpen: true,
    prompts,
    selectedImageUrl: null,
    selectedImageFile: null,
    onConfirm
  })),

  closeSelector: () => set(() => ({
    isOpen: false,
    prompts: [],
    selectedImageUrl: null,
    selectedImageFile: null,
    onConfirm: null
  })),

  selectImage: (imageUrl: string, imageFile?: File) => set(() => ({
    selectedImageUrl: imageUrl,
    selectedImageFile: imageFile || null
  })),

  selectUploadedImage: (file: File) => set(() => ({
    selectedImageUrl: URL.createObjectURL(file),
    selectedImageFile: file
  }))
}));
