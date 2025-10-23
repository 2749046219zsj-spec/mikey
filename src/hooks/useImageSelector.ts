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
  }))
}));
