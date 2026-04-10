/**
 * Basit i18n sistemi
 *
 * Kullanım:
 *   const t = useTranslation();
 *   t('game.hint')              // → "İpucu" veya "Hint"
 *   t('hints.available', { count: 5 })  // → "5 ipucu"
 */
import { useSettingsStore } from '../store/useSettingsStore';
import tr from './tr.json';
import en from './en.json';

type Language = 'tr' | 'en';

const TRANSLATIONS: Record<Language, Record<string, unknown>> = { tr, en };

/**
 * Nested key'e göre değer döner.
 * Örnek: get(tr, 'game.hint') → 'İpucu'
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : path;
}

/**
 * {{variable}} yer tutucularını değiştirir.
 */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`
  );
}

/**
 * Çeviri fonksiyonu döner.
 * React hook olarak kullanılır — dil değişince otomatik re-render.
 */
export function useTranslation() {
  const language = useSettingsStore((s) => s.language);
  const dict = TRANSLATIONS[language] as Record<string, unknown>;

  return function t(key: string, vars?: Record<string, string | number>): string {
    const raw = getNestedValue(dict, key);
    return interpolate(raw, vars);
  };
}

/**
 * Hook dışında (store, service) kullanım için senkron çeviri.
 * Dil güncel değilse 'tr' varsayılanı kullanır.
 */
export function translate(
  key: string,
  language: Language = 'tr',
  vars?: Record<string, string | number>
): string {
  const dict = TRANSLATIONS[language] as Record<string, unknown>;
  const raw = getNestedValue(dict, key);
  return interpolate(raw, vars);
}
