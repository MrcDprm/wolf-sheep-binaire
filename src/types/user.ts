import type { LevelResult } from './game';

export interface UserProfile {
  totalPoints: number;
  availableHints: number;
  lastLoginDate: number | null; // Unix timestamp (ms)
  completedLevels: Record<string, LevelResult>;
  /** En son açılan seviye; "Devam et" bu seviyenin zorluğundan devam eder */
  lastLevelId: number | null;
}

export interface Title {
  id: number;
  name: string;
  nameTr: string;
  minPoints: number;
  icon: string; // emoji veya asset key
}
