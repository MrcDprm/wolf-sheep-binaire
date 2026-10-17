/**
 * Bulmaca üretici
 *
 * 1. Kurallara uyan tam dolu bir çözüm üretilir (geri izleme / backtracking).
 * 2. Hücreler rastgele sırayla silinir; silme çözümü tek olmaktan çıkarırsa geri alınır.
 * 3. İstenen açık simge sayısına inilince durulur.
 *
 * Oyun bu dosyayı çalışırken kullanmaz: seviyeler scripts/generate-levels.ts ile
 * bir kez üretilip src/constants/levelData.ts dosyasına yazılır.
 */
import type { RawGrid, CellValue } from '../types/game';
import { wouldViolateTriple, wouldViolateBalance } from './validator';
import { shuffle, type Rng } from './random';

function cloneRaw(raw: RawGrid): RawGrid {
  return raw.map((row) => [...row] as CellValue[]);
}

/** Boş hücreleri sırayla doldurarak tam bir çözüm arar. */
function fillGrid(raw: RawGrid, pos: number, rng: Rng): boolean {
  const size = raw.length;
  if (pos === size * size) return true;

  const row = Math.floor(pos / size);
  const col = pos % size;

  for (const value of shuffle([1, 2] as CellValue[], rng)) {
    if (!wouldViolateTriple(raw, row, col, value) && !wouldViolateBalance(raw, row, col, value)) {
      raw[row][col] = value;
      if (fillGrid(raw, pos + 1, rng)) return true;
      raw[row][col] = 0;
    }
  }
  return false;
}

/** Kurallara uyan, tam dolu bir çözüm üretir. */
export function generateSolution(size: number, rng: Rng = Math.random): RawGrid {
  const raw: RawGrid = Array.from({ length: size }, () => new Array(size).fill(0) as CellValue[]);
  if (!fillGrid(raw, 0, rng)) throw new Error(`${size}x${size} için çözüm üretilemedi`);
  return raw;
}

/**
 * Kısmi bir tahtanın kaç çözümü olduğunu sayar.
 * `limit`e ulaşınca durur (tek çözüm kontrolü için 2 yeterli).
 */
export function countSolutions(raw: RawGrid, limit = 2): number {
  const grid = cloneRaw(raw);
  const size = grid.length;

  function walk(pos: number): number {
    if (pos === size * size) return 1;
    const row = Math.floor(pos / size);
    const col = pos % size;
    if (grid[row][col] !== 0) return walk(pos + 1);

    let count = 0;
    for (const value of [1, 2] as CellValue[]) {
      if (!wouldViolateTriple(grid, row, col, value) && !wouldViolateBalance(grid, row, col, value)) {
        grid[row][col] = value;
        count += walk(pos + 1);
        grid[row][col] = 0;
        if (count >= limit) return count;
      }
    }
    return count;
  }

  return walk(0);
}

export function hasUniqueSolution(raw: RawGrid): boolean {
  return countSolutions(raw, 2) === 1;
}

/**
 * Çözümden hücre silerek tam `clues` açık simgeli, tek çözümlü bir bulmaca üretir.
 * Bu çözümle o sayıya inilemiyorsa null döner (çağıran yeni çözümle tekrar dener).
 */
export function carvePuzzle(solution: RawGrid, clues: number, rng: Rng = Math.random): RawGrid | null {
  const size = solution.length;
  const puzzle = cloneRaw(solution);
  let filled = size * size;

  for (const pos of shuffle(Array.from({ length: size * size }, (_, i) => i), rng)) {
    if (filled === clues) break;
    const row = Math.floor(pos / size);
    const col = pos % size;
    const backup = puzzle[row][col];
    puzzle[row][col] = 0;
    if (hasUniqueSolution(puzzle)) {
      filled--;
    } else {
      puzzle[row][col] = backup;
    }
  }

  return filled === clues ? puzzle : null;
}
