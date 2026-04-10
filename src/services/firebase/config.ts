/**
 * Firebase Uygulama Başlatıcı
 *
 * @react-native-firebase/app kütüphanesi, native modüller aracılığıyla
 * google-services.json (Android) ve GoogleService-Info.plist (iOS) dosyalarını
 * otomatik olarak okur. JS tarafında sadece import yeterlidir.
 *
 * Kurulum adımları (native):
 *  - Android: android/app/google-services.json dosyasını ekle
 *  - iOS: ios/GoogleService-Info.plist dosyasını ekle
 *  - app.json plugins'e @react-native-firebase/app ekle
 */
import firebase from '@react-native-firebase/app';

export { firebase };

export function isFirebaseReady(): boolean {
  return firebase.apps.length > 0;
}
