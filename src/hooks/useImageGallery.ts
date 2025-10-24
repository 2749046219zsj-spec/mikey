import { create } from 'zustand';

export interface ImageMetadata {
  url: string;
  prompt?: string;
  modelName?: string;
  stylePreset?: string;
  imageCount?: number;
  referenceImages?: string[];
  [key: string]: any;
}

interface ImageGalleryState {
  images: string[];
  imageMetadata: Map<string, ImageMetadata>;
  selectedIndex: number;
  isVisible: boolean;
  isKeyboardActive: boolean;
  checkedImages: Set<number>;
  addImage: (url: string, metadata?: Omit<ImageMetadata, 'url'>) => void;
  addImages: (items: Array<string | ImageMetadata>) => void;
  getImageMetadata: (url: string) => ImageMetadata | undefined;
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
  imageMetadata: new Map(),
  selectedIndex: 0,
  isVisible: true,
  isKeyboardActive: false,
  checkedImages: new Set<number>(),

  addImage: (url: string, metadata?: Omit<ImageMetadata, 'url'>) => set((state) => {
    if (state.images.includes(url)) return state;

    const newMetadata = new Map(state.imageMetadata);
    newMetadata.set(url, { url, ...metadata });

    return {
      images: [...state.images, url],
      imageMetadata: newMetadata
    };
  }),

  addImages: (items: Array<string | ImageMetadata>) => set((state) => {
    const newImages: string[] = [];
    const newMetadata = new Map(state.imageMetadata);

    items.forEach(item => {
      const url = typeof item === 'string' ? item : item.url;
      if (!state.images.includes(url) && !newImages.includes(url)) {
        newImages.push(url);
        if (typeof item === 'object') {
          newMetadata.set(url, item);
        } else {
          newMetadata.set(url, { url });
        }
      }
    });

    return {
      images: [...state.images, ...newImages],
      imageMetadata: newMetadata,
      isVisible: state.images.length === 0 ? true : state.isVisible
    };
  }),

  getImageMetadata: (url: string) => {
    return get().imageMetadata.get(url);
  },

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
    imageMetadata: new Map(),
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