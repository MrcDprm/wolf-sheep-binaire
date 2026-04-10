import { create } from 'zustand';
import type { Grid, GameMode, GameLevel, LevelResult, RawGrid } from '../types/game';
import { buildGridFromRaw, rawFromGrid, applyErrorsToGrid } from '../engine/validator';
import { pickHintCell } from '../engine/hint';
import { isBoardComplete } from '../engine/solver';

interface PrecomputedEntry {
  initialRaw: RawGrid;
  solutionRaw: RawGrid;
}

interface GameState {
  // --- Aktif oyun ---
  grid: Grid;
  solutionRaw: RawGrid;
  mode: GameMode;
  level: GameLevel | null;
  hintsUsed: number;
  elapsedSeconds: number;
  isBlindMode: boolean;
  isComplete: boolean;
  hasActiveError: boolean;

  // --- Önceden hesaplanmış grid havuzu ---
  precomputedGrids: Record<string, PrecomputedEntry>;

  // --- Actions ---
  initGame: (
    level: GameLevel,
    mode: GameMode,
    precomputed?: PrecomputedEntry
  ) => void;
  tapCell: (row: number, col: number) => void;
  applyHint: () => void;
  resetUserCells: () => void;
  tickTimer: () => void;
  storePrecomputed: (key: string, entry: PrecomputedEntry) => void;
  getPrecomputed: (key: string) => PrecomputedEntry | undefined;
  clearPrecomputed: (key: string) => void;
  resetGame: () => void;
}

const EMPTY_GRID: Grid = [];
const EMPTY_RAW: RawGrid = [];

export const useGameStore = create<GameState>((set, get) => ({
  grid: EMPTY_GRID,
  solutionRaw: EMPTY_RAW,
  mode: 'campaign',
  level: null,
  hintsUsed: 0,
  elapsedSeconds: 0,
  isBlindMode: false,
  isComplete: false,
  hasActiveError: false,
  precomputedGrids: {},

  initGame: (level, mode, precomputed) => {
    if (!precomputed) return; // Çağıran taraf precomputed temin etmeli

    const { initialRaw, solutionRaw } = precomputed;
    const grid = buildGridFromRaw(initialRaw);

    set({
      grid,
      solutionRaw,
      mode,
      level,
      hintsUsed: 0,
      elapsedSeconds: 0,
      isBlindMode: mode === 'impossible',
      isComplete: false,
      hasActiveError: false,
    });
  },

  tapCell: (row, col) => {
    const { grid, solutionRaw, isBlindMode } = get();
    const cell = grid[row]?.[col];
    if (!cell || cell.isLocked) return;

    // Dokunma döngüsü: 0 → 1 → 2 → 0
    const nextValue = ((cell.value + 1) % 3) as 0 | 1 | 2;

    const updatedGrid: Grid = grid.map((r) =>
      r.map((c) =>
        c.row === row && c.col === col ? { ...c, value: nextValue, hasError: false } : c
      )
    );

    if (isBlindMode) {
      // İmkansız modda hata gösterme, sadece değeri güncelle
      const complete = isBoardComplete(rawFromGrid(updatedGrid), solutionRaw);
      set({ grid: updatedGrid, isComplete: complete });
      return;
    }

    const { validatedGrid, hasError } = applyErrorsToGrid(updatedGrid);
    const raw = rawFromGrid(validatedGrid);
    const complete = !hasError && isBoardComplete(raw, solutionRaw);

    set({ grid: validatedGrid, hasActiveError: hasError, isComplete: complete });
  },

  applyHint: () => {
    const { grid, solutionRaw } = get();
    const hintCell = pickHintCell(grid, solutionRaw);
    if (!hintCell) return;

    const { row, col, value } = hintCell;
    const updatedGrid: Grid = grid.map((r) =>
      r.map((c) =>
        c.row === row && c.col === col
          ? { ...c, value, isLocked: true, hasError: false }
          : c
      )
    );

    const { validatedGrid, hasError } = applyErrorsToGrid(updatedGrid);
    set({
      grid: validatedGrid,
      hintsUsed: get().hintsUsed + 1,
      hasActiveError: hasError,
    });
  },

  resetUserCells: () => {
    const { grid } = get();
    const resetGrid: Grid = grid.map((r) =>
      r.map((c) =>
        c.isLocked ? c : { ...c, value: 0, hasError: false }
      )
    );
    set({ grid: resetGrid, hasActiveError: false });
  },

  tickTimer: () => {
    set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }));
  },

  storePrecomputed: (key, entry) => {
    set((s) => ({
      precomputedGrids: { ...s.precomputedGrids, [key]: entry },
    }));
  },

  getPrecomputed: (key) => get().precomputedGrids[key],

  clearPrecomputed: (key) => {
    set((s) => {
      const next = { ...s.precomputedGrids };
      delete next[key];
      return { precomputedGrids: next };
    });
  },

  resetGame: () =>
    set({
      grid: EMPTY_GRID,
      solutionRaw: EMPTY_RAW,
      level: null,
      hintsUsed: 0,
      elapsedSeconds: 0,
      isBlindMode: false,
      isComplete: false,
      hasActiveError: false,
    }),
}));

export type { PrecomputedEntry };
