import { theme } from '@/constants/theme';
import * as db from '@/services/db';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { useTranslation } from '@/utils/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuthStore();
    const { resetConfig } = useConfigStore();
    const t = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert(t.common.error, t.auth.errorEmpty);
            return;
        }

        try {
            await db.initDatabase();
            const user = await db.getUserByUsername(username);

            if (user) {
                if (user.password_hash === password) {
                    login(user);
                    router.replace('/(app)/(tabs)');
                    return;
                }
            }
            Alert.alert(t.common.error, t.auth.errorInvalid);
        } catch (e) {
            console.error(e);
            Alert.alert(t.common.error, t.auth.errorFailed);
        }
    };

    const handleReset = () => {
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
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="cart" size={60} color={theme.colors.white} />
                    </View>
                    <Text style={styles.title}>{t.auth.loginTitle}</Text>
                    <Text style={styles.subtitle}>{t.auth.loginSubtitle}</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t.auth.username}</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="cashier / admin"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t.auth.password}</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.8}>
                        <Text style={styles.buttonText}>{t.auth.loginButton}</Text>
                        <Ionicons name="arrow-forward" size={20} color={theme.colors.white} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.resetButton}
                        onPress={handleReset}
                    >
                        <Text style={styles.resetButtonText}>{t.auth.resetApp}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        ...theme.shadows.medium,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    form: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 16,
        ...theme.shadows.small,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: theme.colors.text,
    },
    eyeIcon: {
        padding: 5,
    },
    button: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        ...theme.shadows.medium,
    },
    buttonText: {
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    resetButton: {
        marginTop: 32,
        alignItems: 'center',
        padding: 10,
    },
    resetButtonText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
});

