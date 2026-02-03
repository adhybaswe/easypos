import { create } from 'zustand';
import * as db from '../services/db';
import { Transaction } from '../types';

interface TransactionState {
    transactions: Transaction[];
    isLoading: boolean;
    loadTransactions: () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
    transactions: [],
    isLoading: false,
    loadTransactions: () => {
        set({ isLoading: true });
        try {
            const transactions = db.getTransactions();
            set({ transactions, isLoading: false });
        } catch (e) {
            console.error("Failed to load transactions", e);
            set({ isLoading: false });
        }
    }
}));
