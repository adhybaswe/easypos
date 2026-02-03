import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useUserManagementStore } from '../../../stores/useUserManagementStore';
import { User } from '../../../types';

export default function UserFormScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { users, addUser, updateUser, loadUsers } = useUserManagementStore();

    const isEdit = !!params.id;
    const userId = params.id as string;

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'cashier'>('cashier');
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        if (isEdit) {
            const user = users.find(u => u.id === userId);
            if (user) {
                setUsername(user.username);
                setRole(user.role);
                setIsActive(user.is_active);
            }
        }
    }, [isEdit, userId, users]);

    const handleSubmit = () => {
        if (!username) {
            Alert.alert('Error', 'Username is required');
            return;
        }
        if (!isEdit && !password) {
            Alert.alert('Error', 'Password is required for new user');
            return;
        }

        const payload: User = {
            id: isEdit ? userId : Date.now().toString(),
            username,
            role,
            is_active: isActive,
            password_hash: password
        };

        if (isEdit && !password) {
            const oldUser = users.find(u => u.id === userId);
            if (oldUser) {
                payload.password_hash = oldUser.password_hash;
            }
        }

        if (isEdit) {
            updateUser(payload);
        } else {
            addUser(payload);
        }

        router.back();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>{isEdit ? 'Edit User' : 'New User'}</Text>
                <TouchableOpacity onPress={handleSubmit} style={styles.saveBtn}>
                    <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.form}>
                <View style={styles.field}>
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="e.g. cashier1"
                        placeholderTextColor={theme.colors.textSecondary}
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Password {isEdit && '(Leave blank to keep unchanged)'}</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholder="******"
                        placeholderTextColor={theme.colors.textSecondary}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Role</Text>
                    <View style={styles.roleContainer}>
                        <TouchableOpacity
                            style={[styles.roleOption, role === 'admin' && styles.roleExampleAdmin]}
                            onPress={() => setRole('admin')}
                        >
                            <Text style={[styles.roleText, role === 'admin' && { color: theme.colors.primary }]}>Admin</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.roleOption, role === 'cashier' && styles.roleExampleCashier]}
                            onPress={() => setRole('cashier')}
                        >
                            <Text style={[styles.roleText, role === 'cashier' && { color: theme.colors.warning }]}>Cashier</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.field, styles.rowBetween]}>
                    <Text style={styles.label}>Active Account</Text>
                    <Switch
                        value={isActive}
                        onValueChange={setIsActive}
                        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    />
                </View>
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
        padding: 16,
        paddingTop: 60,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backBtn: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    saveBtn: {
        padding: 8,
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
        paddingHorizontal: 16,
    },
    saveText: {
        color: theme.colors.white,
        fontWeight: 'bold',
    },
    form: {
        padding: 24,
    },
    field: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: theme.colors.text,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        backgroundColor: theme.colors.card,
        color: theme.colors.text,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    roleOption: {
        flex: 1,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 16,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: theme.colors.card,
    },
    roleExampleAdmin: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.card, // Keep white background, just colored border/text
        borderWidth: 2,
    },
    roleExampleCashier: {
        borderColor: theme.colors.warning,
        backgroundColor: theme.colors.card,
        borderWidth: 2,
    },
    roleText: {
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});
