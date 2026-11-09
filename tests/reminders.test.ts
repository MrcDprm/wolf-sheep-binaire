/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DEFAULT_REMINDER_HOUR,
  REMINDER_DAYS,
  formatHour,
  planReminders,
  reminderHourOf,
  reminderText,
} from '../src/utils/reminders';
import type { DailyResults } from '../src/engine/dailyResults';

/** Verilen günler çözülmüş kayıt */
const solved = (...keys: string[]): DailyResults =>
  Object.fromEntries(keys.map((key) => [key, { time: 60, stars: 3, hintsUsed: 0 }]));

// 9 Kasım 2026 Pazartesi; yerel saat
const at = (hour: number, minute = 0) => new Date(2026, 10, 9, hour, minute);

test('bugün çözülmediyse ve saat geçmediyse ilk hatırlatma bugün, 7 gün boyunca seçilen saatte', () => {
  const plan = planReminders({ now: at(10), hour: 20, results: {} });
  assert.equal(plan.length, REMINDER_DAYS);
  assert.deepEqual(
    plan.map((p) => p.day),
    ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'],
  );
  for (const item of plan) {
    assert.deepEqual([item.at.getHours(), item.at.getMinutes(), item.at.getSeconds()], [20, 0, 0]);
  }
  // Zorluk o günün bulmacasınınki
  assert.deepEqual(
    plan.map((p) => p.difficulty),
    ['easy', 'medium', 'medium', 'hard', 'hard', 'veryHard', 'impossible'],
  );
});

test('bugün çözüldüyse bugün hatırlatılmaz; seri yarınki ilk hatırlatmada anılır', () => {
  const plan = planReminders({ now: at(10), hour: 20, results: solved('2026-11-07', '2026-11-08', '2026-11-09') });
  assert.equal(plan[0].day, '2026-11-10');
  assert.equal(plan.length, REMINDER_DAYS - 1);
  assert.deepEqual(plan.map((p) => p.streak), [3, 0, 0, 0, 0, 0]);
});

test('bugün çözülmedi ama dünden seri sürüyorsa bugünkü hatırlatma seriyi anar', () => {
  const plan = planReminders({ now: at(10), hour: 20, results: solved('2026-11-07', '2026-11-08') });
  assert.equal(plan[0].day, '2026-11-09');
  assert.deepEqual(plan.map((p) => p.streak), [2, 0, 0, 0, 0, 0, 0]);
});

test('saat geçtiyse ilk hatırlatma yarın; bugün çözülmediği için seri anılmaz', () => {
  const plan = planReminders({ now: at(21), hour: 20, results: solved('2026-11-08') });
  assert.equal(plan[0].day, '2026-11-10');
  assert.ok(plan.every((p) => p.streak === 0));
  // Tam saatinde de geçmiş sayılır
  assert.equal(planReminders({ now: at(20), hour: 20, results: {} })[0].day, '2026-11-10');
  assert.equal(planReminders({ now: at(19, 59), hour: 20, results: {} })[0].day, '2026-11-09');
});

test('gece yarısı saati ve ay sonu doğru günlere düşer', () => {
  const plan = planReminders({ now: new Date(2026, 10, 30, 23, 30), hour: 0, results: {} });
  // 30 Kasım 00:00 geçti; ilk hatırlatma 1 Aralık 00:00
  assert.equal(plan[0].day, '2026-12-01');
  assert.equal(plan[0].at.getHours(), 0);
  assert.equal(plan.length, REMINDER_DAYS - 1);
});

test('kayıttaki bozuk saat varsayılana döner', () => {
  assert.equal(reminderHourOf(8), 8);
  assert.equal(reminderHourOf(0), 0);
  assert.equal(reminderHourOf(23), 23);
  for (const bad of [24, -1, 7.5, '20', null, undefined, NaN]) {
    assert.equal(reminderHourOf(bad), DEFAULT_REMINDER_HOUR, String(bad));
  }
  assert.equal(formatHour(8), '08:00');
  assert.equal(formatHour(20), '20:00');
});

/** Gerçek çeviri dosyasıyla çalışan sade t */
function translator(language: 'tr' | 'en') {
  const dict = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'i18n', `${language}.json`), 'utf8'));
  return (key: string, vars?: Record<string, string | number>) => {
    const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], dict);
    assert.equal(typeof value, 'string', `çeviri yok: ${language} ${key}`);
    return (value as string).replace(/\{\{(\w+)\}\}/g, (_, name) => String(vars?.[name]));
  };
}

test('bildirim metni: seri sürüyorsa seriyi, sürmüyorsa yalnızca bulmacayı anar (iki dil)', () => {
  const [withStreak, plain] = planReminders({ now: at(10), hour: 20, results: solved('2026-11-08') });
  assert.deepEqual(reminderText(withStreak, translator('tr')), {
    title: 'Günün bulmacası',
    body: 'Serin 1 gün, bozulmasın. Bugün Kolay bir bulmaca seni bekliyor.',
  });
  assert.deepEqual(reminderText(plain, translator('tr')).body, 'Bugün Orta bir bulmaca seni bekliyor.');
  assert.equal(
    reminderText(withStreak, translator('en')).body,
    "Your streak is 1 day. Keep it going with today's Easy puzzle.",
  );
  assert.equal(reminderText(plain, translator('en')).body, "Today's Medium puzzle is waiting for you.");
});

test('hatırlatmaya dokununca: günlükteyse kal, seviyedeyse yerine geç, oyun dışındaysa menüden aç', async () => {
  const { reminderRoute } = await import('../src/utils/reminders');
  assert.equal(reminderRoute('/daily'), 'stay');
  assert.equal(reminderRoute('/level/12'), 'replace');
  assert.equal(reminderRoute('/settings'), 'reset');
  assert.equal(reminderRoute('/tutorial'), 'reset');
  assert.equal(reminderRoute('/share-result'), 'reset');
  for (const path of ['/', '/levels', '/stats']) assert.equal(reminderRoute(path), 'push', path);
});
