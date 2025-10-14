import { create } from 'zustand';

interface ImageGalleryState {
  images: string[];
  selectedIndex: number;
  isVisible: boolean;
  isKeyboardActive: boolean;
  addImage: (url: string) => void;
  addImages: (urls: string[]) => void;
  selectImage: (index: number) => void;
  nextImage: () => void;
  prevImage: () => void;
  toggleVisibility: () => void;
  activateKeyboard: () => void;
  deactivateKeyboard: () => void;
  clearImages: () => void;
}

export const useImageGallery = create<ImageGalleryState>((set, get) => ({
  images: [],
  selectedIndex: 0,
  isVisible: true,
  isKeyboardActive: false,
  
  addImage: (url: string) => set((state) => ({
    images: state.images.includes(url) ? state.images : [...state.images, url]
  })),
  
  addImages: (urls: string[]) => set((state) => ({
    images: [...state.images, ...urls.filter(url => !state.images.includes(url))],
    // 如果是第一次添加图片，自动显示面板
    isVisible: state.images.length === 0 ? true : state.isVisible
  })),
  
  selectImage: (index: number) => set(() => ({
    selectedIndex: Math.max(0, Math.min(index, get().images.length - 1))
  })),
  
  nextImage: () => set((state) => ({
    selectedIndex: state.selectedIndex < state.images.length - 1 
      ? state.selectedIndex + 1 
      : 0
  })),
  
  prevImage: () => set((state) => ({
    selectedIndex: state.selectedIndex > 0 
      ? state.selectedIndex - 1 
      : state.images.length - 1
  })),
  
  toggleVisibility: () => set((state) => ({
    isVisible: !state.isVisible
  })),
  
  activateKeyboard: () => set(() => ({
    isKeyboardActive: true
  })),
  
  deactivateKeyboard: () => set(() => ({
    isKeyboardActive: false
  })),
  
  clearImages: () => set(() => ({
    images: [],
    selectedIndex: 0,
    isKeyboardActive: false
  }))
}));