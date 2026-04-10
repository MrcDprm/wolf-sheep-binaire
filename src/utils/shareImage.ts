/**
 * Paylaşım Görseli Yardımcısı
 *
 * react-native-view-shot ile bir View'ı görüntüye çevirir,
 * ardından expo-sharing veya React Native Share API ile paylaşır.
 */
import { Share, Platform } from 'react-native';
import type { RefObject } from 'react';

/**
 * ViewShot ref'ini kullanarak ekran görüntüsü alır ve paylaşır.
 * Bileşen içinde çağrılır (ViewShot ref gerekir).
 */
export async function captureAndShare(
  viewRef: RefObject<{ capture: () => Promise<string> }>,
  shareMessage: string,
  shareTitle: string
): Promise<void> {
  if (!viewRef.current) return;

  try {
    const uri = await viewRef.current.capture();

    if (Platform.OS === 'ios') {
      await Share.share({ url: uri, message: shareMessage, title: shareTitle });
    } else {
      await Share.share({ message: `${shareMessage}\n${uri}`, title: shareTitle });
    }
  } catch {
    // Kullanıcı paylaşımı iptal etti veya hata oluştu — sessizce geç
  }
}

/**
 * Sadece metin paylaşımı (görsel olmadan).
 */
export async function shareText(message: string, title: string): Promise<void> {
  try {
    await Share.share({ message, title });
  } catch {
    // İptal veya hata
  }
}
