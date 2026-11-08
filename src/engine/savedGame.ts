/**
 * Yarım kalan seviyenin kaydı
 *
 * Oyuncu seviyeden çıkınca ya da uygulama arka plana geçince tahta, ipucuyla açılan
 * hücreler ve geçen süre telefona yazılır; seviyeye dönünce kaldığı yerden sürer.
 * Başta verilen taşlar seviyenin kendisinden bilindiği için kaydedilmez.
 *
 * Telefondan okunan kayda körü körüne güvenilmez: biçimi, başta verilen taşlarla
 * uyumu ve ipucu hücrelerinin doğruluğu denetlenir. Uymayan kayıt (bozuk dosya,
 * bulmacası değişmiş eski sürüm kaydı) yok sayılır ve seviye baştan açılır.
 */
import type { CellValue, GameLevel, Grid } from '../types/game';
import { buildGridFromRaw, rawFromGrid } from './validator';
import { isBoardComplete } from './solver';

export interface SavedGame {
  /** Hücre değerleri satır satır: "0" boş, "1" kurt, "2" koyun */
  values: string;
  /** İpucuyla açılmış hücrelerin sırası (satır * boyut + sütun) */
  hinted: number[];
  /** O ana kadar geçen süre (saniye) */
  elapsed: number;
}

export interface RestoredGame {
  grid: Grid;
  elapsedSeconds: number;
  hintsUsed: number;
}

/** Kabul edilen en uzun süre: 99:59:59 (paylaşım ekranındaki sınırla aynı) */
const MAX_ELAPSED = 359_999;

/**
 * Telefondan okunan kayıt listesi düz bir nesne değilse (bozuk dosya) boş liste.
 * Tek tek kayıtlar seviye açılırken restoreSnapshot ile ayrıca denetlenir.
 */
export function savedGamesFrom(value: unknown): Record<string, SavedGame> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, SavedGame>)
    : {};
}

/** Tahtanın anlık kaydı */
export function createSnapshot(level: GameLevel, grid: Grid, elapsedSeconds: number): SavedGame {
  const size = level.puzzle.length;
  const hinted: number[] = [];
  for (const cell of grid.flat()) {
    if (cell.isLocked && level.puzzle[cell.row][cell.col] === 0) {
      hinted.push(cell.row * size + cell.col);
    }
  }
  return {
    values: grid.flat().map((cell) => cell.value).join(''),
    hinted,
    elapsed: elapsedSeconds,
  };
}

/**
 * Kaydı denetleyip tahtayı geri kurar. Kayıt geçersizse ya da tahta zaten çözülmüşse null.
 * Her ipucu tam bir hücre açtığı için kullanılan ipucu sayısı açılan hücre sayısıdır.
 */
export function restoreSnapshot(level: GameLevel, saved: unknown): RestoredGame | null {
  if (typeof saved !== 'object' || saved === null) return null;
  const { values, hinted, elapsed } = saved as Partial<Record<keyof SavedGame, unknown>>;

  const size = level.puzzle.length;
  const cellCount = size * size;
  if (typeof values !== 'string' || !new RegExp(`^[012]{${cellCount}}$`).test(values)) return null;
  if (!Number.isInteger(elapsed) || (elapsed as number) < 0 || (elapsed as number) > MAX_ELAPSED) {
    return null;
  }
  if (!Array.isArray(hinted) || new Set(hinted).size !== hinted.length) return null;

  const valueAt = (index: number) => Number(values[index]) as CellValue;
  const puzzleAt = (index: number) => level.puzzle[Math.floor(index / size)][index % size];
  const solutionAt = (index: number) => level.solution[Math.floor(index / size)][index % size];

  // Başta verilen taşlar yerinde olmalı
  for (let i = 0; i < cellCount; i++) {
    if (puzzleAt(i) !== 0 && valueAt(i) !== puzzleAt(i)) return null;
  }
  // İpucu hücresi: boş verilmiş bir hücre ve içinde çözümdeki değer
  for (const index of hinted) {
    if (!Number.isInteger(index) || index < 0 || index >= cellCount) return null;
    if (puzzleAt(index) !== 0 || valueAt(index) !== solutionAt(index)) return null;
  }

  const hintedSet = new Set(hinted as number[]);
  const grid: Grid = buildGridFromRaw(level.puzzle).map((row) =>
    row.map((cell) => {
      const index = cell.row * size + cell.col;
      return cell.isLocked
        ? cell
        : { ...cell, value: valueAt(index), isLocked: hintedSet.has(index) };
    }),
  );

  // Çözülmüş tahta yarım kalmış sayılmaz (bitince kayıt silinir; buraya gelmemeli)
  if (isBoardComplete(rawFromGrid(grid), level.solution)) return null;

  return { grid, elapsedSeconds: elapsed as number, hintsUsed: hinted.length };
}
