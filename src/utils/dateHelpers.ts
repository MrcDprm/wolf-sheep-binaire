/**
 * Tarih yardımcıları
 *
 * - Günlük ödül kontrolü
 */

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
