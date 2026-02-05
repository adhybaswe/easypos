import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { useTranslation } from '@/utils/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const { logout, user } = useAuthStore();
    const { language, setLanguage, resetConfig } = useConfigStore();
    const t = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();



    const handleReset = () => {
        import('react-native').then(({ Alert }) => {
            Alert.alert(t.auth.resetAppTitle, t.auth.resetAppMessage, [
                { text: t.common.cancel, style: 'cancel' },
                {
                    text: t.auth.resetButton,
                    style: 'destructive',
                    onPress: () => {
                        resetConfig();
                        router.replace('/');
                    }
                }
            ]);
        });
    };

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t.settings}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={[styles.scrollContainer, { paddingBottom: insets.bottom + 24 }]}
            >
                <View style={styles.section}>
                    <Text style={styles.label}>{t.loggedInAs}:</Text>
                    <Text style={styles.value}>{user?.username} ({user?.role})</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>{t.language}:</Text>
                    <View style={styles.languageContainer}>
                        <TouchableOpacity
                            style={[
                                styles.languageOption,
                                language === 'id' && styles.languageOptionActive
                            ]}
                            onPress={() => setLanguage('id')}
                        >
                            <Text style={[
                                styles.languageText,
                                language === 'id' && styles.languageTextActive
                            ]}>
                                {t.indonesian}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.languageOption,
                                language === 'en' && styles.languageOptionActive
                            ]}
                            onPress={() => setLanguage('en')}
                        >
                            <Text style={[
                                styles.languageText,
                                language === 'en' && styles.languageTextActive
                            ]}>
                                {t.english}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {user?.role === 'admin' && (
                    <View style={styles.section}>
                        <Text style={styles.label}>{t.auth.resetApp}:</Text>
                        <TouchableOpacity
                            style={styles.resetButtonInline}
                            onPress={handleReset}
                        >
                            <Ionicons name="refresh-circle-outline" size={20} color={theme.colors.error} />
                            <Text style={styles.resetButtonInlineText}>{t.auth.resetApp}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>{t.logout}</Text>
                </TouchableOpacity>


            </ScrollView>
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
    scrollContent: {
        flex: 1,
    },
    scrollContainer: {
        padding: 24,
        flexGrow: 1,
    },
    section: {
        marginBottom: 24,
        backgroundColor: theme.colors.card,
        padding: 20,
        borderRadius: 16,
        ...theme.shadows.small,
    },
    label: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 8,
    },
    value: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },
    languageContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    languageOption: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
        backgroundColor: theme.colors.card,
    },
    languageOptionActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    languageText: {
        fontSize: 16,
        color: theme.colors.text,
        fontWeight: '500',
    },
    languageTextActive: {
        color: theme.colors.white,
        fontWeight: 'bold',
    },
    logoutButton: {
        marginTop: 'auto',
        backgroundColor: theme.colors.error,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    logoutButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    resetButtonInline: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.error + '40', // light error border
        backgroundColor: theme.colors.error + '10', // very light error bg
        gap: 8,
        marginTop: 4,
    },
    resetButtonInlineText: {
        color: theme.colors.error,
        fontSize: 14,
        fontWeight: '600',
    },
});
