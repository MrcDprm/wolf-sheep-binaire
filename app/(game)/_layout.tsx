/**
 * Oyun Grubu Layout
 *
 * Tüm oyun ekranlarını sarar:
 * - Gün/gece döngüsüne göre dinamik arka plan rengi
 * - Premium olmayan kullanıcılar için alt banner reklam alanı rezervasyonu
 * - Günlük ödül kontrolü
 */
import { Stack } from 'expo-router';
import { useDayPhase } from '../../src/hooks/useDayPhase';
import { useDailyReward } from '../../src/hooks/useDailyReward';

export default function GameLayout() {
  useDayPhase();       // Arka plan rengi hesaplaması için state sağlar
  useDailyReward();    // Günlük giriş bonusunu kontrol et

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    />
  );
}
