import { theme } from '@/constants/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { useTranslation } from '@/utils/i18n';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
    const { logout, user } = useAuthStore();
    const { language, setLanguage } = useConfigStore();
    const t = useTranslation();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t.settings}</Text>

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

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>{t.logout}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: theme.colors.background,
        paddingTop: 80,
        paddingBottom: 100, // Add extra padding for bottom tab bar
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 32,
        color: theme.colors.text,
    },
    section: {
        marginBottom: 24,
        backgroundColor: theme.colors.card,
        padding: 20,
        borderRadius: 12,
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
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        ...theme.shadows.small,
    },
    logoutButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
