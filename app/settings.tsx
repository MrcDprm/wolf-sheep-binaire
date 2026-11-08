/**
 * Ayarlar
 *
 * - Dil (Türkçe / English)
 * - Ses ve titreşim
 * - Süre sınırı (kapalıysa süre sadece ileri sayar, seviye kaybedilmez)
 * - Nasıl oynanır? (eğitimi yeniden açar)
 * - Uygulama sürümü
 */
import type { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useTranslation } from '../src/i18n';
import { useDayPhase } from '../src/hooks/useDayPhase';
import { IconButton } from '../src/components/ui/IconButton';
import { Icon } from '../src/components/ui/Icon';
import { Toggle } from '../src/components/ui/Toggle';
import { fontSize, fonts, palette, radius } from '../src/theme';

const LANGUAGES = [
  { id: 'tr', label: 'Türkçe' },
  { id: 'en', label: 'English' },
] as const;

/** Ayar satırı: solda yazı, sağda anahtar */
function Row({ background, children }: { background: string; children: ReactNode }) {
  return <View style={[styles.row, { backgroundColor: background }]}>{children}</View>;
}

export default function SettingsScreen() {
  const t = useTranslation();
  const router = useRouter();
  const dayPhase = useDayPhase();
  const {
    language,
    soundEnabled,
    hapticEnabled,
    timeLimitEnabled,
    setLanguage,
    toggleSound,
    toggleHaptic,
    toggleTimeLimit,
  } = useSettingsStore();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const toggleColors = {
    onColor: palette.straw,
    offColor: dayPhase.surfaceEdge,
    thumbColor: palette.wool,
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: dayPhase.sky }]}>
      <View style={styles.header}>
        <IconButton
          name="back"
          color={dayPhase.text}
          onPress={() => router.back()}
          accessibilityLabel={t('game.back')}
        />
        <Text style={[styles.title, { color: dayPhase.text }]} accessibilityRole="header">
          {t('settings.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.section, { color: dayPhase.textMuted }]}>
          {t('settings.language')}
        </Text>
        <View style={styles.langRow} accessibilityRole="radiogroup">
          {LANGUAGES.map((lang) => {
            const active = language === lang.id;
            return (
              <Pressable
                key={lang.id}
                onPress={() => setLanguage(lang.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                style={[
                  styles.langBtn,
                  { backgroundColor: active ? palette.straw : dayPhase.surface },
                ]}
              >
                <Text style={[styles.langText, { color: active ? palette.ink : dayPhase.text }]}>
                  {lang.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Row background={dayPhase.surface}>
          <Text style={[styles.rowLabel, { color: dayPhase.text }]}>{t('settings.sound')}</Text>
          <Toggle
            value={soundEnabled}
            onValueChange={toggleSound}
            accessibilityLabel={t('settings.sound')}
            {...toggleColors}
          />
        </Row>

        <Row background={dayPhase.surface}>
          <Text style={[styles.rowLabel, { color: dayPhase.text }]}>{t('settings.haptic')}</Text>
          <Toggle
            value={hapticEnabled}
            onValueChange={toggleHaptic}
            accessibilityLabel={t('settings.haptic')}
            {...toggleColors}
          />
        </Row>

        <Row background={dayPhase.surface}>
          <Text style={[styles.rowLabel, { color: dayPhase.text }]}>
            {t('settings.timeLimit')}
          </Text>
          <Toggle
            value={timeLimitEnabled}
            onValueChange={toggleTimeLimit}
            accessibilityLabel={t('settings.timeLimit')}
            {...toggleColors}
          />
        </Row>

        <Pressable
          onPress={() => router.push('/tutorial')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: dayPhase.surface },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.rowLabel, { color: dayPhase.text }]}>{t('settings.howToPlay')}</Text>
          <Icon name="chevronRight" size={20} color={dayPhase.textMuted} />
        </Pressable>
      </View>

      <Text style={[styles.version, { color: dayPhase.textMuted }]}>
        {t('settings.version')} {version}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.extrabold,
    fontSize: fontSize.title,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    padding: 20,
    gap: 10,
  },
  section: {
    fontFamily: fonts.bold,
    fontSize: fontSize.small,
    marginLeft: 4,
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  langBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.body,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 18,
    borderRadius: radius.tile,
  },
  rowLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.body,
  },
  pressed: {
    opacity: 0.7,
  },
  version: {
    marginTop: 'auto',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: fontSize.caption,
  },
});
