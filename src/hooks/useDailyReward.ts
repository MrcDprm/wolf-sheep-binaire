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
import { isFirebaseConfigured } from '../services/firebase/config';
import { DAILY_LOGIN_HINT_BONUS } from '../constants/scoring';

export function useDailyReward(): void {
  const { uid, lastLoginDate, availableHints, claimDailyBonus } = useUserStore();

  const checkAndClaim = useCallback(async () => {
    if (isSameDay(lastLoginDate)) return; // Bugün zaten alındı

    // Önce optimistik UI güncellemesi
    claimDailyBonus();

    // Sonra Firestore'a yaz (çevrimiçiyse)
    if (!uid || !isFirebaseConfigured()) return;
    try {
      await claimDailyBonusOnServer(uid, availableHints + DAILY_LOGIN_HINT_BONUS);
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
