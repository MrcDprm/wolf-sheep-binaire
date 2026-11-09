/**
 * Oyun ekranı — seviye [id]
 *
 * Oyun alanı (tahta, süre, kontroller) GameView'dadır; bu ekran başlığı verir:
 * ‹ "Kolay 12" › okları yalnızca açık seviyelere gider. Bitince tamamlama penceresi,
 * süre dolunca süre doldu penceresi açılır.
 *
 * Kilitli bir seviyeye (ör. bağlantıyla) gelinirse oynatılmaz, uyarı gösterilir.
 */
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGameEngine } from '../../../src/hooks/useGameEngine';
import { useDayPhase } from '../../../src/hooks/useDayPhase';
import { useUserStore } from '../../../src/store/useUserStore';
import { getLevelById, isLevelUnlocked } from '../../../src/constants/levels';
import { useTranslation } from '../../../src/i18n';
import { GameView } from '../../../src/components/game/GameView';
import { GameTitle } from '../../../src/components/game/GameHeader';
import { LevelCompleteModal } from '../../../src/components/modals/LevelCompleteModal';
import { TimeUpModal } from '../../../src/components/modals/TimeUpModal';
import { Button } from '../../../src/components/ui/Button';
import { IconButton } from '../../../src/components/ui/IconButton';
import { fontSize, fonts } from '../../../src/theme';

export default function LevelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const levelId = Number(id);
  const router = useRouter();
  const t = useTranslation();
  const dayPhase = useDayPhase();
  const completedLevels = useUserStore((s) => s.completedLevels);

  const unlocked = isLevelUnlocked(levelId, completedLevels);
  const level = unlocked ? getLevelById(levelId) : undefined;

  const engine = useGameEngine(level);
  const { ready, timeLimit, isTimeUp, result, restartLevel } = engine;

  // Pencere kapatılınca hangi seviye için kapatıldığı tutulur; yeni seviyede yeniden açılır
  const [dismissedLevel, setDismissedLevel] = useState<number | null>(null);
  const modalVisible = result !== null && dismissedLevel !== levelId;

  const goTo = useCallback(
    (target: number) => router.replace(`/(game)/level/${target}`),
    [router],
  );

  // --- Bulunamayan ya da kilitli seviye ---
  if (!level) {
    const exists = getLevelById(levelId) !== undefined;
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: dayPhase.sky }]}>
        <View style={styles.center}>
          <Text style={[styles.message, { color: dayPhase.text }]}>
            {exists ? t('game.locked') : t('game.levelNotFound')}
          </Text>
          <Button title={t('menu.levels')} onPress={() => router.replace('/(game)/levels')} />
        </View>
      </SafeAreaView>
    );
  }

  // Oklar sadece açık seviyelere gider (ör. Orta 1'den, kilitliyse Kolay 50'ye geçilmez)
  const previousUnlocked = isLevelUnlocked(levelId - 1, completedLevels);
  const nextUnlocked = isLevelUnlocked(levelId + 1, completedLevels);

  const levelName = t('game.level', {
    difficulty: t(`difficulty.${level.difficulty}`),
    number: level.number,
  });

  return (
    <GameView
      engine={engine}
      onClose={() => router.back()}
      title={
        <>
          <IconButton
            name="chevronLeft"
            color={dayPhase.text}
            disabled={!previousUnlocked}
            onPress={() => goTo(levelId - 1)}
            accessibilityLabel={t('game.previous')}
          />
          <GameTitle>{levelName}</GameTitle>
          <IconButton
            name="chevronRight"
            color={dayPhase.text}
            disabled={!nextUnlocked}
            onPress={() => goTo(levelId + 1)}
            accessibilityLabel={t('game.next')}
          />
        </>
      }
    >
      {/* ── Tamamlama penceresi ── */}
      {result && (
        <LevelCompleteModal
          visible={modalVisible}
          levelId={levelId}
          result={result}
          onClose={() => setDismissedLevel(levelId)}
        />
      )}

      {/* ── Süre doldu penceresi (seçim yapılmadan kapanmaz) ── */}
      {timeLimit !== null && (
        <TimeUpModal
          visible={ready && isTimeUp}
          levelName={levelName}
          timeLimit={timeLimit}
          onRetry={restartLevel}
          onLevels={() => router.dismissTo('/(game)/levels')}
          onMenu={() => router.dismissTo('/(game)')}
        />
      )}
    </GameView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 32,
  },
  message: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.body,
    textAlign: 'center',
  },
});
