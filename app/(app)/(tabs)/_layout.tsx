import { Tabs } from 'expo-router';
import React from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { useTranslation } from '@/utils/i18n';

import { CustomTabBar } from '@/components/CustomTabBar';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuthStore();
  useConfigStore(); // Subscribe to language changes
  const t = useTranslation();

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: user?.role === 'admin' ? t.dashboard : t.pos,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.settings,
        }}
      />
    </Tabs>
  );
}
