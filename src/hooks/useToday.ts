/**
 * Bugünün gün anahtarı ("2026-11-09")
 *
 * Gece yarısında ve uygulama ön plana gelince yenilenir: menü açık kalsa da
 * günün bulmacası kartı yeni güne geçer.
 */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { dayKey } from '../engine/daily';

export function useToday(): string {
  const [today, setToday] = useState(() => dayKey(new Date()));

  useEffect(() => {
    // Aynı gün dönerse durum değişmez, ekran yeniden çizilmez
    const refresh = () => setToday(dayKey(new Date()));
    const now = new Date();
    // Bir sonraki gece yarısından bir saniye sonra
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    const timer = setTimeout(refresh, nextMidnight.getTime() - now.getTime());
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [today]);

  return today;
}
