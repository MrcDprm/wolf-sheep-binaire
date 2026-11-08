import { create } from 'zustand';
import type { Grid, GameLevel, RawGrid } from '../types/game';
import { buildGridFromRaw, rawFromGrid, applyErrorsToGrid } from '../engine/validator';
import { pickHintCell } from '../engine/hint';
import { isBoardComplete } from '../engine/solver';

interface GameState {
  grid: Grid;
  solutionRaw: RawGrid;
  level: GameLevel | null;
  hintsUsed: number;
  elapsedSeconds: number;
  isComplete: boolean;
  hasActiveError: boolean;

  // --- Actions ---
  initGame: (level: GameLevel) => void;
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
};

/**
 * Tahtayı baştan değerlendirir: hangi hücreler kırmızı, hata var mı, bitti mi.
 * Tahtayı değiştiren her eylem buradan geçer; kilitli hücreler dahil hiçbir
 * hücrede eski bir hata işareti kalmaz.
 */
function evaluate(grid: Grid, solutionRaw: RawGrid) {
  const { validatedGrid, hasError } = applyErrorsToGrid(grid);
  return {
    grid: validatedGrid,
    hasActiveError: hasError,
    isComplete: !hasError && isBoardComplete(rawFromGrid(validatedGrid), solutionRaw),
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  ...EMPTY_GAME,

  initGame: (level) => {
    set({
      grid: buildGridFromRaw(level.puzzle),
      solutionRaw: level.solution,
      level,
      hintsUsed: 0,
      elapsedSeconds: 0,
      isComplete: false,
      hasActiveError: false,
    });
  },

  tapCell: (row, col) => {
    const { grid, solutionRaw, isComplete } = get();
    const cell = grid[row]?.[col];
    if (!cell || cell.isLocked || isComplete) return;

    // Dokunma döngüsü: boş → kurt → koyun → boş
    const nextValue = ((cell.value + 1) % 3) as 0 | 1 | 2;

    const updatedGrid: Grid = grid.map((r) =>
      r.map((c) => (c.row === row && c.col === col ? { ...c, value: nextValue } : c))
    );

    set(evaluate(updatedGrid, solutionRaw));
  },

  applyHint: () => {
    const { grid, solutionRaw, isComplete } = get();
    if (isComplete) return false;
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
    const { grid, solutionRaw, isComplete } = get();
    // Bitmiş tahta olduğu gibi kalır (önceden taşlar siliniyor, tahta donuyordu)
    if (isComplete) return;
    // Oyuncunun taşları silinir; başta verilen ve ipucuyla açılan taşlar kalır.
    // Kalan taşların hata işareti de yeniden hesaplanır (önceden kırmızı kalıyordu).
    const resetGrid: Grid = grid.map((r) => r.map((c) => (c.isLocked ? c : { ...c, value: 0 })));
    set(evaluate(resetGrid, solutionRaw));
  },

  tickTimer: () => {
    set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }));
  },

  resetGame: () => set(EMPTY_GAME),
}));
