/**
 * Günlük Giriş Ödülü Hook'u
 *
 * Uygulama açıldığında veya ön plana geldiğinde kontrol eder.
 * Bugün ödül alınmamışsa talep eder ve Firestore'a yazar.
 */
import { useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { useUserStore } from '../store/useUserStore';
import { isSameDay } from '../utils/dateHelpers';
import { claimDailyBonusOnServer } from '../services/firebase/userService';

export function useDailyReward(): void {
  const { uid, lastLoginDate, availableHints, claimDailyBonus } = useUserStore();

  const checkAndClaim = useCallback(async () => {
    if (!uid) return;
    if (isSameDay(lastLoginDate)) return; // Bugün zaten alındı

    // Önce optimistik UI güncellemesi
    claimDailyBonus();

    // Sonra Firestore'a yaz
    try {
      await claimDailyBonusOnServer(uid, availableHints + 5);
    } catch {
      // Sessiz hata — yerel state zaten güncellendi
    }
  }, [uid, lastLoginDate, availableHints, claimDailyBonus]);

  useEffect(() => {
    checkAndClaim();

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') checkAndClaim();
    });

    return () => sub.remove();
  }, [checkAndClaim]);
}
