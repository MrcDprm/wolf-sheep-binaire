/**
 * 300 seviye: 6 zorluk x 50 seviye, hepsi 6x6.
 *
 * Bulmacalar levelData.ts içinde sabittir; her seviye her açılışta aynıdır.
 * Seviyeler kilitlidir: bir seviyeyi açmak için öncekini bitirmek gerekir.
 */
import type { CellValue, GameLevel, LevelResult, RawGrid } from '../types/game';
import { DIFFICULTIES, GRID_SIZE, LEVELS_PER_DIFFICULTY } from './difficulties';
import { LEVEL_DATA } from './levelData';

function parseGrid(text: string): RawGrid {
  return Array.from({ length: GRID_SIZE }, (_, r) =>
    Array.from({ length: GRID_SIZE }, (_, c) => Number(text[r * GRID_SIZE + c]) as CellValue)
  );
}

export const LEVELS: GameLevel[] = LEVEL_DATA.map(([puzzle, solution], i) => {
  const config = DIFFICULTIES[Math.floor(i / LEVELS_PER_DIFFICULTY)];
  return {
    id: i + 1,
    difficulty: config.id,
    number: (i % LEVELS_PER_DIFFICULTY) + 1,
    puzzle: parseGrid(puzzle),
    solution: parseGrid(solution),
    maxHintsForPerfect: config.maxHintsForPerfect,
  };
});

export const TOTAL_LEVELS = LEVELS.length;

export function getLevelById(id: number): GameLevel | undefined {
  return Number.isInteger(id) ? LEVELS[id - 1] : undefined;
}

type Completed = Record<string, LevelResult>;

/** İlk seviye hep açık; diğerleri bir öncekini bitirince açılır. */
export function isLevelUnlocked(id: number, completed: Completed): boolean {
  if (id < 1 || id > TOTAL_LEVELS) return false;
  return id === 1 || completed[String(id - 1)] !== undefined;
}

/** "Oyna" düğmesinin açacağı seviye: bitirilmemiş ilk seviye (hepsi bittiyse sonuncusu). */
export function nextLevelToPlay(completed: Completed): number {
  for (let id = 1; id <= TOTAL_LEVELS; id++) {
    if (completed[String(id)] === undefined) return id;
  }
  return TOTAL_LEVELS;
}
