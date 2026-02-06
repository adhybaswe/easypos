import { AppConfig } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Language = 'id' | 'en';

interface ConfigState extends AppConfig {
    language: Language;
    setBackendType: (type: 'firebase' | 'sqlite' | 'supabase') => void;
    setSqliteConfig: (config: { databaseName: string }) => void;
    setFirebaseConfig: (config: AppConfig['firebaseConfig']) => void;
    setSupabaseConfig: (config: AppConfig['supabaseConfig']) => void;
    setXenditConfig: (config: AppConfig['xenditConfig']) => void;
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
            firebaseConfig: undefined,
            currencySymbol: 'Rp',
            currencyLocale: 'id-ID',
            language: 'id',
            isSetupComplete: false,
            setBackendType: (type) => set({ backendType: type }),
            setSqliteConfig: (config) => set({ sqliteConfig: config }),
            setFirebaseConfig: (config) => set({ firebaseConfig: config }),
            setSupabaseConfig: (config) => set({ supabaseConfig: config }),
            setXenditConfig: (config) => set({ xenditConfig: config }),
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
                firebaseConfig: undefined,
                supabaseConfig: undefined,
                xenditConfig: {
                    secretKey: 'xnd_development_bM4W0FyWgedUwwytWlrlXseNLEl5TPlUhmmcXxBZjmwGbp87CoOkvGfAcQ6oZWI',
                    webhookUrl: ''
                },
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
