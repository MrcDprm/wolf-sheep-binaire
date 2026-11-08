/// <reference types="node" />
import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { useGameStore } from '../src/store/useGameStore';
import { LEVELS } from '../src/constants/levels';
import { applyErrorsToGrid, rawFromGrid } from '../src/engine/validator';
import { isBoardComplete } from '../src/engine/solver';
import { createRng } from '../src/engine/random';
import type { CellValue, GameLevel, Grid, RawGrid } from '../src/types/game';

// . = boş, K = kurt (1), O = koyun (2)
const parse = (rows: string[]): RawGrid =>
  rows.map((r) => [...r].map((ch) => (ch === 'K' ? 1 : ch === 'O' ? 2 : 0) as CellValue));

const SOLUTION = parse([
  'KKOOKO',
  'OOKKOK',
  'KOKOKO',
  'OKOKOK',
  'KOOKKO',
  'OKKOOK',
]);

// Deneme seviyesi: sadece sol üst köşedeki kurt başta verilmiş
const TEST_LEVEL: GameLevel = {
  id: 1,
  difficulty: 'easiest',
  number: 1,
  puzzle: parse(['K.....', '......', '......', '......', '......', '......']),
  solution: SOLUTION,
  maxHintsForPerfect: 3,
};

const game = () => useGameStore.getState();
const flags = (grid: Grid) => grid.flat().map((c) => c.hasError);
const redCells = () =>
  game()
    .grid.flat()
    .filter((c) => c.hasError)
    .map((c) => `${c.row},${c.col}`);

/** Hücreye dokuna dokuna istenen değeri koyar (boş → kurt → koyun → boş) */
function place(row: number, col: number, value: CellValue) {
  for (let i = 0; i < 3 && game().grid[row][col].value !== value; i++) game().tapCell(row, col);
}

beforeEach(() => game().initGame(TEST_LEVEL));

test('Sıfırla sonrası başta verilen taş kırmızı kalmaz', () => {
  place(0, 1, 1);
  place(0, 2, 1); // verilen kurtla birlikte yan yana üç kurt
  assert.deepEqual(redCells(), ['0,0', '0,1', '0,2']);

  game().resetUserCells();
  assert.deepEqual(redCells(), []);
  assert.equal(game().hasActiveError, false);
  assert.equal(game().grid[0][0].value, 1, 'verilen taş yerinde kalır');
  assert.equal(game().grid[0][1].value, 0, 'oyuncunun taşı silinir');
});

test('Hamle dokunarak geri alınınca kırmızı söner', () => {
  place(0, 1, 1);
  place(0, 2, 1);
  game().tapCell(0, 2); // kurt → koyun
  assert.deepEqual(redCells(), []);
  game().tapCell(0, 2); // koyun → boş
  assert.deepEqual(redCells(), []);
  assert.equal(game().hasActiveError, false);
});

test('Bitmiş seviyede Sıfırla tahtayı bozmaz', () => {
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) place(r, c, SOLUTION[r][c]);
  }
  assert.equal(game().isComplete, true);

  game().resetUserCells();
  assert.equal(game().isComplete, true, 'seviye bitmiş sayılmaya devam eder');
  assert.deepEqual(rawFromGrid(game().grid), SOLUTION, 'taşlar silinmez');
});

test('Rastgele hamlelerde kırmızı hücreler, hata ve bitiş durumu hep tahtayla tutarlı', () => {
  const rng = createRng(2026);
  const realRandom = Math.random;
  Math.random = rng; // ipucunun seçtiği hücre de her çalıştırmada aynı olsun
  try {
    for (const level of LEVELS) {
      game().initGame(level);
      for (let i = 0; i < 60; i++) {
        const roll = rng();
        if (roll < 0.85) game().tapCell(Math.floor(rng() * 6), Math.floor(rng() * 6));
        else if (roll < 0.95) game().applyHint();
        else game().resetUserCells();

        const { grid, hasActiveError, isComplete } = game();
        const expected = applyErrorsToGrid(grid);
        const where = `seviye ${level.id}, hamle ${i + 1}`;
        assert.deepEqual(flags(grid), flags(expected.validatedGrid), where);
        assert.equal(hasActiveError, expected.hasError, where);
        assert.equal(
          isComplete,
          !expected.hasError && isBoardComplete(rawFromGrid(grid), level.solution),
          where,
        );
      }
    }
  } finally {
    Math.random = realRandom;
  }
});
