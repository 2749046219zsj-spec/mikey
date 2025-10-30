import { create } from 'zustand';
import type { ProductCategory, CatalogProduct, CatalogProductWithCategory } from '../types/catalog';

interface CatalogStore {
  categories: ProductCategory[];
  selectedCategoryId: string | null;
  products: CatalogProductWithCategory[];
  currentProduct: CatalogProductWithCategory | null;
  loading: boolean;
  error: string | null;

  setCategories: (categories: ProductCategory[]) => void;
  setSelectedCategory: (categoryId: string) => void;
  setProducts: (products: CatalogProductWithCategory[]) => void;
  setCurrentProduct: (product: CatalogProductWithCategory | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  updateProductLike: (productId: string, liked: boolean, likesCount: number) => void;
  updateProductCommentCount: (productId: string, commentsCount: number) => void;

  reset: () => void;
}

export const useCatalogStore = create<CatalogStore>((set) => ({
  categories: [],
  selectedCategoryId: null,
  products: [],
  currentProduct: null,
  loading: false,
  error: null,

  setCategories: (categories) => set({ categories }),

  setSelectedCategory: (categoryId) => set({ selectedCategoryId: categoryId }),

  setProducts: (products) => set({ products }),

  setCurrentProduct: (product) => set({ currentProduct: product }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  updateProductLike: (productId, liked, likesCount) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, user_liked: liked, likes_count: likesCount } : p
      ),
      currentProduct:
        state.currentProduct?.id === productId
          ? { ...state.currentProduct, user_liked: liked, likes_count: likesCount }
          : state.currentProduct,
    })),

  updateProductCommentCount: (productId, commentsCount) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, comments_count: commentsCount } : p
      ),
      currentProduct:
        state.currentProduct?.id === productId
          ? { ...state.currentProduct, comments_count: commentsCount }
          : state.currentProduct,
    })),

  reset: () =>
    set({
      categories: [],
      selectedCategoryId: null,
      products: [],
      currentProduct: null,
      loading: false,
      error: null,
    }),
}));
