/**
 * Günlük hatırlatmaları kurar ve güncel tutar
 *
 * Hatırlatma açıksa ve bildirim izni varsa önümüzdeki 7 günün hatırlatmaları kurulur
 * (utils/reminders.ts). Ayar, dil ya da günün sonucu değişince ve uygulama ön plana
 * gelince plan yeniden kurulur: bugünün bulmacası çözülünce bugünkü hatırlatma kalkar,
 * 7 günlük pencere ilerler, metindeki seri güncellenir. Hatırlatma kapalıysa ya da izin
 * sonradan geri alındıysa kurulu hatırlatmalar silinir.
 * Ayarlar ve günlük sonuçlar telefondan yüklenmeden hiçbir şey yapılmaz.
 */
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { translate } from '../i18n';
import {
  reminderPermission,
  remindersSupported,
  setForegroundHandling,
  syncReminders,
  type ScheduledReminder,
} from '../services/notifications';
import { useDailyStore } from '../store/useDailyStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { planReminders, reminderHourOf, reminderText } from '../utils/reminders';
import { useDailyHydrated } from './useDailyHydrated';
import { useSettingsHydrated } from './useSettingsHydrated';

/** Kurulacak hatırlatmalar; sırası gelince en güncel ayar ve sonuçlarla hesaplanır */
async function currentReminders(): Promise<ScheduledReminder[]> {
  const { reminderEnabled, reminderHour, language } = useSettingsStore.getState();
  if (!reminderEnabled || (await reminderPermission()) !== 'granted') return [];
  const t = (key: string, vars?: Record<string, string | number>) => translate(key, language, vars);
  const plan = planReminders({
    now: new Date(),
    hour: reminderHourOf(reminderHour),
    results: useDailyStore.getState().results,
  });
  return plan.map((item) => ({ id: `daily-${item.day}`, at: item.at, ...reminderText(item, t) }));
}

export function useDailyReminders(): void {
  const enabled = useSettingsStore((s) => s.reminderEnabled);
  const hour = useSettingsStore((s) => s.reminderHour);
  const language = useSettingsStore((s) => s.language);
  const results = useDailyStore((s) => s.results);
  const settingsReady = useSettingsHydrated();
  const dailyReady = useDailyHydrated();
  const ready = settingsReady && dailyReady;

  // Ayar, dil ya da sonuç değişince yeniden kur (değerler kurulumda store'dan taze okunur)
  useEffect(() => {
    if (!remindersSupported || !ready) return;
    setForegroundHandling();
    void syncReminders(currentReminders);
  }, [ready, enabled, hour, language, results]);

  // Ön plana gelince yeniden kur
  useEffect(() => {
    if (!remindersSupported || !ready) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncReminders(currentReminders);
    });
    return () => sub.remove();
  }, [ready]);
}
