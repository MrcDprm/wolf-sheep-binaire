import type { LevelResult } from './game';

export interface UserProfile {
  totalPoints: number;
  availableHints: number;
  lastLoginDate: number | null; // Unix timestamp (ms)
  completedLevels: Record<string, LevelResult>;
}

export interface Title {
  id: number;
  name: string;
  nameTr: string;
  minPoints: number;
  icon: string; // emoji veya asset key
}
