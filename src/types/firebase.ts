import type { LevelResult } from './game';
import { Timestamp } from '@react-native-firebase/firestore';

/**
 * Firestore `users/{uid}` dokümanı
 */
export interface FirestoreUser {
  displayName: string;
  totalPoints: number;
  availableHints: number;
  lastLoginDate: Timestamp | null;
  isPremium: boolean;
  completedLevels: Record<string, LevelResult>;
}

/**
 * Firestore `daily_puzzles/{YYYY-MM-DD}` dokümanı
 */
export interface FirestoreDailyPuzzle {
  gridSize: number;
  /** Düzleştirilmiş board: 0=Boş, 1=Kurt, 2=Koyun */
  initialBoard: number[];
  /** Çözüm dizisi (Cloud Function tarafından üretilir) */
  solutionBoard: number[];
  createdAt: Timestamp;
}

/**
 * Firestore `daily_puzzles/{YYYY-MM-DD}/leaderboard/{uid}` dokümanı
 */
export interface FirestoreLeaderboardEntry {
  displayName: string;
  time: number; // saniye
  completedAt: Timestamp;
}
