/**
 * Firebase Anonim Kimlik Doğrulama
 *
 * Uygulama ilk açıldığında kullanıcıyı anonim olarak giriş yapar.
 * Bu sayede Firestore'a yazma/okuma izni verilir.
 */
import auth from '@react-native-firebase/auth';

export type FirebaseUser = {
  uid: string;
  isAnonymous: boolean;
};

/**
 * Mevcut kullanıcı varsa döner, yoksa anonim giriş yapar.
 */
export async function signInAnonymouslyIfNeeded(): Promise<FirebaseUser> {
  const current = auth().currentUser;
  if (current) {
    return { uid: current.uid, isAnonymous: current.isAnonymous };
  }

  const credential = await auth().signInAnonymously();
  return {
    uid: credential.user.uid,
    isAnonymous: credential.user.isAnonymous,
  };
}

export function getCurrentUser(): FirebaseUser | null {
  const user = auth().currentUser;
  if (!user) return null;
  return { uid: user.uid, isAnonymous: user.isAnonymous };
}

export function onAuthStateChanged(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return auth().onAuthStateChanged((user) => {
    if (!user) {
      callback(null);
      return;
    }
    callback({ uid: user.uid, isAnonymous: user.isAnonymous });
  });
}
