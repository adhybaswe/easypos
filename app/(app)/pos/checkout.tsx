import { CurrencyInput } from '@/components/ui/currency-input';
import { theme } from '@/constants/theme';
import { createTransaction } from '@/services/db';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCartStore } from '@/stores/useCartStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { useDiscountStore } from '@/stores/useDiscountStore';
import { Discount, Transaction, TransactionItem } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { translations } from '@/utils/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CheckoutScreen() {
    const router = useRouter();
    const { items, total, clearCart } = useCartStore();
    const { user } = useAuthStore();
    const { language, currencySymbol } = useConfigStore();
    const t = translations[language];

    const totalAmountBeforeDiscount = total();
    const { discounts, loadDiscounts } = useDiscountStore();
    const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');

    useEffect(() => {
        loadDiscounts();
    }, []);

    const discountAmount = selectedDiscount
        ? (selectedDiscount.type === 'percentage'
            ? (totalAmountBeforeDiscount * selectedDiscount.value / 100)
            : selectedDiscount.value)
        : 0;

    const totalAmount = Math.max(0, totalAmountBeforeDiscount - discountAmount);
    const change = paymentAmount ? parseFloat(paymentAmount) - totalAmount : 0;
    const isSufficient = change >= 0;

    const handlePayment = async () => {
        if (!paymentAmount) return;
        if (!isSufficient) {
            Alert.alert(t.common.error, t.checkout.insufficientPayment);
            return;
        }

        try {
            const transactionId = Date.now().toString();

            const transaction: Transaction = {
                id: transactionId,
                user_id: user?.id || 'unknown',
                subtotal: totalAmountBeforeDiscount,
                discount_id: selectedDiscount?.id,
                discount_amount: discountAmount,
                total_amount: totalAmount,
                payment_amount: parseFloat(paymentAmount),
                change_amount: change,
                created_at: new Date().toISOString()
            };

            const transactionItems: TransactionItem[] = items.map(item => ({
                id: Date.now().toString() + Math.random().toString().slice(2),
                transaction_id: transactionId,
                product_id: item.id,
                quantity: item.quantity,
                price: item.price
            }));

            await createTransaction(transaction, transactionItems);

            clearCart();

            router.replace({
                pathname: '/(app)/pos/success',
                params: {
                    id: transactionId,
                    change: change.toFixed(2),
                    total: totalAmount.toFixed(2)
                }
            });

        } catch (e: any) {
            Alert.alert(t.common.error, e.message);
        }
    };

    const suggestionAmounts = [
        Math.ceil(totalAmount),
        Math.ceil(totalAmount / 5) * 5,
        Math.ceil(totalAmount / 10) * 10,
        Math.ceil(totalAmount / 20) * 20,
        Math.ceil(totalAmount / 50) * 50,
        Math.ceil(totalAmount / 100) * 100,
    ].filter((v, i, a) => v >= totalAmount && a.indexOf(v) === i).slice(0, 4);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t.checkout.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        <Text style={styles.label}>{t.cart.total}</Text>
                        <Text style={[styles.totalAmount, selectedDiscount && styles.strikethrough]}>
                            {formatCurrency(totalAmountBeforeDiscount)}
                        </Text>

                        {selectedDiscount && (
                            <View style={styles.discountRow}>
                                <Text style={styles.discountLabel}>Diskon: {selectedDiscount.name}</Text>
                                <Text style={styles.discountValue}>-{formatCurrency(discountAmount)}</Text>
                            </View>
                        )}

                        {selectedDiscount && (
                            <Text style={styles.finalTotal}>{formatCurrency(totalAmount)}</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.discountPickerBtn}
                        onPress={() => setShowDiscountModal(true)}
                    >
                        <Ionicons name="pricetag-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.discountPickerText}>
                            {selectedDiscount ? 'Ganti Diskon' : 'Pilih Diskon / Promo'}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>{t.checkout.cashReceived}</Text>
                        <CurrencyInput
                            value={paymentAmount}
                            onChangeValue={setPaymentAmount}
                            placeholder="0"
                            autoFocus
                        />
                    </View>

                    {/* Quick Suggestions */}
                    {suggestionAmounts.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            <Text style={styles.suggestionsLabel}>{t.checkout.quickSelect}</Text>
                            <View style={styles.suggestions}>
                                {suggestionAmounts.map(amount => (
                                    <TouchableOpacity
                                        key={amount}
                                        style={styles.chip}
                                        onPress={() => setPaymentAmount(amount.toString())}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.chipText}>{formatCurrency(amount)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    <View style={styles.spacer} />

                    {/* Change / Remaining Card */}
                    {paymentAmount !== '' && (
                        <View style={[
                            styles.resultCard,
                            isSufficient ? styles.resultPositive : styles.resultNegative
                        ]}>
                            <Ionicons
                                name={isSufficient ? "checkmark-circle" : "alert-circle"}
                                size={32}
                                color={isSufficient ? theme.colors.success : theme.colors.error}
                                style={{ marginBottom: 8 }}
                            />
                            <Text style={styles.resultLabel}>
                                {isSufficient ? t.checkout.change : t.checkout.remaining}
                            </Text>
                            <Text style={[
                                styles.resultValue,
                                isSufficient ? styles.textPositive : styles.textNegative
                            ]}>
                                {formatCurrency(Math.abs(change))}
                            </Text>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.payBtn, !isSufficient && styles.payBtnDisabled]}
                        onPress={handlePayment}
                        disabled={!isSufficient}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.payText}>{t.checkout.completePayment}</Text>
                        {isSufficient && <Ionicons name="arrow-forward" size={20} color={theme.colors.white} />}
                    </TouchableOpacity>
                </View>

                {/* Discount Modal */}
                <Modal visible={showDiscountModal} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Pilih Diskon</Text>
                                <TouchableOpacity onPress={() => setShowDiscountModal(false)}>
                                    <Ionicons name="close" size={24} color={theme.colors.text} />
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={discounts.filter(d => d.is_active)}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.discountItem,
                                            selectedDiscount?.id === item.id && styles.discountItemActive
                                        ]}
                                        onPress={() => {
                                            setSelectedDiscount(selectedDiscount?.id === item.id ? null : item);
                                            setShowDiscountModal(false);
                                        }}
                                    >
                                        <View>
                                            <Text style={styles.discountItemName}>{item.name}</Text>
                                            <Text style={styles.discountItemValue}>
                                                {item.type === 'percentage' ? `${item.value}%` : formatCurrency(item.value)}
                                            </Text>
                                        </View>
                                        {selectedDiscount?.id === item.id && (
                                            <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <View style={styles.emptyDiscounts}>
                                        <Text style={styles.emptyDiscountsText}>Tidak ada diskon aktif</Text>
                                    </View>
                                }
                            />
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
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
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 50 : 60,
        paddingBottom: 20,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
    },
    content: {
        padding: 24,
    },
    card: {
        backgroundColor: theme.colors.card,
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 32,
        ...theme.shadows.medium,
    },
    label: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 8,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    totalAmount: {
        fontSize: 42,
        fontWeight: '800',
        color: theme.colors.text,
    },
    inputContainer: {
        marginBottom: 32,
        position: 'relative',
    },
    input: {
        backgroundColor: theme.colors.card,
        fontSize: 32,
        fontWeight: '700',
        padding: 20,
        paddingLeft: 40,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: theme.colors.border,
        color: theme.colors.text,
    },
    currencyBadge: {
        position: 'absolute',
        left: 20,
        top: 28,
    },
    currencyText: {
        fontSize: 24,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    suggestionsContainer: {
        marginBottom: 24,
    },
    suggestionsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: 12,
        marginLeft: 4,
    },
    suggestions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    chip: {
        backgroundColor: theme.colors.card,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        minWidth: 80,
        alignItems: 'center',
    },
    chipText: {
        color: theme.colors.text,
        fontWeight: '600',
        fontSize: 16,
    },
    resultCard: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
        borderWidth: 1,
    },
    resultPositive: {
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.success,
    },
    resultNegative: {
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.error,
    },
    resultLabel: {
        fontSize: 14,
        color: theme.colors.text,
        marginBottom: 4,
        fontWeight: '600',
    },
    resultValue: {
        fontSize: 32,
        fontWeight: '700',
    },
    textPositive: {
        color: theme.colors.success,
    },
    textNegative: {
        color: theme.colors.error,
    },
    spacer: {
        height: 20,
    },
    footer: {
        padding: 24,
        backgroundColor: theme.colors.card,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    payBtn: {
        backgroundColor: theme.colors.primary,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        ...theme.shadows.medium,
    },
    payBtnDisabled: {
        backgroundColor: theme.colors.textSecondary,
        shadowOpacity: 0,
        elevation: 0,
    },
    payText: {
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: '700',
    },
    strikethrough: {
        textDecorationLine: 'line-through',
        fontSize: 24,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    discountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    discountLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    discountValue: {
        fontSize: 14,
        color: theme.colors.error,
        fontWeight: '700',
    },
    finalTotal: {
        fontSize: 42,
        fontWeight: '800',
        color: theme.colors.primary,
        marginTop: 8,
    },
    discountPickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 24,
        gap: 12,
    },
    discountPickerText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: '40%',
        maxHeight: '80%',
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
    },
    discountItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 12,
    },
    discountItemActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '10',
    },
    discountItemName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    discountItemValue: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '700',
        marginTop: 4,
    },
    emptyDiscounts: {
        padding: 40,
        alignItems: 'center',
    },
    emptyDiscountsText: {
        color: theme.colors.textSecondary,
        fontSize: 16,
    },
});
