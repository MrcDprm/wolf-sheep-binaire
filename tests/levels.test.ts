/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL_DATA } from '../src/constants/levelData';
import { LEVELS, getLevelById, isLevelUnlocked, nextLevelToPlay, TOTAL_LEVELS } from '../src/constants/levels';
import { DIFFICULTIES, LEVELS_PER_DIFFICULTY, cluesFor } from '../src/constants/difficulties';
import { countSolutions } from '../src/engine/generator';
import { isRawGridValid } from '../src/engine/validator';
import type { LevelResult } from '../src/types/game';

const clueCount = (text: string) => [...text].filter((ch) => ch !== '0').length;

test('6 zorluk x 50 seviye = 300 seviye', () => {
  assert.equal(DIFFICULTIES.length, 6);
  assert.equal(TOTAL_LEVELS, 6 * LEVELS_PER_DIFFICULTY);
  for (const config of DIFFICULTIES) {
    assert.equal(LEVELS.filter((l) => l.difficulty === config.id).length, LEVELS_PER_DIFFICULTY);
  }
});

test('her bulmaca 6x6 ve sadece 0/1/2 içerir', () => {
  for (const [puzzle, solution] of LEVEL_DATA) {
    assert.match(puzzle, /^[012]{36}$/);
    assert.match(solution, /^[12]{36}$/);
  }
});

test('açık simgeler çözümle aynı', () => {
  for (const [puzzle, solution] of LEVEL_DATA) {
    for (let i = 0; i < 36; i++) {
      if (puzzle[i] !== '0') assert.equal(puzzle[i], solution[i]);
    }
  }
});

test('her çözüm iki kurala uyar', () => {
  for (const level of LEVELS) {
    assert.ok(isRawGridValid(level.solution), `seviye ${level.id}`);
  }
});

test('her bulmacanın tek çözümü var', () => {
  for (const level of LEVELS) {
    assert.equal(countSolutions(level.puzzle, 2), 1, `seviye ${level.id}`);
  }
});

test('açık simge sayısı zorluğa göre doğru ve zorluk arttıkça azalıyor', () => {
  let previous = Infinity;
  LEVEL_DATA.forEach(([puzzle], i) => {
    const config = DIFFICULTIES[Math.floor(i / LEVELS_PER_DIFFICULTY)];
    const expected = cluesFor(config, i % LEVELS_PER_DIFFICULTY);
    const clues = clueCount(puzzle);
    assert.equal(clues, expected, `seviye ${i + 1}`);
    assert.ok(clues <= previous, `seviye ${i + 1} öncekinden kolay olmamalı`);
    previous = clues;
  });
});

test('hiçbir bulmaca tekrar etmiyor', () => {
  const solutions = new Set(LEVEL_DATA.map(([, s]) => s));
  assert.equal(solutions.size, LEVEL_DATA.length);
});

const done = (stars: 0 | 1 | 2 | 3): LevelResult => ({ stars, time: 60, score: 12, hintsUsed: 0 });

test('ilk seviye açık, diğerleri öncekini bitirince açılır', () => {
  assert.equal(isLevelUnlocked(1, {}), true);
  assert.equal(isLevelUnlocked(2, {}), false);
  assert.equal(isLevelUnlocked(2, { '1': done(1) }), true);
  assert.equal(isLevelUnlocked(51, { '50': done(3) }), true);
  assert.equal(isLevelUnlocked(0, {}), false);
  assert.equal(isLevelUnlocked(TOTAL_LEVELS + 1, {}), false);
});

test('Oyna bitirilmemiş ilk seviyeyi açar', () => {
  assert.equal(nextLevelToPlay({}), 1);
  assert.equal(nextLevelToPlay({ '1': done(3), '2': done(2) }), 3);
  const all = Object.fromEntries(LEVELS.map((l) => [String(l.id), done(3)]));
  assert.equal(nextLevelToPlay(all), TOTAL_LEVELS);
});

test('geçersiz seviye numarası bulunamaz', () => {
  assert.equal(getLevelById(0), undefined);
  assert.equal(getLevelById(1.5), undefined);
  assert.equal(getLevelById(NaN), undefined);
  assert.equal(getLevelById(TOTAL_LEVELS + 1), undefined);
  assert.equal(getLevelById(1)?.number, 1);
  assert.equal(getLevelById(51)?.difficulty, 'easy');
  assert.equal(getLevelById(51)?.number, 1);
});
