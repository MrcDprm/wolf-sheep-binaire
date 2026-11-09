/**
 * Hatırlatmaya dokununca günün bulmacası açılır
 *
 * Uygulama kapalıyken dokunulduysa açılışta, açıkken dinleyiciyle yakalanır
 * (services/notifications.ts). Nasıl gidileceği o an açık ekrana göre seçilir
 * (utils/reminders.ts → reminderRoute): seviyedeyken seviyenin yerine açılır,
 * zaten günün bulmacasındaysa bir şey yapılmaz.
 */
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { listenReminderTaps } from '../services/notifications';
import { reminderRoute } from '../utils/reminders';

const DAILY = '/(game)/daily';

export function useReminderTaps(): void {
  const router = useRouter();
  const pathname = usePathname();
  // Dinleyici bir kez kurulur; açık ekran her değişimde buradan okunur
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(
    () =>
      listenReminderTaps(() => {
        switch (reminderRoute(pathnameRef.current)) {
          case 'stay':
            return;
          case 'replace':
            router.replace(DAILY);
            return;
          case 'reset':
            router.dismissAll();
            router.push(DAILY);
            return;
          case 'push':
            router.push(DAILY);
        }
      }),
    [router],
  );
}
