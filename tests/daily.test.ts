/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_ID_BASE,
  createDailyLevel,
  dailyDifficulty,
  dayKey,
  dayKeyOf,
  isDailyLevelId,
  parseDayKey,
} from '../src/engine/daily';
import {
  addDailyResult,
  currentStreak,
  dailyResultsFrom,
  isNewLongestStreak,
  longestStreak,
  type DailyResults,
} from '../src/engine/dailyResults';
import { countSolutions } from '../src/engine/generator';
import { findHint } from '../src/engine/hint';
import { createSnapshot, restoreSnapshot } from '../src/engine/savedGame';
import { applyErrorsToGrid, buildGridFromRaw } from '../src/engine/validator';
import { DIFFICULTIES } from '../src/constants/difficulties';
import type { Grid, LevelResult } from '../src/types/game';

const MONDAY = '2026-11-09';

test('gün anahtarı telefonun yerel tarihinden alınır', () => {
  assert.equal(dayKey(new Date(2026, 10, 9, 0, 0)), MONDAY);
  assert.equal(dayKey(new Date(2026, 10, 9, 23, 59, 59)), MONDAY);
  assert.equal(dayKey(new Date(2027, 0, 1, 12)), '2027-01-01');
});

test('gün anahtarı ile gün numarası birbirine dönüşür (artık yıl ve yıl sonu dahil)', () => {
  const start = parseDayKey('2027-12-25')!;
  for (let day = start; day < start + 500; day++) {
    assert.equal(parseDayKey(dayKeyOf(day)), day);
  }
  assert.equal(parseDayKey('2028-02-29')! - parseDayKey('2028-02-28')!, 1);
  assert.equal(parseDayKey('2028-03-01')! - parseDayKey('2028-02-29')!, 1);
});

test('bozuk ya da takvimde olmayan tarih reddedilir', () => {
  for (const bad of ['2026-02-30', '2027-02-29', '2026-13-01', '2026-00-10', '2026-1-1', '26-11-09', '2026-11-09x', '', '0050-01-01', null, 5, undefined]) {
    assert.equal(parseDayKey(bad), null, String(bad));
  }
});

test('zorluk haftanın gününe bağlı: Pazartesi Kolay, Pazar İmkânsız', () => {
  const monday = parseDayKey(MONDAY)!;
  const week = Array.from({ length: 7 }, (_, i) => dailyDifficulty(monday + i));
  assert.deepEqual(week, ['easy', 'medium', 'medium', 'hard', 'hard', 'veryHard', 'impossible']);
  // Bir hafta sonra aynı sıra
  assert.equal(dailyDifficulty(monday + 7), 'easy');
});

test('aynı tarih her seferinde aynı bulmacayı verir', () => {
  const a = createDailyLevel(MONDAY)!;
  const b = createDailyLevel(MONDAY)!;
  assert.deepEqual(a, b);
  assert.equal(a.id, DAILY_ID_BASE + parseDayKey(MONDAY)!);
  assert.equal(a.dailyDate, MONDAY);
  assert.equal(a.timeLimit, null, 'günün bulmacasında süre sınırı yok');
  assert.equal(createDailyLevel('2026-02-30'), null);
});

/** Hücreyi ipucunun değeriyle doldurur */
const place = (grid: Grid, row: number, col: number, value: 1 | 2): Grid =>
  grid.map((cells) => cells.map((c) => (c.row === row && c.col === col ? { ...c, value } : c)));

test('bir yıl boyunca her gün: tek çözüm, doğru açık taş sayısı, tahmin etmeden çözülür, hepsi farklı', () => {
  const start = parseDayKey(MONDAY)!;
  const seen = new Set<string>();
  for (let day = start; day < start + 365; day++) {
    const key = dayKeyOf(day);
    const level = createDailyLevel(key)!;
    const config = DIFFICULTIES.find((d) => d.id === level.difficulty)!;

    assert.equal(level.difficulty, dailyDifficulty(day), key);
    assert.equal(
      level.puzzle.flat().filter((v) => v !== 0).length,
      config.clues[Math.floor(config.clues.length / 2)],
      `${key}: açık taş sayısı`,
    );
    assert.equal(countSolutions(level.puzzle, 2), 1, `${key}: tek çözüm`);
    assert.equal(applyErrorsToGrid(buildGridFromRaw(level.solution)).hasError, false, `${key}: çözüm kurallara uyuyor`);
    level.puzzle.forEach((row, r) =>
      row.forEach((v, c) => v !== 0 && assert.equal(v, level.solution[r][c], `${key}: açık taş çözümde`)),
    );

    // İpucu motoru cevabı hiç açmadan sona götürür
    let grid = buildGridFromRaw(level.puzzle);
    for (let hint = findHint(grid, level.solution); hint; hint = findHint(grid, level.solution)) {
      assert.ok(hint.kind !== 'wrong' && hint.kind !== 'reveal', `${key}: ${hint.kind}`);
      grid = place(grid, hint.row, hint.col, hint.value);
    }

    const text = level.puzzle.flat().join('');
    assert.ok(!seen.has(text), `${key}: başka bir günle aynı bulmaca`);
    seen.add(text);
  }
});

test('günün bulmacası yarıda bırakılınca kayıttan aynen geri gelir', () => {
  const level = createDailyLevel(MONDAY)!;
  // İlk iki boş hücreye çözümdeki değerleri koy
  let grid = buildGridFromRaw(level.puzzle);
  for (const cell of grid.flat().filter((c) => c.value === 0).slice(0, 2)) {
    grid = place(grid, cell.row, cell.col, level.solution[cell.row][cell.col] as 1 | 2);
  }
  // Ertesi gün açılsa da aynı tarih aynı bulmacayı verdiği için kayıt uyar
  const restored = restoreSnapshot(createDailyLevel(MONDAY)!, createSnapshot(level, grid, 42, 0));
  assert.ok(restored);
  assert.equal(restored.elapsedSeconds, 42);
  assert.deepEqual(
    restored.grid.map((r) => r.map((c) => c.value)),
    grid.map((r) => r.map((c) => c.value)),
  );
  // Başka günün bulmacasına uymaz
  assert.equal(restoreSnapshot(createDailyLevel('2026-11-10')!, createSnapshot(level, grid, 42, 0)), null);
});

