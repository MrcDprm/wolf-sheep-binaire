/**
 * Google AdMob Banner Reklam Servisi
 *
 * Premium kullanıcılara reklam gösterilmez.
 * Test cihazlarda test ID'leri kullanılır.
 */
import {
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';

// Üretim ID'lerini buraya ekle
const BANNER_AD_UNIT_IOS = 'ca-app-pub-REPLACE/REPLACE_IOS';
const BANNER_AD_UNIT_ANDROID = 'ca-app-pub-REPLACE/REPLACE_ANDROID';

/**
 * Platform ve ortama göre doğru banner ad unit ID'sini döner.
 */
export function getBannerAdUnitId(isTest = __DEV__): string {
  if (isTest) return TestIds.BANNER;
  const { Platform } = require('react-native');
  return Platform.OS === 'ios' ? BANNER_AD_UNIT_IOS : BANNER_AD_UNIT_ANDROID;
}

export { BannerAdSize };
