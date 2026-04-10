/**
 * Takuzu/Binairo kural doğrulayıcısı
 *
 * Kural 1: Yatay veya dikey olarak yan yana en fazla 2 aynı sembol.
 * Kural 2: Her satır ve sütun tam olarak eşit sayıda Koyun (2) ve Kurt (1) içerir.
 */
import type { Cell, Grid, RawGrid, CellValue } from '../types/game';

// ---------------------------------------------------------------------------
// Düşük seviye kontroller (RawGrid üzerinde çalışır — algoritma içi kullanım)
// ---------------------------------------------------------------------------

/**
 * Belirli bir (row, col) konumuna `value` yerleştirildiğinde
 * Kural 1 ihlali oluşuyor mu?
 */
export function wouldViolateTriple(
  raw: RawGrid,
  row: number,
  col: number,
  value: CellValue
): boolean {
  const size = raw.length;

  // Yatay kontrol
  const leftVal1 = col >= 2 ? raw[row][col - 2] : -1;
  const leftVal2 = col >= 1 ? raw[row][col - 1] : -1;
  const rightVal1 = col < size - 1 ? raw[row][col + 1] : -1;
  const rightVal2 = col < size - 2 ? raw[row][col + 2] : -1;

  if (leftVal1 === value && leftVal2 === value) return true;
  if (leftVal2 === value && rightVal1 === value) return true;
  if (rightVal1 === value && rightVal2 === value) return true;

  // Dikey kontrol
  const upVal1 = row >= 2 ? raw[row - 2][col] : -1;
  const upVal2 = row >= 1 ? raw[row - 1][col] : -1;
  const downVal1 = row < size - 1 ? raw[row + 1][col] : -1;
  const downVal2 = row < size - 2 ? raw[row + 2][col] : -1;

  if (upVal1 === value && upVal2 === value) return true;
  if (upVal2 === value && downVal1 === value) return true;
  if (downVal1 === value && downVal2 === value) return true;

  return false;
}

/**
 * Belirli bir (row, col) konumuna `value` yerleştirildiğinde
 * Kural 2 ihlali oluşuyor mu? (Satır/sütun kapasitesini taşıyor mu?)
 */
export function wouldViolateBalance(
  raw: RawGrid,
  row: number,
  col: number,
  value: CellValue
): boolean {
  if (value === 0) return false;

  const size = raw.length;
  const half = size / 2;

  // Satır sayacı
  let rowCount = 0;
  for (let c = 0; c < size; c++) {
    if (c !== col && raw[row][c] === value) rowCount++;
  }
  if (rowCount >= half) return true;

  // Sütun sayacı
  let colCount = 0;
  for (let r = 0; r < size; r++) {
    if (r !== row && raw[r][col] === value) colCount++;
  }
  if (colCount >= half) return true;

  return false;
}

/**
 * Bir RawGrid'in tam çözüme uygun olup olmadığını doğrular.
 * (Kural 1 + Kural 2 + satır/sütun benzersizliği)
 */
