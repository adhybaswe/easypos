import { theme } from '@/constants/theme';
import * as db from '@/services/db';
import { useConfigStore } from '@/stores/useConfigStore';
import { Product, Transaction, TransactionItem } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TransactionDetailScreen() {
    const router = useRouter();
    useConfigStore(); // Subscribe to updates
    const { id } = useLocalSearchParams();

    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [items, setItems] = useState<TransactionItem[]>([]);
    const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
    const [cashierName, setCashierName] = useState<string>('Unknown');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadDetails(id as string);
        }
    }, [id]);

    const loadDetails = (txId: string) => {
        try {
            const tx = db.getTransactionById(txId);
            const txItems = db.getTransactionItems(txId);
            const allProducts = db.getProducts();

            const pMap: Record<string, Product> = {};
            allProducts.forEach(p => pMap[p.id] = p);

            setTransaction(tx);
            setItems(txItems);
            setProductsMap(pMap);

            if (tx && tx.user_id) {
                const user = db.getUserById(tx.user_id);
                if (user) {
                    setCashierName(user.username);
                } else {
                    setCashierName(tx.user_id);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!transaction) {
        return (
            <View style={styles.center}>
                <Text style={{ color: theme.colors.text }}>Transaction not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                    <Text style={{ color: theme.colors.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Transaction Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.label}>Transaction ID</Text>
                    <Text style={styles.value}>{transaction.id}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.label}>Date</Text>
                    <Text style={styles.value}>{new Date(transaction.created_at).toLocaleString()}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.label}>Cashier</Text>
                    <Text style={styles.value}>{cashierName}</Text>
                </View>

                <Text style={styles.sectionHeader}>Items</Text>
                <View style={styles.card}>
                    {items.map((item, index) => {
                        const product = productsMap[item.product_id];
                        return (
                            <View key={item.id} style={[styles.itemRow, index < items.length - 1 && styles.borderBottom]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemName}>{product?.name || 'Unknown Product'}</Text>
                                    <Text style={styles.itemMeta}>{item.quantity} x {formatCurrency(item.price)}</Text>
                                </View>
                                <Text style={styles.itemTotal}>{formatCurrency(item.quantity * item.price)}</Text>
                            </View>
                        );
                    })}
                </View>

                <View style={styles.card}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(transaction.total_amount)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Payment</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(transaction.payment_amount)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Change</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(transaction.change_amount)}</Text>
                    </View>
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
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 60,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backBtn: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: theme.colors.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        ...theme.shadows.small,
    },
    label: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: theme.colors.text,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 12,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 4,
        color: theme.colors.textSecondary,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.lightGray,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
        color: theme.colors.text,
    },
    itemMeta: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    itemTotal: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
});
