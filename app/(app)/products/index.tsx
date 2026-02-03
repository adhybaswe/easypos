import { theme } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useProductStore } from '../../../stores/useProductStore';

export default function ProductListScreen() {
    const router = useRouter();
    const { products, loadData, deleteProduct, isLoading } = useProductStore();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = (id: string) => {
        Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteProduct(id) }
        ]);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                {item.image_uri ? (
                    <Image source={{ uri: item.image_uri }} style={styles.thumb} />
                ) : (
                    <View style={styles.thumbPlaceholder}>
                        <Text style={styles.thumbInitials}>{item.name.substring(0, 1).toUpperCase()}</Text>
                    </View>
                )}

                <View style={styles.cardInfo}>
                    <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Stock: {item.stock}</Text>
                        </View>
                        {item.sku && (
                            <Text style={styles.skuText}>SKU: {item.sku}</Text>
                        )}
                    </View>
                    <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
                </View>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => router.push({ pathname: '/(app)/products/form', params: { id: item.id } })}
                >
                    <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item.id)}
                >
                    <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                    <Text style={styles.deleteText}>Delete</Text>
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
                    <Text style={styles.headerTitle}>Products ({products.length})</Text>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => router.push('/(app)/products/form')}
                    >
                        <Ionicons name="add" size={24} color={theme.colors.white} />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search products..."
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
                    data={filteredProducts}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <View style={styles.emptyIconBg}>
                                <Ionicons name="cube-outline" size={48} color={theme.colors.textSecondary} />
                            </View>
                            <Text style={styles.emptyText}>No products found</Text>
                            <Text style={styles.emptySubText}>
                                {searchQuery ? 'Try adjusting your search' : 'Tap the + button to add your first product'}
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
    thumb: {
        width: 70,
        height: 70,
        borderRadius: 12,
        marginRight: 16,
        backgroundColor: theme.colors.lightGray,
    },
    thumbPlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 12,
        marginRight: 16,
        backgroundColor: theme.colors.lightGray,
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbInitials: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    cardInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    productName: {
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
        backgroundColor: theme.colors.lightGray,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },
    skuText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    productPrice: {
        fontSize: 18,
        fontWeight: '700',
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
    editBtn: {
        // backgroundColor: '#fff',
    },
    deleteBtn: {
        // backgroundColor: '#fff',
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
