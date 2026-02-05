import { theme } from '@/constants/theme';
import { useDiscountStore } from '@/stores/useDiscountStore';
import { Discount } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function DiscountFormScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { discounts, addDiscount, updateDiscount } = useDiscountStore();

    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
    const [value, setValue] = useState('');
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (id) {
            const discount = discounts.find(d => d.id === id);
            if (discount) {
                setName(discount.name);
                setType(discount.type);
                setValue(discount.value.toString());
                setIsActive(discount.is_active);
            }
        }
    }, [id]);

    const handleSave = async () => {
        if (!name || !value) {
            alert('Mohon isi semua field wajib');
            return;
        }

        setLoading(true);
        try {
            const discountData: Discount = {
                id: (id as string) || Date.now().toString(),
                name,
                type,
                value: parseFloat(value),
                is_active: isActive
            };

            if (id) {
                await updateDiscount(discountData);
            } else {
                await addDiscount(discountData);
            }
            router.back();
        } catch (e) {
            alert('Gagal menyimpan diskon');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{id ? 'Edit Diskon' : 'Tambah Diskon Baru'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nama Diskon</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Contoh: Promo Ramadhan"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Tipe Diskon</Text>
                    <View style={styles.typeSelector}>
                        <TouchableOpacity
                            style={[styles.typeBtn, type === 'percentage' && styles.typeBtnActive]}
                            onPress={() => setType('percentage')}
                        >
                            <Text style={[styles.typeBtnText, type === 'percentage' && styles.typeBtnTextActive]}>
                                Persentase (%)
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.typeBtn, type === 'fixed' && styles.typeBtnActive]}
                            onPress={() => setType('fixed')}
                        >
                            <Text style={[styles.typeBtnText, type === 'fixed' && styles.typeBtnTextActive]}>
                                Potongan (Rp)
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>{type === 'percentage' ? 'Persentase (%)' : 'Nilai Potongan (Rp)'}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={type === 'percentage' ? 'Contoh: 10' : 'Contoh: 5000'}
                        value={value}
                        onChangeText={setValue}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.switchRow}>
                    <View>
                        <Text style={styles.label}>Aktifkan Diskon</Text>
                        <Text style={styles.subLabel}>Diskon akan muncul di kasir jika aktif</Text>
                    </View>
                    <Switch
                        value={isActive}
                        onValueChange={setIsActive}
                        trackColor={{ false: '#767577', true: theme.colors.primary }}
                        thumbColor={Platform.OS === 'ios' ? '#fff' : isActive ? '#fff' : '#f4f3f4'}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>Simpan Diskon</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
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
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 50 : 60,
        paddingBottom: 16,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
    },
    content: {
        padding: 24,
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
    },
    subLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    input: {
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: theme.colors.text,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
    },
    typeBtn: {
        flex: 1,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    typeBtnActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '10',
    },
    typeBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    typeBtnTextActive: {
        color: theme.colors.primary,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 32,
    },
    saveBtn: {
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    saveBtnDisabled: {
        opacity: 0.6,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
