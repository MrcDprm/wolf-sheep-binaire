/**
 * Günün bulmacası sonuçları telefondan (AsyncStorage) yüklendi mi?
 *
 * Yükleme bitmeden bugün "çözülmemiş" görünür; günün bulmacası ekranı bunu bekler,
 * yoksa çözülmüş bulmaca yeniden oynatılırdı.
 */
import { useSyncExternalStore } from 'react';
import { useDailyStore } from '../store/useDailyStore';

export function useDailyHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useDailyStore.persist.onFinishHydration(onChange),
    () => useDailyStore.persist.hasHydrated(),
  );
}
