/**
 * Puan Sistemi Sabitleri
 *
 * Yıldız Derecelendirmesi:
 *   3 Yıldız = 0 ipucu kullanıldı  → 12 baz puan
 *   2 Yıldız = 1-maxHints arası    → 8 baz puan
 *   1 Yıldız = maxHints'ten fazla  → 4 baz puan
 *   0 Yıldız = 0 (teslim/vazgeç)  → 0 puan
 */

export const POINTS_PER_STAR = 4;

export const STAR_POINTS: Record<0 | 1 | 2 | 3, number> = {
  3: 12,
  2: 8,
  1: 4,
  0: 0,
};

/** İpucu stoğu sabitleri */
export const BASE_HINT_POOL = 100;
export const DAILY_LOGIN_HINT_BONUS = 5;

/**
 * Yıldız sayısını hesaplar.
 *
 * @param hintsUsed Kullanılan ipucu sayısı
 * @param maxHintsForPerfect 3 yıldız için izin verilen max ipucu
 */
export function calculateStars(
  hintsUsed: number,
  maxHintsForPerfect: number
): 0 | 1 | 2 | 3 {
  if (hintsUsed === 0) return 3;
  if (hintsUsed <= maxHintsForPerfect) return 2;
  return 1;
}
