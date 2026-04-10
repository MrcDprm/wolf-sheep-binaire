/**
 * Puan hesaplama yardımcıları (pure functions)
 *
 * Anti-P2W mantığı:
 *  - Premium kullanıcı ipucu kullanırsa yıldız/puan ücretsiz oyuncu gibi düşer.
 *  - Bu mantık burada uygulanır, store bunu doğrudan çağırır.
 */
import type { LevelResult } from '../types/game';
import type { GameLevel } from '../types/game';
import {
  STAR_POINTS,
  calculateStars,
  calculateTimeBonus,
} from '../constants/scoring';

export interface ScoreInput {
  hintsUsed: number;
  elapsedSeconds: number;
  level: GameLevel;
  /** Firebase'den dönen yüzdelik dilim (1-100). null = henüz bilinmiyor → 0 bonus */
  timePercentile: number | null;
}

export interface ScoreOutput extends LevelResult {
  baseScore: number;
  timeBonus: number;
}

/**
 * Bir seviyenin final puanını ve yıldız sayısını hesaplar.
 * Premium/ücretsiz ayrımı yok — ipucu sayısı her zaman etkilidir.
 */
export function computeLevelScore(input: ScoreInput): ScoreOutput {
  const { hintsUsed, elapsedSeconds, level, timePercentile } = input;

  const stars = calculateStars(hintsUsed, level.maxHintsForPerfect);
  const baseScore = STAR_POINTS[stars];
  const timeBonus =
    stars > 0 && timePercentile !== null
      ? calculateTimeBonus(timePercentile)
      : 0;

  return {
    stars,
    time: elapsedSeconds,
    hintsUsed,
    score: baseScore + timeBonus,
    baseScore,
    timeBonus,
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

/**
 * Yüzdelik dilimi hesaplar.
 * `allTimes`: Firebase'den gelen diğer oyuncuların süreleri (saniye).
 * `playerTime`: Oyuncunun süresi.
 * Dönen değer: 1-100 arası integer (1 = en iyi).
 */
export function computePercentile(allTimes: number[], playerTime: number): number {
  if (allTimes.length === 0) return 50; // Veri yoksa orta al
  const betterCount = allTimes.filter((t) => t > playerTime).length;
  return Math.max(1, Math.round(((allTimes.length - betterCount) / allTimes.length) * 100));
}
