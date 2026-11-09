/**
 * Günün bulmacası sonuçları ve seri
 *
 * Her çözülen gün tarihiyle tutulur: { "2026-11-09": { time, stars, hintsUsed } }.
 * Seri ayrı bir sayaçta tutulmaz, her seferinde bu kayıttan hesaplanır: sayaçla kayıt
 * çelişemez, telefonun saati ileri geri alınsa da seri kendiliğinden doğru kalır.
 *
 * Telefondan okunan kayda körü körüne güvenilmez: tarihi ya da değerleri bozuk gün atılır.
 */
import type { LevelResult } from '../types/game';
import { dayKeyOf, parseDayKey } from './daily';

export interface DailyResult {
  /** Çözüm süresi (saniye) */
  time: number;
  stars: 0 | 1 | 2 | 3;
  hintsUsed: number;
}

export type DailyResults = Record<string, DailyResult>;

/** Seviye kaydıyla aynı sınırlar: süre en fazla 99:59:59, ipucu en fazla 999 */
const MAX_TIME = 359_999;
const MAX_HINTS = 999;

const isIntIn = (value: unknown, min: number, max: number) =>
  Number.isInteger(value) && (value as number) >= min && (value as number) <= max;

/** Telefondan okunan sonuç listesi; bozuk günler atılır, liste düz nesne değilse boş */
export function dailyResultsFrom(value: unknown): DailyResults {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  const results: DailyResults = {};
  for (const [key, entry] of Object.entries(value)) {
    if (parseDayKey(key) === null || typeof entry !== 'object' || entry === null) continue;
    const { time, stars, hintsUsed } = entry as Record<string, unknown>;
    if (isIntIn(time, 0, MAX_TIME) && isIntIn(stars, 0, 3) && isIntIn(hintsUsed, 0, MAX_HINTS)) {
      results[key] = { time, stars, hintsUsed } as DailyResult;
    }
  }
  return results;
}

/**
 * Günün sonucunu ekler. O günün yalnızca ilk çözümü sayılır (ezberlenmiş bulmacayı yeniden
 * çözüp süreyi düzeltmek olmaz); tarih geçersizse liste değişmez. Değişiklik yoksa aynı nesne.
 */
export function addDailyResult(results: DailyResults, date: string, result: LevelResult): DailyResults {
  if (results[date] !== undefined || parseDayKey(date) === null) return results;
  return {
    ...results,
    [date]: { time: result.time, stars: result.stars, hintsUsed: result.hintsUsed },
  };
}

/**
 * Bugünkü seri: bugünden geriye kesintisiz çözülmüş gün sayısı. Bugün henüz çözülmediyse
 * dünden sayılır: seri gün bitene kadar bozulmaz, oyuncu bugün çözerek sürdürebilir.
 */
export function currentStreak(results: DailyResults, today: string): number {
  const todayNumber = parseDayKey(today);
  if (todayNumber === null) return 0;
  let day = results[today] !== undefined ? todayNumber : todayNumber - 1;
  let count = 0;
  while (results[dayKeyOf(day)] !== undefined) {
    count++;
    day--;
  }
  return count;
}

/** Şimdiye kadarki en uzun kesintisiz seri */
export function longestStreak(results: DailyResults): number {
  const days = Object.keys(results)
    .map(parseDayKey)
    .filter((day): day is number => day !== null)
    .sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  days.forEach((day, i) => {
    run = i > 0 && day === days[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

/**
 * Bugünkü çözüm seriyi en uzun seri yaptı mı? (Bugünü saymadan önceki en uzun seriden uzunsa.)
 * İlk gün (seri 1) sayılmaz; "en uzun seri" en az iki günde anlamlı.
 */
export function isNewLongestStreak(results: DailyResults, today: string): boolean {
  if (results[today] === undefined) return false;
  const streak = currentStreak(results, today);
  const { [today]: _today, ...before } = results;
  return streak >= 2 && streak > longestStreak(before);
}
