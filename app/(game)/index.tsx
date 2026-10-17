/**
 * Ana menü
 *
 * Gökyüzü gün dilimine göre değişir; altta mera tepeleri.
 * Başlığın iki yanında koyun ve kurt taşı durur.
 * "Devam et" bitirilmemiş ilk seviyeyi açar.
 */
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useDayPhase } from '../../src/hooks/useDayPhase';
import { useTranslation } from '../../src/i18n';
import { useUserStore } from '../../src/store/useUserStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useSettingsHydrated } from '../../src/hooks/useSettingsHydrated';
import { getLevelById, nextLevelToPlay } from '../../src/constants/levels';
import { getTitleForPoints, titleName } from '../../src/constants/titles';
import { Piece } from '../../src/components/pieces/Piece';
import { Button } from '../../src/components/ui/Button';
import { fontSize, fonts } from '../../src/theme';

export default function MainMenu() {
  const router = useRouter();
  const dayPhase = useDayPhase();
  const t = useTranslation();
  const totalPoints = useUserStore((s) => s.totalPoints);
  const availableHints = useUserStore((s) => s.availableHints);
  const completedLevels = useUserStore((s) => s.completedLevels);
  const language = useSettingsStore((s) => s.language);
  const tutorialCompleted = useSettingsStore((s) => s.tutorialCompleted);
  const settingsReady = useSettingsHydrated();

  const title = getTitleForPoints(totalPoints);
  const nextId = nextLevelToPlay(completedLevels);
  const nextLevel = getLevelById(nextId);
  const started = Object.keys(completedLevels).length > 0;
  // "Koyun & Kurt" iki satıra bölünür, iki yanında taşlar
  const [nameTop, nameBottom] = t('app.name').split(' & ');

  // İlk açılışta önce eğitim
  if (settingsReady && !tutorialCompleted) return <Redirect href="/tutorial" />;

  return (
    <View style={[styles.screen, { backgroundColor: dayPhase.sky }]}>
      <Hills far={dayPhase.hillFar} near={dayPhase.hillNear} />

      <SafeAreaView style={styles.content}>
        <Text style={[styles.greeting, { color: dayPhase.textMuted }]}>
          {t(`greetings.${dayPhase.phase}`)}
        </Text>

        <View
          style={styles.lockup}
          accessible
          accessibilityRole="header"
          accessibilityLabel={t('app.name')}
        >
          <View
            style={[
              styles.patch,
              { backgroundColor: dayPhase.felt, borderBottomColor: dayPhase.feltEdge },
            ]}
          >
            <Piece kind="sheep" size={46} />
          </View>
          <Text style={[styles.name, { color: dayPhase.text }]}>
            {nameTop}
            {'\n'}
            {nameBottom}
          </Text>
          <View
            style={[
              styles.patch,
              { backgroundColor: dayPhase.felt, borderBottomColor: dayPhase.feltEdge },
            ]}
          >
            <Piece kind="wolf" size={46} />
          </View>
        </View>

        <Text style={[styles.stats, { color: dayPhase.textMuted }]}>
          {titleName(title, language)}, {t('menu.points', { count: totalPoints })},{' '}
          {t('hints.available', { count: availableHints })}
        </Text>

        <View style={styles.buttons}>
          <Button
            title={started ? t('menu.continueLevel') : t('menu.play')}
            subtitle={
              nextLevel
                ? t('game.level', {
                    difficulty: t(`difficulty.${nextLevel.difficulty}`),
                    number: nextLevel.number,
                  })
                : undefined
            }
            onPress={() => router.push(`/(game)/level/${nextId}`)}
          />
          <Button
            title={t('menu.levels')}
            variant="secondary"
            onPress={() => router.push('/(game)/levels')}
          />
          <Button
            title={t('menu.settings')}
            variant="secondary"
            onPress={() => router.push('/settings')}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

/** Ekranın altındaki iki katlı mera tepesi */
function Hills({ far, near }: { far: string; near: string }) {
  return (
    <Svg style={styles.hills} viewBox="0 0 360 150" preserveAspectRatio="none" pointerEvents="none">
      <Path d="M0 90 Q90 40 190 80 T360 60 V150 H0 Z" fill={far} />
      <Path d="M0 120 Q120 80 230 112 T360 104 V150 H0 Z" fill={near} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  hills: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: 170,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 90,
  },
  greeting: {
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: fontSize.body,
  },
  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 8,
  },
  // Taşların durduğu küçük keçe yama
  patch: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.display,
    lineHeight: fontSize.display * 1.02,
    letterSpacing: -0.5,
  },
  stats: {
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: fontSize.small,
    marginBottom: 32,
  },
  buttons: {
    gap: 10,
  },
});
