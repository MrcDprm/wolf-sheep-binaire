/**
 * İpucu Seçici Motoru
 *
 * Boş hücreler arasından matematiksel olarak tek doğru değeri olan
 * bir hücreyi rastgele seçer ve çözümdeki değeri döner.
 *
 * Öncelik sırası:
 * 1. Çözümde değeri olan ve oyuncunun henüz doldurmadığı hücreler.
 * 2. Bunlar arasından rastgele bir tanesi seçilir (tahmin edilemezlik).
 *
 * Kilitli ipucu: applyHint() store'a ekledikten sonra
 * hücre `isLocked = true` olarak işaretlenir.
 */
import type { Grid, RawGrid, CellValue } from '../types/game';

interface HintCell {
  row: number;
  col: number;
  value: CellValue;
}

/**
 * Oyuncu grid'indeki boş hücreler arasından bir ipucu hücresi seçer.
 *
 * @param grid Mevcut oyuncu grid'i
 * @param solutionRaw Hedef çözüm
 * @returns Seçilen ipucu hücresi veya null (tüm hücreler doluysa)
 */
export function pickHintCell(grid: Grid, solutionRaw: RawGrid): HintCell | null {
  const candidates: HintCell[] = [];

  for (const row of grid) {
    for (const cell of row) {
      if (cell.value === 0 && !cell.isLocked) {
        const correctValue = solutionRaw[cell.row][cell.col] as CellValue;
        if (correctValue !== 0) {
          candidates.push({ row: cell.row, col: cell.col, value: correctValue });
        }
      }
    }
  }

  if (candidates.length === 0) return null;

  // Rastgele seç
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx];
}

/**
 * Belirli bir (row, col) konumu için çözümdeki doğru değeri döner.
 * Doğrudan ipucu vermek yerine "bu hücrenin cevabı nedir?" diye
 * sorulduğunda kullanılır (gelecekteki spotlight ipucu modu için).
 */
export function getCorrectValueAt(
  row: number,
  col: number,
  solutionRaw: RawGrid
): CellValue {
  return solutionRaw[row][col] as CellValue;
}
