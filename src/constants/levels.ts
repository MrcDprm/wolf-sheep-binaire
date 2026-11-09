/**
 * 300 seviye: 6 zorluk x 50 seviye, hepsi 6x6.
 *
 * Bulmacalar levelData.ts içinde sabittir; her seviye her açılışta aynıdır.
 * Oyuncu istediği zorluktan başlar: her zorluğun 1. seviyesi açıktır,
 * zorluk içindeki seviyeler ise sırayla, bir öncekini bitirince açılır.
 */
import type { CellValue, Difficulty, GameLevel, LevelResult, RawGrid } from '../types/game';
import { DIFFICULTIES, GRID_SIZE, LEVELS_PER_DIFFICULTY, WARMUP_LEVELS } from './difficulties';
import { LEVEL_DATA } from './levelData';

function parseGrid(text: string): RawGrid {
  return Array.from({ length: GRID_SIZE }, (_, r) =>
    Array.from({ length: GRID_SIZE }, (_, c) => Number(text[r * GRID_SIZE + c]) as CellValue)
  );
}

export const LEVELS: GameLevel[] = LEVEL_DATA.map(([puzzle, solution], i) => {
  const config = DIFFICULTIES[Math.floor(i / LEVELS_PER_DIFFICULTY)];
  const number = (i % LEVELS_PER_DIFFICULTY) + 1;
  return {
    id: i + 1,
    difficulty: config.id,
    number,
    puzzle: parseGrid(puzzle),
    solution: parseGrid(solution),
    maxHintsForPerfect: config.maxHintsForPerfect,
    // Isınma seviyeleri süresiz, diğerleri zorluğun sabit süresiyle
    timeLimit: config.id === 'easiest' && number <= WARMUP_LEVELS ? null : config.timeLimitSeconds,
  };
});

export const TOTAL_LEVELS = LEVELS.length;

export function getLevelById(id: number): GameLevel | undefined {
  return Number.isInteger(id) ? LEVELS[id - 1] : undefined;
}

type Completed = Record<string, LevelResult>;

/**
 * Her zorluğun 1. seviyesi hep açık; diğerleri aynı zorluktaki bir öncekini bitirince açılır.
 * (Bir zorluğun seviyeleri art arda numaralı olduğu için "bir önceki" id - 1'dir.)
 */
export function isLevelUnlocked(id: number, completed: Completed): boolean {
  const level = getLevelById(id);
  if (!level) return false;
  return level.number === 1 || completed[String(id - 1)] !== undefined;
}

/** Zorluktaki bitirilmemiş ilk seviye; hepsi bittiyse undefined */
export function firstUnfinishedIn(difficulty: Difficulty, completed: Completed): number | undefined {
  return LEVELS.find((l) => l.difficulty === difficulty && completed[String(l.id)] === undefined)?.id;
}

/**
 * "Devam et" düğmesinin açacağı seviye.
 * Son oynanan zorlukta bitirilmemiş ilk seviye; o zorluk bittiyse sonraki zorluklarda
 * (sona gelince baştan) bitirilmemiş ilk seviye. Hiç oynanmadıysa ya da kayıtlı numara
 * geçersizse En Kolay'dan aranır. Hepsi bittiyse son oynanan (yoksa en son) seviye.
 */
export function nextLevelToPlay(completed: Completed, lastLevelId: number | null = null): number {
  const last = lastLevelId === null ? undefined : getLevelById(lastLevelId);
  const start = last ? DIFFICULTIES.findIndex((d) => d.id === last.difficulty) : 0;

  for (let i = 0; i < DIFFICULTIES.length; i++) {
    const difficulty = DIFFICULTIES[(start + i) % DIFFICULTIES.length].id;
    const next = firstUnfinishedIn(difficulty, completed);
    if (next !== undefined) return next;
  }
  return last?.id ?? TOTAL_LEVELS;
}

/**
 * Seviye bitince "Sonraki seviye" düğmesinin açacağı seviye: sıradaki numara; son seviyeden
 * sonra "Devam et" kuralıyla bitirilmemiş ilk seviye. Bütün seviyeler bittiyse null.
 * `completed` az önce bitirilen seviyeyi de içermeli.
 */
export function levelAfter(levelId: number, completed: Completed): number | null {
  if (LEVELS.every((l) => completed[String(l.id)] !== undefined)) return null;
  return levelId < TOTAL_LEVELS ? levelId + 1 : nextLevelToPlay(completed, levelId);
}
