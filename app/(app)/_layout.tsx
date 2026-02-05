import { Stack } from 'expo-router';
import React from 'react';

export default function AppLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="pos" />
            <Stack.Screen name="products/index" />
            <Stack.Screen name="categories/index" />
            <Stack.Screen name="users/index" />
            <Stack.Screen name="discounts/index" />
            <Stack.Screen name="stats/index" />
            <Stack.Screen name="transactions/index" />
        </Stack>
    );
}
