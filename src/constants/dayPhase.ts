import type { DayPhase } from '../types/game';

export interface DayPhaseConfig {
  phase: DayPhase;
  startHour: number; // dahil
  endHour: number;   // hariç
  greetingTr: string;
  greetingEn: string;
  /** Arka plan başlangıç rengi (gradient) */
  bgFrom: string;
  /** Arka plan bitiş rengi (gradient) */
  bgTo: string;
  /** Vurgu rengi (butonlar, başlıklar) */
  accent: string;
  /** Ambiyans müzik tarzı (expo-av için asset key) */
  musicStyle: 'cheerful' | 'lively' | 'calm' | 'peaceful';
}

export const DAY_PHASES: DayPhaseConfig[] = [
  {
    phase: 'morning',
    startHour: 6,
    endHour: 12,
    greetingTr: 'Günaydın!',
    greetingEn: 'Good Morning!',
    bgFrom: '#FFF8E1',
    bgTo: '#B3E5FC',
    accent: '#F9A825',
    musicStyle: 'cheerful',
  },
  {
    phase: 'afternoon',
    startHour: 12,
    endHour: 18,
    greetingTr: 'İyi Öğlenler!',
    greetingEn: 'Good Afternoon!',
    bgFrom: '#E8F5E9',
    bgTo: '#C8E6C9',
    accent: '#388E3C',
    musicStyle: 'lively',
  },
  {
    phase: 'evening',
    startHour: 18,
    endHour: 23,
    greetingTr: 'İyi Akşamlar!',
    greetingEn: 'Good Evening!',
    bgFrom: '#FFE0B2',
    bgTo: '#CE93D8',
    accent: '#E64A19',
    musicStyle: 'calm',
  },
  {
    phase: 'night',
    startHour: 23,
    endHour: 6, // gece yarısını geçer
    greetingTr: 'İyi Geceler!',
    greetingEn: 'Good Night!',
    bgFrom: '#1A237E',
    bgTo: '#0D47A1',
    accent: '#90CAF9',
    musicStyle: 'peaceful',
  },
];

/**
 * Saate göre aktif DayPhaseConfig döner.
 */
export function getDayPhaseConfig(hour: number): DayPhaseConfig {
  for (const config of DAY_PHASES) {
    if (config.phase === 'night') {
      // Gece: 23-24 veya 0-6
      if (hour >= 23 || hour < 6) return config;
    } else if (hour >= config.startHour && hour < config.endHour) {
      return config;
    }
  }
  return DAY_PHASES[0]; // Fallback: sabah
}

export function getCurrentDayPhase(): DayPhaseConfig {
  const hour = new Date().getHours();
  return getDayPhaseConfig(hour);
}
