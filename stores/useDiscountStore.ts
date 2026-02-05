import * as db from '@/services/db';
import { Discount } from '@/types';
import { create } from 'zustand';

interface DiscountState {
    discounts: Discount[];
    isLoading: boolean;
    error: string | null;
    loadDiscounts: () => void;
    addDiscount: (discount: Discount) => Promise<void>;
    updateDiscount: (discount: Discount) => Promise<void>;
    deleteDiscount: (id: string) => Promise<void>;
}

export const useDiscountStore = create<DiscountState>((set) => ({
    discounts: [],
    isLoading: false,
    error: null,

    loadDiscounts: async () => {
        set({ isLoading: true, error: null });
        try {
            await db.initDatabase();
            const discounts = await db.getDiscounts();
            set({ discounts, isLoading: false });
        } catch (e: any) {
            set({ error: e.message, isLoading: false });
        }
    },

    addDiscount: async (discount: Discount) => {
        try {
            await db.insertDiscount(discount);
            set(state => ({ discounts: [...state.discounts, discount] }));
        } catch (e: any) {
            console.error("Failed to add discount", e);
            throw e;
        }
    },

    updateDiscount: async (discount: Discount) => {
        try {
            await db.updateDiscountDB(discount);
            set(state => ({
                discounts: state.discounts.map(d => d.id === discount.id ? discount : d)
            }));
        } catch (e: any) {
            console.error("Failed to update discount", e);
            throw e;
        }
    },

    deleteDiscount: async (id: string) => {
        try {
            await db.deleteDiscountDB(id);
            set(state => ({
                discounts: state.discounts.filter(d => d.id !== id)
            }));
        } catch (e: any) {
            console.error("Failed to delete discount", e);
            throw e;
        }
    }
}));
