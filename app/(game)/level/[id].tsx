/**
 * Oyun ekranı — seviye [id]
 *
 * Düzen:
 *   Üst çubuk: kapat | ‹ "Kolay 12" › | kalan süre (süre sınırı kapalıysa geçen süre)
 *   Keçe tahta (6x6)
 *   Hata satırı: ne yanlışsa onu söyler
 *   Kontroller: Sıfırla | Geri al | İpucu (kalan sayı)
 *   Tamamlama ve süre doldu pencereleri
 *
 * Kilitli bir seviyeye (ör. bağlantıyla) gelinirse oynatılmaz, uyarı gösterilir.
 */
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGameEngine } from '../../../src/hooks/useGameEngine';
import { useDayPhase } from '../../../src/hooks/useDayPhase';
import { useUserStore } from '../../../src/store/useUserStore';
import { getLevelById, isLevelUnlocked } from '../../../src/constants/levels';
import { formatTime } from '../../../src/utils/scoring';
import { describeHint } from '../../../src/utils/hintText';
import { useTranslation } from '../../../src/i18n';
import { GameGrid } from '../../../src/components/grid/GameGrid';
import { LevelCompleteModal } from '../../../src/components/modals/LevelCompleteModal';
import { TimeUpModal } from '../../../src/components/modals/TimeUpModal';
import { Button } from '../../../src/components/ui/Button';
import { ToolButton } from '../../../src/components/ui/ToolButton';
import { IconButton } from '../../../src/components/ui/IconButton';
import { fontSize, fonts, palette } from '../../../src/theme';

export default function LevelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const levelId = Number(id);
  const router = useRouter();
  const t = useTranslation();
  const dayPhase = useDayPhase();
  const completedLevels = useUserStore((s) => s.completedLevels);

  const unlocked = isLevelUnlocked(levelId, completedLevels);
  const level = unlocked ? getLevelById(levelId) : undefined;

  const {
    ready,
    grid,
    elapsedSeconds,
    timeLimit,
    secondsLeft,
    timeRunningOut,
    isTimeUp,
    isComplete,
    hasActiveError,
    triples,
    availableHints,
    result,
    handleTapCell,
    handleApplyHint,
    canUndo,
    lastHint,
    handleUndo,
    resetUserCells,
    restartLevel,
  } = useGameEngine(level);

  // Pencere kapatılınca hangi seviye için kapatıldığı tutulur; yeni seviyede yeniden açılır
  const [dismissedLevel, setDismissedLevel] = useState<number | null>(null);
  const modalVisible = result !== null && dismissedLevel !== levelId;

  const goTo = useCallback(
    (target: number) => router.replace(`/(game)/level/${target}`),
    [router],
  );

  const handleReset = useCallback(() => {
    Alert.alert(t('game.resetConfirm'), '', [
      { text: t('game.resetNo'), style: 'cancel' },
      { text: t('game.resetYes'), style: 'destructive', onPress: resetUserCells },
    ]);
  }, [resetUserCells, t]);

  const onHint = useCallback(() => {
    if (!handleApplyHint()) Alert.alert(t('game.outOfHints'));
  }, [handleApplyHint, t]);

  const errorColor = dayPhase.dark ? palette.errorOnDark : palette.error;

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

  // Hata satırı: önce üçlü (hangi hayvan), yoksa satır/sütun dengesi
  const errorMessage = !hasActiveError
    ? ''
    : triples.sheep
      ? t('errors.tripleSheep')
      : triples.wolf
        ? t('errors.tripleWolf')
        : t('errors.balance');
  // Aynı satırda son ipucunun gerekçesi öne geçer (bir sonraki hamlede kalkar)
  const hintMessage = lastHint ? describeHint(lastHint, t) : '';

  const levelName = t('game.level', {
    difficulty: t(`difficulty.${level.difficulty}`),
    number: level.number,
  });

  // Süre sınırı açıkken geri sayar, kapalıyken ileri; sona yaklaşınca ve dolunca kırmızı
  const clock = formatTime(secondsLeft ?? elapsedSeconds);
  const clockLabel =
    secondsLeft === null ? t('game.elapsed', { time: clock }) : t('game.timeLeft', { time: clock });
  const boardOver = isComplete || isTimeUp;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: dayPhase.sky }]}>
      {/* ── Üst çubuk ── */}
      <View style={styles.header}>
        <IconButton
          name="close"
          color={dayPhase.text}
          onPress={() => router.back()}
          accessibilityLabel={t('game.close')}
        />

        <View style={styles.titleRow}>
          <IconButton
            name="chevronLeft"
            color={dayPhase.text}
            disabled={!previousUnlocked}
            onPress={() => goTo(levelId - 1)}
            accessibilityLabel={t('game.previous')}
          />
          <Text style={[styles.title, { color: dayPhase.text }]} numberOfLines={1}>
            {levelName}
          </Text>
          <IconButton
            name="chevronRight"
            color={dayPhase.text}
            disabled={!nextUnlocked}
            onPress={() => goTo(levelId + 1)}
            accessibilityLabel={t('game.next')}
          />
        </View>

        <Text
          style={[
            styles.timer,
            { color: timeRunningOut || isTimeUp ? errorColor : dayPhase.textMuted },
          ]}
          accessibilityLabel={clockLabel}
        >
          {clock}
        </Text>
      </View>

      {/* ── Tahta ── */}
      <View style={styles.boardArea}>
        {ready && <GameGrid grid={grid} onTapCell={handleTapCell} hint={lastHint} />}
      </View>

      {/* ── Hata ya da ipucu satırı (yer hep ayrılı; tahta zıplamasın) ── */}
      <Text
        style={[styles.error, { color: hintMessage ? dayPhase.text : errorColor }]}
        accessibilityLiveRegion="polite"
        numberOfLines={2}
      >
        {hintMessage || errorMessage}
      </Text>

      {/* ── Kontroller (bitmiş ya da süresi dolmuş tahtada hepsi pasif) ── */}
      <View style={styles.controls}>
        <ToolButton
          icon="reset"
          label={t('game.reset')}
          onPress={handleReset}
          disabled={boardOver}
          style={styles.control}
        />
        <ToolButton
          icon="undo"
          label={t('game.undo')}
          onPress={handleUndo}
          disabled={boardOver || !canUndo}
          style={styles.control}
        />
        <ToolButton
          icon="hint"
          label={t('game.hint')}
          onPress={onHint}
          disabled={boardOver}
          primary
          badge={availableHints}
          accessibilityLabel={`${t('game.hint')}, ${t('hints.available', { count: availableHints })}`}
          style={styles.control}
        />
      </View>

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
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flexShrink: 1,
    textAlign: 'center',
    fontFamily: fonts.extrabold,
    fontSize: fontSize.heading,
  },
  timer: {
    width: 58,
    textAlign: 'right',
    paddingRight: 8,
    fontFamily: fonts.bold,
    fontSize: fontSize.body,
    fontVariant: ['tabular-nums'],
  },
  boardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    minHeight: 46,
    paddingHorizontal: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: fonts.semibold,
    fontSize: fontSize.small,
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  control: {
    flex: 1,
  },
});
