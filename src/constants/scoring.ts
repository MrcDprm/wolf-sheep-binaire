/**
 * Puan Sistemi Sabitleri
 *
 * Yıldız Derecelendirmesi:
 *   3 Yıldız = 0 ipucu kullanıldı  → 12 baz puan
 *   2 Yıldız = 1-maxHints arası    → 8 baz puan
 *   1 Yıldız = maxHints'ten fazla  → 4 baz puan
 *   0 Yıldız = 0 (teslim/vazgeç)  → 0 puan
 *
 * Zaman Bonusu (Firebase yüzdelik dilimi bazlı):
 *   En iyi %1   → +8 puan
 *   En iyi %5   → +6 puan
 *   En iyi %10  → +5 puan
 *   En iyi %25  → +3 puan
 *   En iyi %50  → +1 puan
 *   Alt %50     → +0 puan
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

/** Zaman bonusu eşik tablosu: [yüzdelik dilim üst sınır, bonus puan] */
export const TIME_BONUS_TIERS: Array<{ percentile: number; bonus: number }> = [
  { percentile: 1,  bonus: 8 },
  { percentile: 5,  bonus: 6 },
  { percentile: 10, bonus: 5 },
  { percentile: 25, bonus: 3 },
  { percentile: 50, bonus: 1 },
  { percentile: 100, bonus: 0 },
];

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

/**
 * Zaman bonusunu hesaplar.
 * `percentile`: oyuncunun sıralamada bulunduğu yüzde (küçük = daha iyi).
 * Örnek: percentile=3 → en iyi %3 → +6 puan.
 */
export function calculateTimeBonus(percentile: number): number {
  for (const tier of TIME_BONUS_TIERS) {
    if (percentile <= tier.percentile) return tier.bonus;
  }
  return 0;
}
