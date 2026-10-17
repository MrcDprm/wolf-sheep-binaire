/**
 * Kök layout
 *
 * Expo Router Stack navigasyonunu tanımlar. Oyuncu ilerlemesi
 * Zustand + AsyncStorage ile telefonda saklanır; sunucu yoktur.
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useTranslation } from '../src/i18n';

export const unstable_settings = {
  anchor: '(game)',
};

export default function RootLayout() {
  const t = useTranslation();

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
        <Stack.Screen name="settings" options={{ title: t('settings.title'), headerShown: true }} />
        <Stack.Screen name="share-result" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
