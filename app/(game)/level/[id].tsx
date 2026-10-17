/**
 * Oyun ekranı — seviye [id]
 *
 * Düzen:
 *   Üst çubuk: kapat | ‹ önceki · "Kolay · 12" · sonraki › | süre
 *   Izgara (6x6)
 *   Hata bandı (kural ihlali varsa)
 *   Kontrol çubuğu: Sıfırla | İpucu
 *   Tamamlama penceresi
 *
 * Kilitli bir seviyeye (ör. bağlantıyla) gelinirse oynatılmaz, uyarı gösterilir.
 */
import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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

  // --- Bulunamayan ya da kilitli seviye ---
  if (!level) {
    const exists = getLevelById(levelId) !== undefined;
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: dayPhase.bgFrom }]}>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {exists ? t('game.locked') : t('game.levelNotFound')}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(game)/levels')}>
            <Text style={[styles.linkText, { color: dayPhase.accent }]}>{t('menu.levels')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasPrevious = levelId > 1;
  const nextUnlocked = isLevelUnlocked(levelId + 1, completedLevels);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: dayPhase.bgFrom }]}>
      {/* ── Üst çubuk ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('game.back')}
        >
          <Text style={[styles.backArrow, { color: dayPhase.accent }]}>✕</Text>
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <TouchableOpacity
            disabled={!hasPrevious}
            onPress={() => goTo(levelId - 1)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('game.previous')}
          >
            <Text
              style={[styles.navArrow, { color: dayPhase.accent }, !hasPrevious && styles.navDisabled]}
            >
              ‹
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: dayPhase.text }]} numberOfLines={1}>
            {t('game.level', {
              difficulty: t(`difficulty.${level.difficulty}`),
              number: level.number,
            })}
          </Text>
          <TouchableOpacity
            disabled={!nextUnlocked}
            onPress={() => goTo(levelId + 1)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('game.next')}
          >
            <Text
              style={[styles.navArrow, { color: dayPhase.accent }, !nextUnlocked && styles.navDisabled]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timerBadge}>
          <Text style={[styles.timerText, { color: dayPhase.accent }]}>
            {formatTime(elapsedSeconds)}
          </Text>
        </View>
      </View>

      {/* ── Izgara ── */}
      <View style={styles.gridWrapper}>
        {ready && <GameGrid grid={grid} accentColor={dayPhase.accent} onTapCell={handleTapCell} />}
      </View>

      {/* ── Hata bandı ── */}
      <View style={[styles.errorBar, !hasActiveError && styles.errorBarHidden]}>
        {hasActiveError && <Text style={styles.errorBarText}>⚠ {t('errors.anyRule')}</Text>}
      </View>

      {/* ── Kontrol çubuğu ── */}
      <View style={[styles.controlBar, { borderTopColor: dayPhase.accent + '30' }]}>
        <TouchableOpacity
          style={[styles.controlBtn, { backgroundColor: dayPhase.surface }]}
          onPress={handleReset}
        >
          <Text style={[styles.controlBtnEmoji, { color: dayPhase.text }]}>↺</Text>
          <Text style={[styles.controlBtnLabel, { color: dayPhase.text }]}>{t('game.reset')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, styles.hintBtn, { backgroundColor: dayPhase.accent }]}
          onPress={onHint}
        >
          <Text style={styles.hintBtnEmoji}>💡</Text>
          <Text style={[styles.hintBtnLabel, { color: dayPhase.onAccent }]}>{t('game.hint')}</Text>
          <View style={styles.hintBadge}>
            <Text style={styles.hintBadgeText}>{availableHints}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Tamamlama penceresi ── */}
      {result && (
        <LevelCompleteModal
          visible={modalVisible}
          levelId={levelId}
          result={result}
          accentColor={dayPhase.accent}
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 22,
    fontWeight: '600',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  headerTitle: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  navArrow: {
    fontSize: 30,
    lineHeight: 32,
    paddingHorizontal: 4,
  },
  navDisabled: {
    opacity: 0.2,
  },
  timerBadge: {
    width: 68,
    alignItems: 'flex-end',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // Grid
  gridWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  // Error bar
  errorBar: {
    minHeight: 30,
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  errorBarHidden: {
    backgroundColor: 'transparent',
  },
  errorBarText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '600',
  },

  // Control bar
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 6,
  },
  resetBtn: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  hintBtn: {
    paddingRight: 28, // rozetine yer
  },
  controlBtnEmoji: {
    fontSize: 18,
  },
  controlBtnLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  hintBtnEmoji: {
    fontSize: 18,
  },
  hintBtnLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  hintBadge: {
    position: 'absolute',
    right: -2,
    top: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  hintBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#333',
  },

  // Misc
  errorText: {
    fontSize: 16,
    color: '#C62828',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
