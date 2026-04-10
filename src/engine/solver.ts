/**
 * Çözüm doğrulayıcı
 *
 * - isBoardComplete: Oyuncunun tahtasının çözümle tam örtüştüğünü kontrol eder.
 * - isBoardFilled: Tüm hücreler dolu mu?
 * - diffFromSolution: Oyuncunun yanlış doldurduğu hücreleri döner.
 */
import type { RawGrid } from '../types/game';

/**
 * Oyuncunun mevcut `playerRaw` grid'inin, hedef `solutionRaw` ile
 * birebir eşleşip eşleşmediğini kontrol eder.
 *
 * İmkansız modda da aynı fonksiyon kullanılır:
 * tüm hücreler doluysa ve çözümle eşleşiyorsa oyun biter.
 */
export function isBoardComplete(playerRaw: RawGrid, solutionRaw: RawGrid): boolean {
  const size = playerRaw.length;
  if (size === 0) return false;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (playerRaw[r][c] !== solutionRaw[r][c]) return false;
    }
  }
  return true;
}

/**
 * Grid'in tamamen doldurulup doldurulmadığını kontrol eder (0 değeri yok).
 * İmkansız modda doğrulamayı tetiklemek için kullanılır.
 */
export function isBoardFilled(raw: RawGrid): boolean {
  return raw.every((row) => row.every((cell) => cell !== 0));
}

/**
 * Oyuncunun yanlış doldurduğu hücreleri döner.
 * Kullanım: hata ayıklama / eğitim amaçlı.
 */
export function diffFromSolution(
  playerRaw: RawGrid,
  solutionRaw: RawGrid
): Array<{ row: number; col: number; playerValue: number; correctValue: number }> {
  const diffs: Array<{
    row: number;
    col: number;
    playerValue: number;
    correctValue: number;
  }> = [];

  const size = playerRaw.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const pv = playerRaw[r][c];
      const sv = solutionRaw[r][c];
      if (pv !== 0 && pv !== sv) {
        diffs.push({ row: r, col: c, playerValue: pv, correctValue: sv });
      }
    }
  }

  return diffs;
}

/**
 * Kaç hücrenin boş kaldığını sayar.
 */
export function countEmpty(raw: RawGrid): number {
  let count = 0;
  for (const row of raw) {
    for (const cell of row) {
      if (cell === 0) count++;
    }
  }
  return count;
}

/**
 * Tamamlanma yüzdesini döner (0-100).
 */
export function completionPercent(raw: RawGrid): number {
  const size = raw.length;
  const total = size * size;
  if (total === 0) return 0;
  const filled = total - countEmpty(raw);
  return Math.round((filled / total) * 100);
}
