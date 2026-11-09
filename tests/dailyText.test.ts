/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { calendarLeaf, formatDayKey, formatDays } from '../src/utils/dailyText';

/** Gerçek çeviri dosyasıyla çalışan sade t (uygulamadakiyle aynı iç içe anahtar ve {{yer}} kuralı) */
function translator(language: 'tr' | 'en') {
  const dict = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'i18n', `${language}.json`), 'utf8'));
  return (key: string, vars?: Record<string, string | number>) => {
    const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], dict);
    assert.equal(typeof value, 'string', `çeviri yok: ${language} ${key}`);
    return (value as string).replace(/\{\{(\w+)\}\}/g, (_, name) => String(vars?.[name]));
  };
}

const tr = translator('tr');
const en = translator('en');

test('tarih iki dilde okunur yazılır', () => {
  assert.equal(formatDayKey('2026-11-09', tr), '9 Kasım Pazartesi');
  assert.equal(formatDayKey('2026-11-09', en), 'Monday, November 9');
  assert.equal(formatDayKey('2027-01-01', tr), '1 Ocak Cuma');
  assert.equal(formatDayKey('2028-02-29', en), 'Tuesday, February 29');
  assert.equal(formatDayKey('bozuk', tr), 'bozuk');
});

test('bütün ay ve gün adları iki dilde var', () => {
  for (let month = 1; month <= 12; month++) {
    const key = `2026-${String(month).padStart(2, '0')}-01`;
    for (const t of [tr, en]) {
      formatDayKey(key, t);
      calendarLeaf(key, t);
    }
  }
  // Bir haftanın her günü
  for (let day = 9; day <= 15; day++) formatDayKey(`2026-11-${day}`, tr);
});

test('takvim yaprağı kısa ay ve gün', () => {
  assert.deepEqual(calendarLeaf('2026-11-09', tr), ['KAS', 9]);
  assert.deepEqual(calendarLeaf('2026-04-30', tr), ['NİS', 30]);
  assert.deepEqual(calendarLeaf('2026-11-09', en), ['NOV', 9]);
});

test('gün sayısı İngilizcede tekil ve çoğul', () => {
  assert.equal(formatDays(1, en), '1 day');
  assert.equal(formatDays(5, en), '5 days');
  assert.equal(formatDays(1, tr), '1 gün');
  assert.equal(formatDays(12, tr), '12 gün');
});
