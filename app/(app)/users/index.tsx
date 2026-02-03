import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useUserManagementStore } from '../../../stores/useUserManagementStore';

export default function UserListScreen() {
    const router = useRouter();
    const { users, loadUsers, deleteUser } = useUserManagementStore();
    const { user: currentUser } = useAuthStore();

    useEffect(() => {
        loadUsers();
    }, []);

    const handleDelete = (id: string) => {
        if (id === currentUser?.id) {
            Alert.alert('Error', 'You cannot delete yourself.');
            return;
        }
        Alert.alert('Delete User', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteUser(id) }
        ]);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardInfo}>
                <Text style={styles.username}>{item.username}</Text>
                <View style={styles.badges}>
                    <View style={[styles.badge, item.role === 'admin' ? styles.badgeAdmin : styles.badgeCashier]}>
                        <Text style={[styles.badgeText, item.role === 'admin' ? { color: theme.colors.primary } : { color: theme.colors.warning }]}>
                            {item.role.toUpperCase()}
                        </Text>
                    </View>
                    {!item.is_active && (
                        <View style={[styles.badge, styles.badgeInactive]}>
                            <Text style={[styles.badgeText, { color: theme.colors.error }]}>INACTIVE</Text>
                        </View>
                    )}
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push({ pathname: '/(app)/users/form', params: { id: item.id } })}
                >
                    <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDelete(item.id)}
                >
                    <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Manage Users</Text>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => router.push('/(app)/users/form')}
                >
                    <Ionicons name="add" size={24} color={theme.colors.white} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={users}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No users found.</Text>
                        <Text style={styles.emptySubText}>This is expected if you haven&apos;t synced initial admin.</Text>
                        <Text style={styles.emptySubText}>Tap + to add a cashier.</Text>
                    </View>
                }
            />
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
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    addBtn: {
        backgroundColor: theme.colors.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.small,
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        ...theme.shadows.small,
    },
    cardInfo: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: theme.colors.text,
    },
    badges: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        backgroundColor: theme.colors.lightGray,
    },
    badgeAdmin: {
        // Handled by inline text color for better theme support without complex palette
    },
    badgeCashier: {

    },
    badgeInactive: {

    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginLeft: 16,
    },
    actionBtn: {
        padding: 8,
        backgroundColor: theme.colors.lightGray,
        borderRadius: 8,
    },
    empty: {
        alignItems: 'center',
        marginTop: 80,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },
    emptySubText: {
        color: theme.colors.textSecondary,
        marginTop: 8,
    },
});
