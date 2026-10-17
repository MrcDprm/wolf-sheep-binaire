/**
 * Seviye tamamlama penceresi
 *
 * Tek kutlama anı: kart açılır, yıldızlar sırayla yerine oturur.
 * Hareketi azalt ayarı açıksa her şey doğrudan görünür.
 * Altında süre ve kazanılan puan; düğmeler: Sonraki seviye, Sonucu paylaş, Menüye dön.
 */
import { memo, useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { formatTime } from '../../utils/scoring';
import { useTranslation } from '../../i18n';
import { useDayPhase } from '../../hooks/useDayPhase';
import { getLevelById, TOTAL_LEVELS } from '../../constants/levels';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { cardColors, fontSize, fonts, palette } from '../../theme';
import type { LevelResult } from '../../types/game';

interface LevelCompleteModalProps {
  visible: boolean;
  levelId: number;
  result: LevelResult;
  onClose: () => void;
}

const STAR_LABEL = {
  0: 'stars.noStar',
  1: 'stars.good',
  2: 'stars.great',
  3: 'stars.perfect',
} as const;

function Star({
  value,
  on,
  offColor,
}: {
  value: SharedValue<number>;
  on: boolean;
  offColor: string;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: value.value }],
    opacity: Math.min(1, value.value * 1.5),
  }));
  return (
    <Animated.View style={style}>
      <Icon name="star" size={46} color={on ? palette.straw : offColor} />
    </Animated.View>
  );
}

function LevelCompleteModalComponent({
  visible,
  levelId,
  result,
  onClose,
}: LevelCompleteModalProps) {
  const router = useRouter();
  const t = useTranslation();
  const dayPhase = useDayPhase();
  const reduceMotion = useReducedMotion();
  const card = cardColors(dayPhase.dark);
  const level = getLevelById(levelId);

  const overlay = useSharedValue(1);
  const cardScale = useSharedValue(1);
  const star1 = useSharedValue(1);
  const star2 = useSharedValue(1);
  const star3 = useSharedValue(1);

  useEffect(() => {
    if (!visible || reduceMotion) return;
    overlay.value = 0;
    overlay.value = withTiming(1, { duration: 180 });
    cardScale.value = 0.85;
    cardScale.value = withSpring(1, { damping: 14, stiffness: 200 });
    [star1, star2, star3].forEach((s, i) => {
      s.value = 0;
      s.value = withDelay(220 + i * 160, withSpring(1, { damping: 9, stiffness: 220 }));
    });
  }, [visible, reduceMotion, overlay, cardScale, star1, star2, star3]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }));

  const goNext = () => {
    onClose();
    router.replace(`/(game)/level/${levelId + 1}`);
  };

  const goShare = () => {
    onClose();
    router.push(
      `/share-result?level=${levelId}&stars=${result.stars}&time=${result.time}&score=${result.score}`,
    );
  };

  const goMenu = () => {
    onClose();
    router.replace('/(game)');
  };

  const levelName = level
    ? t('game.level', { difficulty: t(`difficulty.${level.difficulty}`), number: level.number })
    : '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, overlayStyle]}>
        {/* Kartın dışına dokununca pencere kapanır, tahta görünür kalır */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t('game.close')}
        />
        <Animated.View style={[styles.card, { backgroundColor: card.background }, cardStyle]}>
          <Text style={[styles.title, { color: card.text }]} accessibilityRole="header">
            {t('game.levelComplete')}
          </Text>
          <Text style={[styles.levelName, { color: card.muted }]}>{levelName}</Text>

          <View
            style={styles.stars}
            accessible
            accessibilityLabel={t('levels.stars', { count: result.stars })}
          >
            <Star value={star1} on={result.stars >= 1} offColor={card.starOff} />
            <Star value={star2} on={result.stars >= 2} offColor={card.starOff} />
            <Star value={star3} on={result.stars >= 3} offColor={card.starOff} />
          </View>
          <Text style={[styles.starLabel, { color: card.text }]}>
            {t(STAR_LABEL[result.stars])}
          </Text>

          <View style={styles.facts}>
            <View style={styles.fact}>
              <Text style={[styles.factValue, { color: card.text }]}>
                {formatTime(result.time)}
              </Text>
              <Text style={[styles.factLabel, { color: card.muted }]}>{t('game.time')}</Text>
            </View>
            <View style={styles.fact}>
              <Text style={[styles.factValue, { color: card.text }]}>+{result.score}</Text>
              <Text style={[styles.factLabel, { color: card.muted }]}>
                {t('scoring.totalScore')}
              </Text>
            </View>
          </View>

          <View style={styles.buttons}>
            {levelId < TOTAL_LEVELS ? (
              <Button title={t('game.nextLevel')} onPress={goNext} />
            ) : (
              <Text style={[styles.allDone, { color: card.text }]}>{t('game.allDone')}</Text>
            )}
            <Button
              title={t('game.shareResult')}
              variant="secondary"
              colors={card.button}
              onPress={goShare}
            />
            <Pressable
              onPress={goMenu}
              accessibilityRole="button"
              style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
            >
              <Text style={[styles.linkText, { color: card.muted }]}>{t('game.backToMenu')}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export const LevelCompleteModal = memo(LevelCompleteModalComponent);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,24,40,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 18,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.title,
    textAlign: 'center',
  },
  levelName: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.small,
  },
  stars: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  starLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSize.body,
    marginTop: 4,
  },
  facts: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 14,
    marginBottom: 18,
  },
  fact: {
    alignItems: 'center',
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
  buttons: {
    alignSelf: 'stretch',
    gap: 8,
  },
  allDone: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.body,
    textAlign: 'center',
    marginBottom: 6,
  },
  link: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  linkPressed: {
    opacity: 0.6,
  },
  linkText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.small,
  },
});
