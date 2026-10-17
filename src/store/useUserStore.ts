import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LevelResult } from '../types/game';
import type { UserProfile } from '../types/user';
import { BASE_HINT_POOL, DAILY_LOGIN_HINT_BONUS } from '../constants/scoring';

interface UserState extends UserProfile {
  // Actions
  consumeHint: () => boolean;       // true: başarılı, false: yeterli ipucu yok
  /** Seviye sonucunu kaydeder; puana sadece önceki en iyi sonuçtan fazlası eklenir. */
  recordLevelResult: (levelId: number, result: LevelResult) => void;
  claimDailyBonus: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  totalPoints: 0,
  availableHints: BASE_HINT_POOL,
  lastLoginDate: null,
  completedLevels: {},
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PROFILE,

      consumeHint: () => {
        if (get().availableHints <= 0) return false;
        set((s) => ({ availableHints: s.availableHints - 1 }));
        return true;
      },

      recordLevelResult: (levelId, result) => {
        set((s) => {
          const key = String(levelId);
          const previous = s.completedLevels[key];
          if (previous && previous.score >= result.score) return {};
          const totalPoints = s.totalPoints + result.score - (previous?.score ?? 0);
          return {
            completedLevels: { ...s.completedLevels, [key]: result },
            totalPoints,
          };
        });
      },

      claimDailyBonus: () => {
        set((s) => ({
          availableHints: s.availableHints + DAILY_LOGIN_HINT_BONUS,
          lastLoginDate: Date.now(),
        }));
      },
    }),
    {
      name: 'koyun-kurt-user',
      storage: createJSONStorage(() => AsyncStorage),
      // Sürüm 2: 300 sabit seviye. Eski rastgele seviyelerin ilerlemesi sıfırlanır, ipuçları kalır.
      version: 2,
      migrate: (persisted, version) => {
        const old = (persisted ?? {}) as Partial<UserProfile>;
        if (version < 2) {
          return {
            ...DEFAULT_PROFILE,
            availableHints: old.availableHints ?? BASE_HINT_POOL,
            lastLoginDate: old.lastLoginDate ?? null,
          };
        }
        return old as UserProfile;
      },
    }
  )
);
