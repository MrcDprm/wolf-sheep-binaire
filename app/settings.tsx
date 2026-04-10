/**
 * Ayarlar Ekranı
 *
 * - Dil seçimi (TR/EN)
 * - Ses ve titreşim toggle
 * - Premium satın alma
 * - Uygulama versiyonu
 */
import { View, Text, Switch, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Constants from 'expo-constants';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useUserStore } from '../src/store/useUserStore';
import { useTranslation } from '../src/i18n';
import { fetchOfferings, purchasePackage, restorePurchases } from '../src/services/revenueCat';

export default function SettingsScreen() {
  const t = useTranslation();
  const {
    language,
    soundEnabled,
    hapticEnabled,
    setLanguage,
    toggleSound,
    toggleHaptic,
  } = useSettingsStore();
  const { isPremium, setPremium } = useUserStore();

  const handleBuyPremium = async () => {
    const packages = await fetchOfferings();
    if (packages.length === 0) {
      Alert.alert('Hata', 'Şu anda satın alım mevcut değil.');
      return;
    }
    const success = await purchasePackage(packages[0]);
    if (success) {
      setPremium(true);
      Alert.alert('✓', t('premium.alreadyPremium'));
    }
  };

  const handleRestore = async () => {
    const success = await restorePurchases();
    if (success) {
      setPremium(true);
      Alert.alert('✓', t('premium.alreadyPremium'));
    } else {
      Alert.alert('', 'Geri yüklenecek satın alım bulunamadı.');
    }
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={styles.container}>
      {/* Dil */}
      <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
      <View style={styles.langRow}>
        {(['tr', 'en'] as const).map((lang) => (
          <TouchableOpacity
            key={lang}
            style={[styles.langBtn, language === lang && styles.langBtnActive]}
            onPress={() => setLanguage(lang)}
          >
            <Text style={[styles.langText, language === lang && styles.langTextActive]}>
              {lang === 'tr' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Ses */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{t('settings.sound')}</Text>
        <Switch value={soundEnabled} onValueChange={toggleSound} />
      </View>

      {/* Titreşim */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{t('settings.haptic')}</Text>
        <Switch value={hapticEnabled} onValueChange={toggleHaptic} />
      </View>

      {/* Premium */}
      <View style={styles.premiumBox}>
        {isPremium ? (
          <Text style={styles.premiumOwned}>{t('premium.alreadyPremium')}</Text>
        ) : (
          <>
            <Text style={styles.premiumTitle}>{t('premium.title')}</Text>
            <Text style={styles.premiumDesc}>{t('premium.description')}</Text>
            <TouchableOpacity style={styles.premiumBtn} onPress={handleBuyPremium}>
              <Text style={styles.premiumBtnText}>{t('premium.buy')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRestore}>
              <Text style={styles.restoreText}>{t('premium.restore')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Versiyon */}
      <Text style={styles.version}>{t('settings.version')} {version}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FAFAFA',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  langBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#eee',
    alignItems: 'center',
  },
  langBtnActive: {
    backgroundColor: '#388E3C',
  },
  langText: {
    fontWeight: '600',
    color: '#555',
  },
  langTextActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  premiumBox: {
    backgroundColor: '#1A237E',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    gap: 8,
    alignItems: 'center',
  },
  premiumTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  premiumDesc: {
    color: '#C5CAE9',
    fontSize: 13,
    textAlign: 'center',
  },
  premiumOwned: {
    color: '#A5D6A7',
    fontSize: 18,
    fontWeight: '700',
  },
  premiumBtn: {
    backgroundColor: '#F9A825',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  premiumBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  restoreText: {
    color: '#9FA8DA',
    fontSize: 13,
  },
  version: {
    textAlign: 'center',
    color: '#bbb',
    fontSize: 12,
    marginTop: 'auto',
  },
});
