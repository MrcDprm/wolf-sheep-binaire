import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LevelResult } from '../types/game';
import type { UserProfile } from '../types/user';
import { getTitleForPoints } from '../constants/titles';
import { BASE_HINT_POOL, DAILY_LOGIN_HINT_BONUS } from '../constants/scoring';

interface UserState extends UserProfile {
  isLoading: boolean;

  // Actions
  hydrate: (profile: UserProfile) => void;
  consumeHint: () => boolean;       // true: başarılı, false: yeterli ipucu yok
  addHints: (amount: number) => void;
  addPoints: (points: number) => void;
  markLevelComplete: (levelId: string, result: LevelResult) => void;
  claimDailyBonus: () => void;
  setPremium: (value: boolean) => void;
  setDisplayName: (name: string) => void;
  setLoading: (value: boolean) => void;
}

const DEFAULT_PROFILE: UserProfile = {
  uid: '',
  displayName: 'Anonim Oyuncu',
  totalPoints: 0,
  availableHints: BASE_HINT_POOL,
  lastLoginDate: null,
  isPremium: false,
  completedLevels: {},
  currentTitle: 'Kuzu Çırağı',
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PROFILE,
      isLoading: false,

      hydrate: (profile) => {
        set({ ...profile, currentTitle: getTitleForPoints(profile.totalPoints) });
      },

      consumeHint: () => {
        const { availableHints, isPremium } = get();
        if (isPremium) return true; // Sınırsız — stok düşmez
        if (availableHints <= 0) return false;
        set((s) => ({ availableHints: s.availableHints - 1 }));
        return true;
      },

      addHints: (amount) => {
        set((s) => ({ availableHints: s.availableHints + amount }));
      },

      addPoints: (points) => {
        set((s) => {
          const newTotal = s.totalPoints + points;
          return {
            totalPoints: newTotal,
            currentTitle: getTitleForPoints(newTotal),
          };
        });
      },

      markLevelComplete: (levelId, result) => {
        set((s) => {
          const existing = s.completedLevels[levelId];
          // Daha iyi sonucu koru
          if (existing && existing.score >= result.score) return {};
          return {
            completedLevels: { ...s.completedLevels, [levelId]: result },
          };
        });
      },

      claimDailyBonus: () => {
        set((s) => ({
          availableHints: s.availableHints + DAILY_LOGIN_HINT_BONUS,
          lastLoginDate: Date.now(),
        }));
      },

      setPremium: (value) => set({ isPremium: value }),

      setDisplayName: (name) => set({ displayName: name }),

      setLoading: (value) => set({ isLoading: value }),
    }),
    {
      name: 'koyun-kurt-user',
      storage: createJSONStorage(() => AsyncStorage),
      // Tüm alanları persist et, isLoading hariç
      partialize: (state) => {
        const { isLoading: _loading, ...rest } = state;
        return rest;
      },
    }
  )
);
