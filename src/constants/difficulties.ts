/**
 * Zorluk kademeleri
 *
 * Tahta her zaman 6x6. Zorluk sadece başta açık verilen simge sayısına bağlı:
 * En Kolay'da çok simge açık, İmkânsız'da en az. Her kademe 50 seviye;
 * kademe içinde açık simge sayısı `clues` listesindeki sırayla azalır.
 */
import type { Difficulty } from '../types/game';

export const GRID_SIZE = 6;
export const LEVELS_PER_DIFFICULTY = 50;

export interface DifficultyConfig {
  id: Difficulty;
  /** Kademe içindeki seviyelerin açık simge sayıları, kolaydan zora (eşit paylaştırılır) */
  clues: number[];
  /** 2 yıldız için izin verilen en fazla ipucu */
  maxHintsForPerfect: number;
}

export const DIFFICULTIES: DifficultyConfig[] = [
  { id: 'easiest', clues: [24, 23, 22, 21, 20], maxHintsForPerfect: 3 },
  { id: 'easy', clues: [19, 18, 17], maxHintsForPerfect: 3 },
  { id: 'medium', clues: [16, 15, 14], maxHintsForPerfect: 2 },
  { id: 'hard', clues: [13, 12], maxHintsForPerfect: 2 },
  { id: 'veryHard', clues: [11, 10], maxHintsForPerfect: 1 },
  { id: 'impossible', clues: [9, 8, 7], maxHintsForPerfect: 1 },
];

/** Kademedeki `index`. seviyenin (0-49) açık simge sayısı */
export function cluesFor(config: DifficultyConfig, index: number): number {
  const bucket = Math.floor((index * config.clues.length) / LEVELS_PER_DIFFICULTY);
  return config.clues[bucket];
}
