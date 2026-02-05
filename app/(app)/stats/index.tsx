import { theme } from '@/constants/theme';
import * as db from '@/services/db';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProductStore } from '@/stores/useProductStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useUserManagementStore } from '@/stores/useUserManagementStore';
import { Product } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { useTranslation } from '@/utils/i18n';
import { exportToCSV, exportToPDF } from '@/utils/reportExporter';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StatsScreen() {
    const router = useRouter();
    const t = useTranslation();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const { transactions, loadTransactions } = useTransactionStore();
    const { products, loadData: loadProducts } = useProductStore();
    const { users, loadUsers } = useUserManagementStore();
    const { showActionSheetWithOptions } = useActionSheet();
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [topProducts, setTopProducts] = useState<{ product: Product; quantity: number }[]>([]);

    useEffect(() => {
        const init = async () => {
            if (!user) return;
            setLoading(true);
            await loadTransactions(500, user.role === 'admin' ? undefined : user.id); // Filter if not admin
            await loadProducts();
            await loadUsers();
            await calculateTopProducts();
            setLoading(false);
        };
        init();
    }, [user]);

    const handleExport = async () => {
        // Use store state to ensure we're exporting the most current data
        const currentTransactions = useTransactionStore.getState().transactions;
        const currentUsers = useUserManagementStore.getState().users;

        const options = ['Export as PDF', 'Export as CSV', t.common.cancel];
        const cancelButtonIndex = 2;

        showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex,
                title: 'Pilih Format Laporan',
            },
            async (selectedIndex?: number) => {
                if (selectedIndex === undefined || selectedIndex === cancelButtonIndex) return;

                setExporting(true);
                try {
                    if (selectedIndex === 0) {
                        await exportToPDF(currentTransactions, currentUsers);
                    } else if (selectedIndex === 1) {
                        await exportToCSV(currentTransactions, currentUsers);
                    }
                } catch (error) {
                    Alert.alert('Error', 'Gagal mengekspor laporan');
                } finally {
                    setExporting(false);
                }
            }
        );
    };

    const calculateTopProducts = async () => {
        try {
            const currentTransactions = useTransactionStore.getState().transactions;
            const currentProducts = useProductStore.getState().products;

            const itemsMap: Record<string, number> = {};
            // To be efficient, we only check items from the last 100 transactions
            const recentTxs = currentTransactions.slice(0, 100);

            for (const tx of recentTxs) {
                const items = await db.getTransactionItems(tx.id);
                items.forEach(item => {
                    itemsMap[item.product_id] = (itemsMap[item.product_id] || 0) + item.quantity;
                });
            }

            const sorted = Object.entries(itemsMap)
                .map(([id, qty]) => ({
                    product: currentProducts.find(p => p.id === id)!,
                    quantity: qty
                }))
                .filter(item => item.product)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);

            setTopProducts(sorted);
        } catch (e) {
            console.error(e);
        }
    };

    const stats = useMemo(() => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        const todayTransactions = transactions.filter(tx => tx.created_at.startsWith(today));
        const totalRevenue = transactions.reduce((sum, tx) => sum + tx.total_amount, 0);
        const todayRevenue = todayTransactions.reduce((sum, tx) => sum + tx.total_amount, 0);

        // Sales for last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayRevenue = transactions
                .filter(tx => tx.created_at.startsWith(dateStr))
                .reduce((sum, tx) => sum + tx.total_amount, 0);
            return {
                day: d.toLocaleDateString([], { weekday: 'short' }),
                revenue: dayRevenue
            };
        }).reverse();

        const maxDayRevenue = Math.max(...last7Days.map(d => d.revenue), 1);

        return {
            totalRevenue,
            todayRevenue,
            todayCount: todayTransactions.length,
            avgOrder: transactions.length > 0 ? totalRevenue / transactions.length : 0,
            last7Days,
            maxDayRevenue
        };
    }, [transactions]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Statistik Bisnis</Text>
                {user?.role === 'admin' ? (
                    <TouchableOpacity
                        onPress={handleExport}
                        style={styles.exportBtn}
                        disabled={exporting}
                    >
                        {exporting ? (
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : (
                            <Ionicons name="share-outline" size={24} color={theme.colors.primary} />
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Summary Cards */}
                <View style={styles.summaryGrid}>
                    <View style={[styles.summaryCard, { backgroundColor: '#E0F2FE' }]}>
                        <Ionicons name="cash" size={24} color="#0284C7" />
                        <Text style={styles.summaryLabel}>Total Pendapatan</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(stats.totalRevenue)}</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: '#F0FDF4' }]}>
                        <Ionicons name="today" size={24} color="#16A34A" />
                        <Text style={styles.summaryLabel}>Hari Ini</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(stats.todayRevenue)}</Text>
                    </View>
                </View>

                <View style={styles.summaryGrid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statBoxLabel}>Total Pesanan</Text>
                        <Text style={styles.statBoxValue}>{transactions.length}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statBoxLabel}>Rata-rata Pesanan</Text>
                        <Text style={styles.statBoxValue}>{formatCurrency(stats.avgOrder)}</Text>
                    </View>
                </View>

                {/* Revenue Chart */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pendapatan 7 Hari Terakhir</Text>
                    <View style={styles.chartContainer}>
                        {stats.last7Days.map((day, i) => (
                            <View key={i} style={styles.chartBarWrapper}>
                                <View style={styles.chartBarContainer}>
                                    <View
                                        style={[
                                            styles.chartBar,
                                            { height: `${(day.revenue / stats.maxDayRevenue) * 100}%` }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.chartLabel}>{day.day}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Top Products */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Produk Terlaris</Text>
                    {topProducts.length > 0 ? (
                        topProducts.map((item, index) => (
                            <View key={item.product.id} style={styles.topProductRow}>
                                <View style={styles.rankingBadge}>
                                    <Text style={styles.rankingText}>{index + 1}</Text>
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.productName}>{item.product.name}</Text>
                                    <Text style={styles.productCategory}>Terjual {item.quantity} unit</Text>
                                </View>
                                <Text style={styles.productTotal}>
                                    {formatCurrency(item.quantity * item.product.price)}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyProduct}>
                            <Text style={styles.emptyText}>Belum ada data penjualan produk</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backBtn: {
        padding: 8,
    },
    exportBtn: {
        padding: 8,
        width: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    summaryGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    summaryCard: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        ...theme.shadows.small,
    },
    summaryLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 8,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    statBox: {
        flex: 1,
        backgroundColor: theme.colors.card,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    statBoxLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    statBoxValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    section: {
        marginTop: 32,
        padding: 24,
        backgroundColor: theme.colors.card,
        borderRadius: 24,
        ...theme.shadows.small,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 10,
    },
    chartContainer: {
        flexDirection: 'row',
        height: 150,
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginTop: 30
    },
    chartBarWrapper: {
        alignItems: 'center',
        flex: 1,
    },
    chartBarContainer: {
        height: '100%',
        width: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 6,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    chartBar: {
        width: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 6,
    },
    chartLabel: {
        marginTop: 8,
        fontSize: 10,
        color: theme.colors.textSecondary,
    },
    topProductRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    rankingBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.lightGray,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankingText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
    },
    productCategory: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    productTotal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    emptyProduct: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    }
});
