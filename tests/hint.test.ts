/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canCompleteLine, findHint, type Hint } from '../src/engine/hint';
import { buildGridFromRaw } from '../src/engine/validator';
import { DIFFICULTIES } from '../src/constants/difficulties';
import { LEVELS } from '../src/constants/levels';
import type { CellValue, Grid, RawGrid } from '../src/types/game';

// . = boş, K = kurt (1), O = koyun (2)
const parse = (rows: string[]): RawGrid =>
  rows.map((r) => [...r].map((ch) => (ch === 'K' ? 1 : ch === 'O' ? 2 : 0) as CellValue));

const SOLUTION = parse(['KKOOKO', 'OOKKOK', 'KOKOKO', 'OKOKOK', 'KOOKKO', 'OKKOOK']);

/** Kural ipucunun ayrıntıları (yanlış taş ipucunda null) */
const reasonOf = (hint: Hint | null) => (hint && 'value' in hint ? hint : null);

/** Verilen taşlar kilitli, oyuncu taşları (lower-case yok) kilitsiz bir tahta */
const board = (rows: string[], playerCells: [number, number][] = []): Grid =>
  buildGridFromRaw(parse(rows)).map((row) =>
    row.map((c) => (playerCells.some(([r, cc]) => r === c.row && cc === c.col) ? { ...c, isLocked: false } : c)),
  );

test('önce oyuncunun yanlış taşını gösterir', () => {
  // (0,2) çözümde koyun; oyuncu kurt koymuş
  const grid = board(['KKK...', '......', '......', '......', '......', '......'], [[0, 2]]);
  assert.deepEqual(findHint(grid, SOLUTION), { kind: 'wrong', row: 0, col: 2 });
});

test('yan yana iki taş: yanlarına diğer hayvan', () => {
  const hint = findHint(board(['KK....', '......', '......', '......', '......', '......']), SOLUTION);
  assert.equal(hint?.kind, 'pair');
  assert.deepEqual(
    (({ row, col, value, reasons }) => ({ row, col, value, reasons }))(reasonOf(hint)!),
    { row: 0, col: 2, value: 2, reasons: [[0, 0], [0, 1]] },
  );
});

test('iki taş arasındaki tek boşluk: araya diğer hayvan', () => {
  // 1. sütunda K . K: aradaki hücre koyun olmalı
  const grid = board(['K.....', '......', 'K.....', '......', '......', '......']);
  const hint = findHint(grid, SOLUTION);
  assert.equal(hint?.kind, 'gap');
  const r = reasonOf(hint)!;
  assert.deepEqual([r.row, r.col, r.value], [1, 0, 2]);
});

test('satırda 3 kurt tamamsa kalan hücreler koyun', () => {
  // K . . K O K: yan yana ya da araya kuralı yok, ama satırda 3 kurt var
  const grid = board(['K..KOK', '......', '......', '......', '......', '......']);
  const hint = findHint(grid, parse(['KOOKOK', 'OKKOKO', 'KOOKOK', 'OKKOKO', 'KOOKOK', 'OKKOKO']));
  assert.equal(hint?.kind, 'balance');
  assert.deepEqual(
    (({ row, col, value, reasons }) => ({ cell: [row, col], value, reasons }))(reasonOf(hint)!),
    { cell: [0, 1], value: 2, reasons: [[0, 0], [0, 3], [0, 5]] },
  );
});

test('satır akıl yürütmesi: yalnız bir doldurma kurallara uyuyor', () => {
  assert.equal(canCompleteLine(parse(['K..K..'])[0]), true);
  assert.equal(canCompleteLine(parse(['KKOKKO'])[0]), false, 'dört kurt olamaz');
  assert.equal(canCompleteLine(parse(['KK....'])[0]), true);
});

test('tahta çözümle aynıysa ipucu yok', () => {
  assert.equal(findHint(buildGridFromRaw(SOLUTION), SOLUTION), null);
});

