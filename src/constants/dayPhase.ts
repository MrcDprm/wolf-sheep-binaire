/**
 * Gün dilimleri
 *
 * Saate göre sadece gökyüzü, yazı, yüzey ve tepe renkleri değişir;
 * tahta ve taşlar her saatte aynıdır.
 */
import type { DayPhase } from '../types/game';

export interface DayPhaseConfig {
  phase: DayPhase;
  startHour: number; // dahil
  endHour: number; // hariç
  /** Koyu gökyüzü mü (gece) */
  dark: boolean;
  /** Arka plan (gökyüzü) */
  sky: string;
  /** Ana yazı rengi */
  text: string;
  /** İkincil yazı rengi */
  textMuted: string;
  /** İkincil düğme, sekme gibi yüzeyler */
  surface: string;
  /** Yüzeylerin dokunsal alt kenarı */
  surfaceEdge: string;
  /** Tahtanın keçesi ve alt kenarı */
  felt: string;
  feltEdge: string;
  /** Menüdeki tepeler: uzak ve yakın */
  hillFar: string;
  hillNear: string;
}

const DAY_SURFACE = {
  dark: false,
  text: '#2E2A24',
  textMuted: '#5C564D',
  surface: 'rgba(255,255,255,0.6)',
  surfaceEdge: 'rgba(46,42,36,0.16)',
  felt: '#5E8C3A',
  feltEdge: '#4C7530',
};

export const DAY_PHASES: DayPhaseConfig[] = [
  {
    phase: 'morning',
    startHour: 6,
    endHour: 12,
    ...DAY_SURFACE,
    sky: '#D9EDF7',
    hillFar: '#A9CC86',
    hillNear: '#86B562',
  },
  {
    phase: 'afternoon',
    startHour: 12,
    endHour: 18,
    ...DAY_SURFACE,
    sky: '#CFE6F2',
    hillFar: '#9CC27A',
    hillNear: '#7FAE5A',
  },
  {
    phase: 'evening',
    startHour: 18,
    endHour: 23,
    ...DAY_SURFACE,
    sky: '#EFD3D6',
    hillFar: '#9AAE76',
    hillNear: '#7A9459',
  },
  {
    phase: 'night',
    startHour: 23,
    endHour: 6, // gece yarısını geçer
    dark: true,
    sky: '#1E2747',
    text: '#F2EEE4',
    textMuted: '#B9BFD6',
    surface: 'rgba(255,255,255,0.12)',
    surfaceEdge: 'rgba(0,0,0,0.35)',
    felt: '#2F4A2A',
    feltEdge: '#253C21',
    hillFar: '#26402A',
    hillNear: '#1D3322',
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
