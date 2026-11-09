/**
 * İstatistik hesapları (saf fonksiyonlar)
 *
 * İstatistik ekranının bütün sayıları zaten saklanan kayıtlardan çıkarılır: seviye
 * sonuçları (yıldız, en iyi süre) ve günün bulmacası sonuçları. Yeni bir sayaç tutulmaz;
 * sayaçla kayıt çelişemez. Kayıt telefondan geldiği için bozuk girdiler (seviyesi olmayan
 * numara, sayı olmayan süre) sayılmaz.
 */
import { DIFFICULTIES, LEVELS_PER_DIFFICULTY } from '../constants/difficulties';
import { getLevelById, TOTAL_LEVELS } from '../constants/levels';
import { TITLES, getTitleForPoints } from '../constants/titles';
import { dayKeyOf, parseDayKey, weekdayOf } from '../engine/daily';
import { currentStreak, longestStreak, type DailyResults } from '../engine/dailyResults';
import type { Difficulty, LevelResult } from '../types/game';
import type { Title } from '../types/user';

/** Kayıttaki süre sınırı (seviye kaydıyla aynı: 99:59:59) */
const MAX_TIME = 359_999;

const isTime = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) <= MAX_TIME;

export interface DifficultyStats {
  difficulty: Difficulty;
  completed: number;
  total: number;
  stars: number;
  /** En kısa çözüm süresi; bitirilen seviye yoksa null */
  bestTime: number | null;
  /** Bitirilen seviyelerin en iyi sürelerinin ortalaması (tam saniye); yoksa null */
  averageTime: number | null;
}

export interface LevelStats {
  completed: number;
  total: number;
  stars: number;
  maxStars: number;
  /** 3 yıldızla (ipucusuz) bitirilen seviye sayısı */
  perfect: number;
  byDifficulty: DifficultyStats[];
}

/** Seviye sonuçlarından genel ve zorluk başına istatistik */
export function levelStats(completed: Record<string, LevelResult>): LevelStats {
  const rows = new Map(
    DIFFICULTIES.map((d) => [d.id, { completed: 0, stars: 0, times: [] as number[] }]),
  );
  let perfect = 0;

  for (const [key, result] of Object.entries(completed)) {
    // Anahtar seviye numarasının kendisi olmalı ("5"; "05", "5.0", "abc" değil)
    const level = String(Number(key)) === key ? getLevelById(Number(key)) : undefined;
    if (!level || typeof result !== 'object' || result === null) continue;
    const row = rows.get(level.difficulty)!;
    const stars = [0, 1, 2, 3].includes(result.stars) ? result.stars : 0;
    row.completed++;
    row.stars += stars;
    if (stars === 3) perfect++;
    const best = result.bestTime ?? result.time;
    if (isTime(best)) row.times.push(best);
  }

  const byDifficulty = DIFFICULTIES.map(({ id }): DifficultyStats => {
    const row = rows.get(id)!;
    const sum = row.times.reduce((a, b) => a + b, 0);
    return {
      difficulty: id,
      completed: row.completed,
      total: LEVELS_PER_DIFFICULTY,
      stars: row.stars,
      bestTime: row.times.length > 0 ? Math.min(...row.times) : null,
      averageTime: row.times.length > 0 ? Math.round(sum / row.times.length) : null,
    };
  });

  return {
    completed: byDifficulty.reduce((n, d) => n + d.completed, 0),
    total: TOTAL_LEVELS,
    stars: byDifficulty.reduce((n, d) => n + d.stars, 0),
    maxStars: TOTAL_LEVELS * 3,
    perfect,
    byDifficulty,
  };
}

export interface DailyStats {
  current: number;
  longest: number;
  /** Çözülen gün sayısı */
  solved: number;
  solvedToday: boolean;
}

export function dailyStats(results: DailyResults, today: string): DailyStats {
  return {
    current: currentStreak(results, today),
    longest: longestStreak(results),
    solved: Object.keys(results).filter((key) => parseDayKey(key) !== null).length,
    solvedToday: results[today] !== undefined,
  };
}

export interface CalendarDay {
  /** "2026-11-09" */
  key: string;
  /** Ayın günü (1-31) */
  date: number;
  /** Ay (0-11) */
  month: number;
  solved: boolean;
  today: boolean;
  future: boolean;
}

/**
 * Seri takvimi: bu haftayla biten son `weeks` hafta, satır satır, haftalar Pazartesi başlar.
 * Bugünden sonraki günler "gelecek" işaretlenir. Bugünün anahtarı geçersizse boş liste.
 */
export function streakCalendar(results: DailyResults, today: string, weeks = 5): CalendarDay[][] {
  const todayNumber = parseDayKey(today);
  if (todayNumber === null) return [];
  // Pazartesi 0 … Pazar 6
  const sinceMonday = (weekdayOf(todayNumber) + 6) % 7;
  const start = todayNumber - sinceMonday - 7 * (weeks - 1);

  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, i) => {
      const day = start + week * 7 + i;
      const key = dayKeyOf(day);
      const [, month, date] = key.split('-').map(Number);
      return {
        key,
        date,
        month: month - 1,
        solved: results[key] !== undefined,
        today: day === todayNumber,
        future: day > todayNumber,
      };
    }),
  );
}

export interface TitleProgress {
  current: Title;
  /** Sonraki unvan; en yüksek unvandaysa null */
  next: Title | null;
  /** Mevcut unvandan sonrakine 0-1 arası ilerleme (en yüksek unvanda 1) */
  fraction: number;
}

/** Puana göre unvan ve sonraki unvana ilerleme */
export function titleProgress(points: number): TitleProgress {
  const current = getTitleForPoints(points);
  const next = TITLES.find((title) => title.minPoints > points) ?? null;
  if (!next) return { current, next: null, fraction: 1 };
  const fraction = (points - current.minPoints) / (next.minPoints - current.minPoints);
  return { current, next, fraction: Math.min(1, Math.max(0, fraction)) };
}
