import type { LevelResult } from './game';

export interface UserProfile {
  uid: string;
  displayName: string;
  totalPoints: number;
  availableHints: number;
  lastLoginDate: number | null; // Unix timestamp (ms)
  isPremium: boolean;
  completedLevels: Record<string, LevelResult>;
  currentTitle: string;
}

export interface DailyRewardState {
  lastClaimedDate: string | null; // 'YYYY-MM-DD' formatında
  streak: number;
}

export interface Title {
  id: number;
  name: string;
  nameTr: string;
  minPoints: number;
  icon: string; // emoji veya asset key
}
