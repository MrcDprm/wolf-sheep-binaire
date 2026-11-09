/**
 * Günlük hatırlatma bildirimleri
 *
 * Telefonun kendi yerel bildirimleri kullanılır: sunucu, push (APNs) ve hesap yok; hiçbir
 * veri telefondan çıkmaz. Bu yüzden app.json'a expo-notifications eklentisi eklenmedi:
 * eklenti uygulamaya gereksiz yere push yetkisi (aps-environment) ekliyordu.
 *
 * İzin yalnızca oyuncu Ayarlar'da hatırlatmayı açınca istenir. Web önizlemesinde
 * zamanlama desteklenmediği için hatırlatmalar orada kapalıdır.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Hatırlatma bu platformda çalışır mı (web önizlemesinde hayır) */
export const remindersSupported = Platform.OS === 'ios' || Platform.OS === 'android';

export type ReminderPermission = 'granted' | 'denied' | 'undetermined';

export interface ScheduledReminder {
  /** Bildirim kimliği: aynı kimlikle kurulan eskisinin yerine geçer */
  id: string;
  at: Date;
  title: string;
  body: string;
}

/** Bildirime dokununca açılacak ekran (bildirim verisinde taşınır) */
export const REMINDER_SCREEN = 'daily';

let handlerSet = false;

/** Uygulama açıkken gelen hatırlatma gösterilmez: oyuncu zaten oyunun içinde */
export function setForegroundHandling(): void {
  if (!remindersSupported || handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Bildirim izninin şu anki durumu */
export async function reminderPermission(): Promise<ReminderPermission> {
  if (!remindersSupported) return 'denied';
  try {
    const { granted, canAskAgain } = await Notifications.getPermissionsAsync();
    if (granted) return 'granted';
    return canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'denied';
  }
}

/** İzin verilmediyse ve sorulabiliyorsa sorar. İzin varsa true. */
export async function askReminderPermission(): Promise<boolean> {
  const current = await reminderPermission();
  if (current === 'granted') return true;
  if (current === 'denied') return false;
  try {
    const { granted } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
    return granted;
  } catch {
    return false;
  }
}

// Kurma işleri sırayla yapılır ve her iş, sırası gelince kurulacakları en güncel ayarla
// hesaplar: hızlıca aç-kapa yapılınca izni bekleyen eski bir iş, kapatmadan sonra
// bildirim kurmasın; iki kurulum birbirinin bildirimlerini silip çift bırakmasın.
// Bir işin hatası sonrakileri durdurmaz.
let queue: Promise<void> = Promise.resolve();

/** Kurulu bütün hatırlatmaları siler ve `plan`ın verdiklerini kurar (boş liste: hepsini siler) */
export function syncReminders(plan: () => Promise<ScheduledReminder[]>): Promise<void> {
  if (!remindersSupported) return Promise.resolve();
  queue = queue
    .then(async () => {
      const reminders = await plan();
      await Notifications.cancelAllScheduledNotificationsAsync();
      for (const reminder of reminders) {
        await Notifications.scheduleNotificationAsync({
          identifier: reminder.id,
          content: {
            title: reminder.title,
            body: reminder.body,
            sound: 'default',
            data: { screen: REMINDER_SCREEN },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.at },
        });
      }
    })
    .catch((error) => {
      if (__DEV__) console.warn('Hatırlatma kurulamadı', error);
    });
  return queue;
}

/**
 * Hatırlatmaya dokunulunca `open` çağrılır; uygulamayı bildirim açtıysa hemen.
 * Yalnızca kendi kurduğumuz bildirime bakılır (veride ekran adı). Aynı dokunuş iki kez
 * gelirse (açılış yanıtı ve dinleyici) bir kez işlenir. Aboneliği kaldıran fonksiyon döner.
 */
export function listenReminderTaps(open: () => void): () => void {
  if (!remindersSupported) return () => {};
  let lastHandled = '';
  const handle = (response: Notifications.NotificationResponse) => {
    const { request, date } = response.notification;
    if (request.content.data?.screen !== REMINDER_SCREEN) return;
    const key = `${request.identifier}@${date}`;
    if (key === lastHandled) return;
    lastHandled = key;
    open();
  };
  const launch = Notifications.getLastNotificationResponse();
  if (launch) {
    Notifications.clearLastNotificationResponse();
    handle(launch);
  }
  const subscription = Notifications.addNotificationResponseReceivedListener(handle);
  return () => subscription.remove();
}
