/**
 * Root Layout
 *
 * - Firebase anonim kimlik doğrulamasını başlatır
 * - Kullanıcı profilini Firestore'dan çeker ve store'a hydrate eder
 * - RevenueCat'i başlatır
 * - Expo Router Stack navigasyonunu tanımlar
 */
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { signInAnonymouslyIfNeeded, onAuthStateChanged } from '../src/services/firebase/auth';
import { fetchOrCreateUser } from '../src/services/firebase/userService';
import { useUserStore } from '../src/store/useUserStore';
import { initRevenueCat, checkPremiumStatus } from '../src/services/revenueCat';

export const unstable_settings = {
  anchor: '(game)',
};

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const { hydrate, setLoading, setPremium } = useUserStore();

  useEffect(() => {
    let unsubAuth: (() => void) | undefined;

    async function bootstrap() {
      setLoading(true);

      try {
        // 1. Firebase anonim giriş
        const user = await signInAnonymouslyIfNeeded();

        // 2. Kullanıcı profilini çek / oluştur
        const profile = await fetchOrCreateUser(user.uid);
        hydrate(profile);

        // 3. RevenueCat başlat & premium kontrol
        await initRevenueCat(user.uid);
        const isPremium = await checkPremiumStatus();
        setPremium(isPremium);

        // 4. Auth state değişimlerini dinle
        unsubAuth = onAuthStateChanged((u) => {
          if (!u) {
            // Beklenmedik çıkış — anonim re-login
            signInAnonymouslyIfNeeded().catch(() => null);
          }
        });
      } catch {
        // Bootstrap hatası — uygulamayı yine de aç
      } finally {
        setLoading(false);
        setReady(true);
      }
    }

    bootstrap();

    return () => {
      unsubAuth?.();
    };
  }, [hydrate, setLoading, setPremium]);

  if (!ready) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#388E3C" />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      >
        <Stack.Screen name="(game)" options={{ headerShown: false }} />
        <Stack.Screen name="tutorial" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="leaderboard" options={{ title: 'Liderlik Tablosu', headerShown: true, gestureEnabled: true }} />
        <Stack.Screen name="settings" options={{ title: 'Ayarlar', headerShown: true, gestureEnabled: true }} />
        <Stack.Screen name="share-result" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
  },
});
