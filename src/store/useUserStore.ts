import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LevelResult } from '../types/game';
import type { UserProfile } from '../types/user';
import { BASE_HINT_POOL, DAILY_LOGIN_HINT_BONUS } from '../constants/scoring';
import { mergeLevelResult } from '../utils/scoring';

interface UserState extends UserProfile {
  // Actions
  consumeHint: () => boolean;       // true: başarılı, false: yeterli ipucu yok
  /**
   * Seviye sonucunu kaydeder: puana sadece önceki en iyi sonuçtan fazlası eklenir,
   * en iyi süre her zaman güncellenir.
   */
  recordLevelResult: (levelId: number, result: LevelResult) => void;
  /** Son kaydedilen seviyenin rekor bilgisi (tamamlama penceresi için; telefona yazılmaz) */
  lastRecord: { levelId: number; best: number; isNew: boolean } | null;
  claimDailyBonus: () => void;
  /** Açılan seviyeyi "son oynanan" olarak kaydeder */
  setLastLevel: (levelId: number) => void;
}

// Yeni alanlar burada varsayılanla başlar; kayıtlı eski profilde olmayan alan
// (ör. lastLevelId) yüklenirken bu varsayılanla tamamlanır, sürüm artırmak gerekmez.
const DEFAULT_PROFILE: UserProfile = {
  totalPoints: 0,
  availableHints: BASE_HINT_POOL,
  lastLoginDate: null,
  completedLevels: {},
  lastLevelId: null,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PROFILE,
      lastRecord: null,

      consumeHint: () => {
        if (get().availableHints <= 0) return false;
        set((s) => ({ availableHints: s.availableHints - 1 }));
        return true;
      },

      recordLevelResult: (levelId, result) => {
        set((s) => {
          const key = String(levelId);
          const merged = mergeLevelResult(s.completedLevels[key], result);
          return {
            completedLevels: { ...s.completedLevels, [key]: merged.next },
            totalPoints: s.totalPoints + merged.scoreGain,
            lastRecord: { levelId, best: merged.best, isNew: merged.isNewRecord },
          };
        });
      },

      claimDailyBonus: () => {
        set((s) => ({
          availableHints: s.availableHints + DAILY_LOGIN_HINT_BONUS,
          lastLoginDate: Date.now(),
        }));
      },

      setLastLevel: (levelId) => {
        if (get().lastLevelId !== levelId) set({ lastLevelId: levelId });
      },
    }),
    {
      name: 'koyun-kurt-user',
      storage: createJSONStorage(() => AsyncStorage),
      // Sürüm 2: 300 sabit seviye. Eski rastgele seviyelerin ilerlemesi sıfırlanır, ipuçları kalır.
      version: 2,
      // Rekor bilgisi yalnızca o anki pencere için; kalıcı profile girmez
      partialize: ({ lastRecord: _lastRecord, ...profile }) => profile,
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
