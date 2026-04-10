/**
 * RevenueCat Entegrasyonu
 *
 * Satın alım işlemleri:
 *  - "remove_ads_impossible": Reklamları kaldır + İmkansız Mod kilidi açar
 *
 * Kurulum:
 *  - RevenueCat Dashboard'dan API key'leri al
 *  - REVENUECAT_API_KEY_IOS / REVENUECAT_API_KEY_ANDROID değerlerini
 *    env dosyasına veya app.config.ts'e ekle
 */
import Purchases, {
  type PurchasesPackage,
  type CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEY_IOS = 'appl_REPLACE_WITH_YOUR_IOS_KEY';
const API_KEY_ANDROID = 'goog_REPLACE_WITH_YOUR_ANDROID_KEY';
const PREMIUM_ENTITLEMENT = 'premium';

export async function initRevenueCat(userId?: string): Promise<void> {
  Purchases.setLogLevel(LOG_LEVEL.ERROR);

  const apiKey = Platform.OS === 'ios' ? API_KEY_IOS : API_KEY_ANDROID;
  await Purchases.configure({ apiKey, appUserID: userId });
}

/**
 * Kullanıcının premium yetkisine sahip olup olmadığını kontrol eder.
 */
export async function checkPremiumStatus(): Promise<boolean> {
  try {
    const info: CustomerInfo = await Purchases.getCustomerInfo();
    return !!info.entitlements.active[PREMIUM_ENTITLEMENT];
  } catch {
    return false;
  }
}

/**
 * Mevcut teklifleri (offerings) döner.
 */
export async function fetchOfferings(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
  } catch {
    return [];
  }
}

/**
 * Belirli bir paketi satın alır.
 * @returns true: başarılı, false: iptal/hata
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return !!customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];
  } catch {
    return false;
  }
}

/**
 * Önceki satın alımları geri yükler.
 */
export async function restorePurchases(): Promise<boolean> {
  try {
    const info = await Purchases.restorePurchases();
    return !!info.entitlements.active[PREMIUM_ENTITLEMENT];
  } catch {
    return false;
  }
}
