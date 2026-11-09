/**
 * Nedenini söyleyen ipucu
 *
 * Cevabı rastgele açmak yerine oyuncuya bir sonraki mantık adımını gösterir:
 * 1. Oyuncunun koyduğu yanlış bir taş varsa onu işaretler (taş kaldırılır).
 * 2. Yoksa kuralların kesinleştirdiği bir hücreyi bulur, en basit gerekçeyle:
 *    - pair: aynı hayvandan iki taş yan yana, bir yanlarına o hayvan gelemez
 *    - gap: aynı hayvandan iki taş arasında tek boşluk, araya o hayvan gelemez
 *    - balance: satırda/sütunda o hayvandan 3 tane var, kalan hücreler diğeri
 *    - line: satır ya da sütun başka türlü kurallara uygun doldurulamıyor
 * 3. Hiçbiri yoksa (300 seviyede yalnızca bir adımda gerekir) hücrenin cevabını açar.
 *
 * Yanlış taşlar önce temizlendiği için tahtadaki her taş çözümle uyumludur; kurallarla
 * kesinleşen her değer de bu yüzden çözümdeki değerdir (testler 300 seviyede doğrular).
 */
import type { CellValue, Grid, RawGrid } from '../types/game';
import { rawFromGrid } from './validator';

export interface HintLine {
  axis: 'row' | 'col';
  index: number;
}

export type Hint =
  | { kind: 'wrong'; row: number; col: number }
  | {
      kind: 'pair' | 'gap' | 'balance' | 'line' | 'reveal';
      row: number;
      col: number;
      /** Hücreye konacak (kesinleşen) değer */
      value: 1 | 2;
      /** Gerekçe olan taşlar: ekranda vurgulanır */
      reasons: [number, number][];
      /** Gerekçenin geçtiği satır ya da sütun (reveal'da yok) */
      line?: HintLine;
    };

type Reason = Exclude<Hint, { kind: 'wrong' }>;
type Pos = [number, number];

const other = (v: 1 | 2): 1 | 2 => (v === 1 ? 2 : 1);

/** Hücrenin satırı ya da sütunu, sırayla [satır, sütun] konumlarıyla */
function lineCells(size: number, line: HintLine): Pos[] {
  return Array.from({ length: size }, (_, i) => (line.axis === 'row' ? [line.index, i] : [i, line.index]));
}

/**
 * (row, col)'a `banned` konamıyorsa basit kuralın gerekçesi (yan yana, araya, denge).
 * Aynı değer için birden çok gerekçe varsa en basiti döner.
 */
function simpleReason(raw: RawGrid, row: number, col: number, banned: 1 | 2): Reason | null {
  const size = raw.length;
  const at = (r: number, c: number) => (r >= 0 && r < size && c >= 0 && c < size ? raw[r][c] : -1);
  const value = other(banned);
  const make = (kind: Reason['kind'], reasons: Pos[], line: HintLine): Reason => ({
    kind,
    row,
    col,
    value,
    reasons,
    line,
  });

  const rowLine: HintLine = { axis: 'row', index: row };
  const colLine: HintLine = { axis: 'col', index: col };
  // Yan yana iki aynı taş (öncesinde ya da sonrasında)
  if (at(row, col - 1) === banned && at(row, col - 2) === banned) return make('pair', [[row, col - 2], [row, col - 1]], rowLine);
  if (at(row, col + 1) === banned && at(row, col + 2) === banned) return make('pair', [[row, col + 1], [row, col + 2]], rowLine);
  if (at(row - 1, col) === banned && at(row - 2, col) === banned) return make('pair', [[row - 2, col], [row - 1, col]], colLine);
  if (at(row + 1, col) === banned && at(row + 2, col) === banned) return make('pair', [[row + 1, col], [row + 2, col]], colLine);
  // İki aynı taşın arasındaki tek boşluk
  if (at(row, col - 1) === banned && at(row, col + 1) === banned) return make('gap', [[row, col - 1], [row, col + 1]], rowLine);
  if (at(row - 1, col) === banned && at(row + 1, col) === banned) return make('gap', [[row - 1, col], [row + 1, col]], colLine);
  // Satırda/sütunda o hayvanın yarısı (3) zaten var
  for (const line of [rowLine, colLine]) {
    const same = lineCells(size, line).filter(([r, c]) => raw[r][c] === banned);
    if (same.length >= size / 2) return make('balance', same, line);
  }
  return null;
}

/** Tek bir satır/sütun, boşlukları kurallara uyarak (yarı yarıya, yan yana üç yok) doldurulabilir mi? */
export function canCompleteLine(line: CellValue[]): boolean {
  const empty = line.flatMap((v, i) => (v === 0 ? [i] : []));
  const half = line.length / 2;
  for (let mask = 0; mask < 1 << empty.length; mask++) {
    const filled = [...line];
    empty.forEach((i, bit) => (filled[i] = (mask >> bit) & 1 ? 1 : 2));
    if (filled.filter((v) => v === 1).length !== half) continue;
    if (filled.every((v, i) => i < 2 || !(v === filled[i - 1] && v === filled[i - 2]))) return true;
  }
  return false;
}

/** (row, col)'a `banned` konunca satırı ya da sütunu doldurulamaz hale geliyorsa gerekçesi */
function lineReason(raw: RawGrid, row: number, col: number, banned: 1 | 2): Reason | null {
  const size = raw.length;
  for (const line of [{ axis: 'row', index: row }, { axis: 'col', index: col }] as HintLine[]) {
    const cells = lineCells(size, line);
    const values = cells.map(([r, c]) => (r === row && c === col ? banned : raw[r][c]));
    if (!canCompleteLine(values)) {
      const reasons = cells.filter(([r, c]) => raw[r][c] !== 0);
      return { kind: 'line', row, col, value: other(banned), reasons, line };
    }
  }
  return null;
}

/**
 * Sıradaki ipucu. Tahta çözümle aynıysa null.
 * Aynı türden birkaç hücre varsa satır satır ilk bulunan seçilir (her seferinde aynı sonuç).
 */
export function findHint(grid: Grid, solution: RawGrid): Hint | null {
  const raw = rawFromGrid(grid);
  const cells = grid.flat();

  const wrong = cells.find((c) => !c.isLocked && c.value !== 0 && c.value !== solution[c.row][c.col]);
  if (wrong) return { kind: 'wrong', row: wrong.row, col: wrong.col };

  const empty = cells.filter((c) => c.value === 0);
  if (empty.length === 0) return null;

  const tryEach = (find: (r: number, c: number, banned: 1 | 2) => Reason | null) => {
    for (const { row, col } of empty) {
      for (const banned of [1, 2] as const) {
        const reason = find(row, col, banned);
        if (reason) return reason;
      }
    }
    return null;
  };

  // Önce bütün tahtada en basit gerekçe, sonra satır/sütun akıl yürütmesi
  const order: Reason['kind'][] = ['pair', 'gap', 'balance'];
  const simple = empty
    .flatMap(({ row, col }) => [1, 2].map((b) => simpleReason(raw, row, col, b as 1 | 2)))
    .filter((r): r is Reason => r !== null)
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))[0];
  if (simple) return simple;

  const byLine = tryEach((r, c, banned) => lineReason(raw, r, c, banned));
  if (byLine) return byLine;

  // Daha derin bir akıl yürütme gerekiyor: ilk boş hücrenin cevabı açılır
  const first = empty[0];
  const value = solution[first.row][first.col] as 1 | 2;
  return { kind: 'reveal', row: first.row, col: first.col, value, reasons: [] };
}
