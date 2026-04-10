/**
 * Firestore Liderlik Tablosu Servisi
 *
 * Global: `users` koleksiyonunda `totalPoints` alanına göre sıralama.
 * Günlük: `daily_puzzles/{date}/leaderboard` alt koleksiyonu, `time`'a göre sıralama.
 */
import firestore from '@react-native-firebase/firestore';
import type { FirestoreLeaderboardEntry } from '../../types/firebase';
import { getTodayKey } from '../../utils/dateHelpers';

const usersCol = () => firestore().collection('users');
const dailyCol = () => firestore().collection('daily_puzzles');

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  score: number;
  time?: number;
  rank: number;
}

/**
 * Global liderlik tablosu (en iyi 50 kullanıcı, totalPoints'e göre).
 */
export async function fetchGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  const snap = await usersCol()
    .orderBy('totalPoints', 'desc')
    .limit(50)
    .get();

  return snap.docs.map((doc, idx) => ({
    uid: doc.id,
    displayName: doc.data().displayName ?? 'Anonim',
    score: doc.data().totalPoints ?? 0,
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
  const snap = await dailyCol()
    .doc(key)
    .collection('leaderboard')
    .orderBy('time', 'asc')
    .limit(50)
    .get();

  return snap.docs.map((doc, idx) => {
    const data = doc.data() as FirestoreLeaderboardEntry;
    return {
      uid: doc.id,
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
  await dailyCol()
    .doc(key)
    .collection('leaderboard')
    .doc(uid)
    .set({
      displayName,
      time,
      completedAt: firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Belirli bir seviye için tüm tamamlama sürelerini çeker.
 * Zaman bonusu yüzdelik hesabı için kullanılır.
 */
export async function fetchLevelTimes(levelId: string): Promise<number[]> {
  const snap = await firestore()
    .collection('level_times')
    .doc(levelId)
    .collection('entries')
    .orderBy('time', 'asc')
    .limit(500)
    .get();

  return snap.docs.map((doc) => doc.data().time as number);
}
