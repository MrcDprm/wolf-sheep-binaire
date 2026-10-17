/**
 * Ayarlar Ekranı
 *
 * - Dil seçimi (TR/EN)
 * - Ses ve titreşim toggle
 * - Uygulama versiyonu
 */
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useTranslation } from '../src/i18n';

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
  version: {
    textAlign: 'center',
    color: '#bbb',
    fontSize: 12,
    marginTop: 'auto',
  },
});
