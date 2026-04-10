/**
 * Takuzu/Binairo Backtracking Grid Üretici
 *
 * 1. Boş NxN grid oluştur.
 * 2. Her hücreyi sırayla doldur: [1,2] değerlerini rastgele sırayla dene.
 * 3. wouldViolateTriple + wouldViolateBalance kontrolleriyle geçerli değerleri filtrele.
 * 4. Tam çözüm bulununca kopyala.
 * 5. İlk board için zorluk seviyesine göre hücreleri temizle.
 * 6. Benzersiz çözüm garantisi: countSolutions() ile 1 adet çözüm olduğunu doğrula.
 */
import type { RawGrid, CellValue, Difficulty } from '../types/game';
import { wouldViolateTriple, wouldViolateBalance } from './validator';

// ---------------------------------------------------------------------------
// Yardımcı fonksiyonlar
// ---------------------------------------------------------------------------

function createEmptyRaw(size: number): RawGrid {
  return Array.from({ length: size }, () => new Array(size).fill(0) as CellValue[]);
}

function cloneRaw(raw: RawGrid): RawGrid {
  return raw.map((row) => [...row] as CellValue[]);
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Backtracking çözücü/üretici
// ---------------------------------------------------------------------------

/**
 * Tam dolu, geçerli bir Takuzu grid üretir.
 * @param raw Mevcut (boş) grid — in-place değiştirilir
 * @param pos Başlangıç indeksi (row * size + col)
 * @returns true: çözüm bulundu, false: backtrack gerekli
 */
function fillGrid(raw: RawGrid, pos: number): boolean {
  const size = raw.length;
  const total = size * size;

  if (pos === total) return true;

  const row = Math.floor(pos / size);
  const col = pos % size;

  const candidates = shuffle([1, 2] as CellValue[]);

  for (const value of candidates) {
    if (
      !wouldViolateTriple(raw, row, col, value) &&
      !wouldViolateBalance(raw, row, col, value)
    ) {
      raw[row][col] = value;
      if (fillGrid(raw, pos + 1)) return true;
      raw[row][col] = 0;
    }
  }

  return false;
}

/**
 * Tam dolu çözüm grid üretir.
 */
export function generateSolution(size: number): RawGrid {
  const raw = createEmptyRaw(size);
  const success = fillGrid(raw, 0);
  if (!success) throw new Error(`${size}x${size} için çözüm üretilemedi`);
  return raw;
}

// ---------------------------------------------------------------------------
// Benzersiz çözüm sayacı
// ---------------------------------------------------------------------------

/**
 * Verilen partial grid için kaç benzersiz çözüm mevcut olduğunu sayar.
 * Erken çıkış: 2 bulunca dur (benzersizlik kontrolü için yeterli).
 */
function countSolutions(raw: RawGrid, pos: number, limit: number): number {
  const size = raw.length;
  const total = size * size;

  if (pos === total) return 1;

  const row = Math.floor(pos / size);
  const col = pos % size;

  if (raw[row][col] !== 0) {
    return countSolutions(raw, pos + 1, limit);
  }

  let count = 0;
  for (const value of [1, 2] as CellValue[]) {
    if (
      !wouldViolateTriple(raw, row, col, value) &&
      !wouldViolateBalance(raw, row, col, value)
    ) {
      raw[row][col] = value;
      count += countSolutions(raw, pos + 1, limit);
      raw[row][col] = 0;
      if (count >= limit) return count;
    }
  }

  return count;
}

export function hasUniqueSolution(raw: RawGrid): boolean {
  const clone = cloneRaw(raw);
  return countSolutions(clone, 0, 2) === 1;
}

// ---------------------------------------------------------------------------
// Puzzle üretici (çözümden hücre sil)
// ---------------------------------------------------------------------------

/** Zorluk → tutulacak hücre yüzdesi */
const CLUE_DENSITY: Record<Difficulty, number> = {
  easy: 0.55,
  medium: 0.45,
  normal: 0.38,
  hard: 0.32,
  impossible: 0.25,
};

/**
 * Çözümden başlayarak hücreleri kaldırır, benzersiz çözümü korur.
 *
 * @param solution Tam dolu çözüm grid (değiştirilmez)
 * @param difficulty Zorluk seviyesi
 * @returns Başlangıç puzzle grid'i (bazı hücreler 0)
 */
export function generatePuzzle(solution: RawGrid, difficulty: Difficulty): RawGrid {
  const size = solution.length;
  const total = size * size;
  const targetClues = Math.round(total * CLUE_DENSITY[difficulty]);

  const puzzle = cloneRaw(solution);

  // Tüm hücre pozisyonlarını karıştır
  const positions = shuffle(
    Array.from({ length: total }, (_, i) => i)
  );

  let removed = 0;
  const maxToRemove = total - targetClues;

  for (const pos of positions) {
    if (removed >= maxToRemove) break;

    const row = Math.floor(pos / size);
    const col = pos % size;
    const backup = puzzle[row][col];

    puzzle[row][col] = 0;

    if (!hasUniqueSolution(puzzle)) {
      // Benzersizlik bozulursa geri al
      puzzle[row][col] = backup;
    } else {
      removed++;
    }
  }

  return puzzle;
}

// ---------------------------------------------------------------------------
// Ana üretim fonksiyonu
// ---------------------------------------------------------------------------

export interface GeneratedPuzzle {
  initialRaw: RawGrid;
  solutionRaw: RawGrid;
}

/**
 * Belirli bir boyut ve zorluk için tam bir puzzle üretir.
 * (Çözüm + başlangıç board)
 */
export function generateFullPuzzle(
  size: number,
  difficulty: Difficulty
): GeneratedPuzzle {
  const solutionRaw = generateSolution(size);
  const initialRaw = generatePuzzle(solutionRaw, difficulty);
  return { initialRaw, solutionRaw };
}
