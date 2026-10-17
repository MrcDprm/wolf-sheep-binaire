/**
 * Firebase başlatıcı (JavaScript SDK — Expo Go'da da çalışır)
 *
 * Ayarlar .env dosyasındaki EXPO_PUBLIC_FIREBASE_* değişkenlerinden okunur.
 * Ayar yoksa Firebase hiç başlatılmaz; oyun çevrimdışı çalışmaya devam eder.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function firebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase ayarları eksik (.env)');
  }
  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

/** Oturum AsyncStorage'da saklanır; uygulama kapanıp açılınca oyuncu aynı kalır. */
export function firebaseAuth(): Auth {
  if (!auth) {
    const a = firebaseApp();
    try {
      auth = initializeAuth(a, { persistence: getReactNativePersistence(AsyncStorage) });
    } catch {
      // Hızlı yenilemede (Fast Refresh) auth zaten başlatılmış olabilir
      auth = getAuth(a);
    }
  }
  return auth;
}

export function firestoreDb(): Firestore {
  if (!db) {
    db = getFirestore(firebaseApp());
  }
  return db;
}
