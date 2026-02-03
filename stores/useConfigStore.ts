import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AppConfig } from '../types';

export type Language = 'id' | 'en';

interface ConfigState extends AppConfig {
    language: Language;
    setBackendType: (type: 'firebase' | 'sqlite') => void;
    setSqliteConfig: (config: { databaseName: string }) => void;
    setCurrency: (symbol: string, locale: string) => void;
    setLanguage: (lang: Language) => void;
    setSetupComplete: (complete: boolean) => void;
    resetConfig: () => void;
}

export const useConfigStore = create<ConfigState>()(
    persist(
        (set) => ({
            backendType: null,
            sqliteConfig: undefined,
            currencySymbol: 'Rp',
            currencyLocale: 'id-ID',
            language: 'id',
            isSetupComplete: false,
            setBackendType: (type) => set({ backendType: type }),
            setSqliteConfig: (config) => set({ sqliteConfig: config }),
            setCurrency: (symbol, locale) => set({ currencySymbol: symbol, currencyLocale: locale }),
            setLanguage: (lang) => {
                const currencySymbol = lang === 'id' ? 'Rp' : '$';
                const currencyLocale = lang === 'id' ? 'id-ID' : 'en-US';
                set({
                    language: lang,
                    currencySymbol,
                    currencyLocale
                });
            },
            setSetupComplete: (complete) => set({ isSetupComplete: complete }),
            resetConfig: () => set({
                backendType: null,
                sqliteConfig: undefined,
                currencySymbol: 'Rp',
                currencyLocale: 'id-ID',
                language: 'id',
                isSetupComplete: false
            }),
        }),
        {
            name: 'app-config-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
