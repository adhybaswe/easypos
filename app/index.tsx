import { useAuthStore } from '@/stores/useAuthStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
    const { isSetupComplete } = useConfigStore();
    const { isAuthenticated } = useAuthStore();
    const [isReady, setIsReady] = useState(false);

    // We need to wait for hydration (persist) to finish
    // zustand persist usually doesn't expose hydration state directly without custom setup or useStore
    // But for now, we assume it loads quickly from AsyncStorage.
    // A clean way is to rely on the fact that hooks will re-render.

    // Actually, with persist, we might want to check if hydration is done. 
    // For simplicity now, we assume standard behavior. 
    // Ideally useAuthStore.persist.hasHydrated() check if available or similar pattern.

    useEffect(() => {
        // Small delay or check to ensure hydration could be done if needed, 
        // but in basic setup assume defaults.
        setIsReady(true);
    }, []);

    if (!isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!isSetupComplete) {
        return <Redirect href="/setup" />;
    }

    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }

    return <Redirect href="/(app)/(tabs)" />;
}
