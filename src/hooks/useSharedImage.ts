import { create } from 'zustand';

interface SharedImageState {
  currentImage: File | null;
  currentImageUrl: string | null;
  setCurrentImage: (file: File | null, url: string | null) => void;
  clearCurrentImage: () => void;
}

export const useSharedImage = create<SharedImageState>((set) => ({
  currentImage: null,
  currentImageUrl: null,

  setCurrentImage: (file: File | null, url: string | null) => set({
    currentImage: file,
    currentImageUrl: url
  }),

  clearCurrentImage: () => set({
    currentImage: null,
    currentImageUrl: null
  })
}));
