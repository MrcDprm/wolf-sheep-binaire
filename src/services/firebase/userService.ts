/**
 * Firestore `users` koleksiyonu CRUD işlemleri
 */
import firestore from '@react-native-firebase/firestore';
import type { FirestoreUser } from '../../types/firebase';
import type { LevelResult } from '../../types/game';
import type { UserProfile } from '../../types/user';
import { getTitleForPoints } from '../../constants/titles';
import { BASE_HINT_POOL } from '../../constants/scoring';

const usersCol = () => firestore().collection('users');

/**
 * Kullanıcı profilini Firestore'dan çeker.
 * Doküman yoksa varsayılan profili oluşturur ve döner.
 */
export async function fetchOrCreateUser(uid: string): Promise<UserProfile> {
  const ref = usersCol().doc(uid);
  const snap = await ref.get();

  if (!snap.exists) {
    const defaults: FirestoreUser = {
      displayName: 'Anonim Oyuncu',
      totalPoints: 0,
      availableHints: BASE_HINT_POOL,
      lastLoginDate: null,
      isPremium: false,
      completedLevels: {},
    };
    await ref.set(defaults);
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
    isPremium: data.isPremium,
    completedLevels: data.completedLevels ?? {},
    currentTitle: getTitleForPoints(data.totalPoints),
  };
}

/**
 * Seviye tamamlandığında ilgili alanları günceller.
 * Firestore merge: yalnızca değişen alanları yazar.
 */
export async function updateLevelComplete(
  uid: string,
  levelId: string,
  result: LevelResult,
  newTotalPoints: number
): Promise<void> {
  await usersCol().doc(uid).update({
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
  await usersCol().doc(uid).update({
    availableHints: newHintCount,
    lastLoginDate: firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Premium durumunu günceller.
 */
export async function setPremiumStatus(uid: string, isPremium: boolean): Promise<void> {
  await usersCol().doc(uid).update({ isPremium });
}

/**
 * Hint sayısını günceller (satın alma sonrası).
 */
export async function updateHints(uid: string, availableHints: number): Promise<void> {
  await usersCol().doc(uid).update({ availableHints });
}
