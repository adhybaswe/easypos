import { theme } from '@/constants/theme';
import { useCartStore } from '@/stores/useCartStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { useProductStore } from '@/stores/useProductStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function POSScreen() {
    const router = useRouter();
    useConfigStore(); // Subscribe to config changes (currency/language)
    const { products, categories, loadData } = useProductStore();
    const { addToCart } = useCartStore();
    const items = useCartStore(state => state.items);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const filteredProducts = products.filter(p => {
        const matchCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    const renderProduct = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.productCard}
            onPress={() => addToCart(item)}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                {item.image_uri ? (
                    <Image source={{ uri: item.image_uri }} style={styles.productImage} />
                ) : (
                    <View style={styles.productPlaceholder}>
                        <Text style={styles.productInitials}>{item.name.substring(0, 1).toUpperCase()}</Text>
                    </View>
                )}
                <View style={styles.addOverlay}>
                    <Ionicons name="add" size={24} color={theme.colors.white} />
                </View>
            </View>

            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Point of Sale</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search items..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View style={styles.categories}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={[{ id: 'all', name: 'All Items' }, ...categories]}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.catChip, selectedCategory === item.id && styles.catChipActive]}
                                onPress={() => setSelectedCategory(item.id)}
                            >
                                <Text style={[styles.catText, selectedCategory === item.id && styles.catTextActive]}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.catList}
                    />
                </View>
            </View>

            <FlatList
                data={filteredProducts}
                keyExtractor={item => item.id}
                renderItem={renderProduct}
                numColumns={2}
                contentContainerStyle={styles.grid}
                columnWrapperStyle={styles.rowWrapper}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIconBg}>
                            <Ionicons name="search-outline" size={48} color={theme.colors.textSecondary} />
                        </View>
                        <Text style={styles.emptyText}>No items found</Text>
                        <Text style={styles.emptySubText}>Try changing category or search term</Text>
                    </View>
                }
            />

            {/* Cart Footer */}
            {itemCount > 0 && (
                <View style={styles.cartContainer}>
                    <View style={styles.cartFooter}>
                        <View style={styles.cartInfo}>
                            <View style={styles.cartCountBadge}>
                                <Text style={styles.cartCountText}>{itemCount}</Text>
                            </View>
                            <View>
                                <Text style={styles.cartLabel}>Total</Text>
                                <Text style={styles.cartTotal}>{formatCurrency(total)}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.checkoutBtn}
                            onPress={() => router.push('/(app)/pos/cart')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.checkoutText}>View Cart</Text>
                            <Ionicons name="arrow-forward" size={20} color={theme.colors.white} />
                        </TouchableOpacity>
                    </View>
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
        backgroundColor: theme.colors.card,
        paddingTop: Platform.OS === 'android' ? 50 : 60,
        paddingBottom: 0,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.lightGray,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        marginHorizontal: 20,
        marginBottom: 16,
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
    categories: {
        paddingBottom: 16,
    },
    catList: {
        paddingHorizontal: 20,
        gap: 8,
    },
    catChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 100,
        backgroundColor: theme.colors.lightGray,
        borderWidth: 1,
        borderColor: theme.colors.lightGray,
    },
    catChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    catText: {
        color: theme.colors.textSecondary,
        fontWeight: '600',
        fontSize: 14,
    },
    catTextActive: {
        color: theme.colors.white,
    },
    grid: {
        padding: 20,
        paddingBottom: 120, // Space for cart footer
    },
    rowWrapper: {
        justifyContent: 'space-between',
        gap: 16,
    },
    productCard: {
        flex: 1,
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: 8,
        marginBottom: 16,
        ...theme.shadows.small,
        maxWidth: '48%',
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    productImage: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 12,
        backgroundColor: theme.colors.lightGray,
    },
    productPlaceholder: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: theme.colors.lightGray, // Lighter placeholder
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    productInitials: {
        fontSize: 32,
        fontWeight: '700',
        color: theme.colors.textSecondary,
    },
    addOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    productInfo: {
        paddingHorizontal: 4,
        paddingBottom: 4,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
        height: 40,
        lineHeight: 20,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    empty: {
        marginTop: 60,
        alignItems: 'center',
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
    },
    cartContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        backgroundColor: 'transparent',
    },
    cartFooter: {
        backgroundColor: theme.colors.darkGray, // Dark footer
        borderRadius: 24,
        padding: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...theme.shadows.large,
    },
    cartInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    cartCountBadge: {
        backgroundColor: '#374151',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    cartCountText: {
        color: theme.colors.white,
        fontWeight: '700',
        fontSize: 16,
    },
    cartLabel: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: '500',
    },
    cartTotal: {
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: '700',
    },
    checkoutBtn: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 16,
        gap: 8,
    },
    checkoutText: {
        color: theme.colors.white,
        fontWeight: '600',
        fontSize: 15,
    },
});
