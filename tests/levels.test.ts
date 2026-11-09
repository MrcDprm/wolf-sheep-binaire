/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL_DATA } from '../src/constants/levelData';
import {
  LEVELS,
  firstUnfinishedIn,
  getLevelById,
  isLevelUnlocked,
  levelAfter,
  nextLevelToPlay,
  TOTAL_LEVELS,
} from '../src/constants/levels';
import {
  DIFFICULTIES,
  LEVELS_PER_DIFFICULTY,
  cluesFor,
  warningSecondsFor,
} from '../src/constants/difficulties';
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

/** Verilen seviye numaralarını bitirilmiş sayan kayıt */
const completedOf = (ids: number[]) => Object.fromEntries(ids.map((id) => [String(id), done(3)]));
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
/** Zorluğun 1. seviyesinin numarası: 1, 51, 101, 151, 201, 251 */
const firstOf = (index: number) => index * LEVELS_PER_DIFFICULTY + 1;

test('hiç oynamamış oyuncuda her zorluğun 1. seviyesi açık, 2. seviyesi kilitli', () => {
  DIFFICULTIES.forEach((config, i) => {
    assert.equal(isLevelUnlocked(firstOf(i), {}), true, `${config.id} 1`);
    assert.equal(isLevelUnlocked(firstOf(i) + 1, {}), false, `${config.id} 2`);
  });
});

test('zorluk içinde seviyeler sırayla açılır', () => {
  assert.equal(isLevelUnlocked(2, { '1': done(1) }), true);
  assert.equal(isLevelUnlocked(102, completedOf([101])), true, 'Orta 1 bitince Orta 2');
  assert.equal(isLevelUnlocked(103, completedOf([101])), false, 'Orta 3 için Orta 2 bitmeli');
  // Önceki zorluğun son seviyesi, sonraki zorluğun 2. seviyesini açmaz
  assert.equal(isLevelUnlocked(52, completedOf([50])), false);
});

test('geçersiz seviye numarası açık sayılmaz', () => {
  assert.equal(isLevelUnlocked(0, {}), false);
  assert.equal(isLevelUnlocked(-50, {}), false);
  assert.equal(isLevelUnlocked(1.5, {}), false);
  assert.equal(isLevelUnlocked(NaN, {}), false);
  assert.equal(isLevelUnlocked(TOTAL_LEVELS + 1, {}), false);
});

test('eski sürümün sıralı ilerlemesi yeni kurala göre de açık kalır', () => {
  // 1.0'da 1-63 bitirilmiş bir oyuncu (En Kolay'ın hepsi + Kolay 1-13)
  const completed = completedOf(range(1, 63));
  for (let id = 1; id <= 64; id++) assert.equal(isLevelUnlocked(id, completed), true, `seviye ${id}`);
  assert.equal(isLevelUnlocked(65, completed), false);
  assert.equal(nextLevelToPlay(completed), 64, 'kaldığı yerden devam eder');
});

test('zorluktaki sıradaki seviye', () => {
  assert.equal(firstUnfinishedIn('medium', {}), 101);
  assert.equal(firstUnfinishedIn('medium', completedOf(range(101, 107))), 108);
  assert.equal(firstUnfinishedIn('medium', completedOf(range(101, 150))), undefined);
});

test('Devam et: hiç oynanmadıysa En Kolay 1, hepsi bittiyse son seviye', () => {
  assert.equal(nextLevelToPlay({}), 1);
  assert.equal(nextLevelToPlay({ '1': done(3), '2': done(2) }), 3);
  const all = completedOf(range(1, TOTAL_LEVELS));
  assert.equal(nextLevelToPlay(all), TOTAL_LEVELS);
  assert.equal(nextLevelToPlay(all, 120), 120, 'hepsi bittiyse son oynanan seviye');
});

test('Devam et son oynanan zorlukta kalır', () => {
  // Orta 1 açılmış, hiçbir şey bitirilmemiş
  assert.equal(nextLevelToPlay({}, 101), 101);
  // Orta 1 bitti → Orta 2
  assert.equal(nextLevelToPlay(completedOf([101]), 101), 102);
  // En Kolay'da ilerleme olsa da son oynanan zorluk öncelikli
  assert.equal(nextLevelToPlay(completedOf([1, 2, 3, 101, 102]), 102), 103);
  // Bitmiş bir seviye yeniden oynanınca o zorluğun sıradaki seviyesi
  assert.equal(nextLevelToPlay(completedOf(range(1, 20)), 5), 21);
});

test('Devam et: zorluk bitince sonrakine, sondan sonra başa geçer', () => {
  // Orta'nın hepsi bitti → Zor 1
  assert.equal(nextLevelToPlay(completedOf(range(101, 150)), 150), 151);
  // İmkânsız'ın hepsi bitti → En Kolay 1
  assert.equal(nextLevelToPlay(completedOf(range(251, 300)), 300), 1);
});

test('Devam et: kayıtlı son seviye bozuksa En Kolay\'dan aranır', () => {
  assert.equal(nextLevelToPlay({}, 0), 1);
  assert.equal(nextLevelToPlay({}, 999), 1);
  assert.equal(nextLevelToPlay({}, 2.5), 1);
});

test('Sonraki seviye: sıradaki numara, zorluk sınırında sonraki zorluk', () => {
  assert.equal(levelAfter(5, completedOf(range(1, 5))), 6);
  assert.equal(levelAfter(50, completedOf(range(1, 50))), 51, 'En Kolay 50 → Kolay 1');
});

test('İmkânsız 50 bitince her şey bitmediyse "hepsini bitirdin" denmez', () => {
  // Doğrudan İmkânsız'dan başlayıp bitiren oyuncu: En Kolay 1'e yönlenir
  assert.equal(levelAfter(300, completedOf(range(251, 300))), 1);
  // Bütün seviyeler bitince sonraki yok
  assert.equal(levelAfter(300, completedOf(range(1, TOTAL_LEVELS))), null);
  assert.equal(levelAfter(120, completedOf(range(1, TOTAL_LEVELS))), null);
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

test('her zorluğun sabit süresi: 30 sn, 1, 2, 3, 5, 7 dk', () => {
  assert.deepEqual(
    DIFFICULTIES.map((d) => [d.id, d.timeLimitSeconds]),
    [
      ['easiest', 30],
      ['easy', 60],
      ['medium', 120],
      ['hard', 180],
      ['veryHard', 300],
      ['impossible', 420],
    ],
  );
  for (const level of LEVELS) {
    const config = DIFFICULTIES.find((d) => d.id === level.difficulty);
    const warmup = level.difficulty === 'easiest' && level.number <= 5;
    assert.equal(level.timeLimit, warmup ? null : config?.timeLimitSeconds, `seviye ${level.id}`);
  }
});

test('En Kolay 1-5 ısınma: süresiz; En Kolay 6 ve sonrası süreli', () => {
  assert.deepEqual(
    LEVELS.slice(0, 7).map((l) => l.timeLimit),
    [null, null, null, null, null, 30, 30],
  );
  assert.equal(getLevelById(51)?.timeLimit, 60, 'Kolay 1 süreli');
});

test('sayaç sona yaklaşınca kırmızıya döner: sürenin dörtte biri, en fazla 30 sn', () => {
  assert.equal(warningSecondsFor(30), 7);
  assert.equal(warningSecondsFor(60), 15);
  assert.equal(warningSecondsFor(120), 30);
  assert.equal(warningSecondsFor(420), 30);
});
