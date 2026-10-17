/**
 * Oyun ekranı — seviye [id]
 *
 * Düzen:
 *   Üst çubuk: kapat | ‹ "Kolay 12" › | süre
 *   Keçe tahta (6x6)
 *   Hata satırı: ne yanlışsa onu söyler
 *   Kontroller: Sıfırla | İpucu (kalan sayı)
 *   Tamamlama penceresi
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
import { useTranslation } from '../../../src/i18n';
import { GameGrid } from '../../../src/components/grid/GameGrid';
import { LevelCompleteModal } from '../../../src/components/modals/LevelCompleteModal';
import { Button } from '../../../src/components/ui/Button';
import { Icon } from '../../../src/components/ui/Icon';
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
    hasActiveError,
    triples,
    availableHints,
    result,
    handleTapCell,
    handleApplyHint,
    resetUserCells,
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

  const hasPrevious = levelId > 1;
  const nextUnlocked = isLevelUnlocked(levelId + 1, completedLevels);

  // Hata satırı: önce üçlü (hangi hayvan), yoksa satır/sütun dengesi
  const errorMessage = !hasActiveError
    ? ''
    : triples.sheep
      ? t('errors.tripleSheep')
      : triples.wolf
        ? t('errors.tripleWolf')
        : t('errors.balance');

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
            disabled={!hasPrevious}
            onPress={() => goTo(levelId - 1)}
            accessibilityLabel={t('game.previous')}
          />
          <Text style={[styles.title, { color: dayPhase.text }]} numberOfLines={1}>
            {t('game.level', {
              difficulty: t(`difficulty.${level.difficulty}`),
              number: level.number,
            })}
          </Text>
          <IconButton
            name="chevronRight"
            color={dayPhase.text}
            disabled={!nextUnlocked}
            onPress={() => goTo(levelId + 1)}
            accessibilityLabel={t('game.next')}
          />
        </View>

        <Text style={[styles.timer, { color: dayPhase.textMuted }]}>
          {formatTime(elapsedSeconds)}
        </Text>
      </View>

      {/* ── Tahta ── */}
      <View style={styles.boardArea}>
        {ready && <GameGrid grid={grid} onTapCell={handleTapCell} />}
      </View>

      {/* ── Hata satırı (yer hep ayrılı; tahta zıplamasın) ── */}
      <Text
        style={[styles.error, { color: errorColor }]}
        accessibilityLiveRegion="polite"
        numberOfLines={2}
      >
        {errorMessage}
      </Text>

      {/* ── Kontroller ── */}
      <View style={styles.controls}>
        <Button
          title={t('game.reset')}
          variant="secondary"
          onPress={handleReset}
          leading={<Icon name="reset" size={20} color={dayPhase.text} />}
          style={styles.control}
        />
        <Button
          title={t('game.hint')}
          onPress={onHint}
          leading={<Icon name="hint" size={22} color={palette.ink} />}
          trailing={
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{availableHints}</Text>
            </View>
          }
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
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  control: {
    flex: 1,
  },
  badge: {
    minWidth: 30,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(46,42,36,0.16)',
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.small,
    color: palette.ink,
  },
});
