/**
 * Puan hesaplama yardımcıları (pure functions)
 */
import type { GameLevel, LevelResult } from '../types/game';
import { STAR_POINTS, calculateStars } from '../constants/scoring';

export interface ScoreInput {
  hintsUsed: number;
  elapsedSeconds: number;
  level: GameLevel;
}

/**
 * Bir seviyenin puanını ve yıldız sayısını hesaplar.
 * Kullanılan ipucu sayısı yıldızı ve puanı düşürür.
 */
export function computeLevelScore(input: ScoreInput): LevelResult {
  const { hintsUsed, elapsedSeconds, level } = input;
  const stars = calculateStars(hintsUsed, level.maxHintsForPerfect);

  return {
    stars,
    time: elapsedSeconds,
    hintsUsed,
    score: STAR_POINTS[stars],
  };
}

/**
 * Süreyi "MM:SS" formatına çevirir.
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
