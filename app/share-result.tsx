/**
 * Sonuç paylaşım ekranı
 *
 * Bitirilen seviyenin bilgisini (seviye, yıldız, süre, puan) bir kart
 * hâlinde gösterir; "Paylaş" kartın görüntüsünü paylaşır.
 * Bilgiler bağlantı parametresinden geldiği için sınırlar içinde okunur.
 */
import { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from '../src/i18n';
import { useDayPhase } from '../src/hooks/useDayPhase';
import { formatTime } from '../src/utils/scoring';
import { shareCard } from '../src/utils/shareImage';
import { getLevelById, TOTAL_LEVELS } from '../src/constants/levels';
import { Piece } from '../src/components/pieces/Piece';
import { Button } from '../src/components/ui/Button';
import { Icon } from '../src/components/ui/Icon';
import { cardColors, fontSize, fonts, palette } from '../src/theme';

/** Sayı değilse ya da aralık dışındaysa sınıra çeker */
function readInt(value: string | undefined, min: number, max: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}

export default function ShareResultScreen() {
  const t = useTranslation();
  const router = useRouter();
  const dayPhase = useDayPhase();
  const card = cardColors(dayPhase.dark);
  const params = useLocalSearchParams<{
    level: string;
    stars: string;
    time: string;
    score: string;
  }>();
  const cardRef = useRef<View>(null);

  const level = getLevelById(readInt(params.level, 1, TOTAL_LEVELS)) ?? getLevelById(1)!;
  const stars = readInt(params.stars, 0, 3);
  const time = readInt(params.time, 0, 359999);
  const score = readInt(params.score, 0, 12);

  const levelName = t('game.level', {
    difficulty: t(`difficulty.${level.difficulty}`),
    number: level.number,
  });

  const handleShare = () =>
    shareCard(
      cardRef,
      t('share.message', { level: levelName, time: formatTime(time) }),
      t('share.title', { level: levelName }),
    );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: dayPhase.sky }]}>
      {/* Paylaşılan kart; Android'de görüntüsü alınabilsin diye collapsable={false} */}
      <View
        ref={cardRef}
        collapsable={false}
        style={[styles.card, { backgroundColor: card.background }]}
      >
        <View style={[styles.band, { backgroundColor: dayPhase.felt }]}>
          <Piece kind="sheep" size={44} />
          <Text style={styles.appName}>{t('app.name')}</Text>
          <Piece kind="wolf" size={44} />
        </View>

        <Text style={[styles.level, { color: card.text }]}>{levelName}</Text>

        <View style={styles.stars}>
          {[1, 2, 3].map((i) => (
            <Icon key={i} name="star" size={40} color={i <= stars ? palette.straw : card.starOff} />
          ))}
        </View>

        <View style={styles.facts}>
          <View style={styles.fact}>
            <Text style={[styles.factValue, { color: card.text }]}>{formatTime(time)}</Text>
            <Text style={[styles.factLabel, { color: card.muted }]}>{t('game.time')}</Text>
          </View>
          <View style={styles.fact}>
            <Text style={[styles.factValue, { color: card.text }]}>{score}</Text>
            <Text style={[styles.factLabel, { color: card.muted }]}>{t('scoring.totalScore')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttons}>
        <Button title={t('share.button')} onPress={handleShare} />
        <Button title={t('share.close')} variant="secondary" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 24,
  },
  band: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    marginBottom: 18,
  },
  appName: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.heading,
    color: palette.wool,
  },
  level: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.title,
  },
  stars: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 10,
  },
  facts: {
    flexDirection: 'row',
    gap: 48,
  },
  fact: {
    alignItems: 'center',
  },
  factValue: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.title,
    fontVariant: ['tabular-nums'],
  },
  factLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.caption,
  },
  buttons: {
    gap: 10,
  },
});
