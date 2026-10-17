/**
 * Günlük giriş ödülü
 *
 * Uygulama açıldığında veya ön plana geldiğinde kontrol eder.
 * Bugün ödül alınmamışsa ipucu stoğuna eklenir.
 */
import { useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { useUserStore } from '../store/useUserStore';
import { isSameDay } from '../utils/dateHelpers';

export function useDailyReward(): void {
  const lastLoginDate = useUserStore((s) => s.lastLoginDate);
  const claimDailyBonus = useUserStore((s) => s.claimDailyBonus);

  const checkAndClaim = useCallback(() => {
    if (isSameDay(lastLoginDate)) return; // Bugün zaten alındı
    claimDailyBonus();
  }, [lastLoginDate, claimDailyBonus]);

  useEffect(() => {
    checkAndClaim();

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') checkAndClaim();
    });

    return () => sub.remove();
  }, [checkAndClaim]);
}
