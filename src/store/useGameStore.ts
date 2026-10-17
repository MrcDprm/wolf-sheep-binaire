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
      r.map((c) =>
        c.row === row && c.col === col ? { ...c, value: nextValue, hasError: false } : c
      )
    );

    const { validatedGrid, hasError } = applyErrorsToGrid(updatedGrid);
    const complete = !hasError && isBoardComplete(rawFromGrid(validatedGrid), solutionRaw);

    set({ grid: validatedGrid, hasActiveError: hasError, isComplete: complete });
  },

  applyHint: () => {
    const { grid, solutionRaw, isComplete } = get();
    if (isComplete) return false;
    const hintCell = pickHintCell(grid, solutionRaw);
    if (!hintCell) return false;

    const { row, col, value } = hintCell;
    const updatedGrid: Grid = grid.map((r) =>
      r.map((c) =>
        c.row === row && c.col === col
          ? { ...c, value, isLocked: true, hasError: false }
          : c
      )
    );

    const { validatedGrid, hasError } = applyErrorsToGrid(updatedGrid);
    const complete = !hasError && isBoardComplete(rawFromGrid(validatedGrid), solutionRaw);
    set({
      grid: validatedGrid,
      hintsUsed: get().hintsUsed + 1,
      hasActiveError: hasError,
      isComplete: complete,
    });
    return true;
  },

  resetUserCells: () => {
    const { grid } = get();
    const resetGrid: Grid = grid.map((r) =>
      r.map((c) => (c.isLocked ? c : { ...c, value: 0, hasError: false }))
    );
    set({ grid: resetGrid, hasActiveError: false });
  },

  tickTimer: () => {
    set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }));
  },

  resetGame: () => set(EMPTY_GAME),
}));
