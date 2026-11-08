import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { pickLanguage, type Language } from '../utils/language';

interface SettingsState {
  language: Language;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  /** Seviyelerde süre sınırı; kapalıysa süre sadece ileri sayar, seviye kaybedilmez */
  timeLimitEnabled: boolean;
  tutorialCompleted: boolean;

  // Actions
  setLanguage: (lang: Language) => void;
  toggleSound: () => void;
  toggleHaptic: () => void;
  toggleTimeLimit: () => void;
  completeTutorial: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Kayıtlı ayar yoksa (ilk açılış) cihaz dili kullanılır
      language: pickLanguage(getLocales().map((l) => l.languageCode)),
      soundEnabled: true,
      hapticEnabled: true,
      // Kayıtlı ayarlarda bu alan yoksa (1.0'dan gelen oyuncu) açık başlar
      timeLimitEnabled: true,
      tutorialCompleted: false,

      setLanguage: (lang) => set({ language: lang }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleHaptic: () => set((s) => ({ hapticEnabled: !s.hapticEnabled })),
      toggleTimeLimit: () => set((s) => ({ timeLimitEnabled: !s.timeLimitEnabled })),
      completeTutorial: () => set({ tutorialCompleted: true }),
    }),
    {
      name: 'koyun-kurt-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
