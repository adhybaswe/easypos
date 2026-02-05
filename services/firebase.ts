import { useConfigStore } from '@/stores/useConfigStore';
import { Category, Discount, Product, Transaction, TransactionItem, User } from '@/types';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
    collection,
    deleteDoc,
    doc,
    Firestore,
    getDoc,
    getDocs,
    getFirestore,
    increment,
    limit,
    orderBy,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

export const initFirebase = async () => {
    const { firebaseConfig } = useConfigStore.getState();
    if (!firebaseConfig) {
        throw new Error("Firebase config is missing");
    }

    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    db = getFirestore(app);
};

const getDB = (): Firestore => {
    if (!db) {
        // If not initialized, try to init with stored config (if possible, but usually initFirebase should be called first)
        const apps = getApps();
        if (apps.length) {
            db = getFirestore(apps[0]);
        } else {
            throw new Error("Firebase not initialized. Call initFirebase first.");
        }
    }
    return db;
};

// --- Products ---

export const getProducts = async (): Promise<Product[]> => {
    const db = getDB();
    const querySnapshot = await getDocs(collection(db, "products"));
    return querySnapshot.docs.map(doc => doc.data() as Product);
};

export const getProductById = async (id: string): Promise<Product | null> => {
    const db = getDB();
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Product) : null;
};

// Helper to remove undefined fields
const sanitizeData = (data: any) => {
    return Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
    );
};

export const insertProduct = async (product: Product) => {
    const db = getDB();
    await setDoc(doc(db, "products", product.id), sanitizeData(product));
};

export const updateProductDB = async (product: Product) => {
    const db = getDB();
    await updateDoc(doc(db, "products", product.id), sanitizeData(product));
};

export const deleteProductDB = async (id: string) => {
    const db = getDB();
    await deleteDoc(doc(db, "products", id));
};

// --- Categories ---

export const getCategories = async (): Promise<Category[]> => {
    const db = getDB();
    const querySnapshot = await getDocs(collection(db, "categories"));
    return querySnapshot.docs.map(doc => doc.data() as Category);
};

export const insertCategory = async (category: Category) => {
    const db = getDB();
    await setDoc(doc(db, "categories", category.id), category);
};

export const deleteCategoryDB = async (id: string) => {
    const db = getDB();
    await deleteDoc(doc(db, "categories", id));
};

// --- Users ---

export const getUsers = async (): Promise<User[]> => {
    const db = getDB();
    const querySnapshot = await getDocs(collection(db, "users"));
    return querySnapshot.docs.map(doc => doc.data() as User);
};

export const insertUser = async (user: User) => {
    const db = getDB();
    await setDoc(doc(db, "users", user.id), user);
};

export const updateUserDB = async (user: User) => {
    const db = getDB();
    await updateDoc(doc(db, "users", user.id), { ...user });
};

export const deleteUserDB = async (id: string) => {
    const db = getDB();
    await deleteDoc(doc(db, "users", id));
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
    const db = getDB();
    const q = query(collection(db, "users"), where("username", "==", username));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as User;
    }
    return null;
};

export const getUserById = async (id: string): Promise<User | null> => {
    const db = getDB();
    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as User) : null;
};

// --- Transactions ---

export const createTransaction = async (transaction: Transaction, items: TransactionItem[]) => {
    const db = getDB();

    // Firestore transactions/batch
    const batch = writeBatch(db);

    // 1. Create Transaction
    const txRef = doc(db, "transactions", transaction.id);
    batch.set(txRef, transaction);

    // 2. Create Items & Update Stock
    for (const item of items) {
        // Create Item
        const itemRef = doc(db, "transaction_items", item.id);
        batch.set(itemRef, item);

        // Update Product Stock
        const productRef = doc(db, "products", item.product_id);
        batch.update(productRef, { stock: increment(-item.quantity) });
    }

    await batch.commit();
};

export const getTransactions = async (limitCount: number = 20, userId?: string): Promise<Transaction[]> => {
    const db = getDB();
    let q;
    if (userId) {
        q = query(collection(db, "transactions"), where("user_id", "==", userId), orderBy("created_at", "desc"), limit(limitCount));
    } else {
        q = query(collection(db, "transactions"), orderBy("created_at", "desc"), limit(limitCount));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Transaction);
};

export const getTransactionItems = async (transactionId: string): Promise<TransactionItem[]> => {
    const db = getDB();
    const q = query(collection(db, "transaction_items"), where("transaction_id", "==", transactionId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as TransactionItem);
};

export const getTransactionById = async (id: string): Promise<Transaction | null> => {
    const db = getDB();
    const docRef = doc(db, "transactions", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Transaction) : null;
};

// --- Discounts ---

export const getDiscounts = async (): Promise<Discount[]> => {
    const db = getDB();
    const querySnapshot = await getDocs(collection(db, "discounts"));
    return querySnapshot.docs.map(doc => doc.data() as Discount);
};

export const insertDiscount = async (discount: Discount) => {
    const db = getDB();
    await setDoc(doc(db, "discounts", discount.id), discount);
};

export const updateDiscountDB = async (discount: Discount) => {
    const db = getDB();
    await updateDoc(doc(db, "discounts", discount.id), { ...discount });
};

export const deleteDiscountDB = async (id: string) => {
    const db = getDB();
    await deleteDoc(doc(db, "discounts", id));
};