test('günlük seviye numaraları 300 seviyeyle karışmaz', () => {
  assert.equal(isDailyLevelId(300), false);
  assert.equal(isDailyLevelId(1), false);
  assert.equal(isDailyLevelId(DAILY_ID_BASE), true);
  assert.equal(isDailyLevelId(createDailyLevel(MONDAY)!.id), true);
  assert.equal(isDailyLevelId(DAILY_ID_BASE + 0.5), false);
});

const result = (time: number, stars: 0 | 1 | 2 | 3 = 3, hintsUsed = 0): LevelResult => ({
  time,
  stars,
  hintsUsed,
  score: stars * 4,
});

/** Verilen günler çözülmüş kayıt */
const solved = (...keys: string[]): DailyResults =>
  Object.fromEntries(keys.map((key) => [key, { time: 60, stars: 3, hintsUsed: 0 }]));

test('günün ilk çözümü sayılır, sonraki çözüm kaydı değiştirmez', () => {
  const first = addDailyResult({}, MONDAY, result(95, 2, 1));
  assert.deepEqual(first, { [MONDAY]: { time: 95, stars: 2, hintsUsed: 1 } });
  assert.equal(addDailyResult(first, MONDAY, result(30)), first, 'aynı nesne döner');
  assert.deepEqual(addDailyResult({}, '2026-02-30', result(30)), {}, 'geçersiz tarih');
});

test('telefondaki bozuk günler atılır, sağlamlar kalır', () => {
  // Telefondaki dosya gibi JSON'dan okunur ("__proto__" burada sıradan bir anahtar olur)
  const ok = { time: 80, stars: 3, hintsUsed: 0 };
  const loaded = dailyResultsFrom(
    JSON.parse(
      JSON.stringify({
        [MONDAY]: ok,
        '2026-11-08': { ...ok, time: -1 },
        '2026-11-07': { ...ok, stars: 4 },
        '2026-11-06': { ...ok, hintsUsed: 1.5 },
        '2026-11-04': { ...ok, time: '80' },
        '2026-11-05': null,
        '2026-02-30': ok,
        yarın: ok,
      }).replace('"yarın"', '"__proto__": {"time": 80, "stars": 3, "hintsUsed": 0}, "yarın"'),
    ),
  );
  assert.deepEqual(Object.keys(loaded), [MONDAY]);
  assert.deepEqual(loaded[MONDAY], ok);
  assert.equal(Object.getPrototypeOf(loaded), Object.prototype);
  for (const bad of [null, undefined, 'yazı', 7, [], true]) assert.deepEqual(dailyResultsFrom(bad), {});
});

test('seri: bugün çözülünce bugünden, çözülmediyse dünden geriye sayılır', () => {
  const week = solved('2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08');
  assert.equal(currentStreak(week, '2026-11-08'), 4, 'bugün çözüldü');
  assert.equal(currentStreak(week, MONDAY), 4, 'bugün henüz çözülmedi, seri sürüyor');
  assert.equal(currentStreak({ ...week, [MONDAY]: week['2026-11-08'] }, MONDAY), 5);
  assert.equal(currentStreak(week, '2026-11-10'), 0, 'dün çözülmedi: seri bozuldu');
  assert.equal(currentStreak(solved('2026-11-05', '2026-11-07', '2026-11-08'), MONDAY), 2, 'boşluktan sonrası');
  assert.equal(currentStreak({}, MONDAY), 0);
  assert.equal(currentStreak(week, 'bozuk'), 0);
  // Ay ve yıl geçişi
  assert.equal(currentStreak(solved('2026-12-30', '2026-12-31', '2027-01-01'), '2027-01-01'), 3);
  assert.equal(currentStreak(solved('2028-02-28', '2028-02-29', '2028-03-01'), '2028-03-01'), 3);
});

test('en uzun seri bütün kayıttan bulunur', () => {
  assert.equal(longestStreak({}), 0);
  assert.equal(longestStreak(solved(MONDAY)), 1);
  assert.equal(
    longestStreak(solved('2026-10-01', '2026-10-02', '2026-10-03', '2026-10-10', '2026-11-08', MONDAY)),
    3,
  );
  // Sıra karışık olsa da
  assert.equal(longestStreak(solved('2026-11-03', '2026-11-01', '2026-11-02', '2026-11-04')), 4);
});

test('en uzun seri rekoru: önceki en uzun seriyi bugün geçince', () => {
  const old = ['2026-10-01', '2026-10-02', '2026-10-03'];
  assert.equal(isNewLongestStreak(solved(...old, '2026-11-07', '2026-11-08', MONDAY), MONDAY), false, 'eşit');
  assert.equal(
    isNewLongestStreak(solved(...old, '2026-11-06', '2026-11-07', '2026-11-08', MONDAY), MONDAY),
    true,
    'geçti',
  );
  assert.equal(isNewLongestStreak(solved(MONDAY), MONDAY), false, 'ilk gün rekor sayılmaz');
  assert.equal(isNewLongestStreak(solved('2026-11-08', MONDAY), MONDAY), true, 'ilk iki gün');
  assert.equal(isNewLongestStreak(solved('2026-11-08'), MONDAY), false, 'bugün çözülmedi');
});
