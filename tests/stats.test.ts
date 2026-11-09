/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dailyStats, levelStats, streakCalendar, titleProgress } from '../src/utils/stats';
import type { DailyResults } from '../src/engine/dailyResults';
import type { LevelResult } from '../src/types/game';

const result = (stars: 0 | 1 | 2 | 3, time: number, bestTime?: number): LevelResult => ({
  stars,
  time,
  score: stars * 4,
  hintsUsed: 3 - stars,
  ...(bestTime === undefined ? {} : { bestTime }),
});

test('hiç oynanmadıysa her şey sıfır, süreler yok', () => {
  const stats = levelStats({});
  assert.deepEqual([stats.completed, stats.total, stats.stars, stats.maxStars, stats.perfect], [0, 300, 0, 900, 0]);
  assert.equal(stats.byDifficulty.length, 6);
  for (const row of stats.byDifficulty) {
    assert.deepEqual([row.completed, row.total, row.stars, row.bestTime, row.averageTime], [0, 50, 0, null, null]);
  }
});

test('seviye sonuçları zorluklara dağılır; en iyi süre yoksa çözüm süresi kullanılır', () => {
  const stats = levelStats({
    '1': result(3, 40, 25), // En Kolay
    '2': result(2, 30), // En Kolay, eski kayıt (bestTime yok)
    '51': result(3, 70, 70), // Kolay
    '300': result(1, 400, 380), // İmkânsız 50
  });
  const [easiest, easy, , , , impossible] = stats.byDifficulty;
  assert.deepEqual([easiest.completed, easiest.stars, easiest.bestTime, easiest.averageTime], [2, 5, 25, 28]);
  assert.deepEqual([easy.completed, easy.stars, easy.bestTime, easy.averageTime], [1, 3, 70, 70]);
  assert.deepEqual([impossible.completed, impossible.stars, impossible.bestTime], [1, 1, 380]);
  assert.deepEqual([stats.completed, stats.stars, stats.perfect], [4, 9, 2]);
});

test('ortalama tam saniyeye yuvarlanır', () => {
  const stats = levelStats({ '1': result(3, 10), '2': result(3, 11) });
  assert.equal(stats.byDifficulty[0].averageTime, 11); // 10,5 → 11
});

test('telefondaki bozuk girdiler sayılmaz', () => {
  const stats = levelStats({
    '0': result(3, 10),
    '301': result(3, 10),
    '05': result(3, 10),
    '5.0': result(3, 10),
    abc: result(3, 10),
    '7': null as unknown as LevelResult,
    '8': { stars: 9, time: -4, score: 0, hintsUsed: 0 } as unknown as LevelResult,
  });
  // Yalnızca 8 sayılır: seviye var ama yıldız ve süre bozuk → 0 yıldız, süre yok
  assert.equal(stats.completed, 1);
  assert.deepEqual([stats.stars, stats.byDifficulty[0].bestTime], [0, null]);
});

const solved = (...keys: string[]): DailyResults =>
  Object.fromEntries(keys.map((key) => [key, { time: 60, stars: 3, hintsUsed: 0 }]));

test('günlük istatistik: seri, en uzun seri, çözülen gün, bugün', () => {
  const results = solved('2026-10-01', '2026-10-02', '2026-10-03', '2026-11-07', '2026-11-08');
  assert.deepEqual(dailyStats(results, '2026-11-09'), { current: 2, longest: 3, solved: 5, solvedToday: false });
  assert.deepEqual(dailyStats({ ...results, ...solved('2026-11-09') }, '2026-11-09'), {
    current: 3,
    longest: 3,
    solved: 6,
    solvedToday: true,
  });
  assert.deepEqual(dailyStats({}, '2026-11-09'), { current: 0, longest: 0, solved: 0, solvedToday: false });
});

test('takvim: 5 hafta, Pazartesiden başlar, son satırda bugün, sonrası gelecek', () => {
  // 2026-11-11 Çarşamba
  const weeks = streakCalendar(solved('2026-11-09', '2026-10-31'), '2026-11-11');
  assert.equal(weeks.length, 5);
  assert.ok(weeks.every((week) => week.length === 7));
  assert.equal(weeks[0][0].key, '2026-10-12', 'ilk gün dört hafta önceki Pazartesi');
  const last = weeks[4];
  assert.deepEqual(last.map((d) => d.date), [9, 10, 11, 12, 13, 14, 15]);
  assert.deepEqual(last.map((d) => d.today), [false, false, true, false, false, false, false]);
  assert.deepEqual(last.map((d) => d.future), [false, false, false, true, true, true, true]);
  assert.equal(last[0].solved, true);
  // Ay geçişi: 31 Ekim Cumartesi, ertesi gün 1 Kasım
  const flat = weeks.flat();
  const october31 = flat.findIndex((d) => d.key === '2026-10-31');
  assert.deepEqual([flat[october31].solved, flat[october31].month, flat[october31 + 1].date, flat[october31 + 1].month], [true, 9, 1, 10]);
});

test('takvim: bugün Pazartesiyse son satırın ilk günü, Pazarsa son günü', () => {
  const monday = streakCalendar({}, '2026-11-09');
  assert.equal(monday[4][0].today, true);
  assert.equal(monday[4][1].future, true);
  const sunday = streakCalendar({}, '2026-11-15');
  assert.equal(sunday[4][6].today, true);
  assert.ok(sunday.flat().every((d) => !d.future));
  assert.deepEqual(streakCalendar({}, 'bozuk'), []);
});

test('unvan ilerlemesi: sonraki unvana kalan pay, en yüksek unvanda tam', () => {
  const start = titleProgress(0);
  assert.equal(start.current.nameTr, 'Kuzu Çırağı');
  assert.equal(start.next?.nameTr, 'Çayır Gezgini');
  assert.equal(start.fraction, 0);
  // 24 puan: 0'dan 30'a yolun %80'i
  assert.equal(titleProgress(24).fraction, 0.8);
  // Tam sınırda yeni unvana geçilir
  assert.equal(titleProgress(30).current.nameTr, 'Çayır Gezgini');
  assert.equal(titleProgress(30).fraction, 0);
  const top = titleProgress(3600);
  assert.equal(top.next, null);
  assert.equal(top.fraction, 1);
});
