/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyErrorsToGrid,
  buildGridFromRaw,
  findTripleAnimals,
  rawFromGrid,
} from '../src/engine/validator';
import { pickHintCell } from '../src/engine/hint';
import { isBoardComplete } from '../src/engine/solver';
import { calculateStars } from '../src/constants/scoring';
import { createRng } from '../src/engine/random';
import type { CellValue, RawGrid } from '../src/types/game';

// 0 = boş, K = kurt (1), O = koyun (2)
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

test('yatayda 3 kurt üçlüsü bulunur', () => {
  const grid = buildGridFromRaw(parse(['KKK...', '......', '......', '......', '......', '......']));
  assert.deepEqual(findTripleAnimals(grid), { wolf: true, sheep: false });
});

test('dikeyde 3 koyun üçlüsü bulunur', () => {
  const grid = buildGridFromRaw(parse(['.O....', '.O....', '.O....', '......', '......', '......']));
  assert.deepEqual(findTripleAnimals(grid), { wolf: false, sheep: true });
});

test('ikili yan yana hata değildir', () => {
  const grid = buildGridFromRaw(parse(['KK.OO.', '......', '......', '......', '......', '......']));
  assert.deepEqual(findTripleAnimals(grid), { wolf: false, sheep: false });
  assert.equal(applyErrorsToGrid(grid).hasError, false);
});

test('üçlüdeki üç hücre hatalı işaretlenir', () => {
  const grid = buildGridFromRaw(parse(['OOO...', '......', '......', '......', '......', '......']));
  const { hasError, errorCells } = applyErrorsToGrid(grid);
  assert.equal(hasError, true);
  assert.deepEqual(errorCells, [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
  ]);
});

test('dolu satırda sayılar eşit değilse hata', () => {
  // Üçlü yok ama 4 kurt 2 koyun
  const grid = buildGridFromRaw(parse(['KKOKKO', '......', '......', '......', '......', '......']));
  assert.equal(applyErrorsToGrid(grid).hasError, true);
});

test('yarım satırda sayı kontrolü yapılmaz', () => {
  const grid = buildGridFromRaw(parse(['KK.KK.', '......', '......', '......', '......', '......']));
  assert.equal(applyErrorsToGrid(grid).hasError, false);
});

test('çözüm hatasız ve tamamlanmış sayılır', () => {
  const grid = buildGridFromRaw(SOLUTION);
  assert.equal(applyErrorsToGrid(grid).hasError, false);
  assert.equal(isBoardComplete(rawFromGrid(grid), SOLUTION), true);
});

test('ipucu yanlış hücreyi de düzeltir', () => {
  // Tahta dolu ama bir hücre yanlış: tek aday o hücre
  const wrong = SOLUTION.map((r) => [...r]) as RawGrid;
  wrong[0][0] = 2;
  const grid = buildGridFromRaw(wrong).map((row) =>
    row.map((cell) => ({ ...cell, isLocked: !(cell.row === 0 && cell.col === 0) })),
  );
  assert.deepEqual(pickHintCell(grid, SOLUTION), { row: 0, col: 0, value: 1 });
});

test('tahta çözümle aynıysa ipucu yok', () => {
  const grid = buildGridFromRaw(SOLUTION).map((row) => row.map((c) => ({ ...c, isLocked: false })));
  assert.equal(pickHintCell(grid, SOLUTION), null);
});

test('yıldızlar ipucu sayısına göre', () => {
  assert.equal(calculateStars(0, 2), 3);
  assert.equal(calculateStars(2, 2), 2);
  assert.equal(calculateStars(3, 2), 1);
});

test('aynı tohum aynı sayıları verir', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
});
