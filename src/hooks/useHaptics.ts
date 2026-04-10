/**
 * Expo Haptics Sarmalayıcısı
 *
 * Ayarlardan titreşim kapatıldıysa tüm hapta çağrıları sessizce atlanır.
 */
import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../store/useSettingsStore';

type HapticType = 'light' | 'medium' | 'heavy' | 'error' | 'success' | 'warning';

export function useHaptics() {
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);

  const trigger = useCallback(
    async (type: HapticType = 'light') => {
      if (!hapticEnabled) return;

      try {
        switch (type) {
          case 'light':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'medium':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'heavy':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case 'error':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
          case 'success':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'warning':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
        }
      } catch {
        // Cihaz haptics desteklemiyorsa sessizce geç
      }
    },
    [hapticEnabled]
  );

  return { trigger };
}
