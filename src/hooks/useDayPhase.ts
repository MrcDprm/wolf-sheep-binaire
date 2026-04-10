/**
 * Günün saatine göre aktif DayPhaseConfig döner.
 * Her dakika yeniden hesaplanır (nadir değişim, performans açısından yeterli).
 */
import { useState, useEffect } from 'react';
import { getCurrentDayPhase, type DayPhaseConfig } from '../constants/dayPhase';

export function useDayPhase(): DayPhaseConfig {
  const [config, setConfig] = useState<DayPhaseConfig>(getCurrentDayPhase);

  useEffect(() => {
    const interval = setInterval(() => {
      setConfig(getCurrentDayPhase());
    }, 60_000); // Her dakika kontrol et

    return () => clearInterval(interval);
  }, []);

  return config;
}
