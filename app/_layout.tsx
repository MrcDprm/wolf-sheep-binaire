/**
 * Kök layout
 *
 * Expo Router Stack navigasyonunu tanımlar. Oyuncu ilerlemesi
 * Zustand + AsyncStorage ile telefonda saklanır; sunucu yoktur.
 */
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useTranslation } from '../src/i18n';
import { useDayPhase } from '../src/hooks/useDayPhase';
import { MAX_APP_WIDTH } from '../src/constants/layout';

export const unstable_settings = {
  anchor: '(game)',
};

export default function RootLayout() {
  const t = useTranslation();
  const dayPhase = useDayPhase();

  return (
    // Geniş ekranda ortada telefon genişliğinde sütun; kenarlar günün rengiyle dolar
    <View style={[styles.page, { backgroundColor: dayPhase.bgTo }]}>
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
            options={{ title: t('settings.title'), headerShown: true }}
          />
          <Stack.Screen
            name="share-result"
            options={{ headerShown: false, presentation: 'modal' }}
          />
        </Stack>
      </View>
      <StatusBar style="auto" />
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
