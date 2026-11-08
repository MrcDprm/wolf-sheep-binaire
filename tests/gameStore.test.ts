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
  timeLimit: 30,
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

/** Deneme seviyesini çözer */
function solve() {
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) place(r, c, SOLUTION[r][c]);
  }
}

const tick = (times: number) => {
  for (let i = 0; i < times; i++) game().tickTimer();
};

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
  solve();
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

// ---------------------------------------------------------------------------
// Süre sınırı
// ---------------------------------------------------------------------------

test('Süre dolunca seviye kaybedilir ve tahta kilitlenir', () => {
  game().initGame(TEST_LEVEL, 3);
  place(0, 1, 1);
  tick(2);
  assert.equal(game().isTimeUp, false);
  tick(1);
  assert.equal(game().isTimeUp, true, 'son saniyede süre doldu');

  const before = rawFromGrid(game().grid);
  game().tapCell(0, 2);
  assert.equal(game().applyHint(), false, 'ipucu verilmez');
  game().resetUserCells();
  tick(5);
  assert.deepEqual(rawFromGrid(game().grid), before, 'taşlar değişmez');
  assert.equal(game().elapsedSeconds, 3, 'süre durur');
  assert.equal(game().hintsUsed, 0);
  assert.equal(game().isComplete, false);
});

test('Sıfırla süreyi başa almaz', () => {
  game().initGame(TEST_LEVEL, 30);
  place(0, 1, 1);
  tick(10);
  game().resetUserCells();
  assert.equal(game().elapsedSeconds, 10);
  assert.equal(game().grid[0][1].value, 0);
});

test('Tekrar dene: tahta ve süre baştan', () => {
  game().initGame(TEST_LEVEL, 2);
  place(0, 1, 1);
  tick(2);
  assert.equal(game().isTimeUp, true);

  game().initGame(TEST_LEVEL, 2);
  assert.equal(game().isTimeUp, false);
  assert.equal(game().elapsedSeconds, 0);
  assert.equal(game().grid[0][1].value, 0);
});

test('Süre sınırı kapalıyken süre ileri sayar ve hiç dolmaz', () => {
  game().initGame(TEST_LEVEL, null);
  tick(1000);
  assert.equal(game().isTimeUp, false);
  assert.equal(game().elapsedSeconds, 1000);
  game().tapCell(0, 1);
  assert.equal(game().grid[0][1].value, 1, 'oyun sürer');
});

test('Süresi içinde biten seviyede süre durur, sonradan dolmaz', () => {
  game().initGame(TEST_LEVEL, 5);
  tick(4);
  solve();
  assert.equal(game().isComplete, true);
  tick(10);
  assert.equal(game().isTimeUp, false);
  assert.equal(game().elapsedSeconds, 4, 'çözüm süresi korunur');
});

test('Rastgele hamlelerde süre dolduktan sonra tahta hiç değişmez', () => {
  const rng = createRng(11);
  const realRandom = Math.random;
  Math.random = rng;
  try {
    for (const level of LEVELS.filter((_, i) => i % 6 === 0)) {
      game().initGame(level, 20);
      let frozen: RawGrid | null = null;
      for (let i = 0; i < 80; i++) {
        const roll = rng();
        if (roll < 0.6) game().tapCell(Math.floor(rng() * 6), Math.floor(rng() * 6));
        else if (roll < 0.7) game().applyHint();
        else if (roll < 0.75) game().resetUserCells();
        else game().tickTimer();

        const { grid, isTimeUp, elapsedSeconds } = game();
        assert.ok(elapsedSeconds <= 20, `seviye ${level.id}: süre sınırı aşılmaz`);
        if (isTimeUp) {
          frozen ??= rawFromGrid(grid);
          assert.deepEqual(rawFromGrid(grid), frozen, `seviye ${level.id}, hamle ${i + 1}`);
        }
      }
    }
  } finally {
    Math.random = realRandom;
  }
});
