/**
 * Zorluk kademeleri
 *
 * Tahta her zaman 6x6. Zorluk sadece başta açık verilen simge sayısına bağlı:
 * En Kolay'da çok simge açık, İmkânsız'da en az. Her kademe 50 seviye;
 * kademe içinde açık simge sayısı `clues` listesindeki sırayla azalır.
 * Her kademenin sabit bir süresi var; süre sınırı ayarlardan kapatılabilir.
 */
import type { Difficulty } from '../types/game';

export const GRID_SIZE = 6;
export const LEVELS_PER_DIFFICULTY = 50;

/** En Kolay'ın ilk bu kadar seviyesi süresiz: yeni oyuncu kuralları süreyle yarışmadan öğrensin */
export const WARMUP_LEVELS = 5;

export interface DifficultyConfig {
  id: Difficulty;
  /** Kademe içindeki seviyelerin açık simge sayıları, kolaydan zora (eşit paylaştırılır) */
  clues: number[];
  /** 2 yıldız için izin verilen en fazla ipucu */
  maxHintsForPerfect: number;
  /** Seviyeyi bitirmek için süre (saniye); dolarsa seviye kaybedilir */
  timeLimitSeconds: number;
}

export const DIFFICULTIES: DifficultyConfig[] = [
  { id: 'easiest', clues: [24, 23, 22, 21, 20], maxHintsForPerfect: 3, timeLimitSeconds: 30 },
  { id: 'easy', clues: [19, 18, 17], maxHintsForPerfect: 3, timeLimitSeconds: 60 },
  { id: 'medium', clues: [16, 15, 14], maxHintsForPerfect: 2, timeLimitSeconds: 2 * 60 },
  { id: 'hard', clues: [13, 12], maxHintsForPerfect: 2, timeLimitSeconds: 3 * 60 },
  { id: 'veryHard', clues: [11, 10], maxHintsForPerfect: 1, timeLimitSeconds: 5 * 60 },
  { id: 'impossible', clues: [9, 8, 7], maxHintsForPerfect: 1, timeLimitSeconds: 7 * 60 },
];

/**
 * Sayacın kırmızıya döndüğü kalan süre (saniye): sürenin dörtte biri, en fazla 30 sn.
 * En Kolay'da (30 sn) son 7 saniye, Orta ve üstünde son 30 saniye.
 */
export function warningSecondsFor(timeLimit: number): number {
  return Math.min(30, Math.floor(timeLimit / 4));
}

/** Kademedeki `index`. seviyenin (0-49) açık simge sayısı */
export function cluesFor(config: DifficultyConfig, index: number): number {
  const bucket = Math.floor((index * config.clues.length) / LEVELS_PER_DIFFICULTY);
  return config.clues[bucket];
}