/** İpucunu uygular: yanlış taşı kaldırır ya da değeri koyup kilitler */
function applyHint(grid: Grid, hint: Hint): Grid {
  return grid.map((row) =>
    row.map((c) => {
      if (c.row !== hint.row || c.col !== hint.col) return c;
      return hint.kind === 'wrong' ? { ...c, value: 0 } : { ...c, value: hint.value, isLocked: true };
    }),
  );
}

test('300 seviyenin hepsi baştan sona ipucuyla çözülüyor ve her ipucu doğru', () => {
  const kinds: Record<string, number> = {};
  const deeperByDifficulty: Record<string, number> = {};
  for (const level of LEVELS) {
    let grid = buildGridFromRaw(level.puzzle);
    const empty = grid.flat().filter((c) => c.value === 0).length;
    for (let step = 0; step <= empty; step++) {
      const hint = findHint(grid, level.solution);
      if (!hint) break;
      assert.notEqual(hint.kind, 'wrong', `seviye ${level.id}: temiz tahtada yanlış taş olmaz`);
      if (hint.kind !== 'wrong') {
        assert.equal(hint.value, level.solution[hint.row][hint.col], `seviye ${level.id}: ipucu doğru değer`);
        kinds[hint.kind] = (kinds[hint.kind] ?? 0) + 1;
        if (hint.kind === 'line' || hint.kind === 'reveal') {
          deeperByDifficulty[level.difficulty] = (deeperByDifficulty[level.difficulty] ?? 0) + 1;
        }
      }
      grid = applyHint(grid, hint);
    }
    assert.deepEqual(
      grid.map((r) => r.map((c) => c.value)),
      level.solution,
      `seviye ${level.id} ipuçlarıyla çözülmeli`,
    );
  }
  // Kolay zorluklarda yalnızca basit kurallar yetiyor; cevabı açmak çok nadir
  for (const id of ['easiest', 'easy', 'medium'] as const) {
    assert.equal(deeperByDifficulty[id] ?? 0, 0, `${id}: basit kurallar yetmeli`);
  }
  assert.ok((kinds.reveal ?? 0) <= 3, `cevabı açma sayısı: ${kinds.reveal ?? 0}`);
  assert.ok(DIFFICULTIES.length === 6);
});

test('yanlış taş kaldırılınca sıradaki ipucu yine doğru bir adım', () => {
  const level = LEVELS[0];
  // Boş bir hücreye yanlış değeri koy (oyuncu taşı)
  let grid = buildGridFromRaw(level.puzzle);
  const target = grid.flat().find((c) => c.value === 0)!;
  const wrongValue = (level.solution[target.row][target.col] === 1 ? 2 : 1) as CellValue;
  grid = grid.map((row) => row.map((c) => (c === target ? { ...c, value: wrongValue } : c)));

  const first = findHint(grid, level.solution);
  assert.deepEqual(first, { kind: 'wrong', row: target.row, col: target.col });
  grid = applyHint(grid, first!);
  const next = findHint(grid, level.solution);
  assert.ok(next && next.kind !== 'wrong' && next.value === level.solution[next.row][next.col]);
});

test('ipucu gerekçesi cümleye çevrilir (İngilizcede tekil/çoğul)', async () => {
  const { describeHint } = await import('../src/utils/hintText');
  const en: Record<string, string> = {
    'hintReason.pair': '{{line}} has two {{animals}} side by side, so a {{other}} goes next to them.',
    'hintReason.balance': '{{line}} already has 3 {{animals}}, so the remaining cells are {{others}}.',
    'hintReason.row': 'Row {{n}}',
    'hintReason.col': 'Column {{n}}',
    'hintReason.wolf': 'wolf',
    'hintReason.wolves': 'wolves',
    'hintReason.sheep': 'sheep',
    'hintReason.sheepMany': 'sheep',
    'hintReason.wrong': 'wrong',
  };
  const t = (key: string, vars?: Record<string, string | number>) =>
    (en[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars?.[k] ?? ''));
  const pair = findHint(board(['KK....', '......', '......', '......', '......', '......']), SOLUTION)!;
  assert.equal(describeHint(pair, t), 'Row 1 has two wolves side by side, so a sheep goes next to them.');
  assert.equal(describeHint({ kind: 'wrong', row: 0, col: 0 }, t), 'wrong');
});
