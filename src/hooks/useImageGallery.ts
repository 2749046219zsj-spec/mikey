import { create } from 'zustand';

interface ImageGalleryState {
  images: string[];
  selectedIndex: number;
  isVisible: boolean;
  isKeyboardActive: boolean;
  checkedImages: Set<number>;
  addImage: (url: string) => void;
  addImages: (urls: string[]) => void;
  selectImage: (index: number) => void;
  nextImage: () => void;
  prevImage: () => void;
  toggleVisibility: () => void;
  activateKeyboard: () => void;
  deactivateKeyboard: () => void;
  clearImages: () => void;
  toggleImageCheck: (index: number) => void;
  selectAllImages: () => void;
  clearSelection: () => void;
}

export const useImageGallery = create<ImageGalleryState>((set, get) => ({
  images: [],
  selectedIndex: 0,
  isVisible: true,
  isKeyboardActive: false,
  checkedImages: new Set<number>(),

  addImage: (url: string) => set((state) => ({
    images: state.images.includes(url) ? state.images : [...state.images, url]
  })),

  addImages: (urls: string[]) => set((state) => {
    const newUrls = urls.filter(url => !state.images.includes(url));
    if (newUrls.length === 0) return state;

    return {
      images: [...state.images, ...newUrls],
      isVisible: true
    };
  }),

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
    isKeyboardActive: false,
    checkedImages: new Set<number>()
  })),

  toggleImageCheck: (index: number) => set((state) => {
    const newChecked = new Set(state.checkedImages);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    return { checkedImages: newChecked };
  }),

  selectAllImages: () => set((state) => ({
    checkedImages: new Set(state.images.map((_, index) => index))
  })),

  clearSelection: () => set(() => ({
    checkedImages: new Set<number>()
  }))
}));