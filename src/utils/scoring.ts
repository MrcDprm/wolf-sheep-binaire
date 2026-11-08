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

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Süreyi cümle içinde okunur yazar: 30 → "30 saniye", 60 → "1 minute", 90 → "1 dakika 30 saniye".
 * Tekil/çoğul ayrımı İngilizce için (`duration.minute` / `duration.minutes`).
 */
export function formatDuration(seconds: number, t: Translate): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  const parts: string[] = [];
  if (minutes > 0) {
    parts.push(t(minutes === 1 ? 'duration.minute' : 'duration.minutes', { count: minutes }));
  }
  if (rest > 0 || minutes === 0) {
    parts.push(t(rest === 1 ? 'duration.second' : 'duration.seconds', { count: rest }));
  }
  return parts.join(' ');
}
