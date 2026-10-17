/**
 * Kök layout
 *
 * Expo Router Stack navigasyonunu tanımlar. Oyuncu ilerlemesi
 * Zustand + AsyncStorage ile telefonda saklanır; sunucu yoktur.
 * Baloo 2 yazı tipi yüklenene kadar açılış ekranı ekranda kalır.
 */
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Baloo2_500Medium,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from '@expo-google-fonts/baloo-2';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useDayPhase } from '../src/hooks/useDayPhase';
import { MAX_APP_WIDTH } from '../src/constants/layout';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Açılış ekranı zaten kapanmışsa (ör. web) yapılacak bir şey yok
});

export const unstable_settings = {
  anchor: '(game)',
};

export default function RootLayout() {
  const dayPhase = useDayPhase();
  const [fontsLoaded, fontError] = useFonts({
    Baloo2_500Medium,
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
  });
  // Yazı tipi yüklenemese de uygulama sistem yazı tipiyle açılır
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    // Geniş ekranda ortada telefon genişliğinde sütun; kenarlar günün rengiyle dolar
    <View style={[styles.page, { backgroundColor: dayPhase.sky }]}>
      <View style={styles.column}>
        <Stack
          screenOptions={{
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
          }}
        >
          <Stack.Screen name="(game)" options={{ headerShown: false }} />
          <Stack.Screen name="tutorial" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen
            name="settings"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="share-result"
            options={{ headerShown: false, presentation: 'modal' }}
          />
        </Stack>
      </View>
      <StatusBar style={dayPhase.dark ? 'light' : 'dark'} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_APP_WIDTH,
  },
});
