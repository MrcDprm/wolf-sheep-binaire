/**
 * Yarım kalan seviyeler (telefonda, AsyncStorage)
 *
 * Her seviyenin en son yarım kalan hali seviye numarasıyla tutulur. Seviye bitince
 * ya da süresi dolunca kaydı silinir; bir sonraki giriş baştan başlar. Günün bulmacası
 * da günün numarasıyla burada tutulur; gün geçince eski kaydı silinir.
 * Kayıtlar okunurken engine/savedGame.ts içinde denetlenir.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { savedGamesFrom, type SavedGame } from '../engine/savedGame';
import { isDailyLevelId } from '../engine/daily';
import { safeJSONStorage } from './safeStorage';

interface SavedGamesState {
  games: Record<string, SavedGame>;
  saveGame: (levelId: number, game: SavedGame) => void;
  clearGame: (levelId: number) => void;
  /** Geçmiş günlerin yarım kalmış günlük bulmacalarını siler (o günler bir daha açılmaz) */
  clearOldDailyGames: (todayLevelId: number) => void;
}

const sameGame = (a: SavedGame | undefined, b: SavedGame) =>
  a !== undefined &&
  a.values === b.values &&
  a.elapsed === b.elapsed &&
  a.hinted.length === b.hinted.length &&
  a.hinted.every((index, i) => index === b.hinted[i]);

export const useSavedGamesStore = create<SavedGamesState>()(
  persist(
    (set) => ({
      games: {},

      // Değişiklik yoksa aynı durum döner: zustand güncellemez, telefona boşuna yazılmaz
      saveGame: (levelId, game) =>
        set((s) =>
          sameGame(s.games[String(levelId)], game)
            ? s
            : { games: { ...s.games, [String(levelId)]: game } },
        ),

      clearGame: (levelId) =>
        set((s) => {
          const key = String(levelId);
          if (!(key in s.games)) return s;
          const games = { ...s.games };
          delete games[key];
          return { games };
        }),

      clearOldDailyGames: (todayLevelId) =>
        set((s) => {
          const stale = Object.keys(s.games).filter(
            (key) => isDailyLevelId(Number(key)) && Number(key) !== todayLevelId,
          );
          if (stale.length === 0) return s;
          const games = { ...s.games };
          for (const key of stale) delete games[key];
          return { games };
        }),
    }),
    {
      name: 'koyun-kurt-saved-games',
      // Bozuk dosya yüklemeyi kilitlemesin: oyun ekranı bu yüklemeyi bekliyor
      storage: safeJSONStorage<Pick<SavedGamesState, 'games'>>(() => AsyncStorage),
      version: 1,
      partialize: (s) => ({ games: s.games }),
      merge: (persisted, current) => ({
        ...current,
        games: savedGamesFrom((persisted as { games?: unknown } | undefined)?.games),
      }),
    },
  ),
);
