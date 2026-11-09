/**
 * Günlük hatırlatma planı (saf fonksiyonlar)
 *
 * Hatırlatma her gün tekrarlayan tek bir bildirim değildir: önümüzdeki 7 günün her biri
 * için seçilen saate ayrı bildirim kurulur. Böylece günün bulmacası çözülen gün atlanır.
 * Uygulama her açılışta, bulmaca çözülünce ve ayar değişince planı yeniden kurar;
 * oyuncu bir hafta hiç açmazsa hatırlatmalar kendiliğinden biter, ısrar edilmez.
 *
 * Bildirim metni, bildirim geldiğinde serinin hâlâ sürüp sürmeyeceğine göre seçilir:
 * seri yalnızca ilk hatırlatmada anılır (bugün çözülmediyse bugünkü, çözüldüyse yarınki);
 * daha ileri bir günde oyuncu arada girmediyse seri zaten bozulmuş olur.
 */
import { dailyDifficulty, dayKey, parseDayKey } from '../engine/daily';
import { currentStreak, type DailyResults } from '../engine/dailyResults';
import type { Difficulty } from '../types/game';
import { formatDays } from './dailyText';

/** Kaç gün ileriye hatırlatma kurulur */
export const REMINDER_DAYS = 7;
/** Varsayılan hatırlatma saati (akşam 20:00) */
export const DEFAULT_REMINDER_HOUR = 20;

export interface ReminderPlanItem {
  /** Bildirimin günü ("2026-11-10") */
  day: string;
  /** Yerel saatle bildirim anı */
  at: Date;
  /** O günün bulmacasının zorluğu */
  difficulty: Difficulty;
  /** Bildirim anında süren seri (gün); seri anılmayacaksa 0 */
  streak: number;
}

/** Ayardan okunan saat: 0-23 arası tam sayı değilse varsayılan saat */
export function reminderHourOf(value: unknown): number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 23
    ? (value as number)
    : DEFAULT_REMINDER_HOUR;
}

/** Saatin ekranda yazılışı: 8 → "08:00" */
export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

/**
 * Önümüzdeki günlerin hatırlatmaları. Geçmiş anlar ve bulmacası bugün çözülmüşse bugün atlanır.
 * Saat, gün bileşenleriyle kurulur (yerel saat): yaz saati geçişinde de seçilen saatte çalar.
 */
export function planReminders({
  now,
  hour,
  results,
  days = REMINDER_DAYS,
}: {
  now: Date;
  hour: number;
  results: DailyResults;
  days?: number;
}): ReminderPlanItem[] {
  const today = dayKey(now);
  const solvedToday = results[today] !== undefined;
  const streak = currentStreak(results, today);
  const plan: ReminderPlanItem[] = [];

  for (let offset = 0; offset < days; offset++) {
    if (offset === 0 && solvedToday) continue;
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, 0, 0, 0);
    if (at.getTime() <= now.getTime()) continue;
    const day = dayKey(at);
    // Seri bu anda hâlâ sürüyor mu: bugün (çözülmediyse dünden süren seri) ya da bugün çözüldüyse yarın
    const alive = solvedToday ? offset === 1 : offset === 0;
    plan.push({
      day,
      at,
      difficulty: dailyDifficulty(parseDayKey(day)!),
      streak: alive ? streak : 0,
    });
  }
  return plan;
}

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** Bildirimin başlığı ve metni */
export function reminderText(item: ReminderPlanItem, t: Translate): { title: string; body: string } {
  const difficulty = t(`difficulty.${item.difficulty}`);
  return {
    title: t('reminder.title'),
    body:
      item.streak > 0
        ? t('reminder.streak', { days: formatDays(item.streak, t), difficulty })
        : t('reminder.plain', { difficulty }),
  };
}

/**
 * Hatırlatmaya dokununca günün bulmacasına nasıl gidilir (o an açık ekrana göre):
 * - stay: zaten günün bulmacasında; aynı bulmaca ikinci kez açılmaz
 * - replace: bir seviyede; günün bulmacası seviyenin yerine açılır (seviye çıkarken
 *   kaydedilir). İki oyun ekranı üst üste açılsa ortak oyun durumu karışırdı.
 * - reset: oyun grubunun dışındaki bir ekranda (Ayarlar, eğitim, paylaşım); önce menüye
 *   dönülür, sonra açılır. Yoksa menünün üstüne ikinci bir oyun yığını kurulurdu.
 * - push: menü, seviye listesi ya da istatistiklerde; üstüne açılır
 */
export type ReminderRoute = 'stay' | 'replace' | 'reset' | 'push';

const OUTSIDE_GAME = ['/settings', '/tutorial', '/share-result'];

export function reminderRoute(pathname: string): ReminderRoute {
  if (pathname === '/daily') return 'stay';
  if (pathname.startsWith('/level/')) return 'replace';
  if (OUTSIDE_GAME.includes(pathname)) return 'reset';
  return 'push';
}
