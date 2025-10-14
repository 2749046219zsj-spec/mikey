import { create } from 'zustand';
import { useImageGallery } from './useImageGallery';

interface ImageModalState {
  isOpen: boolean;
  imageUrl: string | null;
  openModal: (url: string) => void;
  closeModal: () => void;
}

export const useImageModal = create<ImageModalState>((set) => ({
  isOpen: false,
  imageUrl: null,
  openModal: (url: string) => {
    try {
      if (!url) {
        console.error('Cannot open modal: Invalid URL');
        return;
      }

      const galleryState = useImageGallery.getState();
      if (galleryState && galleryState.images) {
        const imageIndex = galleryState.images.findIndex(img => img === url);

        if (imageIndex !== -1 && galleryState.selectImage) {
          galleryState.selectImage(imageIndex);
        }
      }

      set({ isOpen: true, imageUrl: url });
    } catch (error) {
      console.error('Error opening modal:', error);
    }
  },
  closeModal: () => set({ isOpen: false, imageUrl: null }),
}));