/**
 * Menüdeki "Günün bulmacası" kartı
 *
 * Solda takvim yaprağı (kısa ay adı ve gün), ortada başlık ve durum, sağda seri.
 * Bugün çözülmediyse durumda zorluk yazar, seri alevi sönük durur: seri dün bitti,
 * bugün çözülürse sürer. Çözülünce süre yazar, yaprağa onay işareti gelir, alev yanar.
 * Düğmelerle aynı dokunsal yüzey: basınca alt kenarın üstüne iner.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDayPhase } from '../../hooks/useDayPhase';
import { useTranslation } from '../../i18n';
import { calendarLeaf } from '../../utils/dailyText';
import { formatTime } from '../../utils/scoring';
import { Icon } from '../ui/Icon';
import type { DailyResult } from '../../engine/dailyResults';
import type { Difficulty } from '../../types/game';
import { EDGE, fontSize, fonts, palette, radius } from '../../theme';

interface DailyCardProps {
  /** Bugünün anahtarı ("2026-11-09") */
  date: string;
  difficulty: Difficulty;
  /** Bugünün sonucu; çözülmediyse yok */
  solved?: DailyResult;
  /** Süren seri (gün); yoksa 0 */
  streak: number;
  onPress: () => void;
}

export function DailyCard({ date, difficulty, solved, streak, onPress }: DailyCardProps) {
  const t = useTranslation();
  const dayPhase = useDayPhase();
  const [month, day] = calendarLeaf(date, t);

  const status = solved
    ? t('daily.solvedIn', { time: formatTime(solved.time) })
    : t('daily.today', { difficulty: t(`difficulty.${difficulty}`) });
  const streakLabel = streak > 0 ? t('daily.streakLabel', { count: streak }) : '';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[t('daily.title'), status, streakLabel].filter(Boolean).join(', ')}
      style={styles.wrap}
    >
      {({ pressed }) => (
        <>
          <View style={[styles.edge, { backgroundColor: dayPhase.surfaceEdge }]} />
          <View
            style={[
              styles.face,
              { backgroundColor: dayPhase.surface, transform: [{ translateY: pressed ? EDGE : 0 }] },
            ]}
          >
            {/* Takvim yaprağı; çözülünce köşesinde keçe yeşili onay */}
            <View>
              <View style={styles.leaf}>
                <Text style={styles.leafMonth}>{month}</Text>
                <Text style={styles.leafDay}>{day}</Text>
              </View>
              {solved ? (
                <View style={[styles.tick, { backgroundColor: palette.felt, borderColor: palette.wool }]}>
                  <Icon name="check" size={13} color={palette.wool} />
                </View>
              ) : null}
            </View>

            <View style={styles.texts}>
              <Text style={[styles.title, { color: dayPhase.text }]} numberOfLines={1}>
                {t('daily.title')}
              </Text>
              <Text style={[styles.status, { color: dayPhase.textMuted }]} numberOfLines={1}>
                {status}
              </Text>
            </View>

            {streak > 0 ? (
              <View style={styles.streak}>
                <Icon name="flame" size={22} color={solved ? palette.straw : dayPhase.textMuted} />
                <Text style={[styles.streakCount, { color: solved ? dayPhase.text : dayPhase.textMuted }]}>
                  {streak}
                </Text>
              </View>
            ) : null}
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: EDGE,
  },
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: EDGE,
    bottom: 0,
    borderRadius: radius.button,
  },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 9,
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: radius.button,
  },
  // Yün kremi yaprak, üstünde saman sarısı ay bandı
  leaf: {
    width: 44,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: palette.wool,
    borderBottomWidth: 3,
    borderBottomColor: palette.woolEdge,
  },
  leafMonth: {
    alignSelf: 'stretch',
    textAlign: 'center',
    backgroundColor: palette.straw,
    color: palette.ink,
    fontFamily: fonts.extrabold,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.6,
  },
  leafDay: {
    color: palette.ink,
    fontFamily: fonts.extrabold,
    fontSize: 21,
    lineHeight: 29,
  },
  tick: {
    position: 'absolute',
    right: -6,
    bottom: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSize.body + 1,
    lineHeight: (fontSize.body + 1) * 1.3,
  },
  status: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.small,
    lineHeight: fontSize.small * 1.3,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakCount: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.heading,
    fontVariant: ['tabular-nums'],
  },
});
