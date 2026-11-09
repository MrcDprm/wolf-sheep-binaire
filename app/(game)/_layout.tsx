/**
 * Oyun Grubu Layout
 *
 * Tüm oyun ekranlarını sarar:
 * - Gün/gece döngüsüne göre dinamik arka plan rengi
 * - Günlük ipucu ödülü kontrolü
 * - Günlük hatırlatmaların kurulması ve hatırlatmaya dokununca günün bulmacası
 */
import { Stack } from 'expo-router';
import { useDayPhase } from '../../src/hooks/useDayPhase';
import { useDailyReward } from '../../src/hooks/useDailyReward';
import { useDailyReminders } from '../../src/hooks/useDailyReminders';
import { useReminderTaps } from '../../src/hooks/useReminderTaps';

export default function GameLayout() {
  useDayPhase();       // Arka plan rengi hesaplaması için state sağlar
  useDailyReward();    // Günlük giriş bonusunu kontrol et
  useDailyReminders(); // Hatırlatmaları kur ve güncel tut
  useReminderTaps();   // Hatırlatmaya dokununca günün bulmacasını aç

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
