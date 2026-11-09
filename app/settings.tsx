/**
 * Ayarlar
 *
 * - Dil (Türkçe / English)
 * - Ses ve titreşim
 * - Süre sınırı (kapalıysa süre sadece ileri sayar, seviye kaybedilmez)
 * - Günlük hatırlatma ve saati (bildirim izni anahtar açılırken istenir; izin sonradan
 *   telefonun ayarlarından kapatılırsa uyarı ve ayarlara giden düğme çıkar)
 * - Nasıl oynanır? (eğitimi yeniden açar)
 * - Uygulama sürümü
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, AppState, Linking, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useTranslation } from '../src/i18n';
import { useDayPhase } from '../src/hooks/useDayPhase';
import { IconButton } from '../src/components/ui/IconButton';
import { Icon } from '../src/components/ui/Icon';
import { Toggle } from '../src/components/ui/Toggle';
import {
  askReminderPermission,
  reminderPermission,
  remindersSupported,
  type ReminderPermission,
} from '../src/services/notifications';
import { formatHour, reminderHourOf } from '../src/utils/reminders';
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
    reminderEnabled,
    reminderHour,
    setLanguage,
    toggleSound,
    toggleHaptic,
    toggleTimeLimit,
    setReminderEnabled,
    setReminderHour,
  } = useSettingsStore();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const hour = reminderHourOf(reminderHour);

  // Bildirim izni: ekran açılınca ve telefonun ayarlarından dönünce bakılır
  const [permission, setPermission] = useState<ReminderPermission | null>(null);
  useEffect(() => {
    if (!remindersSupported) return;
    const check = () => {
      void reminderPermission().then(setPermission);
    };
    check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => sub.remove();
  }, []);
  const blocked = reminderEnabled && permission !== null && permission !== 'granted';

  /** Hatırlatma açılırken izin istenir; verilmezse anahtar kapalı kalır, ayarlara yönlendirilir */
  const onReminderChange = async (next: boolean) => {
    if (!next) {
      setReminderEnabled(false);
      return;
    }
    const granted = await askReminderPermission();
    setPermission(granted ? 'granted' : 'denied');
    if (granted) {
      setReminderEnabled(true);
      return;
    }
    Alert.alert(t('settings.reminderDenied'), t('settings.reminderDeniedBody'), [
      { text: t('settings.notNow'), style: 'cancel' },
      { text: t('settings.openSettings'), onPress: () => void Linking.openSettings() },
    ]);
  };
  const changeHour = (step: number) => setReminderHour((hour + step + 24) % 24);

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

      <ScrollView contentContainerStyle={styles.scroll}>
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

          {/* Web önizlemesinde bildirim yok: hatırlatma yalnızca telefonda */}
          {remindersSupported ? (
            <>
              <Row background={dayPhase.surface}>
                <Text style={[styles.rowLabel, { color: dayPhase.text }]}>
                  {t('settings.reminder')}
                </Text>
                <Toggle
                  value={reminderEnabled}
                  onValueChange={(next) => void onReminderChange(next)}
                  accessibilityLabel={t('settings.reminder')}
                  {...toggleColors}
                />
              </Row>

              {reminderEnabled ? (
                <Row background={dayPhase.surface}>
                  <Text style={[styles.rowLabel, { color: dayPhase.text }]}>
                    {t('settings.reminderTime')}
                  </Text>
                  {/* Ekran okuyucuda tek ayarlanabilir öğe: yukarı/aşağı kaydırınca saat değişir */}
                  <View
                    style={styles.stepper}
                    accessible
                    accessibilityRole="adjustable"
                    accessibilityLabel={t('settings.reminderTime')}
                    accessibilityValue={{ text: formatHour(hour) }}
                    accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                    onAccessibilityAction={(event) =>
                      changeHour(event.nativeEvent.actionName === 'increment' ? 1 : -1)
                    }
                  >
                    <IconButton
                      name="chevronLeft"
                      color={dayPhase.text}
                      size={22}
                      onPress={() => changeHour(-1)}
                      accessibilityLabel={t('settings.earlier')}
                    />
                    <Text style={[styles.hour, { color: dayPhase.text }]}>{formatHour(hour)}</Text>
                    <IconButton
                      name="chevronRight"
                      color={dayPhase.text}
                      size={22}
                      onPress={() => changeHour(1)}
                      accessibilityLabel={t('settings.later')}
                    />
                  </View>
                </Row>
              ) : null}

              {blocked ? (
                <View style={styles.blocked}>
                  <Text style={[styles.hint, styles.hintBlocked, { color: dayPhase.text }]}>
                    {t('settings.reminderBlocked')}
                  </Text>
                  <Pressable
                    onPress={() => void Linking.openSettings()}
                    accessibilityRole="button"
                    hitSlop={8}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <Text style={[styles.link, { color: dayPhase.text }]}>
                      {t('settings.openSettings')}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={[styles.hint, { color: dayPhase.textMuted }]}>
                  {t('settings.reminderHint')}
                </Text>
              )}
            </>
          ) : null}

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
      </ScrollView>
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
  scroll: {
    flexGrow: 1,
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: -10,
  },
  hour: {
    minWidth: 58,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: fontSize.body,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    marginTop: -2,
    marginHorizontal: 6,
    marginBottom: 4,
    fontFamily: fonts.semibold,
    fontSize: fontSize.caption,
  },
  blocked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  hintBlocked: {
    flex: 1,
  },
  link: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.caption,
    textDecorationLine: 'underline',
    marginRight: 6,
  },
  version: {
    marginTop: 'auto',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: fontSize.caption,
  },
});
