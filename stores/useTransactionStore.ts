import * as db from '@/services/db';
import { Transaction } from '@/types';
import { create } from 'zustand';

interface TransactionState {
    transactions: Transaction[];
    isLoading: boolean;
    loadTransactions: (limitCount?: number, userId?: string) => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
    transactions: [],
    isLoading: false,
    loadTransactions: async (limitCount?: number, userId?: string) => {
        set({ isLoading: true });
        try {
            await db.initDatabase(); // Ensure initialized
            const transactions = await db.getTransactions(limitCount, userId);
            set({ transactions, isLoading: false });
        } catch (e) {
            console.error("Failed to load transactions", e);
            set({ isLoading: false });
        }
    }
}));
