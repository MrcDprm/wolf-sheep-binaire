/**
 * Telefondan okunan oyuncu profili ve ayarların denetimi
 *
 * Kayıt telefondan geldiği için körü körüne güvenilmez. Bozuk ya da elle değiştirilmiş
 * bir kayıtta sayı olmayan ipucu sınırsız ipucu, sayı olmayan puan en yüksek unvan
 * demekti; tanımsız dil ekranda çeviri anahtarlarını gösteriyordu.
 *
 * İlke: silmeden düzelt. Her alan ayrı denetlenir; bozuk alan varsayılana döner, sağlam
 * alanlar olduğu gibi kalır. Bozuk ama var olan seviye sonucu seviyeyi bitmiş saymaya devam
 * eder, yalnızca alanları onarılır: güncellemeyi alan oyuncunun ilerlemesi silinmez.
 * 1.0 ve 1.1 kayıtları bu denetimden hiç değişmeden geçer (testler doğrular).
 */
import { STAR_POINTS } from '../constants/scoring';
import { getLevelById } from '../constants/levels';
import type { LevelResult } from '../types/game';
import type { UserProfile } from '../types/user';
import type { Language } from '../utils/language';

/** Süre üst sınırı: 99:59:59 (seviye kaydıyla aynı) */
const MAX_TIME = 359_999;
/** Bir seviyede kabul edilen en fazla ipucu */
const MAX_HINTS = 999;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isIntIn = (value: unknown, min: number, max: number): value is number =>
  Number.isInteger(value) && (value as number) >= min && (value as number) <= max;

/** Negatif olmayan tam sayı (puan, ipucu sayısı) */
const isCount = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;

/** Bir seviyenin sonucunu onarır; sonuç nesne değilse (bozuk) null */
function levelResultFrom(value: unknown): LevelResult | null {
  if (!isObject(value)) return null;
  const stars = isIntIn(value.stars, 0, 3) ? (value.stars as LevelResult['stars']) : 0;
  const result: LevelResult = {
    stars,
    // Bozuk süre en uzun süre sayılır: sonraki çözüm rekor olur, kayıt kendiliğinden düzelir
    time: isIntIn(value.time, 0, MAX_TIME) ? value.time : MAX_TIME,
    score: isCount(value.score) ? value.score : STAR_POINTS[stars],
    hintsUsed: isIntIn(value.hintsUsed, 0, MAX_HINTS) ? value.hintsUsed : 0,
  };
  if (isIntIn(value.bestTime, 0, MAX_TIME)) result.bestTime = value.bestTime;
  return result;
}

/** Bitirilen seviyeler: anahtar seviye numarasının kendisi olmalı ("5"; "05", "abc" değil) */
function completedLevelsFrom(value: unknown): Record<string, LevelResult> {
  if (!isObject(value)) return {};
  const completed: Record<string, LevelResult> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (String(Number(key)) !== key || !getLevelById(Number(key))) continue;
    const result = levelResultFrom(entry);
    if (result) completed[key] = result;
  }
  return completed;
}

/**
 * Telefondan okunan profil: yalnızca sağlam alanlar döner, gerisi varsayılanda kalır.
 * Toplam puan bozuksa seviyelerin en iyi puanlarından yeniden hesaplanır (toplam puan
 * zaten her seviyenin en iyi puanının toplamıdır); unvan kaybolmaz.
 */
export function userProfileFrom(value: unknown): Partial<UserProfile> {
  if (!isObject(value)) return {};
  const completedLevels = completedLevelsFrom(value.completedLevels);
  const profile: Partial<UserProfile> = { completedLevels };

  profile.totalPoints = isCount(value.totalPoints)
    ? value.totalPoints
    : Object.values(completedLevels).reduce((sum, result) => sum + result.score, 0);
  if (isCount(value.availableHints)) profile.availableHints = value.availableHints;
  if (value.lastLoginDate === null || isCount(value.lastLoginDate)) {
    profile.lastLoginDate = value.lastLoginDate as number | null;
  }
  if (value.lastLevelId === null || (isCount(value.lastLevelId) && getLevelById(value.lastLevelId))) {
    profile.lastLevelId = value.lastLevelId as number | null;
  }
  return profile;
}

export interface SettingsData {
  language: Language;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  timeLimitEnabled: boolean;
  reminderEnabled: boolean;
  reminderHour: number;
  tutorialCompleted: boolean;
}

const BOOLEAN_SETTINGS = [
  'soundEnabled',
  'hapticEnabled',
  'timeLimitEnabled',
  'reminderEnabled',
  'tutorialCompleted',
] as const;

/** Telefondan okunan ayarlar: yalnızca sağlam alanlar döner, gerisi varsayılanda kalır */
export function settingsFrom(value: unknown): Partial<SettingsData> {
  if (!isObject(value)) return {};
  const settings: Partial<SettingsData> = {};
  if (value.language === 'tr' || value.language === 'en') settings.language = value.language;
  for (const key of BOOLEAN_SETTINGS) {
    if (typeof value[key] === 'boolean') settings[key] = value[key];
  }
  if (isIntIn(value.reminderHour, 0, 23)) settings.reminderHour = value.reminderHour;
  return settings;
}
