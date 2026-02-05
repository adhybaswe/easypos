import { theme } from '@/constants/theme';
import { useDiscountStore } from '@/stores/useDiscountStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function DiscountListScreen() {
    const router = useRouter();
    const { discounts, loadDiscounts, deleteDiscount, isLoading } = useDiscountStore();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadDiscounts();
    }, []);

    const handleDelete = (id: string) => {
        Alert.alert('Hapus Diskon', 'Apakah Anda yakin ingin menghapus diskon ini?', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Hapus', style: 'destructive', onPress: () => deleteDiscount(id) }
        ]);
    };

    const filteredDiscounts = discounts.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: item.is_active ? theme.colors.primary + '20' : theme.colors.lightGray }]}>
                    <Ionicons
                        name="pricetag"
                        size={24}
                        color={item.is_active ? theme.colors.primary : theme.colors.textSecondary}
                    />
                </View>

                <View style={styles.cardInfo}>
                    <Text style={styles.discountName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.metaRow}>
                        <View style={[styles.badge, { backgroundColor: item.type === 'percentage' ? '#E0F2FE' : '#F0FDF4' }]}>
                            <Text style={[styles.badgeText, { color: item.type === 'percentage' ? '#0284C7' : '#16A34A' }]}>
                                {item.type === 'percentage' ? 'Persentase' : 'Potongan Tetap'}
                            </Text>
                        </View>
                        {!item.is_active && (
                            <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                                <Text style={[styles.badgeText, { color: '#EF4444' }]}>Nonaktif</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.discountValue}>
                        {item.type === 'percentage' ? `${item.value}%` : `Rp ${item.value.toLocaleString()}`}
                    </Text>
                </View>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push({ pathname: '/(app)/discounts/form', params: { id: item.id } })}
                >
                    <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDelete(item.id)}
                >
                    <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                    <Text style={styles.deleteText}>Hapus</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Diskon & Promo</Text>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => router.push('/(app)/discounts/form')}
                    >
                        <Ionicons name="add" size={24} color={theme.colors.white} />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari diskon..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredDiscounts}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <View style={styles.emptyIconBg}>
                                <Ionicons name="pricetags-outline" size={48} color={theme.colors.textSecondary} />
                            </View>
                            <Text style={styles.emptyText}>Belum ada diskon</Text>
                            <Text style={styles.emptySubText}>
                                {searchQuery ? 'Coba sesuaikan pencarian Anda' : 'Ketuk tombol + untuk menambah diskon pertama'}
                            </Text>
                        </View>
                    }
                />
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
        backgroundColor: theme.colors.card,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 50 : 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
    },
    addBtn: {
        backgroundColor: theme.colors.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.medium,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.lightGray,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
        height: '100%',
    },
    list: {
        padding: 20,
        paddingBottom: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        marginBottom: 16,
        ...theme.shadows.small,
        overflow: 'hidden',
    },
    cardContent: {
        flexDirection: 'row',
        padding: 16,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        marginRight: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    discountName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    discountValue: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.primary,
    },
    cardActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
    },
    editText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    deleteText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.error,
    },
    divider: {
        width: 1,
        backgroundColor: theme.colors.border,
    },
    empty: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.lightGray,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },
    emptySubText: {
        color: theme.colors.textSecondary,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
