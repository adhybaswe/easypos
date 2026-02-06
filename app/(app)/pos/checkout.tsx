import { CurrencyInput } from '@/components/ui/currency-input';
import { theme } from '@/constants/theme';
import { createTransaction } from '@/services/db';
import { createXenditQRCode, getXenditQRCode } from '@/services/xendit';
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
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CheckoutScreen() {
    const router = useRouter();
    const { items, total, clearCart } = useCartStore();
    const { user } = useAuthStore();
    const { language, currencySymbol, backendType, xenditConfig } = useConfigStore();
    const t = translations[language];

    const totalAmountBeforeDiscount = total();
    const { discounts, loadDiscounts } = useDiscountStore();
    const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'xendit'>(
        backendType === 'supabase' && xenditConfig?.secretKey ? 'xendit' : 'cash'
    );
    const [isProcessing, setIsProcessing] = useState(false);
    const [qrString, setQrString] = useState<string | null>(null);
    const [qrId, setQrId] = useState<string | null>(null); // Xendit ID (For Polling)
    const [externalQrId, setExternalQrId] = useState<string | null>(null); // External ID (For Display/Sim)
    const [showQRModal, setShowQRModal] = useState(false);
    const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);

    useEffect(() => {
        loadDiscounts();
    }, []);

    // Polling logic for QRIS status
    useEffect(() => {
        let interval: any;

        if (showQRModal && qrId) {
            console.log("Memulai polling untuk QR:", qrId);
            interval = setInterval(async () => {
                try {
                    // 1. Cek status di Xendit
                    const status = await getXenditQRCode(qrId);
                    console.log("Status QR Xendit:", status.status);

                    // 2. Cek status di Supabase (sebagai cadangan jika webhook sudah masuk)
                    let isCompletedInDb = false;
                    if (backendType === 'supabase' && currentTransactionId) {
                        const { getClient } = await import('@/services/supabase');
                        const { data } = await getClient()
                            .from('transactions')
                            .select('payment_status')
                            .eq('id', currentTransactionId)
                            .single();
                        isCompletedInDb = data?.payment_status === 'completed';
                    }

                    // Jika Xendit bilang sukses ATAU Berubah jadi INACTIVE 
                    // ATAU Database sudah terupdate oleh Webhook
                    if (status.status === 'COMPLETED' || status.status === 'PAID' || status.status === 'INACTIVE' || isCompletedInDb) {
                        console.log("Pembayaran Terdeteksi (Via API/DB/Webhook)! Mengalihkan...");
                        clearInterval(interval);
                        handleFinishTransaction();
                    }
                } catch (e) {
                    console.error("Polling Error:", e);
                }
            }, 3000); // Cek setiap 3 detik
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [showQRModal, qrId]);

    const handleFinishTransaction = async () => {
        if (!qrId) return;

        setIsProcessing(true);
        try {
            const status = await getXenditQRCode(qrId);
            console.log("Verifikasi Manual Status:", status.status);

            // Cek Supabase juga kalau-kalau webhook sudah sukses duluan
            let isCompletedInDb = false;
            if (backendType === 'supabase' && currentTransactionId) {
                const { getClient } = await import('@/services/supabase');
                const { data } = await getClient()
                    .from('transactions')
                    .select('payment_status')
                    .eq('id', currentTransactionId)
                    .single();
                isCompletedInDb = data?.payment_status === 'completed';
            }

            if (status.status === 'COMPLETED' || status.status === 'PAID' || status.status === 'INACTIVE' || isCompletedInDb) {
                // Hanya jika Xendit/DB bilang ok, baru update Supabase ke completed (jika belum)
                if (backendType === 'supabase' && currentTransactionId && !isCompletedInDb) {
                    const { getClient } = await import('@/services/supabase');
                    const client = getClient();
                    await client.from('transactions')
                        .update({ payment_status: 'completed' })
                        .eq('id', currentTransactionId);
                }

                setShowQRModal(false);
                clearCart();
                router.replace({
                    pathname: '/(app)/pos/success',
                    params: {
                        id: currentTransactionId || '',
                        change: '0',
                        total: totalAmount.toFixed(2),
                        paymentMethod: 'xendit'
                    }
                });
            } else {
                // Jika belum bayar, jangan biarkan masuk!
                Alert.alert(
                    "Pembayaran Belum Masuk",
                    "Kami belum mendeteksi pembayaran di sistem Xendit. Silakan pastikan pelanggan sudah berhasil melakukan scan dan pembayaran."
                );
            }
        } catch (err: any) {
            Alert.alert("Error Verifikasi", err.message || "Gagal menghubungi Xendit");
        } finally {
            setIsProcessing(false);
        }
    };

    const discountAmount = selectedDiscount
        ? (selectedDiscount.type === 'percentage'
            ? (totalAmountBeforeDiscount * selectedDiscount.value / 100)
            : selectedDiscount.value)
        : 0;

    const totalAmount = Math.max(0, totalAmountBeforeDiscount - discountAmount);
    const change = paymentAmount ? parseFloat(paymentAmount) - totalAmount : 0;
    const isSufficient = change >= 0;

    const handlePayment = async () => {
        if (paymentMethod === 'cash') {
            if (!paymentAmount) return;
            if (!isSufficient) {
                Alert.alert(t.common.error, t.checkout.insufficientPayment);
                return;
            }
        }

        setIsProcessing(true);

        try {
            const transactionId = backendType === 'supabase' ? (Math.random().toString(36).substring(2, 15)) : Date.now().toString();

            // 1. Persiapkan data transaksi (Tanpa Id Xendit dulu)
            const transaction: Transaction = {
                id: transactionId,
                user_id: user?.id || 'unknown',
                subtotal: totalAmountBeforeDiscount,
                discount_id: selectedDiscount?.id,
                discount_amount: discountAmount,
                total_amount: totalAmount,
                payment_amount: paymentMethod === 'xendit' ? totalAmount : parseFloat(paymentAmount),
                change_amount: paymentMethod === 'xendit' ? 0 : change,
                payment_method: paymentMethod,
                payment_status: paymentMethod === 'xendit' ? 'pending' : 'completed',
                created_at: new Date().toISOString()
            };

            const transactionItems: TransactionItem[] = items.map(item => ({
                id: backendType === 'supabase' ? (Math.random().toString(36).substring(2, 15)) : (Date.now().toString() + Math.random().toString().slice(2)),
                transaction_id: transactionId,
                product_id: item.id,
                quantity: item.quantity,
                price: item.price
            }));

            // 2. Simpan ke Supabase Terlebih Dahulu (App -> Supabase)
            // Kita simpan status 'pending' untuk QRIS
            await createTransaction(transaction, transactionItems);

            let finalXenditUrl = '';

            // 3. Jika metode Xendit, baru panggil Xendit (Supabase -> Xendit)
            if (paymentMethod === 'xendit') {
                try {
                    const qrResponse = await createXenditQRCode(transactionId, totalAmount);

                    setQrString(qrResponse.qr_string);
                    setQrId(qrResponse.id);
                    setExternalQrId(qrResponse.external_id);
                    setCurrentTransactionId(transactionId);
                    setShowQRModal(true);

                    // Update transaksi di Supabase dengan ID QR Code (Opsional)
                    if (backendType === 'supabase') {
                        const { getClient } = await import('@/services/supabase');
                        const client = getClient();
                        await client.from('transactions')
                            .update({
                                xendit_external_id: qrResponse.id
                            })
                            .eq('id', transactionId);
                    }

                    setIsProcessing(false);
                    return; // Stop here to show the QR Modal

                } catch (xerr: any) {
                    console.error("Xendit QR Error:", xerr);
                    Alert.alert("Xendit Error", "Gagal membuat QRIS: " + xerr.message);
                    setIsProcessing(false);
                    return;
                }
            }

            clearCart();

            router.replace({
                pathname: '/(app)/pos/success',
                params: {
                    id: transactionId,
                    change: change.toFixed(2),
                    total: totalAmount.toFixed(2),
                    paymentMethod: 'cash'
                }
            });

        } catch (e: any) {
            Alert.alert(t.common.error, e.message);
        } finally {
            setIsProcessing(false);
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

                    {/* Payment Method Selection (Supabase only) */}
                    {backendType === 'supabase' && xenditConfig?.secretKey && (
                        <View style={styles.methodContainer}>
                            <Text style={styles.suggestionsLabel}>Metode Pembayaran</Text>
                            <View style={styles.methodRow}>
                                <TouchableOpacity
                                    style={[styles.methodBtn, paymentMethod === 'cash' && styles.methodBtnActive]}
                                    onPress={() => setPaymentMethod('cash')}
                                >
                                    <Ionicons name="cash-outline" size={20} color={paymentMethod === 'cash' ? theme.colors.white : theme.colors.text} />
                                    <Text style={[styles.methodText, paymentMethod === 'cash' && styles.methodTextActive]}>Tunai</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.methodBtn, paymentMethod === 'xendit' && styles.methodBtnActive]}
                                    onPress={() => setPaymentMethod('xendit')}
                                >
                                    <Ionicons name="qr-code-outline" size={20} color={paymentMethod === 'xendit' ? theme.colors.white : theme.colors.text} />
                                    <Text style={[styles.methodText, paymentMethod === 'xendit' && styles.methodTextActive]}>QRIS</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {paymentMethod === 'cash' && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t.checkout.cashReceived}</Text>
                            <CurrencyInput
                                value={paymentAmount}
                                onChangeValue={setPaymentAmount}
                                placeholder="0"
                                autoFocus
                            />
                        </View>
                    )}

                    {/* Quick Suggestions */}
                    {paymentMethod === 'cash' && suggestionAmounts.length > 0 && (
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
                    {paymentMethod === 'cash' && paymentAmount !== '' && (
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

                    {paymentMethod === 'xendit' && (
                        <View style={styles.infoCard}>
                            <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
                            <Text style={styles.infoText}>
                                Transaksi akan dicatat di database, kemudian Anda akan diarahkan ke halaman pembayaran QRIS.
                            </Text>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.payBtn,
                            paymentMethod === 'cash' && !isSufficient && styles.payBtnDisabled,
                            isProcessing && styles.payBtnDisabled
                        ]}
                        onPress={handlePayment}
                        disabled={(paymentMethod === 'cash' && !isSufficient) || isProcessing}
                        activeOpacity={0.8}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color={theme.colors.white} />
                        ) : (
                            <>
                                <Text style={styles.payText}>
                                    {paymentMethod === 'xendit' ? 'Bayar via QRIS' : t.checkout.completePayment}
                                </Text>
                                {(paymentMethod === 'xendit' || isSufficient) && <Ionicons name="arrow-forward" size={20} color={theme.colors.white} />}
                            </>
                        )}
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

                {/* QRIS Display Modal */}
                <Modal visible={showQRModal} animationType="fade" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.qrModalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Scan QRIS untuk Bayar</Text>
                                <TouchableOpacity onPress={() => setShowQRModal(false)}>
                                    <Ionicons name="close" size={24} color={theme.colors.text} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.qrContainer}>
                                {qrString && (
                                    <Image
                                        source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrString}` }}
                                        style={styles.qrImage}
                                    />
                                )}
                                <Text style={styles.totalLabel}>Total Tagihan</Text>
                                <Text style={styles.qrTotalValue}>{formatCurrency(totalAmount)}</Text>
                            </View>

                            <View style={styles.qrInfo}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.success} />
                                <Text style={styles.qrInfoText}>Pembayaran terverifikasi otomatis oleh Xendit</Text>
                            </View>

                            {/* Simulation Info for Sandbox/Dev */}
                            {xenditConfig?.secretKey?.startsWith('xnd_development_') && (
                                <View style={styles.devNote}>
                                    <Text style={styles.devNoteTitle}>Sandbox Mode: Simulasi Pembayaran</Text>
                                    <Text style={styles.devNoteDesc}>Salin External ID ini ke Postman:</Text>
                                    <TouchableOpacity
                                        style={styles.copyIdBox}
                                        onPress={() => Alert.alert("External ID (Simulasi)", externalQrId || '')}
                                    >
                                        <Text style={styles.copyIdText}>{externalQrId}</Text>
                                        <Ionicons name="copy-outline" size={16} color={theme.colors.textSecondary} />
                                    </TouchableOpacity>
                                    <Text style={styles.devNoteHint}>Path URL: /qr_codes/{'{EXTERNAL_ID}'}/payments/simulate</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.doneBtn}
                                onPress={handleFinishTransaction}
                            >
                                <Text style={styles.doneBtnText}>Saya Sudah Bayar</Text>
                            </TouchableOpacity>
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
    payNowText: {
        color: theme.colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    qrModalContent: {
        backgroundColor: theme.colors.card,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        width: '100%',
        alignItems: 'center',
        marginTop: 'auto', // Push to bottom
    },
    qrContainer: {
        alignItems: 'center',
        marginVertical: 20,
        backgroundColor: theme.colors.white,
        padding: 24,
        borderRadius: 24,
        width: '100%',
    },
    qrImage: {
        width: 280,
        height: 280,
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    qrTotalValue: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.text,
    },
    qrInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.colors.success + '10',
        padding: 12,
        borderRadius: 12,
        marginBottom: 24,
    },
    qrInfoText: {
        fontSize: 12,
        color: theme.colors.success,
        fontWeight: '600',
        flex: 1,
    },
    doneBtn: {
        backgroundColor: theme.colors.primary,
        width: '100%',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    doneBtnText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: 'bold',
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
    methodContainer: {
        marginBottom: 24,
    },
    methodRow: {
        flexDirection: 'row',
        gap: 12,
    },
    methodBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.card,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 8,
    },
    methodBtnActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    methodText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
    },
    methodTextActive: {
        color: theme.colors.white,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.primary + '10',
        padding: 16,
        borderRadius: 16,
        gap: 12,
        marginTop: 20,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.text,
        lineHeight: 20,
    },
    devNote: {
        backgroundColor: theme.colors.background,
        padding: 16,
        borderRadius: 16,
        width: '100%',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
    },
    devNoteTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: 8,
    },
    devNoteDesc: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 8,
    },
    copyIdBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.card,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    copyIdText: {
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        color: theme.colors.text,
    },
    devNoteHint: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        marginTop: 8,
        fontStyle: 'italic',
    },
});
