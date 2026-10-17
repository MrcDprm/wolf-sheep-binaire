/**
 * Firestore Liderlik Tablosu Servisi
 *
 * Global: `users` koleksiyonunda `totalPoints` alanına göre sıralama.
 * Günlük: `daily_puzzles/{date}/leaderboard` alt koleksiyonu, `time`'a göre sıralama.
 */
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { firestoreDb } from './config';
import type { FirestoreLeaderboardEntry } from '../../types/firebase';
import { getTodayKey } from '../../utils/dateHelpers';

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  score: number;
  time?: number;
  rank: number;
}

const dailyLeaderboardCol = (dateKey: string) =>
  collection(firestoreDb(), 'daily_puzzles', dateKey, 'leaderboard');

/**
 * Global liderlik tablosu (en iyi 50 kullanıcı, totalPoints'e göre).
 */
export async function fetchGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  const snap = await getDocs(
    query(collection(firestoreDb(), 'users'), orderBy('totalPoints', 'desc'), limit(50))
  );

  return snap.docs.map((d, idx) => ({
    uid: d.id,
    displayName: d.data().displayName ?? 'Anonim',
    score: d.data().totalPoints ?? 0,
    rank: idx + 1,
  }));
}

/**
 * Günlük liderlik tablosu (bugünün bulmacası için, süreye göre).
 */
export async function fetchDailyLeaderboard(
  dateKey?: string
): Promise<LeaderboardEntry[]> {
  const key = dateKey ?? getTodayKey();
  const snap = await getDocs(
    query(dailyLeaderboardCol(key), orderBy('time', 'asc'), limit(50))
  );

  return snap.docs.map((d, idx) => {
    const data = d.data() as FirestoreLeaderboardEntry;
    return {
      uid: d.id,
      displayName: data.displayName,
      score: 0,
      time: data.time,
      rank: idx + 1,
    };
  });
}

/**
 * Günlük bulmaca tamamlama süresini Firestore'a kaydeder.
 */
export async function submitDailyScore(
  uid: string,
  displayName: string,
  time: number,
  dateKey?: string
): Promise<void> {
  const key = dateKey ?? getTodayKey();
  await setDoc(doc(dailyLeaderboardCol(key), uid), {
    displayName,
    time,
    completedAt: serverTimestamp(),
  });
}

/**
 * Belirli bir seviye için tüm tamamlama sürelerini çeker.
 * Zaman bonusu yüzdelik hesabı için kullanılır.
 */
export async function fetchLevelTimes(levelId: string): Promise<number[]> {
  const snap = await getDocs(
    query(
      collection(firestoreDb(), 'level_times', levelId, 'entries'),
      orderBy('time', 'asc'),
      limit(500)
    )
  );

  return snap.docs.map((d) => d.data().time as number);
}
