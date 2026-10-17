/**
 * İpucu seçici
 *
 * Oyuncunun boş bıraktığı ya da yanlış doldurduğu hücrelerden birini
 * rastgele seçer ve çözümdeki doğru değeri döner. Seçilen hücre
 * store'da doğru değerle kilitlenir.
 */
import type { Grid, RawGrid, CellValue } from '../types/game';

interface HintCell {
  row: number;
  col: number;
  value: CellValue;
}

/**
 * Boş ya da yanlış hücreler arasından bir ipucu hücresi seçer.
 * Tahta çözümle aynıysa null döner.
 */
export function pickHintCell(grid: Grid, solutionRaw: RawGrid): HintCell | null {
  const candidates: HintCell[] = [];

  for (const row of grid) {
    for (const cell of row) {
      const correctValue = solutionRaw[cell.row][cell.col] as CellValue;
      if (!cell.isLocked && cell.value !== correctValue) {
        candidates.push({ row: cell.row, col: cell.col, value: correctValue });
      }
    }
  }

  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
