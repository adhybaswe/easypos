import { theme } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../stores/useAuthStore';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        // In a real app, verify with backend.
        // For this setup demo:
        if (username === 'admin' && password === 'admin') {
            login({ id: '1', username: 'admin', role: 'admin', is_active: true });
            router.replace('/(app)/(tabs)');
            return;
        }
        if (username === 'cashier' && password === 'cashier') {
            login({ id: '2', username: 'cashier', role: 'cashier', is_active: true });
            router.replace('/(app)/(tabs)');
            return;
        }

        if (username && password) {
            // Mock login
            const role = username.toLowerCase().includes('admin') ? 'admin' : 'cashier';
            login({ id: Date.now().toString(), username, role, is_active: true });
            router.replace('/(app)/(tabs)');
        } else {
            Alert.alert('Error', 'Please enter username and password');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>EasyPOS Login</Text>

                <Text style={styles.label}>Username</Text>
                <TextInput
                    style={styles.input}
                    placeholder="admin / cashier"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />

                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder="password"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Log In</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: theme.colors.card,
        borderRadius: 20,
        padding: 32,
        ...theme.shadows.medium,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 32,
        textAlign: 'center',
        color: theme.colors.text,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: theme.colors.textSecondary,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        marginBottom: 20,
        color: theme.colors.text,
    },
    button: {
        backgroundColor: theme.colors.primary,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
        ...theme.shadows.small,
    },
    buttonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