export function isRawGridValid(raw: RawGrid): boolean {
  const size = raw.length;
  const half = size / 2;

  for (let r = 0; r < size; r++) {
    let wolfRow = 0;
    let sheepRow = 0;
    for (let c = 0; c < size; c++) {
      const v = raw[r][c];
      if (v === 1) wolfRow++;
      if (v === 2) sheepRow++;
      // Kural 1 — yatay
      if (c >= 2 && raw[r][c - 1] === v && raw[r][c - 2] === v && v !== 0) return false;
    }
    if (raw[r].some((v) => v === 0)) continue; // Henüz boş hücre var, kontrol etme
    if (wolfRow !== half || sheepRow !== half) return false;
  }

  for (let c = 0; c < size; c++) {
    let wolfCol = 0;
    let sheepCol = 0;
    for (let r = 0; r < size; r++) {
      const v = raw[r][c];
      if (v === 1) wolfCol++;
      if (v === 2) sheepCol++;
      // Kural 1 — dikey
      if (r >= 2 && raw[r - 1][c] === v && raw[r - 2][c] === v && v !== 0) return false;
    }
    if (raw.some((row) => row[c] === 0)) continue;
    if (wolfCol !== half || sheepCol !== half) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// UI Grid dönüşüm yardımcıları
// ---------------------------------------------------------------------------

/** Grid → RawGrid (sadece değerler) */
export function rawFromGrid(grid: Grid): RawGrid {
  return grid.map((row) => row.map((cell) => cell.value));
}

/** RawGrid → Cell[][] (tüm hücreler kilitli değil, hatasız başlar) */
export function buildGridFromRaw(raw: RawGrid): Grid {
  return raw.map((row, r) =>
    row.map((value, c) => ({
      row: r,
      col: c,
      value: value as CellValue,
      isLocked: value !== 0, // Başlangıç ipuçları kilitli
      hasError: false,
    }))
  );
}

// ---------------------------------------------------------------------------
// Hata tespiti ve Grid güncelleme
// ---------------------------------------------------------------------------

interface ValidationResult {
  validatedGrid: Grid;
  hasError: boolean;
  errorCells: Array<{ row: number; col: number }>;
}

/**
 * Mevcut Grid üzerindeki tüm Kural 1 ve Kural 2 ihlallerini tespit eder,
 * ilgili hücreleri `hasError: true` olarak işaretler.
 */
export function applyErrorsToGrid(grid: Grid): ValidationResult {
  const size = grid.length;
  const half = size / 2;
  const errorSet = new Set<string>();

  const key = (r: number, c: number) => `${r},${c}`;

  // --- Kural 1: Üçlü ardışık kontrol (yatay & dikey) ---
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 2; c++) {
      const v = grid[r][c].value;
      if (v !== 0 &&
          grid[r][c + 1].value === v &&
          grid[r][c + 2].value === v) {
        errorSet.add(key(r, c));
        errorSet.add(key(r, c + 1));
        errorSet.add(key(r, c + 2));
      }
    }
  }

  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size - 2; r++) {
      const v = grid[r][c].value;
      if (v !== 0 &&
          grid[r + 1][c].value === v &&
          grid[r + 2][c].value === v) {
        errorSet.add(key(r, c));
        errorSet.add(key(r + 1, c));
        errorSet.add(key(r + 2, c));
      }
    }
  }

  // --- Kural 2: Satır/sütun dengesizliği ---
  for (let r = 0; r < size; r++) {
    const rowValues = grid[r].map((c) => c.value);
    const hasEmpty = rowValues.includes(0);
    if (hasEmpty) continue;

    const wolfCount = rowValues.filter((v) => v === 1).length;
    const sheepCount = rowValues.filter((v) => v === 2).length;
    if (wolfCount !== half || sheepCount !== half) {
      grid[r].forEach((cell) => {
        if (cell.value !== 0) errorSet.add(key(cell.row, cell.col));
      });
    }
  }

  for (let c = 0; c < size; c++) {
    const colValues = grid.map((row) => row[c].value);
    const hasEmpty = colValues.includes(0);
    if (hasEmpty) continue;

    const wolfCount = colValues.filter((v) => v === 1).length;
    const sheepCount = colValues.filter((v) => v === 2).length;
    if (wolfCount !== half || sheepCount !== half) {
      grid.forEach((row) => {
        if (row[c].value !== 0) errorSet.add(key(row[c].row, row[c].col));
      });
    }
  }

  const hasError = errorSet.size > 0;
  const errorCells: Array<{ row: number; col: number }> = [];

  const validatedGrid: Grid = grid.map((row) =>
    row.map((cell) => {
      const inError = errorSet.has(key(cell.row, cell.col));
      if (inError) errorCells.push({ row: cell.row, col: cell.col });
      return { ...cell, hasError: inError };
    })
  );

  return { validatedGrid, hasError, errorCells };
}
