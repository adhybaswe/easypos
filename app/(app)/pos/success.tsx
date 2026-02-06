import { theme } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { useTranslation } from '@/utils/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SuccessScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const params = useLocalSearchParams();
    const t = useTranslation();
    const { change, total, id, paymentMethod, invoiceUrl } = params;

    const isXendit = paymentMethod === 'xendit';
    const hasInvoice = !!invoiceUrl;

    // Parse strings to numbers safely
    const totalNum = parseFloat(Array.isArray(total) ? total[0] : total);
    const changeNum = parseFloat(Array.isArray(change) ? change[0] : change);

    const handleDone = () => {
        // Pop to the top of the POS stack (index)
        navigation.dispatch({ type: 'POP_TO_TOP' });
    };

    const handleOpenPayment = async () => {
        if (typeof invoiceUrl === 'string') {
            await WebBrowser.openBrowserAsync(invoiceUrl);
        } else {
            Alert.alert("Error", "URL Invoice tidak ditemukan");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.iconCircle}>
                    <Ionicons name="checkmark" size={48} color={theme.colors.white} />
                </View>
                <Text style={styles.title}>{t.success.title}</Text>
                <Text style={styles.subtitle}>{t.success.transactionId}{id}</Text>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <Text style={styles.label}>{t.success.totalAmount}</Text>
                    <Text style={styles.value}>{formatCurrency(totalNum)}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>{t.success.change}</Text>
                    <Text style={styles.changeValue}>{formatCurrency(changeNum)}</Text>
                </View>

                {isXendit && hasInvoice && (
                    <TouchableOpacity style={styles.payNowBtn} onPress={handleOpenPayment}>
                        <Ionicons name="qr-code" size={20} color={theme.colors.white} />
                        <Text style={styles.payNowText}>Buka QRIS Pembayaran</Text>
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity style={styles.button} onPress={handleDone}>
                <Text style={styles.buttonText}>{t.success.newTransaction}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        marginBottom: 32,
        ...theme.shadows.large,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 24,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        width: '100%',
        marginBottom: 24,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 12,
    },
    label: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    value: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    changeValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    button: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    buttonText: {
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    payNowBtn: {
        backgroundColor: theme.colors.success,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginTop: 16,
        gap: 8,
    },
    payNowText: {
        color: theme.colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
