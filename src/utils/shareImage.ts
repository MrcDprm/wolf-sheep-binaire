/**
 * Sonuç kartını paylaşma
 *
 * Telefonda kartın ekran görüntüsü alınıp (react-native-view-shot)
 * sistemin paylaşım penceresiyle (expo-sharing) gönderilir.
 * Görüntü paylaşılamıyorsa (ör. web) sadece metin paylaşılır.
 */
import type { RefObject } from 'react';
import { Platform, Share, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export async function shareCard(
  cardRef: RefObject<View | null>,
  message: string,
  title: string
): Promise<void> {
  try {
    if (Platform.OS !== 'web' && cardRef.current && (await Sharing.isAvailableAsync())) {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: title });
      return;
    }
    await Share.share({ message, title });
  } catch {
    // Kullanıcı paylaşımı iptal etti ya da paylaşım desteklenmiyor
  }
}
