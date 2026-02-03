import { useConfigStore } from '@/stores/useConfigStore';
import { Category, Product, Transaction, TransactionItem, User } from '@/types';
import * as firebase from './firebase';
import * as sqlite from './sqlite';

const getBackend = () => {
    const { backendType } = useConfigStore.getState();
    if (backendType === 'firebase') {
        return firebase;
    }
    return sqlite;
};

// Initialize the selected backend
export const initDatabase = async () => {
    const { backendType } = useConfigStore.getState();
    if (backendType === 'firebase') {
        await firebase.initFirebase();
    } else {
        await sqlite.initDatabase();
    }
};

// --- Products ---

export const getProducts = async (): Promise<Product[]> => {
    return getBackend().getProducts();
};

export const getProductById = async (id: string): Promise<Product | null> => {
    return getBackend().getProductById(id);
};

export const insertProduct = async (product: Product) => {
    return getBackend().insertProduct(product);
};

export const updateProductDB = async (product: Product) => {
    return getBackend().updateProductDB(product);
};

export const deleteProductDB = async (id: string) => {
    return getBackend().deleteProductDB(id);
};

// --- Categories ---

export const getCategories = async (): Promise<Category[]> => {
    return getBackend().getCategories();
};

export const insertCategory = async (category: Category) => {
    return getBackend().insertCategory(category);
};

export const deleteCategoryDB = async (id: string) => {
    return getBackend().deleteCategoryDB(id);
};

// --- Users ---

export const getUsers = async (): Promise<User[]> => {
    return getBackend().getUsers();
};

export const insertUser = async (user: User) => {
    return getBackend().insertUser(user);
};

export const updateUserDB = async (user: User) => {
    return getBackend().updateUserDB(user);
};

export const deleteUserDB = async (id: string) => {
    return getBackend().deleteUserDB(id);
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
    return getBackend().getUserByUsername(username);
};

export const getUserById = async (id: string): Promise<User | null> => {
    return getBackend().getUserById(id);
};

// --- Transactions ---

export const createTransaction = async (transaction: Transaction, items: TransactionItem[]) => {
    return getBackend().createTransaction(transaction, items);
};

export const getTransactions = async (limit: number = 20): Promise<Transaction[]> => {
    return getBackend().getTransactions(limit);
};

export const getTransactionItems = async (transactionId: string): Promise<TransactionItem[]> => {
    return getBackend().getTransactionItems(transactionId);
};

export const getTransactionById = async (id: string): Promise<Transaction | null> => {
    return getBackend().getTransactionById(id);
};
