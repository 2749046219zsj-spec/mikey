import { create } from 'zustand';

interface ImageGalleryState {
  images: string[];
  selectedIndex: number;
  isVisible: boolean;
  addImage: (url: string) => void;
  addImages: (urls: string[]) => void;
  selectImage: (index: number) => void;
  nextImage: () => void;
  prevImage: () => void;
  toggleVisibility: () => void;
  clearImages: () => void;
}

export const useImageGallery = create<ImageGalleryState>((set, get) => ({
  images: [],
  selectedIndex: 0,
  isVisible: true,
  
  addImage: (url: string) => set((state) => ({
    images: [...state.images, url]
  })),
  
  addImages: (urls: string[]) => set((state) => ({
    images: [...state.images, ...urls]
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
  
  clearImages: () => set(() => ({
    images: [],
    selectedIndex: 0
  }))
}));