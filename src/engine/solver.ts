/**
 * Bitiş kontrolü
 */
import type { RawGrid } from '../types/game';

/**
 * Oyuncunun tahtası çözümle birebir aynı mı?
 * Bulmacaların tek çözümü olduğu için kurallara uyan dolu tahta = çözüm.
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
