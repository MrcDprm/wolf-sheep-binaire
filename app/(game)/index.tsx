/**
 * Ana Menü Ekranı
 *
 * Gün/gece döngüsüne göre dinamik arka plan ve karşılama mesajı.
 * Temel navigasyon butonları.
 */
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useDayPhase } from '../../src/hooks/useDayPhase';
import { useTranslation } from '../../src/i18n';
import { useUserStore } from '../../src/store/useUserStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';

export default function MainMenu() {
  const router = useRouter();
  const dayPhase = useDayPhase();
  const t = useTranslation();
  const { currentTitle, totalPoints, availableHints, isPremium } = useUserStore();
  const language = useSettingsStore((s) => s.language);

  const greeting = language === 'tr'
    ? dayPhase.greetingTr
    : dayPhase.greetingEn;

  return (
    <View style={[styles.container, { backgroundColor: dayPhase.bgFrom }]}>
      {/* Başlık */}
      <Text style={[styles.greeting, { color: dayPhase.accent }]}>{greeting}</Text>
      <Text style={styles.title}>{t('app.name')}</Text>

      {/* Kullanıcı bilgisi */}
      <View style={styles.profileRow}>
        <Text style={styles.titleBadge}>{currentTitle}</Text>
        <Text style={styles.points}>{totalPoints} puan</Text>
      </View>

      {/* Hint göstergesi */}
      <Text style={styles.hints}>💡 {availableHints} ipucu</Text>

      {/* Navigasyon butonları */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: dayPhase.accent }]}
        onPress={() => router.push('/(game)/level/1')}
      >
        <Text style={styles.buttonText}>{t('menu.play')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonOutline}
        onPress={() => router.push('/(game)/daily')}
      >
        <Text style={[styles.buttonOutlineText, { color: dayPhase.accent }]}>
          {t('menu.dailyPuzzle')}
        </Text>
      </TouchableOpacity>

      {isPremium ? (
        <TouchableOpacity
          style={styles.buttonOutline}
          onPress={() => router.push('/(game)/impossible/1001')}
        >
          <Text style={[styles.buttonOutlineText, { color: dayPhase.accent }]}>
            {t('menu.impossibleMode')}
          </Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={styles.buttonOutline}
        onPress={() => router.push('/leaderboard')}
      >
        <Text style={[styles.buttonOutlineText, { color: dayPhase.accent }]}>
          {t('menu.leaderboard')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonOutline}
        onPress={() => router.push('/settings')}
      >
        <Text style={[styles.buttonOutlineText, { color: dayPhase.accent }]}>
          {t('menu.settings')}
        </Text>
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
