/**
 * İstatistikler
 *
 * - Günün bulmacası: keçe kartta seri (alev), en uzun seri, çözülen gün ve son 5 haftanın
 *   takvimi; çözülen her güne bir koyun oturur. Bugün çözülmediyse bulmacaya giden düğme.
 * - Unvan: puan ve sonraki unvana ilerleme.
 * - Seviyeler: tamamlanan, yıldız, kusursuz; her zorlukta ilerleme, en iyi ve ortalama süre.
 *
 * Sayılar saklanan sonuçlardan hesaplanır (utils/stats.ts); ekran yeni bir şey kaydetmez.
 */
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDayPhase } from '../../src/hooks/useDayPhase';
import { useDailyHydrated } from '../../src/hooks/useDailyHydrated';
import { useToday } from '../../src/hooks/useToday';
import { useTranslation } from '../../src/i18n';
import { useDailyStore } from '../../src/store/useDailyStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useUserStore } from '../../src/store/useUserStore';
import { titleName } from '../../src/constants/titles';
import { formatDays } from '../../src/utils/dailyText';
import { formatTime } from '../../src/utils/scoring';
import {
  dailyStats,
  levelStats,
  streakCalendar,
  titleProgress,
  type DifficultyStats,
} from '../../src/utils/stats';
import type { DailyResults } from '../../src/engine/dailyResults';
import { StreakCalendar } from '../../src/components/stats/StreakCalendar';
import { Button } from '../../src/components/ui/Button';
import { Icon } from '../../src/components/ui/Icon';
import { IconButton } from '../../src/components/ui/IconButton';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { cardColors, fontSize, fonts, palette, radius } from '../../src/theme';

/** Ekran kenarı ve keçe kartın iç boşluğu (px); takvim yuvaları buna göre ölçülür */
const SCREEN_PADDING = 20;
const FELT_PADDING = 18;

const NO_RESULTS: DailyResults = {};
/** Bugün henüz çözülmediyse alev sönük: yarı saydam yün kremi (içindeki açık alev seçilsin) */
const UNLIT_FLAME = 'rgba(255,248,236,0.45)';

