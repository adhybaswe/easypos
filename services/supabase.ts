import { useConfigStore } from '@/stores/useConfigStore';
import { Category, Discount, Product, Transaction, TransactionItem, User } from '@/types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | undefined;

export const initSupabase = async () => {
    const { supabaseConfig } = useConfigStore.getState();
    if (!supabaseConfig) {
        throw new Error("Supabase config is missing");
    }

    supabase = createClient(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey);
};

export const getClient = (): SupabaseClient => {
    if (!supabase) {
        // Try to init if not initialized
        const { backendType, supabaseConfig } = useConfigStore.getState();
        if (backendType === 'supabase' && supabaseConfig) {
            supabase = createClient(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey);
            return supabase;
        }
        throw new Error("Supabase not initialized. Call initSupabase first.");
    }
    return supabase;
};

// --- Products ---

export const getProducts = async (): Promise<Product[]> => {
    const { data, error } = await getClient().from('products').select('*');
    if (error) throw error;
    return data || [];
};

export const getProductById = async (id: string): Promise<Product | null> => {
    const { data, error } = await getClient().from('products').select('*').eq('id', id).single();
    if (error) {
        if (error.code === 'PGRST116') return null; // not found
        throw error;
    }
    return data;
};

export const insertProduct = async (product: Product) => {
    const { error } = await getClient().from('products').upsert(product);
    if (error) throw error;
};

export const updateProductDB = async (product: Product) => {
    const { error } = await getClient().from('products').update(product).eq('id', product.id);
    if (error) throw error;
};

export const deleteProductDB = async (id: string) => {
    const { error } = await getClient().from('products').delete().eq('id', id);
    if (error) throw error;
};

// --- Categories ---

export const getCategories = async (): Promise<Category[]> => {
    const { data, error } = await getClient().from('categories').select('*');
    if (error) throw error;
    return data || [];
};

export const insertCategory = async (category: Category) => {
    const { error } = await getClient().from('categories').upsert(category);
    if (error) throw error;
};

export const deleteCategoryDB = async (id: string) => {
    const { error } = await getClient().from('categories').delete().eq('id', id);
    if (error) throw error;
};

// --- Users ---

export const getUsers = async (): Promise<User[]> => {
    const { data, error } = await getClient().from('users').select('*');
    if (error) throw error;
    return data || [];
};

export const insertUser = async (user: User) => {
    const { error } = await getClient().from('users').upsert(user);
    if (error) throw error;
};

export const updateUserDB = async (user: User) => {
    const { error } = await getClient().from('users').update(user).eq('id', user.id);
    if (error) throw error;
};

export const deleteUserDB = async (id: string) => {
    const { error } = await getClient().from('users').delete().eq('id', id);
    if (error) throw error;
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
    const { data, error } = await getClient().from('users').select('*').eq('username', username).maybeSingle();
    if (error) throw error;
    return data;
};

export const getUserById = async (id: string): Promise<User | null> => {
    const { data, error } = await getClient().from('users').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
};

// --- Transactions ---

export const createTransaction = async (transaction: Transaction, items: TransactionItem[]) => {
    const client = getClient();

    // 1. Create Transaction
    const { error: txError } = await client.from('transactions').insert(transaction);
    if (txError) throw txError;

    // 2. Create Items
    const { error: itemsError } = await client.from('transaction_items').insert(items);
    if (itemsError) throw itemsError;

    // 3. Update Stock
    for (const item of items) {
        const { data: product, error: getError } = await client.from('products').select('stock').eq('id', item.product_id).single();
        if (getError) throw getError;

        const { error: updateError } = await client.from('products').update({ stock: (product.stock || 0) - item.quantity }).eq('id', item.product_id);
        if (updateError) throw updateError;
    }
};

export const getTransactions = async (limitCount: number = 20, userId?: string): Promise<Transaction[]> => {
    let query = getClient().from('transactions').select('*').order('created_at', { ascending: false }).limit(limitCount);
    if (userId) {
        query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

export const getTransactionItems = async (transactionId: string): Promise<TransactionItem[]> => {
    const { data, error } = await getClient().from('transaction_items').select('*').eq('transaction_id', transactionId);
    if (error) throw error;
    return data || [];
};

export const getTransactionById = async (id: string): Promise<Transaction | null> => {
    const { data, error } = await getClient().from('transactions').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
};

// --- Discounts ---

export const getDiscounts = async (): Promise<Discount[]> => {
    const { data, error } = await getClient().from('discounts').select('*');
    if (error) throw error;
    return data || [];
};

export const insertDiscount = async (discount: Discount) => {
    const { error } = await getClient().from('discounts').upsert(discount);
    if (error) throw error;
};

export const updateDiscountDB = async (discount: Discount) => {
    const { error } = await getClient().from('discounts').update(discount).eq('id', discount.id);
    if (error) throw error;
};

export const deleteDiscountDB = async (id: string) => {
    const { error } = await getClient().from('discounts').delete().eq('id', id);
    if (error) throw error;
};
