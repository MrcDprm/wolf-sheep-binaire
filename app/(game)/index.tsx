/**
 * Ana menü
 *
 * Gün/gece döngüsüne göre arka plan ve karşılama mesajı.
 * "Oyna" bitirilmemiş ilk seviyeyi açar.
 */
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useDayPhase } from '../../src/hooks/useDayPhase';
import { useTranslation } from '../../src/i18n';
import { useUserStore } from '../../src/store/useUserStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { getLevelById, nextLevelToPlay } from '../../src/constants/levels';

export default function MainMenu() {
  const router = useRouter();
  const dayPhase = useDayPhase();
  const t = useTranslation();
  const currentTitle = useUserStore((s) => s.currentTitle);
  const totalPoints = useUserStore((s) => s.totalPoints);
  const availableHints = useUserStore((s) => s.availableHints);
  const completedLevels = useUserStore((s) => s.completedLevels);
  const language = useSettingsStore((s) => s.language);

  const greeting = language === 'tr' ? dayPhase.greetingTr : dayPhase.greetingEn;
  const nextId = nextLevelToPlay(completedLevels);
  const nextLevel = getLevelById(nextId);
  const started = Object.keys(completedLevels).length > 0;

  return (
    <View style={[styles.container, { backgroundColor: dayPhase.bgFrom }]}>
      <Text style={[styles.greeting, { color: dayPhase.accent }]}>{greeting}</Text>
      <Text style={styles.title}>{t('app.name')}</Text>

      <View style={styles.profileRow}>
        <Text style={styles.titleBadge}>{currentTitle}</Text>
        <Text style={styles.points}>{t('menu.points', { count: totalPoints })}</Text>
      </View>

      <Text style={styles.hints}>💡 {t('hints.available', { count: availableHints })}</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: dayPhase.accent }]}
        onPress={() => router.push(`/(game)/level/${nextId}`)}
      >
        <Text style={styles.buttonText}>{started ? t('menu.continueLevel') : t('menu.play')}</Text>
        {nextLevel && (
          <Text style={styles.buttonSub}>
            {t('game.level', {
              difficulty: t(`difficulty.${nextLevel.difficulty}`),
              number: nextLevel.number,
            })}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonOutline} onPress={() => router.push('/(game)/levels')}>
        <Text style={[styles.buttonOutlineText, { color: dayPhase.accent }]}>{t('menu.levels')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonOutline} onPress={() => router.push('/settings')}>
        <Text style={[styles.buttonOutlineText, { color: dayPhase.accent }]}>{t('menu.settings')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '500',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
  },
  profileRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 4,
  },
  titleBadge: {
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  points: {
    fontSize: 14,
    color: '#555',
  },
  hints: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  button: {
    width: '80%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  buttonOutline: {
    width: '80%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  buttonOutlineText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
