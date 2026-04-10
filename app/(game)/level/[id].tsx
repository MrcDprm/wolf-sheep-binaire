/**
 * Oyun Ekranı — Seviye [id]
 *
 * Düzen:
 *   SafeAreaView (day/night arka plan rengi)
 *   ├── Header: geri butonu | "Seviye N" | timer
 *   ├── GameGrid (flex: 1, ortalanmış)
 *   ├── ErrorWarning bar (hasActiveError = true ise görünür)
 *   ├── ControlBar: Reset | Hint (isBlindMode'da gizli)
 *   └── LevelCompleteModal (isComplete = true olunca gösterilir)
 *
 * Pre-computation:
 *   - Eğer sonraki seviyenin grid'i store'da varsa anında yüklenir.
 *   - Yoksa async üretim tetiklenir → spinner gösterilir.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGameEngine } from '../../../src/hooks/useGameEngine';
import { usePrecompute } from '../../../src/hooks/usePrecompute';
import { useDayPhase } from '../../../src/hooks/useDayPhase';
import { useGameStore } from '../../../src/store/useGameStore';
import { useUserStore } from '../../../src/store/useUserStore';
import { getLevelById } from '../../../src/constants/levels';
import { precomputePuzzleAsync } from '../../../src/engine/precompute';
import { computeLevelScore } from '../../../src/utils/scoring';
import { formatTime } from '../../../src/utils/scoring';
import { useTranslation } from '../../../src/i18n';
import { GameGrid } from '../../../src/components/grid/GameGrid';
import { LevelCompleteModal } from '../../../src/components/modals/LevelCompleteModal';
import type { ScoreOutput } from '../../../src/utils/scoring';

export default function LevelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const levelId = parseInt(id ?? '1', 10);
  const level = getLevelById(levelId);

  const router = useRouter();
  const t = useTranslation();
  const dayPhase = useDayPhase();

  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreOutput | null>(null);

  const {
    grid,
    level: activeLevel,
    hintsUsed,
    elapsedSeconds,
    isBlindMode,
    isComplete,
    hasActiveError,
    availableHints,
    handleTapCell,
    handleApplyHint,
    resetUserCells,
    startGame,
  } = useGameEngine();

  const getPrecomputed = useGameStore((s) => s.getPrecomputed);
  const clearPrecomputed = useGameStore((s) => s.clearPrecomputed);
  const { addPoints, markLevelComplete } = useUserStore();

  // Sonraki seviyeyi arka planda hesapla
  usePrecompute(level ?? null);

  // İlk yükleme — store'da hazır varsa anında, yoksa async üret
  useEffect(() => {
    if (!level) return;

    const key = `level_${level.id}`;
    const existing = getPrecomputed(key);

    if (existing) {
      clearPrecomputed(key);
      startGame(level, 'campaign', existing);
      setLoading(false);
    } else {
      setLoading(true);
      precomputePuzzleAsync(level.gridSize, level.difficulty)
        .then((puzzle) => {
          startGame(level, 'campaign', puzzle);
        })
        .catch(() => {
          // Üretim başarısız — tekrar dene ya da menüye dön
          router.replace('/(game)');
        })
        .finally(() => setLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId]);

  // Tamamlanma — modal göster ve puanı kaydet
  const scoreRef = useRef(false);
  useEffect(() => {
    if (!isComplete || scoreRef.current || !activeLevel) return;
    scoreRef.current = true;

    const result = computeLevelScore({
      hintsUsed,
      elapsedSeconds,
      level: activeLevel,
      timePercentile: null, // Firebase asenkron — şimdilik 50 varsayılan
    });

    setScoreResult(result);
    setModalVisible(true);

    // Store'a kaydet
    addPoints(result.score);
    markLevelComplete(String(levelId), result);
  }, [isComplete]);

  // Seviye değişince score guard'ı sıfırla
  useEffect(() => {
    scoreRef.current = false;
    setModalVisible(false);
    setScoreResult(null);
  }, [levelId]);

  const handleReset = useCallback(() => {
    Alert.alert(
      t('game.resetConfirm'),
      '',
      [
        { text: t('game.resetNo'), style: 'cancel' },
        { text: t('game.resetYes'), style: 'destructive', onPress: resetUserCells },
      ]
    );
  }, [resetUserCells, t]);

  // --- Yükleme ekranı ---
  if (!level) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: dayPhase.bgFrom }]}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Seviye bulunamadı: {id}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: dayPhase.bgFrom }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={dayPhase.accent} />
          <Text style={[styles.loadingText, { color: dayPhase.accent }]}>
            Bulmaca hazırlanıyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const hintsLabel = isBlindMode
    ? ''
    : availableHints === Infinity
    ? '∞'
    : String(availableHints);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: dayPhase.bgFrom }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.backArrow, { color: dayPhase.accent }]}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {t('menu.levelSelect')} {levelId}
        </Text>

        {/* Timer */}
        <View style={styles.timerBadge}>
          <Text style={[styles.timerText, { color: dayPhase.accent }]}>
            {formatTime(elapsedSeconds)}
          </Text>
        </View>
      </View>

      {/* Zorluk etiketi */}
      <Text style={[styles.difficultyLabel, { color: dayPhase.accent + 'BB' }]}>
        {activeLevel?.gridSize}×{activeLevel?.gridSize}
        {isBlindMode ? `  •  ${t('game.blindMode')}` : ''}
      </Text>

      {/* ── Izgara ── */}
      <View style={styles.gridWrapper}>
        <GameGrid
          grid={grid}
          accentColor={dayPhase.accent}
          onTapCell={handleTapCell}
        />
      </View>

      {/* ── Hata uyarı bandı ── */}
      <View style={[styles.errorBar, !hasActiveError && styles.errorBarHidden]}>
        {hasActiveError && (
          <Text style={styles.errorBarText}>
            ⚠ {t('errors.tripleRule')}
          </Text>
        )}
      </View>

      {/* ── Kontrol çubuğu ── */}
      <View style={[styles.controlBar, { borderTopColor: dayPhase.accent + '30' }]}>
        {/* Reset butonu */}
        <TouchableOpacity
          style={[styles.controlBtn, styles.resetBtn]}
          onPress={handleReset}
        >
          <Text style={styles.controlBtnEmoji}>↺</Text>
          <Text style={styles.controlBtnLabel}>{t('game.reset')}</Text>
        </TouchableOpacity>

        {/* Hint butonu — blind modda gizli */}
        {!isBlindMode && (
          <TouchableOpacity
            style={[styles.controlBtn, styles.hintBtn, { backgroundColor: dayPhase.accent }]}
            onPress={handleApplyHint}
          >
            <Text style={styles.hintBtnEmoji}>💡</Text>
            <Text style={styles.hintBtnLabel}>{t('game.hint')}</Text>
            {/* Stok rozeti */}
            <View style={styles.hintBadge}>
              <Text style={styles.hintBadgeText}>{hintsLabel}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Tamamlama Modalı ── */}
      {scoreResult && (
        <LevelCompleteModal
          visible={modalVisible}
          levelId={levelId}
          result={scoreResult}
          baseScore={scoreResult.baseScore}
          timeBonus={scoreResult.timeBonus}
          accentColor={dayPhase.accent}
          onClose={() => setModalVisible(false)}
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
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '300',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
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

  // Zorluk etiketi
  difficultyLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
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
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#C62828',
  },
});
