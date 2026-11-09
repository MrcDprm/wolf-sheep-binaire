import { create } from 'zustand';
import type { CellValue, Grid, GameLevel, RawGrid } from '../types/game';
import { buildGridFromRaw, rawFromGrid, applyErrorsToGrid } from '../engine/validator';
import { findHint, type Hint } from '../engine/hint';
import { isBoardComplete } from '../engine/solver';
import { restoreSnapshot, type SavedGame } from '../engine/savedGame';

/**
 * Geri alınabilir hamle: tek hücreye dokunuş ya da Sıfırla (öncesindeki bütün değerler).
 * İpucu geri alınmaz: harcanmış bir ipucudur ve hücreyi kilitler.
 */
export type Move =
  | { type: 'tap'; row: number; col: number; prev: CellValue }
  | { type: 'reset'; prev: RawGrid };

/** Geri al geçmişinde en fazla bu kadar hamle tutulur */
const MAX_HISTORY = 300;

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
  /** Geri al için yapılan hamleler (en yenisi sonda); seviyeden çıkınca saklanmaz */
  history: Move[];
  /** Son ipucu (ekranda vurgulanır, gerekçesi yazılır); sonraki hamlede silinir */
  lastHint: Hint | null;

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
  /** Son hamleyi (dokunuş ya da Sıfırla) geri alır; geri alınacak bir şey yoksa false */
  undo: () => boolean;
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
  history: [] as Move[],
  lastHint: null as Hint | null,
};

const withMove = (history: Move[], move: Move) => [...history, move].slice(-MAX_HISTORY);

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
      history: [],
      lastHint: null,
    });
  },

  tapCell: (row, col) => {
    const { grid, solutionRaw, history } = get();
    const cell = grid[row]?.[col];
    if (!cell || cell.isLocked || isOver(get())) return;

    // Dokunma döngüsü: boş → kurt → koyun → boş
    const nextValue = ((cell.value + 1) % 3) as 0 | 1 | 2;

    const updatedGrid: Grid = grid.map((r) =>
      r.map((c) => (c.row === row && c.col === col ? { ...c, value: nextValue } : c))
    );

    set({
      ...evaluate(updatedGrid, solutionRaw),
      history: withMove(history, { type: 'tap', row, col, prev: cell.value }),
      lastHint: null,
    });
  },

  applyHint: () => {
    const { grid, solutionRaw, history, hintsUsed } = get();
    if (isOver(get())) return false;
    const hint = findHint(grid, solutionRaw);
    if (!hint) return false;

    const { row, col } = hint;
    if (hint.kind === 'wrong') {
      // Yanlış taş kaldırılır; o hücreye ait eski hamleler geri alınınca geri gelmesin
      const updatedGrid: Grid = grid.map((r) =>
        r.map((c) => (c.row === row && c.col === col ? { ...c, value: 0 } : c))
      );
      set({
        ...evaluate(updatedGrid, solutionRaw),
        hintsUsed: hintsUsed + 1,
        lastHint: hint,
        history: history.filter((m) => !(m.type === 'tap' && m.row === row && m.col === col)),
      });
      return true;
    }

    // Kural kesinleştirdi: değer konur ve kilitlenir
    const updatedGrid: Grid = grid.map((r) =>
      r.map((c) => (c.row === row && c.col === col ? { ...c, value: hint.value, isLocked: true } : c))
    );
    set({ ...evaluate(updatedGrid, solutionRaw), hintsUsed: hintsUsed + 1, lastHint: hint });
    return true;
  },

  resetUserCells: () => {
    const { grid, solutionRaw, history } = get();
    // Bitmiş ya da süresi dolmuş tahta olduğu gibi kalır (önceden taşlar siliniyor, tahta donuyordu)
    if (isOver(get())) return;
    // Silinecek oyuncu taşı yoksa geçmişe boş bir Sıfırla yazılmaz
    if (grid.every((r) => r.every((c) => c.isLocked || c.value === 0))) return;
    // Oyuncunun taşları silinir; başta verilen ve ipucuyla açılan taşlar kalır.
    // Kalan taşların hata işareti de yeniden hesaplanır (önceden kırmızı kalıyordu).
    // Süre işlemeye devam eder: Sıfırla yeni süre vermez. Geri al ile taşlar geri gelir.
    const resetGrid: Grid = grid.map((r) => r.map((c) => (c.isLocked ? c : { ...c, value: 0 })));
    set({
      ...evaluate(resetGrid, solutionRaw),
      history: withMove(history, { type: 'reset', prev: rawFromGrid(grid) }),
      lastHint: null,
    });
  },

  undo: () => {
    if (isOver(get())) return false;
    const { grid, solutionRaw } = get();
    const history = [...get().history];

    while (history.length > 0) {
      const move = history.pop()!;
      if (move.type === 'tap') {
        // Sonradan ipucuyla kilitlenen hücrenin eski hamlesi atlanır
        if (grid[move.row]?.[move.col]?.isLocked !== false) continue;
        const updated: Grid = grid.map((r) =>
          r.map((c) => (c.row === move.row && c.col === move.col ? { ...c, value: move.prev } : c))
        );
        set({ ...evaluate(updated, solutionRaw), history, lastHint: null });
        return true;
      }
      // Sıfırla geri alınınca oyuncunun taşları geri gelir; kilitli hücreler olduğu gibi kalır
      const updated: Grid = grid.map((r) =>
        r.map((c) => (c.isLocked ? c : { ...c, value: move.prev[c.row][c.col] }))
      );
      set({ ...evaluate(updated, solutionRaw), history, lastHint: null });
      return true;
    }

    set({ history });
    return false;
  },

  tickTimer: () => {
    const { elapsedSeconds, timeLimit } = get();
    if (isOver(get())) return;
    const elapsed = elapsedSeconds + 1;
    set({ elapsedSeconds: elapsed, isTimeUp: timeLimit !== null && elapsed >= timeLimit });
  },

  resetGame: () => set(EMPTY_GAME),
}));
