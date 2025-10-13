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
    const galleryState = useImageGallery.getState();
    const imageIndex = galleryState.images.findIndex(img => img === url);

    if (imageIndex !== -1) {
      galleryState.selectImage(imageIndex);
    }

    set({ isOpen: true, imageUrl: url });
  },
  closeModal: () => set({ isOpen: false, imageUrl: null }),
}));