export default function StatsScreen() {
  const router = useRouter();
  const t = useTranslation();
  const dayPhase = useDayPhase();
  const card = cardColors(dayPhase.dark);
  const language = useSettingsStore((s) => s.language);
  const completedLevels = useUserStore((s) => s.completedLevels);
  const totalPoints = useUserStore((s) => s.totalPoints);
  const today = useToday();
  const savedResults = useDailyStore((s) => s.results);
  // Sonuçlar yüklenmeden seri 0 görünmesin diye boş sayılır, yüklenince dolar
  const results = useDailyHydrated() ? savedResults : NO_RESULTS;

  const levels = useMemo(() => levelStats(completedLevels), [completedLevels]);
  const daily = dailyStats(results, today);
  const weeks = streakCalendar(results, today);
  const rank = titleProgress(totalPoints);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: dayPhase.sky }]}>
      <View style={styles.header}>
        <IconButton
          name="back"
          color={dayPhase.text}
          onPress={() => router.back()}
          accessibilityLabel={t('game.back')}
        />
        <Text style={[styles.title, { color: dayPhase.text }]} accessibilityRole="header">
          {t('stats.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Günün bulmacası: keçe kart ── */}
        <View
          style={[
            styles.felt,
            { backgroundColor: dayPhase.felt, borderBottomColor: dayPhase.feltEdge },
          ]}
        >
          <View style={styles.stitch} />
          <Text style={styles.feltLabel} accessibilityRole="header">
            {t('daily.title')}
          </Text>

          <View style={styles.streakRow}>
            <View
              style={styles.streakMain}
              accessible
              accessibilityLabel={t('daily.streakLabel', { count: daily.current })}
            >
              <Icon name="flame" size={36} color={daily.solvedToday ? palette.straw : UNLIT_FLAME} />
              <Text style={styles.streakNumber}>{daily.current}</Text>
              <Text style={styles.streakUnit}>{t('stats.streakUnit')}</Text>
            </View>
            <View style={styles.streakSide}>
              <FeltFact label={t('stats.longest')} value={formatDays(daily.longest, t)} />
              <FeltFact label={t('stats.solvedDays')} value={String(daily.solved)} />
            </View>
          </View>

          <StreakCalendar weeks={weeks} horizontalInset={(SCREEN_PADDING + FELT_PADDING) * 2} />

          {daily.solved === 0 ? <Text style={styles.feltHint}>{t('stats.calendarHint')}</Text> : null}
          {!daily.solvedToday ? (
            <Button
              title={t('stats.solveToday')}
              onPress={() => router.push('/(game)/daily')}
              style={styles.feltButton}
            />
          ) : null}
        </View>

        {/* ── Unvan ── */}
        <View style={[styles.card, { backgroundColor: card.background }]}>
          <Text style={[styles.cardLabel, { color: card.muted }]}>{t('stats.rank')}</Text>
          <View style={styles.rankRow}>
            <Text style={[styles.rankName, { color: card.text }]} numberOfLines={2}>
              {titleName(rank.current, language)}
            </Text>
            <Text style={[styles.rankPoints, { color: card.text }]}>
              {t('menu.points', { count: totalPoints })}
            </Text>
          </View>
          <ProgressBar value={rank.fraction} color={palette.straw} trackColor={card.starOff} />
          <Text style={[styles.rankNext, { color: card.muted }]}>
            {rank.next
              ? t('stats.nextTitle', {
                  title: titleName(rank.next, language),
                  points: rank.next.minPoints,
                })
              : t('stats.topTitle')}
          </Text>
        </View>

        {/* ── Seviyeler ── */}
        <View style={[styles.card, { backgroundColor: card.background }]}>
          <Text style={[styles.cardLabel, { color: card.muted }]}>{t('levels.title')}</Text>
          <View style={styles.facts}>
            <Fact value={`${levels.completed}/${levels.total}`} label={t('stats.completed')} />
            <Fact value={`${levels.stars}/${levels.maxStars}`} label={t('stats.stars')} />
            <Fact value={String(levels.perfect)} label={t('stats.perfect')} />
          </View>
          <View style={styles.rows}>
            {levels.byDifficulty.map((row, i) => (
              <DifficultyRow key={row.difficulty} row={row} delay={150 + i * 70} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Keçe kartta küçük bilgi: değer üstte, açıklama altta */
function FeltFact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.feltFact}>
      <Text style={styles.feltFactValue}>{value}</Text>
      <Text style={styles.feltFactLabel}>{label}</Text>
    </View>
  );
}

/** Krem kartta bilgi: değer üstte, açıklama altta */
function Fact({ value, label }: { value: string; label: string }) {
  const dayPhase = useDayPhase();
  const card = cardColors(dayPhase.dark);
  return (
    <View style={styles.fact}>
      <Text style={[styles.factValue, { color: card.text }]}>{value}</Text>
      <Text style={[styles.factLabel, { color: card.muted }]}>{label}</Text>
    </View>
  );
}

/** Zorluk satırı: ad ve ilerleme, dolan çubuk, yıldız ve süreler */
function DifficultyRow({ row, delay }: { row: DifficultyStats; delay: number }) {
  const t = useTranslation();
  const dayPhase = useDayPhase();
  const card = cardColors(dayPhase.dark);
  const name = t(`difficulty.${row.difficulty}`);
  const times =
    row.bestTime === null || row.averageTime === null
      ? t('stats.noTime')
      : `${t('stats.best')} ${formatTime(row.bestTime)} · ${t('stats.average')} ${formatTime(row.averageTime)}`;

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={[
        name,
        t('levels.progress', { done: row.completed, total: row.total }),
        t('levels.stars', { count: row.stars }),
        times,
      ].join(', ')}
    >
      <View style={styles.rowHead}>
        <Text style={[styles.rowName, { color: card.text }]}>{name}</Text>
        <Text style={[styles.rowCount, { color: card.text }]}>
          {row.completed}/{row.total}
        </Text>
      </View>
      <ProgressBar
        value={row.completed / row.total}
        color={palette.felt}
        trackColor={card.starOff}
        delay={delay}
      />
      <View style={styles.rowMeta}>
        <Icon name="star" size={14} color={palette.straw} />
        <Text style={[styles.rowMetaText, { color: card.muted }]}>{row.stars}</Text>
        <Text style={[styles.rowMetaText, styles.rowTimes, { color: card.muted }]} numberOfLines={1}>
          {times}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.extrabold,
    fontSize: fontSize.title,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    padding: SCREEN_PADDING,
    paddingBottom: 36,
    gap: 16,
  },
  // Tahtayla aynı keçe: dikiş çizgisi ve koyu alt kalınlık
  felt: {
    padding: FELT_PADDING,
    borderRadius: radius.board,
    borderBottomWidth: 6,
    gap: 14,
  },
  stitch: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: radius.board - 5,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.stitch,
    pointerEvents: 'none',
  },
  feltLabel: {
    color: palette.wool,
    fontFamily: fonts.bold,
    fontSize: fontSize.small,
    opacity: 0.85,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: -6,
  },
  streakMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  streakNumber: {
    color: palette.wool,
    fontFamily: fonts.extrabold,
    fontSize: fontSize.display,
    lineHeight: fontSize.display * 1.25,
    fontVariant: ['tabular-nums'],
  },
  streakUnit: {
    color: palette.wool,
    fontFamily: fonts.bold,
    fontSize: fontSize.body,
    flexShrink: 1,
  },
  streakSide: {
    gap: 6,
    alignItems: 'flex-end',
  },
  feltFact: {
    alignItems: 'flex-end',
  },
  feltFactValue: {
    color: palette.wool,
    fontFamily: fonts.extrabold,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * 1.25,
  },
  feltFactLabel: {
    color: palette.wool,
    opacity: 0.75,
    fontFamily: fonts.semibold,
    fontSize: fontSize.caption,
    lineHeight: fontSize.caption * 1.25,
  },
  feltHint: {
    color: palette.wool,
    opacity: 0.85,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: fontSize.small,
  },
  feltButton: {
    marginTop: 2,
  },
  card: {
    borderRadius: radius.board,
    padding: 18,
    gap: 10,
  },
  cardLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSize.small,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: -6,
  },
  rankName: {
    flexShrink: 1,
    fontFamily: fonts.extrabold,
    fontSize: fontSize.heading,
  },
  rankPoints: {
    fontFamily: fonts.bold,
    fontSize: fontSize.body,
    fontVariant: ['tabular-nums'],
  },
  rankNext: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.caption,
  },
  facts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -2,
    marginBottom: 4,
  },
  fact: {
    alignItems: 'center',
    flex: 1,
  },
  factValue: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.heading,
    fontVariant: ['tabular-nums'],
  },
  factLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.caption,
  },
  rows: {
    gap: 14,
  },
  row: {
    gap: 6,
  },
  rowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  rowName: {
    fontFamily: fonts.bold,
    fontSize: fontSize.body,
  },
  rowCount: {
    fontFamily: fonts.bold,
    fontSize: fontSize.small,
    fontVariant: ['tabular-nums'],
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowMetaText: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.caption,
    fontVariant: ['tabular-nums'],
  },
  rowTimes: {
    flexShrink: 1,
    marginLeft: 8,
  },
});
