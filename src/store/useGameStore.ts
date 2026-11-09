import { create } from 'zustand';
import type { Grid, GameLevel, RawGrid } from '../types/game';
import { buildGridFromRaw, rawFromGrid, applyErrorsToGrid } from '../engine/validator';
import { pickHintCell } from '../engine/hint';
import { isBoardComplete } from '../engine/solver';
import { restoreSnapshot, type SavedGame } from '../engine/savedGame';

interface GameState {
  grid: Grid;
  solutionRaw: RawGrid;
  level: GameLevel | null;
  hintsUsed: number;
  elapsedSeconds: number;
  isComplete: boolean;
  hasActiveError: boolean;
  /** Süre sınırı (saniye); ayarlardan kapatıldıysa null ve süre ileri sayar */
  timeLimit: number | null;
  /** Süre doldu: seviye kaybedildi, tahta kilitli */
  isTimeUp: boolean;

  // --- Actions ---
  /**
   * Seviyeyi başlatır. `timeLimit` verilmezse süre sınırı yoktur.
   * Geçerli bir `saved` kaydı verilirse kaldığı yerden (taşlar, ipuçları, süre) sürer;
   * kayıt geçersizse seviye baştan açılır.
   */
  initGame: (level: GameLevel, timeLimit?: number | null, saved?: SavedGame) => void;
  tapCell: (row: number, col: number) => void;
  /** İpucu uygulandıysa true döner */
  applyHint: () => boolean;
  resetUserCells: () => void;
  tickTimer: () => void;
  /** Ekrandan çıkınca oyunu temizler */
  resetGame: () => void;
}

const EMPTY_GAME = {
  grid: [] as Grid,
  solutionRaw: [] as RawGrid,
  level: null,
  hintsUsed: 0,
  elapsedSeconds: 0,
  isComplete: false,
  hasActiveError: false,
  timeLimit: null,
  isTimeUp: false,
};

/** Tahtada boş hücre kalmadı mı? */
export const isBoardFull = (grid: Grid) => grid.every((row) => row.every((cell) => cell.value !== 0));

/**
 * Tahtayı baştan değerlendirir: hangi hücreler kırmızı, hata var mı, bitti mi.
 * Tahtayı değiştiren her eylem buradan geçer; kilitli hücreler dahil hiçbir
 * hücrede eski bir hata işareti kalmaz.
 *
 * Hatalar ancak tahta tamamen dolunca gösterilir: oyuncu taş koyup kırmızı yanıp
 * yanmadığına bakarak, mantık yürütmeden çözemesin.
 */
function evaluate(grid: Grid, solutionRaw: RawGrid) {
  const { validatedGrid, hasError } = applyErrorsToGrid(grid);
  const full = isBoardFull(grid);
  return {
    grid: full
      ? validatedGrid
      : validatedGrid.map((row) => row.map((cell) => (cell.hasError ? { ...cell, hasError: false } : cell))),
    hasActiveError: full && hasError,
    isComplete: full && !hasError && isBoardComplete(rawFromGrid(validatedGrid), solutionRaw),
  };
}

/** Seviye bitti ya da süre doldu: tahtada artık hiçbir şey değişmez */
const isOver = (s: { isComplete: boolean; isTimeUp: boolean }) => s.isComplete || s.isTimeUp;

export const useGameStore = create<GameState>((set, get) => ({
  ...EMPTY_GAME,

  initGame: (level, timeLimit = null, saved) => {
    const restored = saved === undefined ? null : restoreSnapshot(level, saved);
    const elapsedSeconds = restored?.elapsedSeconds ?? 0;
    set({
      // Kayıttan gelen tahtanın kırmızı hücreleri de yeniden hesaplanır
      ...evaluate(restored?.grid ?? buildGridFromRaw(level.puzzle), level.solution),
      solutionRaw: level.solution,
      level,
      hintsUsed: restored?.hintsUsed ?? 0,
      elapsedSeconds,
      timeLimit,
      // Süre sınırı sonradan açıldıysa kayıttaki süre sınırı aşmış olabilir
      isTimeUp: timeLimit !== null && elapsedSeconds >= timeLimit,
    });
  },

  tapCell: (row, col) => {
    const { grid, solutionRaw } = get();
    const cell = grid[row]?.[col];
    if (!cell || cell.isLocked || isOver(get())) return;

    // Dokunma döngüsü: boş → kurt → koyun → boş
    const nextValue = ((cell.value + 1) % 3) as 0 | 1 | 2;

    const updatedGrid: Grid = grid.map((r) =>
      r.map((c) => (c.row === row && c.col === col ? { ...c, value: nextValue } : c))
    );

    set(evaluate(updatedGrid, solutionRaw));
  },

  applyHint: () => {
    const { grid, solutionRaw } = get();
    if (isOver(get())) return false;
    const hintCell = pickHintCell(grid, solutionRaw);
    if (!hintCell) return false;

    const { row, col, value } = hintCell;
    const updatedGrid: Grid = grid.map((r) =>
      r.map((c) => (c.row === row && c.col === col ? { ...c, value, isLocked: true } : c))
    );

    set({ ...evaluate(updatedGrid, solutionRaw), hintsUsed: get().hintsUsed + 1 });
    return true;
  },

  resetUserCells: () => {
    const { grid, solutionRaw } = get();
    // Bitmiş ya da süresi dolmuş tahta olduğu gibi kalır (önceden taşlar siliniyor, tahta donuyordu)
    if (isOver(get())) return;
    // Oyuncunun taşları silinir; başta verilen ve ipucuyla açılan taşlar kalır.
    // Kalan taşların hata işareti de yeniden hesaplanır (önceden kırmızı kalıyordu).
    // Süre işlemeye devam eder: Sıfırla yeni süre vermez.
    const resetGrid: Grid = grid.map((r) => r.map((c) => (c.isLocked ? c : { ...c, value: 0 })));
    set(evaluate(resetGrid, solutionRaw));
  },

  tickTimer: () => {
    const { elapsedSeconds, timeLimit } = get();
    if (isOver(get())) return;
    const elapsed = elapsedSeconds + 1;
    set({ elapsedSeconds: elapsed, isTimeUp: timeLimit !== null && elapsed >= timeLimit });
  },

  resetGame: () => set(EMPTY_GAME),
}));
