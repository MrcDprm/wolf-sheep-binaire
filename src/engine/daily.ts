/**
 * Günün bulmacası
 *
 * Bulmaca sunucudan gelmez, telefonda o günün tarihinden üretilir: tarih tohum olur,
 * aynı gün herkes aynı bulmacayı alır. Zorluk haftanın gününe bağlı: hafta Pazartesi
 * Kolay ile başlar, Pazar İmkânsız ile biter. Günün bulmacasında süre sınırı yoktur;
 * seri süre yüzünden bozulmasın, süre yalnızca kaydedilir.
 *
 * Üretilen bulmaca tek çözümlüdür ve cevap açmadan, yalnızca ipucu motorunun mantık
 * adımlarıyla çözülebilir: her gün "tahmin etmeden" bitirilebilen bir bulmaca çıkar.
 *
 * Tarihler telefonun yerel saatine göre "YYYY-AA-GG" anahtarıyla tutulur. Gün farkları
 * UTC gece yarıları üzerinden sayılır; yaz saati geçişinde bir gün 23 ya da 25 saat
 * sürse de gün numarası tam sayıdır.
 */
import type { Difficulty, GameLevel, Grid, RawGrid } from '../types/game';
import { DIFFICULTIES, GRID_SIZE } from '../constants/difficulties';
import { carvePuzzle, generateSolution } from './generator';
import { findHint } from './hint';
import { createRng } from './random';
import { buildGridFromRaw } from './validator';

const DAY_MS = 86_400_000;
const KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Günün bulmacalarının seviye numaraları bundan başlar; 1-300 seviyelerle karışmaz */
export const DAILY_ID_BASE = 100_000;

/** Haftanın gününe göre zorluk (0 = Pazar, Date.getUTCDay sırası) */
const WEEKDAY_DIFFICULTY: readonly Difficulty[] = [
  'impossible', // Pazar
  'easy', // Pazartesi
  'medium', // Salı
  'medium', // Çarşamba
  'hard', // Perşembe
  'hard', // Cuma
  'veryHard', // Cumartesi
];

/** Telefonun yerel tarihine göre gün anahtarı: "2026-11-09" */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Gün anahtarını gün numarasına çevirir (1970-01-01 = 0). Biçimi bozuk ya da takvimde
 * olmayan tarihte (ör. 2026-02-30) null: telefondan okunan anahtarlar bununla denetlenir.
 */
export function parseDayKey(key: unknown): number | null {
  if (typeof key !== 'string') return null;
  const match = KEY_PATTERN.exec(key);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const utc = Date.UTC(year, month - 1, day);
  const check = new Date(utc);
  // Takvimde olmayan gün Date'te bir sonraki aya kayar; kaymışsa geçersiz
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return null;
  }
  return utc / DAY_MS;
}

/** Gün numarasından anahtar: 20766 → "2026-11-09" */
export function dayKeyOf(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** Haftanın günü: 0 Pazar … 6 Cumartesi */
export function weekdayOf(day: number): number {
  return new Date(day * DAY_MS).getUTCDay();
}

export function dailyDifficulty(day: number): Difficulty {
  return WEEKDAY_DIFFICULTY[weekdayOf(day)];
}

export function isDailyLevelId(id: number): boolean {
  return Number.isInteger(id) && id >= DAILY_ID_BASE;
}

/** Bulmaca, cevap açmadan yalnızca ipucu motorunun mantık adımlarıyla çözülebiliyor mu? */
function solvableByLogic(puzzle: RawGrid, solution: RawGrid): boolean {
  let grid: Grid = buildGridFromRaw(puzzle);
  for (;;) {
    const hint = findHint(grid, solution);
    if (hint === null) return true;
    if (hint.kind === 'wrong' || hint.kind === 'reveal') return false;
    const { row, col, value } = hint;
    grid = grid.map((cells) =>
      cells.map((cell) => (cell.row === row && cell.col === col ? { ...cell, value } : cell)),
    );
  }
}

/** Mantıkla çözülebilen bulmaca bu kadar denemede çıkmazsa ilk tek çözümlü bulmaca alınır */
const MAX_ATTEMPTS = 200;

/**
 * Günün bulmacası. Aynı tarih her telefonda aynı bulmacayı verir. Geçersiz anahtarda null.
 * Açık taş sayısı, zorluğun seviyelerdeki aralığının ortasıdır (ör. Orta: 16-14 → 15).
 */
export function createDailyLevel(key: string): GameLevel | null {
  const day = parseDayKey(key);
  if (day === null) return null;

  const difficulty = dailyDifficulty(day);
  const config = DIFFICULTIES.find((d) => d.id === difficulty)!;
  const clues = config.clues[Math.floor(config.clues.length / 2)];
  const rng = createRng(day);

  let fallback: [RawGrid, RawGrid] | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const solution = generateSolution(GRID_SIZE, rng);
    const puzzle = carvePuzzle(solution, clues, rng);
    if (!puzzle) continue;
    if (solvableByLogic(puzzle, solution)) {
      fallback = [puzzle, solution];
      break;
    }
    fallback ??= [puzzle, solution];
  }
  // Pratikte ilk birkaç denemede bulunur (testler bir yılı tarar); yine de sonsuz döngü yok
  if (!fallback) throw new Error(`${key} için bulmaca üretilemedi`);

  const [puzzle, solution] = fallback;
  return {
    id: DAILY_ID_BASE + day,
    difficulty,
    number: 0,
    puzzle,
    solution,
    maxHintsForPerfect: config.maxHintsForPerfect,
    timeLimit: null,
    dailyDate: key,
  };
}
