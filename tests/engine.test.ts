/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyErrorsToGrid,
  buildGridFromRaw,
  findTripleAnimals,
  rawFromGrid,
} from '../src/engine/validator';
import { isBoardComplete } from '../src/engine/solver';
import { calculateStars } from '../src/constants/scoring';
import { formatDuration } from '../src/utils/scoring';
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

test('süre cümle içinde okunur yazılır, İngilizcede tekil ve çoğul ayrı', () => {
  // Çeviri yerine anahtarın son parçasını yazan sahte t: "duration.minute" → "1 minute"
  const t = (key: string, vars?: Record<string, string | number>) =>
    `${vars?.count} ${key.split('.')[1]}`;
  assert.equal(formatDuration(30, t), '30 seconds');
  assert.equal(formatDuration(60, t), '1 minute');
  assert.equal(formatDuration(120, t), '2 minutes');
  assert.equal(formatDuration(90, t), '1 minute 30 seconds');
  assert.equal(formatDuration(1, t), '1 second');
  assert.equal(formatDuration(0, t), '0 seconds');
});

test('en iyi süre: ilk çözüm rekor değil, sonra daha hızlısı rekor', async () => {
  const { mergeLevelResult } = await import('../src/utils/scoring');
  const run = (stars: 0 | 1 | 2 | 3, time: number) => ({ stars, time, score: stars * 4, hintsUsed: 3 - stars });

  const first = mergeLevelResult(undefined, run(2, 90));
  assert.equal(first.isNewRecord, false, 'ilk çözüm');
  assert.equal(first.scoreGain, 8);
  assert.equal(first.next.bestTime, 90);

  // Aynı yıldız, daha hızlı: puan değişmez, rekor kırılır
  const faster = mergeLevelResult(first.next, run(2, 60));
  assert.deepEqual([faster.isNewRecord, faster.scoreGain, faster.next.bestTime, faster.next.stars], [true, 0, 60, 2]);

  // Daha çok yıldız ama daha yavaş: yıldız ve puan artar, en iyi süre korunur
  const better = mergeLevelResult(faster.next, run(3, 120));
  assert.deepEqual([better.isNewRecord, better.scoreGain, better.next.bestTime, better.next.stars], [false, 4, 60, 3]);

  // Daha az yıldız ama daha hızlı: yıldız korunur, süre rekoru yine sayılır
  const quickWorse = mergeLevelResult(better.next, run(1, 45));
  assert.deepEqual([quickWorse.isNewRecord, quickWorse.scoreGain, quickWorse.next.bestTime, quickWorse.next.stars], [true, 0, 45, 3]);

  // Eski kayıt (bestTime yok): süresi en iyi süre sayılır
  const legacy = mergeLevelResult({ stars: 3, time: 50, score: 12, hintsUsed: 0 }, run(3, 55));
  assert.deepEqual([legacy.isNewRecord, legacy.best], [false, 50]);
});
