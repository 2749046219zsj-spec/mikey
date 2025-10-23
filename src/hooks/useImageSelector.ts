import { create } from 'zustand';

type SelectionMode = 'unified' | 'individual';

interface PromptWithImages {
  prompt: string;
  images: File[];
}

interface ImageSelectorState {
  isOpen: boolean;
  prompts: string[];
  mode: SelectionMode;
  selectedImageUrl: string | null;
  selectedImageFile: File | null;
  selectedImages: File[];
  promptImages: Map<number, File[]>;
  currentPromptIndex: number;
  onConfirm: ((imageFile: File) => void) | null;
  onConfirmMultiple: ((result: { mode: SelectionMode; unifiedImages?: File[]; promptImages?: PromptWithImages[] }) => void) | null;
  defaultImageUrls: string[];
  openSelector: (prompts: string[], onConfirm: (imageFile: File) => void) => void;
  openAdvancedSelector: (prompts: string[], onConfirm: (result: { mode: SelectionMode; unifiedImages?: File[]; promptImages?: PromptWithImages[] }) => void) => void;
  closeSelector: () => void;
  selectImage: (imageUrl: string, imageFile?: File) => void;
  selectUploadedImage: (file: File) => void;
  setMode: (mode: SelectionMode) => void;
  addImageToUnified: (file: File) => void;
  removeImageFromUnified: (index: number) => void;
  addImageToPrompt: (promptIndex: number, file: File) => void;
  removeImageFromPrompt: (promptIndex: number, imageIndex: number) => void;
  setCurrentPromptIndex: (index: number) => void;
  setDefaultImageUrls: (urls: string[]) => void;
  loadDefaultImages: (imageUrls: string[]) => Promise<void>;
}

export const useImageSelector = create<ImageSelectorState>((set, get) => ({
  isOpen: false,
  prompts: [],
  mode: 'unified',
  selectedImageUrl: null,
  selectedImageFile: null,
  selectedImages: [],
  promptImages: new Map(),
  currentPromptIndex: 0,
  onConfirm: null,
  onConfirmMultiple: null,
  defaultImageUrls: [],

  openSelector: (prompts: string[], onConfirm: (imageFile: File) => void) => set(() => ({
    isOpen: true,
    prompts,
    mode: 'unified',
    selectedImageUrl: null,
    selectedImageFile: null,
    selectedImages: [],
    promptImages: new Map(),
    currentPromptIndex: 0,
    onConfirm,
    onConfirmMultiple: null
  })),

  openAdvancedSelector: (prompts: string[], onConfirm: (result: { mode: SelectionMode; unifiedImages?: File[]; promptImages?: PromptWithImages[] }) => void) => set(() => ({
    isOpen: true,
    prompts,
    mode: 'unified',
    selectedImageUrl: null,
    selectedImageFile: null,
    selectedImages: [],
    promptImages: new Map(),
    currentPromptIndex: 0,
    onConfirm: null,
    onConfirmMultiple: onConfirm
  })),

  closeSelector: () => set(() => ({
    isOpen: false,
    prompts: [],
    selectedImageUrl: null,
    selectedImageFile: null,
    selectedImages: [],
    promptImages: new Map(),
    currentPromptIndex: 0,
    onConfirm: null,
    onConfirmMultiple: null
  })),

  selectImage: (imageUrl: string, imageFile?: File) => set(() => ({
    selectedImageUrl: imageUrl,
    selectedImageFile: imageFile || null
  })),

  selectUploadedImage: (file: File) => set(() => ({
    selectedImageUrl: URL.createObjectURL(file),
    selectedImageFile: file
  })),

  setMode: (mode: SelectionMode) => set(() => ({
    mode,
    selectedImages: [],
    promptImages: new Map(),
    currentPromptIndex: 0
  })),

  addImageToUnified: (file: File) => set((state) => ({
    selectedImages: [...state.selectedImages, file]
  })),

  removeImageFromUnified: (index: number) => set((state) => ({
    selectedImages: state.selectedImages.filter((_, i) => i !== index)
  })),

  addImageToPrompt: (promptIndex: number, file: File) => set((state) => {
    const newMap = new Map(state.promptImages);
    const existing = newMap.get(promptIndex) || [];
    newMap.set(promptIndex, [...existing, file]);
    return { promptImages: newMap };
  }),

  removeImageFromPrompt: (promptIndex: number, imageIndex: number) => set((state) => {
    const newMap = new Map(state.promptImages);
    const existing = newMap.get(promptIndex) || [];
    newMap.set(promptIndex, existing.filter((_, i) => i !== imageIndex));
    return { promptImages: newMap };
  }),

  setCurrentPromptIndex: (index: number) => set(() => ({
    currentPromptIndex: index
  })),

  setDefaultImageUrls: (urls: string[]) => set(() => ({
    defaultImageUrls: urls
  })),

  loadDefaultImages: async (imageUrls: string[]) => {
    if (imageUrls.length === 0) return;

    try {
      const imageFiles = await Promise.all(
        imageUrls.map(async (url) => {
          const response = await fetch(url);
          const blob = await response.blob();
          const fileName = url.split('/').pop() || 'reference-image.jpg';
          return new File([blob], fileName, { type: blob.type });
        })
      );

      set(() => ({
        selectedImages: imageFiles,
        defaultImageUrls: imageUrls
      }));
    } catch (error) {
      console.error('Failed to load default reference images:', error);
    }
  }
}));
