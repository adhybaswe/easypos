import { theme } from '@/constants/theme';
import * as db from '@/services/db';
import { getXenditQRCode } from '@/services/xendit';
import { useConfigStore } from '@/stores/useConfigStore';
import { Product, Transaction, TransactionItem } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { useTranslation } from '@/utils/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TransactionDetailScreen() {
    const router = useRouter();
    useConfigStore(); // Subscribe to updates
    const t = useTranslation();
    const { id } = useLocalSearchParams();

    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [items, setItems] = useState<TransactionItem[]>([]);
    const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
    const [cashierName, setCashierName] = useState<string>('Unknown');
    const [loading, setLoading] = useState(true);
    const [checkingStatus, setCheckingStatus] = useState(false);

    useEffect(() => {
        if (id) {
            loadDetails(id as string);
        }
    }, [id]);

    const loadDetails = async (txId: string) => {
        try {
            const tx = await db.getTransactionById(txId);
            const txItems = await db.getTransactionItems(txId);
            const allProducts = await db.getProducts();

            const pMap: Record<string, Product> = {};
            allProducts.forEach(p => pMap[p.id] = p);

            setTransaction(tx);
            setItems(txItems);
            setProductsMap(pMap);

            if (tx && tx.user_id) {
                const user = await db.getUserById(tx.user_id);
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

    const handleCheckStatus = async () => {
        if (!id || !transaction?.xendit_external_id) return;

        setCheckingStatus(true);
        try {
            const status = await getXenditQRCode(transaction.xendit_external_id);
            console.log("Xendit Status:", status.status);

            if (status.status === 'COMPLETED' || status.status === 'PAID') {
                // Update di Supabase
                const { getClient } = await import('@/services/supabase');
                const client = getClient();
                await client.from('transactions')
                    .update({ payment_status: 'completed' })
                    .eq('id', id);

                Alert.alert("Sukses", "Pembayaran telah terverifikasi dan status diperbarui.");
                loadDetails(id as string);
            } else {
                Alert.alert("Info", `Status pembayaran saat ini: ${status.status.toLowerCase()}`);
            }
        } catch (e: any) {
            Alert.alert("Error", e.message || "Gagal mengecek status ke Xendit");
        } finally {
            setCheckingStatus(false);
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
                <Text style={{ color: theme.colors.text }}>{t.transactionDetail.notFound}</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                    <Text style={{ color: theme.colors.primary }}>{t.transactionDetail.goBack}</Text>
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
                <Text style={styles.title}>{t.transactionDetail.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.label}>{t.transactionDetail.transactionId}</Text>
                    <Text style={styles.value}>{transaction.id}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.label}>{t.transactionDetail.date}</Text>
                    <Text style={styles.value}>{new Date(transaction.created_at).toLocaleString()}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.label}>{t.transactionDetail.cashier}</Text>
                    <Text style={styles.value}>{cashierName}</Text>

                    {transaction.payment_method === 'xendit' && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.statusSection}>
                                <View>
                                    <Text style={styles.label}>Status Pembayaran</Text>
                                    <View style={[
                                        styles.statusBadge,
                                        transaction.payment_status === 'completed' ? styles.statusCompleted : styles.statusPending
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            transaction.payment_status === 'completed' ? styles.statusTextCompleted : styles.statusTextPending
                                        ]}>
                                            {(transaction.payment_status || 'PENDING').toUpperCase()}
                                        </Text>
                                    </View>
                                </View>

                                {transaction.payment_status !== 'completed' && (
                                    <TouchableOpacity
                                        style={styles.checkStatusBtn}
                                        onPress={handleCheckStatus}
                                        disabled={checkingStatus}
                                    >
                                        {checkingStatus ? (
                                            <ActivityIndicator size="small" color={theme.colors.white} />
                                        ) : (
                                            <>
                                                <Ionicons name="refresh" size={16} color={theme.colors.white} />
                                                <Text style={styles.checkStatusText}>Cek Status</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}
                </View>

                <Text style={styles.sectionHeader}>{t.transactionDetail.items}</Text>
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
                        <Text style={styles.summaryLabel}>{t.transactionDetail.total}</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(transaction.total_amount)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>{t.transactionDetail.payment}</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(transaction.payment_amount)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>{t.transactionDetail.change}</Text>
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
    statusSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    statusCompleted: {
        backgroundColor: '#DCFCE7',
    },
    statusPending: {
        backgroundColor: '#FEF9C3',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    statusTextCompleted: {
        color: '#166534',
    },
    statusTextPending: {
        color: '#854D0E',
    },
    checkStatusBtn: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 6,
    },
    checkStatusText: {
        color: theme.colors.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
});
