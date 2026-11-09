import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { pickLanguage, type Language } from '../utils/language';
import { DEFAULT_REMINDER_HOUR, reminderHourOf } from '../utils/reminders';
import { settingsFrom } from './persistedData';
import { safeJSONStorage } from './safeStorage';

interface SettingsState {
  language: Language;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  /** Seviyelerde süre sınırı; kapalıysa süre sadece ileri sayar, seviye kaybedilmez */
  timeLimitEnabled: boolean;
  /** Günün bulmacası çözülmediyse seçilen saatte hatırlatma (izin açılırken istenir) */
  reminderEnabled: boolean;
  /** Hatırlatma saati (0-23) */
  reminderHour: number;
  tutorialCompleted: boolean;

  // Actions
  setLanguage: (lang: Language) => void;
  toggleSound: () => void;
  toggleHaptic: () => void;
  toggleTimeLimit: () => void;
  setReminderEnabled: (enabled: boolean) => void;
  setReminderHour: (hour: number) => void;
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
      // Hatırlatma kendiliğinden açılmaz: bildirim izni oyuncu isteyince sorulur
      reminderEnabled: false,
      reminderHour: DEFAULT_REMINDER_HOUR,
      tutorialCompleted: false,

      setLanguage: (lang) => set({ language: lang }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleHaptic: () => set((s) => ({ hapticEnabled: !s.hapticEnabled })),
      toggleTimeLimit: () => set((s) => ({ timeLimitEnabled: !s.timeLimitEnabled })),
      setReminderEnabled: (enabled) => set({ reminderEnabled: enabled }),
      setReminderHour: (hour) => set({ reminderHour: reminderHourOf(hour) }),
      completeTutorial: () => set({ tutorialCompleted: true }),
    }),
    {
      name: 'koyun-kurt-settings',
      // Bozuk dosya yüklemeyi kilitlemesin (eğitim yönlendirmesi ve hatırlatmalar bu yüklemeyi
      // bekliyor); okunan ayarlar alan alan denetlenir (persistedData.ts)
      storage: safeJSONStorage<SettingsState>(() => AsyncStorage),
      merge: (persisted, current) => ({ ...current, ...settingsFrom(persisted) }),
    }
  )
);
