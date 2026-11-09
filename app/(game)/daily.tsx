/**
 * Günün bulmacası ekranı
 *
 * Bugünün bulmacası telefonda tarihten üretilir (engine/daily.ts) ve seviye ekranıyla
 * aynı oyun alanında (GameView) oynanır; süre sınırı yoktur, süre ileri sayar.
 * Bitince sonuç günlük kayda yazılır ve seri penceresi açılır.
 *
 * Günün bulmacası günde bir kez çözülür: bugün daha önce çözüldüyse çözülmüş tahta,
 * süre, yıldızlar ve seri gösterilir. Ekran açıldığı günde kalır; gece yarısını geçse de
 * oynanan bulmaca değişmez, sonuç bulmacanın gününe yazılır.
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGameEngine } from '../../src/hooks/useGameEngine';
import { useDayPhase } from '../../src/hooks/useDayPhase';
import { useDailyHydrated } from '../../src/hooks/useDailyHydrated';
import { useSavedGamesHydrated } from '../../src/hooks/useSavedGamesHydrated';
import { useDailyStore } from '../../src/store/useDailyStore';
import { useGameStore } from '../../src/store/useGameStore';
import { useSavedGamesStore } from '../../src/store/useSavedGamesStore';
import { createDailyLevel, dayKey } from '../../src/engine/daily';
import { currentStreak } from '../../src/engine/dailyResults';
import { buildGridFromRaw } from '../../src/engine/validator';
import { formatDayKey } from '../../src/utils/dailyText';
import { formatTime } from '../../src/utils/scoring';
import { useTranslation } from '../../src/i18n';
import { GameView } from '../../src/components/game/GameView';
import { GameHeader, GameTitle } from '../../src/components/game/GameHeader';
import { GameGrid } from '../../src/components/grid/GameGrid';
import { DailyCompleteModal } from '../../src/components/modals/DailyCompleteModal';
import { Button } from '../../src/components/ui/Button';
import { Icon } from '../../src/components/ui/Icon';
import { fontSize, fonts, palette } from '../../src/theme';
import type { GameLevel, Grid } from '../../src/types/game';

/** Çözülmüş tahta: başta verilen taşlar sabit, diğer hücreler çözümdeki değerle */
function solvedGrid(level: GameLevel): Grid {
  return buildGridFromRaw(level.puzzle).map((row) =>
    row.map((cell) => (cell.isLocked ? cell : { ...cell, value: level.solution[cell.row][cell.col] })),
  );
}

const noop = () => {};

export default function DailyScreen() {
  const router = useRouter();
  const t = useTranslation();
  const dayPhase = useDayPhase();

  // Ekran açıldığı günün bulmacasında kalır
  const [date] = useState(() => dayKey(new Date()));
  // Bugünün anahtarı her zaman geçerli olduğu için bulmaca hep üretilir
  const level = useMemo(() => createDailyLevel(date)!, [date]);

  const hydrated = useDailyHydrated();
  const savesReady = useSavedGamesHydrated();
  const results = useDailyStore((s) => s.results);
  const solved = results[date];
  // Bu ekranda oynanıp bitirildiyse oyun alanı ve pencere kalır; bugün önceden
  // çözüldüyse oyun başlamaz, sonuç gösterilir (sonuçlar yüklenmeden karar verilmez)
  const playingHere = useGameStore((s) => s.level?.id === level.id);
  const play = hydrated && (solved === undefined || playingHere);
  const engine = useGameEngine(play ? level : undefined);
  const [dismissed, setDismissed] = useState(false);

  // Geçmiş günlerin yarım kalan bulmacaları silinir (o günler bir daha açılmaz)
  useEffect(() => {
    if (savesReady) useSavedGamesStore.getState().clearOldDailyGames(level.id);
  }, [savesReady, level.id]);

  const close = () => router.back();
  const title = (
    <GameTitle
      subtitle={t('daily.subtitle', {
        date: formatDayKey(date, t),
        difficulty: t(`difficulty.${level.difficulty}`),
      })}
    >
      {t('daily.title')}
    </GameTitle>
  );

  if (play) {
    return (
      <GameView engine={engine} title={title} onClose={close}>
        {engine.result && (
          <DailyCompleteModal
            visible={!dismissed}
            level={level}
            result={engine.result}
            onClose={() => setDismissed(true)}
          />
        )}
      </GameView>
    );
  }

  // --- Bugün önceden çözülmüş: çözülmüş tahta ve sonuç ---
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: dayPhase.sky }]}>
      <GameHeader
        onClose={close}
        right={
          solved ? (
            <Text
              style={[styles.time, { color: dayPhase.textMuted }]}
              accessibilityLabel={t('game.elapsed', { time: formatTime(solved.time) })}
            >
              {formatTime(solved.time)}
            </Text>
          ) : null
        }
      >
        {title}
      </GameHeader>
      {solved ? (
        <SolvedSummary
          level={level}
          stars={solved.stars}
          time={solved.time}
          streak={currentStreak(results, date)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function SolvedSummary({
  level,
  stars,
  time,
  streak,
}: {
  level: GameLevel;
  stars: 0 | 1 | 2 | 3;
  time: number;
  streak: number;
}) {
  const router = useRouter();
  const t = useTranslation();
  const dayPhase = useDayPhase();
  const grid = useMemo(() => solvedGrid(level), [level]);

  const share = () =>
    router.push(
      `/share-result?daily=${level.dailyDate}&stars=${stars}&time=${time}&streak=${streak}`,
    );

  return (
    <>
      {/* Bitmiş tahta: yalnızca bakılır */}
      <View style={[styles.boardArea, styles.readOnly]}>
        <GameGrid grid={grid} onTapCell={noop} />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <View
            style={styles.stars}
            accessible
            accessibilityLabel={t('levels.stars', { count: stars })}
          >
            {[1, 2, 3].map((i) => (
              <Icon
                key={i}
                name="star"
                size={22}
                color={i <= stars ? palette.straw : dayPhase.surfaceEdge}
              />
            ))}
          </View>
          <View style={styles.streak}>
            <Icon name="flame" size={20} color={palette.straw} />
            <Text style={[styles.summaryText, { color: dayPhase.text }]}>
              {t('daily.streakLabel', { count: streak })}
            </Text>
          </View>
        </View>
        <Text style={[styles.comeBack, { color: dayPhase.textMuted }]}>{t('daily.comeBack')}</Text>
        <Button title={t('game.shareResult')} variant="secondary" onPress={share} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  time: {
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
  readOnly: {
    pointerEvents: 'none',
  },
  summary: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.body,
  },
  comeBack: {
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: fontSize.small,
    marginBottom: 6,
  },
});
