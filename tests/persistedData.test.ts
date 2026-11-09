/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { settingsFrom, userProfileFrom } from '../src/store/persistedData';

/** Telefondaki dosya gibi: JSON yazılıp okunur */
const fromDisk = (value: unknown) => JSON.parse(JSON.stringify(value));

test('1.0 kaydı (bestTime ve son seviye yok) hiç değişmeden geçer: ilerleme silinmez', () => {
  const saved = fromDisk({
    totalPoints: 20,
    availableHints: 104,
    lastLoginDate: 1762000000000,
    completedLevels: {
      '1': { stars: 3, time: 16, hintsUsed: 0, score: 12 },
      '2': { stars: 2, time: 40, hintsUsed: 1, score: 8 },
    },
  });
  assert.deepEqual(userProfileFrom(saved), saved);
});

test('1.1 kaydı (en iyi süre ve son oynanan seviye ile) hiç değişmeden geçer', () => {
  const saved = fromDisk({
    totalPoints: 36,
    availableHints: 101,
    lastLoginDate: 1762700000000,
    lastLevelId: 3,
    completedLevels: {
      '1': { stars: 3, time: 16, hintsUsed: 0, score: 12, bestTime: 9 },
      '51': { stars: 1, time: 300, hintsUsed: 4, score: 4, bestTime: 250 },
      '300': { stars: 3, time: 410, hintsUsed: 0, score: 12 },
    },
  });
  assert.deepEqual(userProfileFrom(saved), saved);
  assert.deepEqual(userProfileFrom(fromDisk({ ...saved, lastLevelId: null })).lastLevelId, null);
});

test('bozuk ipucu sayısı varsayılana döner (eskiden sınırsız ipucu demekti)', () => {
  for (const bad of ['abc', '5', -3, 1.5, null, true, {}]) {
    const profile = userProfileFrom(fromDisk({ availableHints: bad, completedLevels: {} }));
    assert.equal('availableHints' in profile, false, String(bad));
  }
});

test('bozuk toplam puan seviyelerin en iyi puanlarından yeniden hesaplanır (unvan kaybolmaz)', () => {
  const completedLevels = {
    '1': { stars: 3, time: 16, hintsUsed: 0, score: 12 },
    '2': { stars: 2, time: 40, hintsUsed: 1, score: 8 },
  };
  for (const bad of ['abc', -1, 2.5, null]) {
    assert.equal(userProfileFrom(fromDisk({ totalPoints: bad, completedLevels })).totalPoints, 20, String(bad));
  }
});

test('bozuk son giriş ve son seviye varsayılana döner', () => {
  const profile = userProfileFrom(fromDisk({ lastLoginDate: 'dün', lastLevelId: 999, completedLevels: {} }));
  assert.equal('lastLoginDate' in profile, false);
  assert.equal('lastLevelId' in profile, false);
  assert.equal('lastLevelId' in userProfileFrom(fromDisk({ lastLevelId: '3' })), false);
});

test('seviye sonuçları: geçersiz anahtar atılır, bozuk alan onarılır, seviye bitmiş kalır', () => {
  const completed = JSON.parse(`{
    "0": {"stars": 3, "time": 10, "hintsUsed": 0, "score": 12},
    "301": {"stars": 3, "time": 10, "hintsUsed": 0, "score": 12},
    "05": {"stars": 3, "time": 10, "hintsUsed": 0, "score": 12},
    "abc": {"stars": 3, "time": 10, "hintsUsed": 0, "score": 12},
    "__proto__": {"stars": 3, "time": 10, "hintsUsed": 0, "score": 12},
    "4": null,
    "6": 7,
    "7": {"stars": 9, "time": "uzun", "hintsUsed": -1, "score": "x", "bestTime": -5},
    "8": {"stars": 2, "time": 999999, "hintsUsed": 1, "score": 8, "bestTime": 30}
  }`);
  const profile = userProfileFrom({ completedLevels: completed });
  assert.deepEqual(Object.keys(profile.completedLevels!).sort(), ['7', '8']);
  // Bozuk alanlar: yıldız 0, puan yıldızdan, süre en uzun (sonraki çözüm rekor olur), ipucu 0, en iyi süre yok
  assert.deepEqual(profile.completedLevels!['7'], { stars: 0, time: 359_999, score: 0, hintsUsed: 0 });
  assert.deepEqual(profile.completedLevels!['8'], { stars: 2, time: 359_999, score: 8, hintsUsed: 1, bestTime: 30 });
  assert.equal(Object.getPrototypeOf(profile.completedLevels), Object.prototype);
  // Puan kayıtta yoktu: onarılan seviyelerden hesaplanır
  assert.equal(profile.totalPoints, 8);
});

test('profil kaydı düz nesne değilse hiçbir şey alınmaz', () => {
  for (const bad of [null, undefined, 'yazı', 5, [], true]) assert.deepEqual(userProfileFrom(bad), {});
});

test('ayarlar: 1.0 ve 1.1 ayarları değişmeden geçer, bozuk alanlar varsayılana döner', () => {
  const old = { language: 'tr', soundEnabled: true, hapticEnabled: false, tutorialCompleted: true };
  assert.deepEqual(settingsFrom(fromDisk(old)), old);
  const current = { ...old, language: 'en', timeLimitEnabled: false, reminderEnabled: true, reminderHour: 8 };
  assert.deepEqual(settingsFrom(fromDisk(current)), current);

  const broken = settingsFrom(
    fromDisk({ language: 'xx', soundEnabled: 'true', hapticEnabled: 1, reminderEnabled: null, reminderHour: 24, tutorialCompleted: true }),
  );
  assert.deepEqual(broken, { tutorialCompleted: true });
  assert.deepEqual(settingsFrom(fromDisk({ reminderHour: 7.5 })), {});
  for (const bad of [null, 'yazı', [], 3]) assert.deepEqual(settingsFrom(bad), {});
});
