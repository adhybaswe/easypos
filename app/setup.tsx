import { theme } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../stores/useAuthStore';
import { useConfigStore } from '../stores/useConfigStore';

export default function SetupScreen() {
    const router = useRouter();
    const { setBackendType, setSqliteConfig, setSetupComplete, setCurrency } = useConfigStore();
    const { login } = useAuthStore();

    const [step, setStep] = useState(1);
    const [backend, setBackend] = useState<'firebase' | 'sqlite' | null>(null);

    // SQLite config state
    const [dbName, setDbName] = useState('easypos.db');

    // Admin config state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Currency config state
    const [currencySymbol, setCurrencySymbol] = useState('Rp');
    const [currencyLocale, setCurrencyLocale] = useState('id-ID');

    const handleBackendSelect = (type: 'firebase' | 'sqlite') => {
        setBackend(type);
    };

    const handleNext = () => {
        if (step === 1) {
            if (!backend) {
                Alert.alert('Error', 'Please select a backend type');
                return;
            }
            setBackendType(backend);
            if (backend === 'sqlite') {
                if (!dbName) {
                    Alert.alert('Error', 'Please enter a database name');
                    return;
                }
                setSqliteConfig({ databaseName: dbName });
            }
            setStep(2);
        }
    };

    const handleSetup = () => {
        // Step 2: Create Admin & Finalize
        if (!username || !password) {
            Alert.alert('Error', 'Please enter admin credentials');
            return;
        }

        // Set Currency
        if (currencySymbol && currencyLocale) {
            setCurrency(currencySymbol, currencyLocale);
        }

        // Create admin user
        const adminUser = {
            id: 'admin-1',
            username,
            role: 'admin' as const,
            is_active: true
        };

        // We simulate creating user and logging in
        login(adminUser);
        setSetupComplete(true);
        router.replace('/(app)/(tabs)');
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Welcome to EasyPOS</Text>
            <Text style={styles.subtitle}>{step === 1 ? 'Step 1: Backend Configuration' : 'Step 2: Create Admin Account'}</Text>

            {step === 1 && (
                <View style={styles.section}>
                    <Text style={styles.label}>Select Backend:</Text>
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[styles.option, backend === 'firebase' && styles.selected]}
                            onPress={() => handleBackendSelect('firebase')}
                        >
                            <Text style={[styles.optionText, backend === 'firebase' && styles.selectedText]}>Firebase</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.option, backend === 'sqlite' && styles.selected]}
                            onPress={() => handleBackendSelect('sqlite')}
                        >
                            <Text style={[styles.optionText, backend === 'sqlite' && styles.selectedText]}>Local SQLite</Text>
                        </TouchableOpacity>
                    </View>

                    {backend === 'sqlite' && (
                        <View style={styles.form}>
                            <Text style={styles.label}>Database Name</Text>
                            <TextInput
                                style={styles.input}
                                value={dbName}
                                onChangeText={setDbName}
                                placeholder="easypos.db"
                                placeholderTextColor={theme.colors.textSecondary}
                            />
                            <Text style={styles.hint}>Data will be stored locally on this device.</Text>
                        </View>
                    )}
                </View>
            )}

            {step === 2 && (
                <View style={styles.section}>
                    <Text style={styles.label}>Admin Username</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        placeholderTextColor={theme.colors.textSecondary}
                    />
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholderTextColor={theme.colors.textSecondary}
                    />
                </View>
            )}

            {step === 2 && (
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Store Currency</Text>
                    <View style={styles.row}>
                        <TextInput
                            style={[styles.input, { flex: 1, marginRight: 8 }]}
                            placeholder="Symbol (e.g. Rp)"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={currencySymbol}
                            onChangeText={setCurrencySymbol}
                        />
                        <TextInput
                            style={[styles.input, { flex: 2 }]}
                            placeholder="Locale (e.g. id-ID)"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={currencyLocale}
                            onChangeText={setCurrencyLocale}
                        />
                    </View>
                </View>
            )}

            <TouchableOpacity style={styles.button} onPress={step === 1 ? handleNext : handleSetup}>
                <Text style={styles.buttonText}>{step === 1 ? 'Next' : 'Complete Setup'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: 18,
        color: theme.colors.textSecondary,
        marginBottom: 32,
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: theme.colors.text,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    option: {
        flex: 1,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: theme.colors.card,
    },
    selected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.card, // kept simple
        borderWidth: 2,
    },
    optionText: {
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    selectedText: {
        color: theme.colors.primary,
    },
    form: {
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 14,
        borderRadius: 12,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: theme.colors.card,
        color: theme.colors.text,
    },
    hint: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: -8,
        marginBottom: 16,
    },
    button: {
        backgroundColor: theme.colors.primary,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        ...theme.shadows.medium,
    },
    buttonText: {
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    inputGroup: {
        marginTop: 20,
        marginBottom: 20,
    },
});
