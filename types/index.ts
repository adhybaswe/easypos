export type Role = 'admin' | 'cashier';

export interface User {
    id: string;
    username: string;
    password_hash?: string; // We might not store this on client, or minimal for mock
    role: Role;
    is_active: boolean;
}

export interface Category {
    id: string;
    name: string;
}

export interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    category_id: string;
    sku?: string;
    image_uri?: string;
}

export interface TransactionItem {
    id: string;
    transaction_id: string;
    product_id: string;
    quantity: number;
    price: number; // Price at the time of transaction
}

export interface Discount {
    id: string;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    is_active: boolean;
}

export interface Transaction {
    id: string;
    user_id: string;
    total_amount: number;
    payment_amount: number;
    change_amount: number;
    discount_id?: string;
    discount_amount?: number;
    subtotal?: number;
    payment_method?: 'cash' | 'xendit';
    payment_status?: 'pending' | 'completed' | 'failed';
    xendit_invoice_url?: string;
    xendit_external_id?: string;
    created_at: string; // ISO string
    items?: TransactionItem[];
}

export interface AppConfig {
    backendType: 'firebase' | 'sqlite' | 'supabase' | null;
    sqliteConfig?: {
        databaseName: string;
    };
    firebaseConfig?: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
    };
    supabaseConfig?: {
        supabaseUrl: string;
        supabaseAnonKey: string;
    };
    xenditConfig?: {
        secretKey: string;
        webhookUrl?: string;
    };
    currencySymbol: string; // e.g. 'Rp', '$'
    currencyLocale: string; // e.g. 'id-ID', 'en-US'
    isSetupComplete: boolean;
}
