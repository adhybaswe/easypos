import { theme } from '@/constants/theme';
import { useCartStore } from '@/stores/useCartStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { translations } from '@/utils/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CartScreen() {
    const router = useRouter();
    const { language } = useConfigStore();
    const t = translations[language];

    // Explicitly select items to ensure updates trigger re-render
    const items = useCartStore((state) => state.items);
    const { updateQuantity, removeFromCart, clearCart } = useCartStore();

    // Calculate total locally to ensure it updates with items
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleClear = () => {
        Alert.alert(t.cart.clearCart, t.common.areYouSure, [
            { text: t.common.cancel, style: 'cancel' },
            { text: t.cart.clearCart, style: 'destructive', onPress: clearCart }
        ]);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardInfo}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>{formatCurrency(item.price)}</Text>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                >
                    <Ionicons name="remove" size={16} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantity}</Text>
                <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                >
                    <Ionicons name="add" size={16} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(item.id)}>
                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>{t.cart.title}</Text>
                <TouchableOpacity onPress={handleClear} disabled={items.length === 0}>
                    <Text style={[styles.clearText, items.length === 0 && styles.disabledText]}>{t.cart.clearCart}</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={items}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>{t.cart.empty}</Text>
                    </View>
                }
            />

            {items.length > 0 && (
                <View style={styles.footer}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>{t.cart.total}</Text>
                        <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.checkoutBtn}
                        onPress={() => router.push('/(app)/pos/checkout')}
                    >
                        <Text style={styles.checkoutText}>{t.cart.checkout}</Text>
                    </TouchableOpacity>
                </View>
            )}
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
        paddingTop: 60,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backBtn: {
        padding: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    clearText: {
        color: theme.colors.error,
        fontSize: 16,
    },
    disabledText: {
        color: theme.colors.textSecondary,
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: theme.colors.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        ...theme.shadows.small,
    },
    cardInfo: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    price: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.lightGray,
        borderRadius: 8,
    },
    qtyBtn: {
        padding: 8,
    },
    qty: {
        paddingHorizontal: 8,
        fontWeight: '600',
        minWidth: 24,
        textAlign: 'center',
        color: theme.colors.text,
    },
    removeBtn: {
        padding: 8,
    },
    empty: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: theme.colors.textSecondary,
    },
    footer: {
        padding: 24,
        backgroundColor: theme.colors.card,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        ...theme.shadows.medium,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        alignItems: 'flex-end',
    },
    totalLabel: {
        fontSize: 18,
        color: theme.colors.textSecondary,
    },
    totalValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    checkoutBtn: {
        backgroundColor: theme.colors.primary,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    checkoutText: {
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
