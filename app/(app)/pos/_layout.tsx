import { Stack } from 'expo-router';

export default function POSLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="cart" />
            <Stack.Screen name="checkout" />
            <Stack.Screen name="success" options={{ gestureEnabled: false }} />
        </Stack>
    );
}
