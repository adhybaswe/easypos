import { create } from 'zustand';
import * as db from '../services/db';
import { Category, Product } from '../types';

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

    loadData: () => {
        set({ isLoading: true, error: null });
        try {
            // Ensure DB is initialized
            db.initDatabase();

            const products = db.getProducts();
            const categories = db.getCategories();

            // If no categories, maybe add a default one for UX
            if (categories.length === 0) {
                const defaultCat = { id: 'cat-1', name: 'General' };
                db.insertCategory(defaultCat);
                categories.push(defaultCat);
            }

            set({ products, categories, isLoading: false });
        } catch (e: any) {
            set({ error: e.message, isLoading: false });
        }
    },

    addProduct: (product) => {
        try {
            db.insertProduct(product);
            set(state => ({ products: [...state.products, product] }));
        } catch (e: any) {
            console.error("Failed to add product", e);
            set({ error: "Failed to add product" });
        }
    },

    updateProduct: (product) => {
        try {
            db.updateProductDB(product);
            set(state => ({
                products: state.products.map(p => p.id === product.id ? product : p)
            }));
        } catch (e: any) {
            console.error("Failed to update product", e);
        }
    },

    deleteProduct: (id) => {
        try {
            db.deleteProductDB(id);
            set(state => ({
                products: state.products.filter(p => p.id !== id)
            }));
        } catch (e) {
            console.error("Failed to delete product", e);
        }
    },

    addCategory: (category) => {
        try {
            db.insertCategory(category);
            set(state => ({ categories: [...state.categories, category] }));
        } catch (e) {
            console.error("Failed to add category", e);
        }
    },

    deleteCategory: (id) => {
        try {
            db.deleteCategoryDB(id);
            set(state => ({
                categories: state.categories.filter(c => c.id !== id)
            }));
        } catch (e) {
            console.error("Failed to delete category", e);
        }
    }
}));
