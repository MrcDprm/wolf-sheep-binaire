/**
 * Yarım kalan seviyeler telefondan (AsyncStorage) yüklendi mi?
 *
 * Yükleme bitmeden seviye açılırsa kayıt bulunamaz ve seviye baştan başlar; ardından
 * gelen yükleme de az önce yazılan kaydı ezer. Oyun ekranı bu yüzden yüklemeyi bekler.
 */
import { useSyncExternalStore } from 'react';
import { useSavedGamesStore } from '../store/useSavedGamesStore';

export function useSavedGamesHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useSavedGamesStore.persist.onFinishHydration(onChange),
    () => useSavedGamesStore.persist.hasHydrated(),
  );
}
