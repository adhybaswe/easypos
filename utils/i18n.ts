import { useConfigStore } from '@/stores/useConfigStore';

export const translations = {
    id: {
        settings: 'Pengaturan',
        loggedInAs: 'Masuk sebagai',
        logout: 'Keluar',
        language: 'Bahasa',
        changeLanguage: 'Ganti Bahasa',
        english: 'Inggris',
        indonesian: 'Indonesia',
        cancel: 'Batal',
        confirm: 'Konfirmasi',
        dashboard: 'Dasbor',
        pos: 'Kasir',
        hello: 'Halo',
        adminDashboard: 'Dasbor Admin',
        totalTransactions: 'Total Transaksi',
        revenue: 'Pendapatan',
        manageProducts: 'Kelola Produk',
        manageCategories: 'Kelola Kategori',
        manageUsers: 'Kelola Pengguna',
        viewReports: 'Lihat Laporan',
        cashierPos: 'Kasir POS',
        newTransaction: 'Transaksi Baru',
        recentTransactions: 'Transaksi Terakhir',
        noTransactions: 'Belum ada transaksi',
        order: 'Pesanan',
    },
    en: {
        settings: 'Settings',
        loggedInAs: 'Logged in as',
        logout: 'Log Out',
        language: 'Language',
        changeLanguage: 'Change Language',
        english: 'English',
        indonesian: 'Indonesian',
        cancel: 'Cancel',
        confirm: 'Confirm',
        dashboard: 'Dashboard',
        pos: 'POS',
        hello: 'Hello',
        adminDashboard: 'Admin Dashboard',
        totalTransactions: 'Total Transactions',
        revenue: 'Revenue',
        manageProducts: 'Manage Products',
        manageCategories: 'Manage Categories',
        manageUsers: 'Manage Users',
        viewReports: 'View Reports',
        cashierPos: 'Cashier POS',
        newTransaction: 'New Transaction',
        recentTransactions: 'Recent Transactions',
        noTransactions: 'No transactions yet',
        order: 'Order',
    }
};

export const useTranslation = () => {
    const language = useConfigStore((state) => state.language);
    return translations[language] || translations.en;
};
