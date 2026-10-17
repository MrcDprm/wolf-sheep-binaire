import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'tr' | 'en';

interface SettingsState {
  language: Language;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  tutorialCompleted: boolean;

  // Actions
  setLanguage: (lang: Language) => void;
  toggleSound: () => void;
  toggleHaptic: () => void;
  completeTutorial: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'tr',
      soundEnabled: true,
      hapticEnabled: true,
      tutorialCompleted: false,

      setLanguage: (lang) => set({ language: lang }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleHaptic: () => set((s) => ({ hapticEnabled: !s.hapticEnabled })),
      completeTutorial: () => set({ tutorialCompleted: true }),
    }),
    {
      name: 'koyun-kurt-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
