import { CurrencyInput } from '@/components/ui/currency-input';
import { theme } from '@/constants/theme';
import { useConfigStore } from '@/stores/useConfigStore';
import { useProductStore } from '@/stores/useProductStore';
import { Product } from '@/types';
import { translations } from '@/utils/i18n';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function ProductFormScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { products, categories, addProduct, updateProduct, loadData } = useProductStore();
    const { language, currencySymbol } = useConfigStore();
    const t = translations[language];

    const isEdit = !!params.id;
    const productId = params.id as string;

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [sku, setSku] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (isEdit) {
            const product = products.find(p => p.id === productId);
            if (product) {
                setName(product.name);
                setPrice(product.price.toString());
                setStock(product.stock.toString());
                setSku(product.sku || '');
                setCategoryId(product.category_id);
                setImageUri(product.image_uri || null);
            }
        } else {
            if (categories.length > 0) setCategoryId(categories[0].id);
        }
    }, [isEdit, productId, products, categories]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!name || !price || !stock || !categoryId) {
            Alert.alert(t.common.error, t.common.fillRequired);
            return;
        }

        const payload: Product = {
            id: isEdit ? productId : Date.now().toString(),
            name,
            price: parseFloat(price),
            stock: parseInt(stock),
            category_id: categoryId,
            sku: sku || undefined,
            image_uri: imageUri || undefined
        };

        try {
            if (isEdit) {
                await updateProduct(payload);
            } else {
                await addProduct(payload);
            }
            router.back();
        } catch (e: any) {
            console.error(e);
            Alert.alert(t.common.error, "Failed to save product. " + e.message);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEdit ? t.products.editProduct : t.products.newProduct}</Text>
                <TouchableOpacity onPress={handleSubmit} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>{t.common.save}</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Image Section */}
                    <View style={styles.section}>
                        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
                            {imageUri ? (
                                <View style={styles.imageWrapper}>
                                    <Image source={{ uri: imageUri }} style={styles.image} />
                                    <View style={styles.editBadge}>
                                        <Ionicons name="camera" size={16} color={theme.colors.white} />
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.placeholder}>
                                    <View style={styles.placeholderIcon}>
                                        <Ionicons name="image-outline" size={32} color={theme.colors.primary} />
                                    </View>
                                    <Text style={styles.placeholderText}>{t.products.addImage}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Basic Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t.products.basicInfo}</Text>
                        <View style={styles.card}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t.products.productName}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="e.g. Iced Latte"
                                    placeholderTextColor={theme.colors.textSecondary}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>{t.products.price}</Text>
                                    <CurrencyInput
                                        value={price}
                                        onChangeValue={setPrice}
                                        placeholder="0"
                                        containerStyle={styles.formCurrencyInput}
                                        symbolStyle={styles.formCurrencySymbol}
                                        style={styles.formInputText}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Stock</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={stock}
                                        onChangeText={setStock}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor={theme.colors.textSecondary}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>SKU Code <Text style={styles.optionalText}>(Optional)</Text></Text>
                                <TextInput
                                    style={styles.input}
                                    value={sku}
                                    onChangeText={setSku}
                                    placeholder="e.g. COF-001"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    autoCapitalize="characters"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Category Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Category</Text>
                        <View style={styles.categoryContainer}>
                            {categories.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.categoryChip,
                                        categoryId === cat.id && styles.categoryChipActive
                                    ]}
                                    onPress={() => setCategoryId(cat.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.categoryText,
                                        categoryId === cat.id && styles.categoryTextActive
                                    ]}>
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.spacer} />
                </ScrollView>
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
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
    },
    saveBtn: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    saveBtnText: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: 20,
        ...theme.shadows.small,
    },
    // Image Picker Styles
    imagePicker: {
        alignSelf: 'center',
        marginTop: 10,
    },
    imageWrapper: {
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    image: {
        width: 140,
        height: 140,
        borderRadius: 24,
        backgroundColor: theme.colors.lightGray,
    },
    editBadge: {
        position: 'absolute',
        bottom: -8,
        right: -8,
        backgroundColor: theme.colors.text,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: theme.colors.white,
    },
    placeholder: {
        width: 140,
        height: 140,
        borderRadius: 24,
        backgroundColor: theme.colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
    },
    placeholderIcon: {
        backgroundColor: theme.colors.lightGray,
        padding: 12,
        borderRadius: 50,
        marginBottom: 8,
    },
    placeholderText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },
    // Form Fields
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: theme.colors.text,
    },
    currencyInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    currencyPrefix: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginRight: 4,
        fontWeight: '500',
    },
    formCurrencyInput: {
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    formCurrencySymbol: {
        fontSize: 16,
        marginRight: 4,
    },
    formInputText: {
        fontSize: 16,
        paddingVertical: 0,
        height: '100%',
    },
    inputNoBorder: {
        borderWidth: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    optionalText: {
        color: theme.colors.textSecondary,
        fontWeight: '400',
    },
    // Categories
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    categoryChip: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        backgroundColor: theme.colors.card,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    categoryChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    categoryTextActive: {
        color: theme.colors.white,
    },
    spacer: {
        height: 40,
    },
});
