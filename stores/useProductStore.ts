import * as db from '@/services/db';
import { Category, Product } from '@/types';
import { create } from 'zustand';

interface ProductState {
    products: Product[];
    categories: Category[];
    isLoading: boolean;
    error: string | null;
    loadData: () => void;
    addProduct: (product: Product) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (id: string) => void;
    addCategory: (category: Category) => void;
    deleteCategory: (id: string) => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
    products: [],
    categories: [],
    isLoading: false,
    error: null,

    loadData: async () => {
        set({ isLoading: true, error: null });
        try {
            // Ensure DB is initialized
            await db.initDatabase();

            const products = await db.getProducts();
            const categories = await db.getCategories();

            // If no categories, maybe add a default one for UX
            if (categories.length === 0) {
                const defaultCat = { id: 'cat-1', name: 'General' };
                await db.insertCategory(defaultCat);
                categories.push(defaultCat);
            }

            set({ products, categories, isLoading: false });
        } catch (e: any) {
            set({ error: e.message, isLoading: false });
        }
    },

    addProduct: async (product) => {
        try {
            await db.insertProduct(product);
            set(state => ({ products: [...state.products, product] }));
        } catch (e: any) {
            console.error("Failed to add product", e);
            set({ error: "Failed to add product" });
        }
    },

    updateProduct: async (product) => {
        try {
            await db.updateProductDB(product);
            set(state => ({
                products: state.products.map(p => p.id === product.id ? product : p)
            }));
        } catch (e: any) {
            console.error("Failed to update product", e);
        }
    },

    deleteProduct: async (id) => {
        try {
            await db.deleteProductDB(id);
            set(state => ({
                products: state.products.filter(p => p.id !== id)
            }));
        } catch (e) {
            console.error("Failed to delete product", e);
        }
    },

    addCategory: async (category) => {
        try {
            await db.insertCategory(category);
            set(state => ({ categories: [...state.categories, category] }));
        } catch (e) {
            console.error("Failed to add category", e);
        }
    },

    deleteCategory: async (id) => {
        try {
            await db.deleteCategoryDB(id);
            set(state => ({
                categories: state.categories.filter(c => c.id !== id)
            }));
        } catch (e) {
            console.error("Failed to delete category", e);
        }
    }
}));
