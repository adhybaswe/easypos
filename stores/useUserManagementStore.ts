import * as db from '@/services/db';
import { User } from '@/types';
import { create } from 'zustand';

interface UserState {
    users: User[];
    isLoading: boolean;
    error: string | null;
    loadUsers: () => void;
    addUser: (user: User) => void;
    updateUser: (user: User) => void;
    deleteUser: (id: string) => void;
}

export const useUserManagementStore = create<UserState>((set) => ({
    users: [],
    isLoading: false,
    error: null,

    loadUsers: async () => {
        set({ isLoading: true, error: null });
        try {
            await db.initDatabase();
            const users = await db.getUsers();

            // If no users, maybe setup incomplete, or admin doesn't exist yet in DB?
            // During setup.tsx we mostly mocked it or just set config.
            // But we should probably add the current admin to DB if not exists eventually.

            set({ users, isLoading: false });
        } catch (e: any) {
            set({ error: e.message, isLoading: false });
        }
    },

    addUser: async (user) => {
        try {
            await db.insertUser(user);
            set((state) => ({ users: [...state.users, user] }));
        } catch (e: any) {
            console.error("Failed to add user", e);
            set({ error: "Failed to add user (Username might be taken)" });
        }
    },

    updateUser: async (user) => {
        try {
            await db.updateUserDB(user);
            set((state) => ({
                users: state.users.map((u) => (u.id === user.id ? user : u)),
            }));
        } catch (e: any) {
            console.error("Failed to update user", e);
            set({ error: "Failed to update user" });
        }
    },

    deleteUser: async (id) => {
        try {
            await db.deleteUserDB(id);
            set((state) => ({
                users: state.users.filter((u) => u.id !== id),
            }));
        } catch (e: any) {
            console.error("Failed to delete user", e);
            set({ error: "Failed to delete user" });
        }
    },
}));
