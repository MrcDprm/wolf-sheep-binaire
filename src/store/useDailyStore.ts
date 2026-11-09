/**
 * Günün bulmacası sonuçları (telefonda, AsyncStorage)
 *
 * Çözülen her gün tarihiyle tutulur; seri ve istatistikler bu kayıttan hesaplanır
 * (engine/dailyResults.ts). Bir günün yalnızca ilk çözümü sayılır.
 * Kayıt okunurken denetlenir: bozuk günler atılır.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDailyResult, dailyResultsFrom, type DailyResults } from '../engine/dailyResults';
import type { LevelResult } from '../types/game';
import { safeJSONStorage } from './safeStorage';

interface DailyState {
  results: DailyResults;
  /** Günün sonucunu kaydeder (o gün zaten çözüldüyse değişmez) */
  recordResult: (date: string, result: LevelResult) => void;
}

export const useDailyStore = create<DailyState>()(
  persist(
    (set) => ({
      results: {},

      // Değişiklik yoksa aynı durum döner: zustand güncellemez, telefona boşuna yazılmaz
      recordResult: (date, result) =>
        set((s) => {
          const results = addDailyResult(s.results, date, result);
          return results === s.results ? s : { results };
        }),
    }),
    {
      name: 'koyun-kurt-daily',
      // Bozuk dosya yüklemeyi kilitlemesin: günün bulmacası ekranı bu yüklemeyi bekliyor
      storage: safeJSONStorage<Pick<DailyState, 'results'>>(() => AsyncStorage),
      version: 1,
      partialize: (s) => ({ results: s.results }),
      merge: (persisted, current) => ({
        ...current,
        results: dailyResultsFrom((persisted as { results?: unknown } | undefined)?.results),
      }),
    },
  ),
);
