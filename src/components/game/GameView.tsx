/**
 * Oyun alanı
 *
 * Düzen:
 *   Üst çubuk: kapat | başlık | kalan süre (süre sınırı yoksa geçen süre; dokununca duraklar)
 *   Keçe tahta (6x6), duraklatınca örtülür
 *   Hata ya da ipucu satırı: ne yanlışsa ya da ipucunun gerekçesi
 *   Kontroller: Sıfırla | Geri al | İpucu (kalan sayı)
 *
 * Seviye ekranı ve günün bulmacası ekranı aynı oyun alanını kullanır; ekrana göre
 * değişen yalnızca başlık ve bitince açılan pencerelerdir (`children`).
 */
import { useCallback, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { useGameEngine } from '../../hooks/useGameEngine';
import { useDayPhase } from '../../hooks/useDayPhase';
import { useTranslation } from '../../i18n';
import { describeHint } from '../../utils/hintText';
import { formatTime } from '../../utils/scoring';
import { GameGrid } from '../grid/GameGrid';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ToolButton } from '../ui/ToolButton';
import { GameHeader } from './GameHeader';
import { fontSize, fonts, palette } from '../../theme';

/** Oyun motorunun durumu ve eylemleri */
type GameEngine = ReturnType<typeof useGameEngine>;

interface GameViewProps {
  engine: GameEngine;
  /** Üst çubuğun ortası */
  title: ReactNode;
  onClose: () => void;
  /** Tamamlama ve süre doldu pencereleri */
  children?: ReactNode;
}

export function GameView({ engine, title, onClose, children }: GameViewProps) {
  const t = useTranslation();
  const dayPhase = useDayPhase();
  const {
    ready,
    grid,
    elapsedSeconds,
    secondsLeft,
    timeRunningOut,
    isTimeUp,
    isComplete,
    hasActiveError,
    triples,
    availableHints,
    canUndo,
    lastHint,
    isPaused,
    pause,
    resume,
    handleTapCell,
    handleUndo,
    handleApplyHint,
    resetUserCells,
  } = engine;

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

  // Süre sınırı açıkken geri sayar, kapalıyken ileri; sona yaklaşınca ve dolunca kırmızı
  const clock = formatTime(secondsLeft ?? elapsedSeconds);
  const clockLabel =
    secondsLeft === null ? t('game.elapsed', { time: clock }) : t('game.timeLeft', { time: clock });
  const boardOver = isComplete || isTimeUp;
  // Duraklatılmışken de tahtaya ve kontrollere dokunulmaz
  const boardLocked = boardOver || isPaused;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: dayPhase.sky }]}>
      <GameHeader
        onClose={onClose}
        right={
          // Süreye dokununca oyun duraklar
          <Pressable
            onPress={pause}
            disabled={boardLocked}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${t('game.pause')}, ${clockLabel}`}
            accessibilityState={{ disabled: boardLocked }}
            style={({ pressed }) => [styles.clock, pressed && styles.clockPressed]}
          >
            {!boardLocked && <Icon name="pause" size={15} color={dayPhase.textMuted} />}
            <Text
              style={[
                styles.timer,
                { color: timeRunningOut || isTimeUp ? errorColor : dayPhase.textMuted },
              ]}
            >
              {clock}
            </Text>
          </Pressable>
        }
      >
        {title}
      </GameHeader>

      {/* ── Tahta ── */}
      <View style={styles.boardArea}>
        {ready && (
          <GameGrid
            grid={grid}
            onTapCell={handleTapCell}
            hint={lastHint}
            overlay={
              isPaused ? (
                <>
                  <Text style={styles.pausedTitle} accessibilityRole="header">
                    {t('game.paused')}
                  </Text>
                  <Text style={styles.pausedBody}>{t('game.pausedBody')}</Text>
                  <Button
                    title={t('game.resume')}
                    onPress={resume}
                    leading={<Icon name="play" size={18} color={palette.ink} />}
                    style={styles.resume}
                  />
                </>
              ) : undefined
            }
          />
        )}
      </View>

      {/* ── Hata ya da ipucu satırı (yer hep ayrılı; tahta zıplamasın) ── */}
      <Text
        style={[styles.error, { color: hintMessage ? dayPhase.text : errorColor }]}
        accessibilityLiveRegion="polite"
        numberOfLines={2}
      >
        {hintMessage || errorMessage}
      </Text>

      {/* ── Kontroller (bitmiş, süresi dolmuş ya da duraklatılmış tahtada hepsi pasif) ── */}
      <View style={styles.controls}>
        <ToolButton
          icon="reset"
          label={t('game.reset')}
          onPress={handleReset}
          disabled={boardLocked}
          style={styles.control}
        />
        <ToolButton
          icon="undo"
          label={t('game.undo')}
          onPress={handleUndo}
          disabled={boardLocked || !canUndo}
          style={styles.control}
        />
        <ToolButton
          icon="hint"
          label={t('game.hint')}
          onPress={onHint}
          disabled={boardLocked}
          primary
          badge={availableHints}
          accessibilityLabel={`${t('game.hint')}, ${t('hints.available', { count: availableHints })}`}
          style={styles.control}
        />
      </View>

      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  clock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    minWidth: 72,
    paddingRight: 8,
  },
  clockPressed: {
    opacity: 0.6,
  },
  timer: {
    textAlign: 'right',
    fontFamily: fonts.bold,
    fontSize: fontSize.body,
    fontVariant: ['tabular-nums'],
  },
  pausedTitle: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.title,
    color: palette.wool,
    textAlign: 'center',
  },
  pausedBody: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.small,
    color: palette.wool,
    opacity: 0.85,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  resume: {
    alignSelf: 'stretch',
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
