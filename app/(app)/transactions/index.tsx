import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { useTranslation } from '@/utils/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HistoryScreen() {
    const router = useRouter();
    const t = useTranslation();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const { transactions, loadTransactions, isLoading } = useTransactionStore();

    useEffect(() => {
        if (user) {
            loadTransactions(100, user.role === 'admin' ? undefined : user.id);
        }
    }, [user]);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.transactionCard}
            onPress={() => router.push(`/(app)/transactions/${item.id}`)}
        >
            <View style={styles.txIcon}>
                <Ionicons name="receipt" size={20} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={styles.orderId}>{t.order} #{item.id.slice(-4).toUpperCase()}</Text>
                <Text style={styles.dateText}>
                    {new Date(item.created_at).toLocaleString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </Text>
                {item.payment_status && (
                    <View style={[
                        styles.statusBadge,
                        item.payment_status === 'completed' && styles.statusCompleted,
                        item.payment_status === 'pending' && styles.statusPending,
                        item.payment_status === 'failed' && styles.statusFailed,
                    ]}>
                        <Text style={[
                            styles.statusText,
                            item.payment_status === 'completed' && styles.statusTextCompleted,
                            item.payment_status === 'pending' && styles.statusTextPending,
                            item.payment_status === 'failed' && styles.statusTextFailed,
                        ]}>
                            {item.payment_status.toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.amountText}>
                    {formatCurrency(item.total_amount)}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>{t.recentTransactions}</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                onRefresh={() => loadTransactions(100, user?.role === 'admin' ? undefined : user?.id)}
                refreshing={isLoading}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color={theme.colors.border} />
                        <Text style={styles.emptyText}>{t.noTransactions}</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
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
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        marginBottom: 12,
        ...theme.shadows.small,
    },
    txIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    orderId: {
        fontWeight: '600',
        color: theme.colors.text,
        fontSize: 16,
        marginBottom: 2,
    },
    dateText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    amountText: {
        fontWeight: 'bold',
        color: theme.colors.primary,
        fontSize: 16,
        marginBottom: 4,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 4,
        backgroundColor: theme.colors.border,
    },
    statusCompleted: {
        backgroundColor: '#DCFCE7',
    },
    statusPending: {
        backgroundColor: '#FEF9C3',
    },
    statusFailed: {
        backgroundColor: '#FEE2E2',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.textSecondary,
    },
    statusTextCompleted: {
        color: '#166534',
    },
    statusTextPending: {
        color: '#854D0E',
    },
    statusTextFailed: {
        color: '#991B1B',
    },
});
