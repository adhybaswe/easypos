import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(app)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // In a real app, you might want to load fonts or check auth status here.
    // For now, we just hide the splash screen once the component mounts.
    const prepare = async () => {
      try {
        // Artificially delay slightly for a smoother transition if needed
        // await new Promise(resolve => setTimeout(resolve, 500));
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      }
    };

    prepare();
  }, []);

  return (
    <ActionSheetProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="setup" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </ActionSheetProvider>
  );
}
