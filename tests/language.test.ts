/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

// Yasak karakterler kaçış koduyla: şapkalı a, i, u büyük ve küçük, tırnaklar ve parantez
test('uygulama metinleri yazım kurallarına uyar: şapkalı harf, parantez ve tırnak yok', () => {
  for (const language of ['tr', 'en']) {
    const texts: string[] = [];
    const collect = (node: unknown): void => {
      if (typeof node === 'string') texts.push(node);
      else if (node && typeof node === 'object') Object.values(node).forEach(collect);
    };
    collect(JSON.parse(readFileSync(join(__dirname, '..', 'src', 'i18n', `${language}.json`), 'utf8')));
    for (const text of texts) {
      assert.doesNotMatch(text, /[\u00e2\u00c2\u00ee\u00ce\u00fb\u00db\u201c\u201d\u00ab\u00bb()"]/, `${language}: ${text}`);
    }
  }
});
