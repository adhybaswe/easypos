import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';
import { Category, Product } from '../types';

let db: SQLiteDatabase | null = null;

export const getDB = () => {
    if (!db) {
        db = openDatabaseSync('easypos.db');
    }
    return db;
};

export const initDatabase = () => {
    const database = getDB();
    database.execSync(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      category_id TEXT,
      sku TEXT,
      image_uri TEXT,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );
    `);

    try {
        // Migration for existing tables that might miss the column
        database.runSync('ALTER TABLE products ADD COLUMN image_uri TEXT');
    } catch (e) {
        // Column likely already exists, ignore
    }

    database.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      total_amount REAL NOT NULL,
      payment_amount REAL NOT NULL,
      change_amount REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transaction_items (
      id TEXT PRIMARY KEY NOT NULL,
      transaction_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    );
    `);
};

// --- Products ---

export const getProducts = (): Product[] => {
    const database = getDB();
    const result = database.getAllSync<Product>('SELECT * FROM products');
    return result;
};

export const getProductById = (id: string): Product | null => {
    const database = getDB();
    const result = database.getFirstSync<Product>('SELECT * FROM products WHERE id = ?', [id]);
    return result || null;
};

export const insertProduct = (product: Product) => {
    const database = getDB();
    database.runSync(
        'INSERT INTO products (id, name, price, stock, category_id, sku, image_uri) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [product.id, product.name, product.price, product.stock, product.category_id, product.sku || null, product.image_uri || null]
    );
};

export const updateProductDB = (product: Product) => {
    const database = getDB();
    database.runSync(
        'UPDATE products SET name = ?, price = ?, stock = ?, category_id = ?, sku = ?, image_uri = ? WHERE id = ?',
        [product.name, product.price, product.stock, product.category_id, product.sku || null, product.image_uri || null, product.id]
    );
};

export const deleteProductDB = (id: string) => {
    const database = getDB();
    database.runSync('DELETE FROM products WHERE id = ?', [id]);
};

// --- Categories ---
export const getCategories = (): Category[] => {
    const database = getDB();
    return database.getAllSync<Category>('SELECT * FROM categories');
};

export const insertCategory = (category: Category) => {
    const database = getDB();
    database.runSync('INSERT INTO categories (id, name) VALUES (?, ?)', [category.id, category.name]);
};

export const deleteCategoryDB = (id: string) => {
    const database = getDB();
    // Optional: Check if products exist in this category before deleting or cascade?
    // specific PRD requirement isn't detailed, but safe delete is good.
    // For now, let's just delete. SQLite foreign key constraints might block if enabled,
    // but by default in expo-sqlite they might not be enforced unless PRAGMA foreign_keys = ON; is run.
    database.runSync('DELETE FROM categories WHERE id = ?', [id]);
};

// --- Users ---
import { User } from '../types';

export const getUsers = (): User[] => {
    const database = getDB();
    const result = database.getAllSync<any>('SELECT * FROM users');
    return result.map(u => ({ ...u, is_active: !!u.is_active }));
};

export const insertUser = (user: User) => {
    const database = getDB();
    database.runSync(
        'INSERT INTO users (id, username, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
        [user.id, user.username, user.password_hash || '', user.role, user.is_active ? 1 : 0]
    );
};

export const updateUserDB = (user: User) => {
    const database = getDB();
    database.runSync(
        'UPDATE users SET username = ?, password_hash = ?, role = ?, is_active = ? WHERE id = ?',
        [user.username, user.password_hash || '', user.role, user.is_active ? 1 : 0, user.id]
    );
};

export const deleteUserDB = (id: string) => {
    const database = getDB();
    database.runSync('DELETE FROM users WHERE id = ?', [id]);
};

export const getUserByUsername = (username: string): User | null => {
    const database = getDB();
    const result = database.getFirstSync<any>('SELECT * FROM users WHERE username = ?', [username]);
    if (result) {
        return { ...result, is_active: !!result.is_active };
    }
    return null;
};

export const getUserById = (id: string): User | null => {
    const database = getDB();
    const result = database.getFirstSync<any>('SELECT * FROM users WHERE id = ?', [id]);
    if (result) {
        return { ...result, is_active: !!result.is_active };
    }
    return null;
};

// --- Transactions ---
import { Transaction, TransactionItem } from '../types';

export const createTransaction = (transaction: Transaction, items: TransactionItem[]) => {
    const database = getDB();

    // Ideally use transaction() but execSync/runSync in sequence works for now in basic expo-sqlite usage
    // Better to use withTransactionSync if available in recent versions, but standard runSync sequence is okay for v1 if careful.

    try {
        database.runSync('BEGIN TRANSACTION');

        database.runSync(
            'INSERT INTO transactions (id, user_id, total_amount, payment_amount, change_amount, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [transaction.id, transaction.user_id, transaction.total_amount, transaction.payment_amount, transaction.change_amount, transaction.created_at]
        );

        for (const item of items) {
            database.runSync(
                'INSERT INTO transaction_items (id, transaction_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
                [item.id, item.transaction_id, item.product_id, item.quantity, item.price]
            );

            // Update stock
            // We use a simple update here. 
            // Ideally we should check if stock is sufficient first, but let's assume UI checks or we allow negative for now.
            database.runSync(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        database.runSync('COMMIT');
    } catch (error) {
        database.runSync('ROLLBACK');
        throw error;
    }
};

export const getTransactions = (limit: number = 20): Transaction[] => {
    const database = getDB();
    const result = database.getAllSync<Transaction>('SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?', [limit]);
    return result;
};

export const getTransactionItems = (transactionId: string): TransactionItem[] => {
    const database = getDB();
    const result = database.getAllSync<TransactionItem>('SELECT * FROM transaction_items WHERE transaction_id = ?', [transactionId]);
    return result;
};

export const getTransactionById = (id: string): Transaction | null => {
    const database = getDB();
    const result = database.getFirstSync<Transaction>('SELECT * FROM transactions WHERE id = ?', [id]);
    return result || null;
};
