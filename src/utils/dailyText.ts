/**
 * Günün bulmacası metinleri: tarih ve seri
 *
 * Tarih, telefonun tarih biçimleyicisine (Intl) bırakılmaz; ay ve gün adları çeviri
 * dosyasından gelir, her telefonda ve testte aynı yazılır.
 * Örnek: "2026-11-09" → "9 Kasım Pazartesi" / "Monday, November 9"
 */
import { parseDayKey, weekdayOf } from '../engine/daily';

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** Gün anahtarını okunur tarihe çevirir; anahtar bozuksa olduğu gibi döner */
export function formatDayKey(key: string, t: Translate): string {
  const day = parseDayKey(key);
  if (day === null) return key;
  const [, month, date] = key.split('-').map(Number);
  return t('daily.date', {
    day: date,
    month: t(`calendar.months.${month - 1}`),
    weekday: t(`calendar.weekdays.${weekdayOf(day)}`),
  });
}

/** Takvim yaprağı için kısa ay adı ve ayın günü: "2026-11-09" → ["KAS", 9] */
export function calendarLeaf(key: string, t: Translate): [string, number] {
  const [, month, date] = key.split('-').map(Number);
  return [t(`calendar.monthsShort.${month - 1}`), date];
}

/** Gün sayısı; İngilizcede tekil/çoğul ayrı: "1 day", "5 days" */
export function formatDays(count: number, t: Translate): string {
  return t(count === 1 ? 'daily.day' : 'daily.days', { count });
}
