import { theme } from '@/constants/theme';
import { useConfigStore } from '@/stores/useConfigStore';
import React from 'react';
import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';

interface CurrencyInputProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
    value: string;
    onChangeValue: (value: string) => void;
    containerStyle?: StyleProp<ViewStyle>;
    symbolStyle?: StyleProp<TextStyle>;
}

export const CurrencyInput = ({ value, onChangeValue, style, containerStyle, symbolStyle, ...props }: CurrencyInputProps) => {
    const { currencySymbol, currencyLocale } = useConfigStore();

    // Determine configuration based on locale
    const isIDR = currencyLocale === 'id-ID';
    const groupingSeparator = isIDR ? '.' : ',';
    const decimalSeparator = isIDR ? ',' : '.';

    // Format value for display (adds grouping separators)
    const formatDisplayValue = (val: string) => {
        if (!val) return '';

        // Split integer and decimal parts
        const parts = val.split('.');
        const integerPart = parts[0];
        const decimalPart = parts.length > 1 ? parts[1] : '';

        // Format integer part with grouping separators
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupingSeparator);

        if (parts.length > 1) {
            return `${formattedInteger}${decimalSeparator}${decimalPart}`;
        }
        return formattedInteger;
    };

    const handleChangeText = (text: string) => {
        if (isIDR) {
            // IDR: Integer only for simplicity and robust formatting (standard for Rp inputs)
            const cleanVal = text.replace(/[^0-9]/g, '');
            onChangeValue(cleanVal);
        } else {
            // EN/USD: allow numeric and dot
            let cleanVal = text.replace(/[^0-9.]/g, '');
            // Prevent multiple dots
            const parts = cleanVal.split('.');
            if (parts.length > 2) {
                cleanVal = parts[0] + '.' + parts[1];
            }
            onChangeValue(cleanVal);
        }
    };

    return (
        <View style={[styles.container, containerStyle]}>
            <Text style={[styles.symbol, symbolStyle]}>{currencySymbol}</Text>
            <TextInput
                {...props}
                style={[styles.input, style]}
                value={formatDisplayValue(value)}
                onChangeText={handleChangeText}
                keyboardType="numeric"
                placeholderTextColor={theme.colors.textSecondary}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 16,
        paddingHorizontal: 16,
    },
    symbol: {
        fontSize: 20,
        color: theme.colors.textSecondary,
        marginRight: 8,
        fontWeight: '600',
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 24,
        color: theme.colors.text,
        fontWeight: '700',
    }
});
