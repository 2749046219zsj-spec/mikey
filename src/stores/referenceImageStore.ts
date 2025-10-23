import { create } from 'zustand';

export interface SelectedReferenceImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  source: 'public' | 'private';
}

interface ReferenceImageState {
  selectedImages: SelectedReferenceImage[];
  addImage: (image: SelectedReferenceImage) => void;
  removeImage: (id: string) => void;
  toggleImage: (image: SelectedReferenceImage) => boolean;
  clearImages: () => void;
  setImages: (images: SelectedReferenceImage[]) => void;
  isImageSelected: (url: string) => boolean;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'reference_images_selection';

export const useReferenceImageStore = create<ReferenceImageState>((set, get) => ({
  selectedImages: [],

  addImage: (image: SelectedReferenceImage) => {
    set((state) => {
      const exists = state.selectedImages.some(img => img.url === image.url);
      if (exists) return state;

      const newImages = [...state.selectedImages, image];
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newImages));
      return { selectedImages: newImages };
    });
  },

  removeImage: (id: string) => {
    set((state) => {
      const newImages = state.selectedImages.filter(img => img.id !== id);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newImages));
      return { selectedImages: newImages };
    });
  },

  toggleImage: (image: SelectedReferenceImage) => {
    const state = get();
    const exists = state.selectedImages.some(img => img.url === image.url);

    if (exists) {
      const existingImage = state.selectedImages.find(img => img.url === image.url);
      if (existingImage) {
        state.removeImage(existingImage.id);
      }
      return false;
    } else {
      state.addImage(image);
      return true;
    }
  },

  clearImages: () => {
    set({ selectedImages: [] });
    sessionStorage.removeItem(STORAGE_KEY);
  },

  setImages: (images: SelectedReferenceImage[]) => {
    set({ selectedImages: images });
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(images));
  },

  isImageSelected: (url: string) => {
    return get().selectedImages.some(img => img.url === url);
  },

  loadFromStorage: () => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const images = JSON.parse(stored);
        set({ selectedImages: images });
      }
    } catch (error) {
      console.error('Failed to load reference images from storage:', error);
    }
  },

  saveToStorage: () => {
    const state = get();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.selectedImages));
  },
}));
