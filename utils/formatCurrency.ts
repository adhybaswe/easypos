import { useConfigStore } from '../stores/useConfigStore';

export const formatCurrency = (amount: number) => {
    const { currencyLocale, currencySymbol } = useConfigStore.getState();

    // Use Intl.NumberFormat for proper localization (thousands separators etc.)
    try {
        if (currencyLocale === 'id-ID') {
            // Indonesian Format: Rp 10.000 (no decimals usually for easy reading, or ,00)
            // Standard: Rp10.000,00
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        }

        return new Intl.NumberFormat(currencyLocale, {
            style: 'currency',
            currency: 'USD', // This logic is a bit flawed if we just pass symbol. 
            // Ideally store currencyCode (IDR, USD) instead of locale alone.
            // But for now, let's just use the symbol manually if locale fails or strictly 'en-US'
        }).format(amount).replace('$', currencySymbol);

    } catch (e) {
        // Fallback
        return `${currencySymbol} ${amount.toFixed(2)}`;
    }
};
