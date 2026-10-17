/**
 * Ayarlar telefondan (AsyncStorage) yüklendi mi?
 *
 * Yükleme bitmeden "eğitim tamamlanmadı" görünür; eğitimi açmadan önce
 * bunun beklenmesi, eski oyuncuya eğitimin bir an görünmesini önler.
 */
import { useSyncExternalStore } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

export function useSettingsHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useSettingsStore.persist.onFinishHydration(onChange),
    () => useSettingsStore.persist.hasHydrated(),
  );
}
