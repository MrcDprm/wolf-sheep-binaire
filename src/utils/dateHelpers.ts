/**
 * Tarih yardımcıları
 *
 * - Günlük bulmaca için tarih anahtarı üretimi
 * - Günlük ödül kontrolü
 * - Bir sonraki yenileme saatine kalan süre
 */

/** Yerel saate göre 'YYYY-MM-DD' formatında tarih döner */
export function getTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Verilen Unix timestamp (ms) ile bugün aynı gün mü?
 */
export function isSameDay(timestampMs: number | null): boolean {
  if (!timestampMs) return false;
  const today = new Date();
  const other = new Date(timestampMs);
  return (
    today.getFullYear() === other.getFullYear() &&
    today.getMonth() === other.getMonth() &&
    today.getDate() === other.getDate()
  );
}

/**
 * Günlük bulmaca yenileme saati: her gün 10:00 yerel saat.
 * Bu saate kadar kalan saniyeyi döner.
 */
export function secondsUntilDailyReset(): number {
  const now = new Date();
  const reset = new Date();
  reset.setHours(10, 0, 0, 0);

  if (now >= reset) {
    // 10:00 geçtiyse yarın 10:00'a kadar
    reset.setDate(reset.getDate() + 1);
  }

  return Math.floor((reset.getTime() - now.getTime()) / 1000);
}

/**
 * Kalan saniyeyi "SS:DD:SS" (saat:dakika:saniye) formatında döner.
 */
export function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

/**
 * Son günlük bonusun bugün talep edilip edilmediğini kontrol eder.
 */
export function hasDailyBonusBeenClaimed(lastClaimedDateStr: string | null): boolean {
  if (!lastClaimedDateStr) return false;
  return lastClaimedDateStr === getTodayKey();
}

/**
 * Verilen tarihin bugün olup olmadığını 'YYYY-MM-DD' string üzerinden kontrol eder.
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayKey();
}
