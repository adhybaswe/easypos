import { theme } from '@/constants/theme';
import * as db from '@/services/db';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SetupScreen() {
    const router = useRouter();
    const { setBackendType, setSqliteConfig, setFirebaseConfig, setSupabaseConfig, setXenditConfig, setSetupComplete, setCurrency } = useConfigStore();
    const { login } = useAuthStore();

    const [step, setStep] = useState(1);
    const [backend, setBackend] = useState<'firebase' | 'sqlite' | 'supabase' | null>(null);
    const [loading, setLoading] = useState(false);

    // SQLite config state
    const [dbName, setDbName] = useState('easypos.db');

    // Firebase config state
    const [firebaseConfig, setFirebaseConfigState] = useState({
        apiKey: 'AIzaSyAmxgAxrlAtRnSxaKwXk4KJRznHjzZGwkw',
        authDomain: 'easypos-21733.firebaseapp.com',
        projectId: 'easypos-21733',
        storageBucket: 'easypos-21733.firebasestorage.app',
        messagingSenderId: '355211235039',
        appId: '1:355211235039:web:88c72afd698b1142b2236a'
    });
    const [supabaseConfig, setSupabaseConfigState] = useState({
        supabaseUrl: 'https://mtmitpvpainxcvyortwb.supabase.co',
        supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bWl0cHZwYWlueGN2eW9ydHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMTE5NjksImV4cCI6MjA4NTg4Nzk2OX0.6V-bm6lyOqK6PAKtCsxBAnHv2dJmi2xMy2M5LVGz6Dk'
    });
    const [xenditConfig, setXenditConfigState] = useState({
        secretKey: 'xnd_development_bM4W0FyWgedUwwytWlrlXseNLEl5TPlUhmmcXxBZjmwGbp87CoOkvGfAcQ6oZWI',
        webhookUrl: 'https://mtmitpvpainxcvyortwb.supabase.co/functions/v1/webhooh-xendit'
    });

    // Admin config state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Currency config state
    const [currencySymbol, setCurrencySymbol] = useState('Rp');
    const [currencyLocale, setCurrencyLocale] = useState('id-ID');

    const handleBackendSelect = (type: 'firebase' | 'sqlite' | 'supabase') => {
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
            } else if (backend === 'firebase') {
                if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
                    Alert.alert('Error', 'Please enter at least API Key and Project ID');
                    return;
                }
                setFirebaseConfig(firebaseConfig);
            } else if (backend === 'supabase') {
                if (!supabaseConfig.supabaseUrl || !supabaseConfig.supabaseAnonKey) {
                    Alert.alert('Error', 'Please enter URL and Anon Key');
                    return;
                }
                setSupabaseConfig(supabaseConfig);
                if (xenditConfig.secretKey) {
                    setXenditConfig(xenditConfig);
                }
            }
            setStep(2);
        }
    };

    const handleSetup = async () => {
        // Step 2: Create Admin & Finalize
        if (!username || !password) {
            Alert.alert('Error', 'Please enter admin credentials');
            return;
        }

        setLoading(true);

        try {
            // Set Currency
            if (currencySymbol && currencyLocale) {
                setCurrency(currencySymbol, currencyLocale);
            }

            // Create admin user
            const adminUser = {
                id: 'admin-1',
                username,
                role: 'admin' as const,
                is_active: true,
                password_hash: password // In real app, hash this!
            };

            // Init DB (Async)
            await db.initDatabase();

            // Insert Admin
            // Check if user exists first to avoid error on re-setup
            const existingAdmin = await db.getUserByUsername(username);

            if (existingAdmin) {
                // Update existing admin
                const updatedAdmin = { ...adminUser, id: existingAdmin.id };
                await db.updateUserDB(updatedAdmin);
                // Also update local adminUser object to use correct ID if we need it later
                // But for login we can just use the updatedAdmin
                login(updatedAdmin);
            } else {
                await db.insertUser(adminUser);
                login(adminUser);
            }

            setSetupComplete(true);
            router.replace('/(app)');
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', 'Setup failed: ' + e.message);
        } finally {
            setLoading(false);
        }
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
                        <TouchableOpacity
                            style={[styles.option, backend === 'supabase' && styles.selected]}
                            onPress={() => handleBackendSelect('supabase')}
                        >
                            <Text style={[styles.optionText, backend === 'supabase' && styles.selectedText]}>Supabase</Text>
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

                    {backend === 'firebase' && (
                        <View style={styles.form}>
                            <Text style={styles.label}>Firebase Configuration</Text>
                            <TextInput style={styles.input} placeholder="API Key" placeholderTextColor={theme.colors.textSecondary} value={firebaseConfig.apiKey} onChangeText={(t) => setFirebaseConfigState({ ...firebaseConfig, apiKey: t })} />
                            <TextInput style={styles.input} placeholder="Project ID" placeholderTextColor={theme.colors.textSecondary} value={firebaseConfig.projectId} onChangeText={(t) => setFirebaseConfigState({ ...firebaseConfig, projectId: t })} />
                            <TextInput style={styles.input} placeholder="Auth Domain (Optional)" placeholderTextColor={theme.colors.textSecondary} value={firebaseConfig.authDomain} onChangeText={(t) => setFirebaseConfigState({ ...firebaseConfig, authDomain: t })} />
                            <TextInput style={styles.input} placeholder="Storage Bucket (Optional)" placeholderTextColor={theme.colors.textSecondary} value={firebaseConfig.storageBucket} onChangeText={(t) => setFirebaseConfigState({ ...firebaseConfig, storageBucket: t })} />
                            <TextInput style={styles.input} placeholder="Messaging Sender ID (Optional)" placeholderTextColor={theme.colors.textSecondary} value={firebaseConfig.messagingSenderId} onChangeText={(t) => setFirebaseConfigState({ ...firebaseConfig, messagingSenderId: t })} />
                            <TextInput style={styles.input} placeholder="App ID (Optional)" placeholderTextColor={theme.colors.textSecondary} value={firebaseConfig.appId} onChangeText={(t) => setFirebaseConfigState({ ...firebaseConfig, appId: t })} />
                        </View>
                    )}

                    {backend === 'supabase' && (
                        <View style={styles.form}>
                            <Text style={styles.label}>Supabase Configuration</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Supabase URL"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={supabaseConfig.supabaseUrl}
                                onChangeText={(t) => setSupabaseConfigState({ ...supabaseConfig, supabaseUrl: t })}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Anon Key"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={supabaseConfig.supabaseAnonKey}
                                onChangeText={(t) => setSupabaseConfigState({ ...supabaseConfig, supabaseAnonKey: t })}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Xendit Secret Key (xnd_development_...)"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={xenditConfig.secretKey}
                                onChangeText={(t) => setXenditConfigState({ ...xenditConfig, secretKey: t })}
                                secureTextEntry
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Webhook URL (Supabase Edge Function)"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={xenditConfig.webhookUrl}
                                onChangeText={(t) => setXenditConfigState({ ...xenditConfig, webhookUrl: t })}
                            />
                            <Text style={styles.hint}>Jika diisi, pembayaran via QRIS/E-Wallet akan tersedia.</Text>
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

            <TouchableOpacity style={styles.button} onPress={step === 1 ? handleNext : handleSetup} disabled={loading}>
                {loading ? (
                    <Text style={styles.buttonText}>Setting up...</Text>
                ) : (
                    <Text style={styles.buttonText}>{step === 1 ? 'Next' : 'Complete Setup'}</Text>
                )}
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
