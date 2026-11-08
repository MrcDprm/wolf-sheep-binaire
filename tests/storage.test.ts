/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { create } from 'zustand';
import { createJSONStorage, persist, type PersistStorage, type StateStorage } from 'zustand/middleware';
import { safeJSONStorage } from '../src/store/safeStorage';
import { savedGamesFrom } from '../src/engine/savedGame';

/** Bellekte duran sahte AsyncStorage */
function memoryStorage(initial: Record<string, string> = {}): StateStorage {
  const data = { ...initial };
  return {
    getItem: async (name) => data[name] ?? null,
    setItem: async (name, value) => {
      data[name] = value;
    },
    removeItem: async (name) => {
      delete data[name];
    },
  };
}

type Games = { games: Record<string, unknown> };

/** Verilen depolamayla bir persist store kurar; yükleme bitti mi? */
async function hydrates(storage: PersistStorage<Games> | undefined): Promise<boolean> {
  const store = create<Games>()(persist(() => ({ games: {} }), { name: 'kayit', storage }));
  await new Promise((resolve) => setTimeout(resolve, 20));
  return store.persist.hasHydrated();
}

test('bozuk kayıt dosyası yüklemeyi kilitlemez (createJSONStorage ile hiç bitmiyordu)', async () => {
  const corrupt = () => memoryStorage({ kayit: '{"state": {"games": {' });
  assert.equal(await hydrates(createJSONStorage<Games>(corrupt)), false, 'eski yol: yükleme bitmez');
  assert.equal(await hydrates(safeJSONStorage<Games>(corrupt)), true, 'yeni yol: yükleme biter');
});

test('okuma hatası "kayıt yok" sayılır', async () => {
  const failing: StateStorage = {
    getItem: async () => {
      throw new Error('disk okunamadı');
    },
    setItem: async () => {},
    removeItem: async () => {},
  };
  assert.equal(await safeJSONStorage<Games>(() => failing).getItem('kayit'), null);
});

test('sağlam kayıt yazılıp aynen okunur ve silinir', async () => {
  const memory = memoryStorage();
  const storage = safeJSONStorage<Games>(() => memory);
  const value = { state: { games: { '5': { values: '0'.repeat(36), hinted: [], elapsed: 3 } } }, version: 1 };
  await storage.setItem('kayit', value);
  assert.deepEqual(await storage.getItem('kayit'), value);
  await storage.removeItem('kayit');
  assert.equal(await storage.getItem('kayit'), null);
});

test('kayıt listesi düz nesne değilse boş liste sayılır', () => {
  for (const bad of [null, undefined, 5, 'yazı', [], true]) assert.deepEqual(savedGamesFrom(bad), {});
  const ok = { '3': { values: '', hinted: [], elapsed: 0 } };
  assert.equal(savedGamesFrom(ok), ok);
});
