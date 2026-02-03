import * as db from '@/services/db';
import { Transaction } from '@/types';
import { create } from 'zustand';

interface TransactionState {
    transactions: Transaction[];
    isLoading: boolean;
    loadTransactions: () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
    transactions: [],
    isLoading: false,
    loadTransactions: async () => {
        set({ isLoading: true });
        try {
            await db.initDatabase(); // Ensure initialized
            const transactions = await db.getTransactions();
            set({ transactions, isLoading: false });
        } catch (e) {
            console.error("Failed to load transactions", e);
            set({ isLoading: false });
        }
    }
}));
