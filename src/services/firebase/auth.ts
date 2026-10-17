/**
 * Firebase Anonim Kimlik Doğrulama
 *
 * Uygulama ilk açıldığında kullanıcıyı anonim olarak giriş yapar.
 * Bu sayede Firestore'a yazma/okuma izni verilir.
 */
import {
  signInAnonymously,
  onAuthStateChanged as onFirebaseAuthStateChanged,
} from 'firebase/auth';
import { firebaseAuth } from './config';

export type FirebaseUser = {
  uid: string;
  isAnonymous: boolean;
};

/**
 * Mevcut kullanıcı varsa döner, yoksa anonim giriş yapar.
 */
export async function signInAnonymouslyIfNeeded(): Promise<FirebaseUser> {
  const auth = firebaseAuth();
  // Kayıtlı oturumun AsyncStorage'dan yüklenmesini bekle
  await auth.authStateReady();

  const current = auth.currentUser;
  if (current) {
    return { uid: current.uid, isAnonymous: current.isAnonymous };
  }

  const credential = await signInAnonymously(auth);
  return {
    uid: credential.user.uid,
    isAnonymous: credential.user.isAnonymous,
  };
}

export function getCurrentUser(): FirebaseUser | null {
  const user = firebaseAuth().currentUser;
  if (!user) return null;
  return { uid: user.uid, isAnonymous: user.isAnonymous };
}

export function onAuthStateChanged(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onFirebaseAuthStateChanged(firebaseAuth(), (user) => {
    if (!user) {
      callback(null);
      return;
    }
    callback({ uid: user.uid, isAnonymous: user.isAnonymous });
  });
}
