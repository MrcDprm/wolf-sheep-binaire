/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickLanguage } from '../src/utils/language';

test('Türkçe cihaz Türkçe açılır', () => {
  assert.equal(pickLanguage(['tr']), 'tr');
  assert.equal(pickLanguage(['TR']), 'tr');
});

test('desteklenen ilk dil seçilir', () => {
  assert.equal(pickLanguage(['de', 'tr', 'en']), 'tr');
  assert.equal(pickLanguage(['fr', 'en', 'tr']), 'en');
});

test('desteklenmeyen ya da boş liste İngilizce açılır', () => {
  assert.equal(pickLanguage(['de', 'ja']), 'en');
  assert.equal(pickLanguage([]), 'en');
  assert.equal(pickLanguage([null, undefined, '']), 'en');
});
