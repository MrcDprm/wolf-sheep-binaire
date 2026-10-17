/**
 * Firestore `users` koleksiyonu CRUD işlemleri
 */
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestoreDb } from './config';
import type { FirestoreUser } from '../../types/firebase';
import type { LevelResult } from '../../types/game';
import type { UserProfile } from '../../types/user';
import { getTitleForPoints } from '../../constants/titles';
import { BASE_HINT_POOL } from '../../constants/scoring';

const userDoc = (uid: string) => doc(firestoreDb(), 'users', uid);

/**
 * Kullanıcı profilini Firestore'dan çeker.
 * Doküman yoksa varsayılan profili oluşturur ve döner.
 */
export async function fetchOrCreateUser(uid: string): Promise<UserProfile> {
  const ref = userDoc(uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const defaults: FirestoreUser = {
      displayName: 'Anonim Oyuncu',
      totalPoints: 0,
      availableHints: BASE_HINT_POOL,
      lastLoginDate: null,
      completedLevels: {},
    };
    await setDoc(ref, defaults);
    return {
      uid,
      ...defaults,
      lastLoginDate: null,
      currentTitle: getTitleForPoints(0),
    };
  }

  const data = snap.data() as FirestoreUser;
  return {
    uid,
    displayName: data.displayName,
    totalPoints: data.totalPoints,
    availableHints: data.availableHints,
    lastLoginDate: data.lastLoginDate?.toMillis() ?? null,
    completedLevels: data.completedLevels ?? {},
    currentTitle: getTitleForPoints(data.totalPoints),
  };
}

/**
 * Seviye tamamlandığında ilgili alanları günceller.
 * updateDoc yalnızca verilen alanları yazar.
 */
export async function updateLevelComplete(
  uid: string,
  levelId: string,
  result: LevelResult,
  newTotalPoints: number
): Promise<void> {
  await updateDoc(userDoc(uid), {
    [`completedLevels.${levelId}`]: result,
    totalPoints: newTotalPoints,
  });
}

/**
 * Günlük giriş bonusu talep edildiğinde hint sayısını ve son giriş tarihini günceller.
 */
export async function claimDailyBonusOnServer(
  uid: string,
  newHintCount: number
): Promise<void> {
  await updateDoc(userDoc(uid), {
    availableHints: newHintCount,
    lastLoginDate: serverTimestamp(),
  });
}

/**
 * Hint sayısını günceller.
 */
export async function updateHints(uid: string, availableHints: number): Promise<void> {
  await updateDoc(userDoc(uid), { availableHints });
}
