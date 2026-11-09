/**
 * Sonuç penceresi (bulmaca bitince)
 *
 * Tek kutlama anı: kart açılır, yıldızlar sırayla yerine oturur.
 * Hareketi azalt ayarı açıksa her şey doğrudan görünür. Kartın dışına dokununca
 * pencere kapanır, bitmiş tahta görünür kalır.
 *
 * Seviye ve günün bulmacası pencereleri bu kartı kullanır; başlık, iki bilgi
 * (ör. süre ve puan), rozet ve düğmeler pencereye göre değişir.
 */
import { useEffect, type ReactNode } from 'react';
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
import { useTranslation } from '../../i18n';
import { useDayPhase } from '../../hooks/useDayPhase';
import { Icon } from '../ui/Icon';
import { cardColors, fontSize, fonts, palette } from '../../theme';

const STAR_LABEL = {
  0: 'stars.noStar',
  1: 'stars.good',
  2: 'stars.great',
  3: 'stars.perfect',
} as const;

export interface ResultFact {
  value: string;
  label: string;
}

interface ResultModalProps {
  visible: boolean;
  /** Kartın başlığı ("Seviye tamamlandı") */
  title: string;
  /** Başlığın altındaki satır (seviye adı ya da tarih) */
  subtitle: string;
  stars: 0 | 1 | 2 | 3;
  /** Yıldızların altındaki bilgiler (ör. süre ve puan) */
  facts: ResultFact[];
  /** Bilgilerin altındaki rozet: vurgulu ("Yeni rekor!") ya da sönük ("En iyi süren: …") */
  badge?: { text: string; highlight: boolean };
  onClose: () => void;
  /** Düğmeler */
  children: ReactNode;
}

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

export function ResultModal({
  visible,
  title,
  subtitle,
  stars,
  facts,
  badge,
  onClose,
  children,
}: ResultModalProps) {
  const t = useTranslation();
  const dayPhase = useDayPhase();
  const reduceMotion = useReducedMotion();
  const card = cardColors(dayPhase.dark);

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
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: card.muted }]}>{subtitle}</Text>

          <View
            style={styles.stars}
            accessible
            accessibilityLabel={t('levels.stars', { count: stars })}
          >
            <Star value={star1} on={stars >= 1} offColor={card.starOff} />
            <Star value={star2} on={stars >= 2} offColor={card.starOff} />
            <Star value={star3} on={stars >= 3} offColor={card.starOff} />
          </View>
          <Text style={[styles.starLabel, { color: card.text }]}>{t(STAR_LABEL[stars])}</Text>

          <View style={styles.facts}>
            {facts.map((fact) => (
              <View key={fact.label} style={styles.fact}>
                <Text style={[styles.factValue, { color: card.text }]}>{fact.value}</Text>
                <Text style={[styles.factLabel, { color: card.muted }]}>{fact.label}</Text>
              </View>
            ))}
          </View>

          {badge?.highlight ? (
            <Text style={styles.highlight} accessibilityLiveRegion="polite">
              {badge.text}
            </Text>
          ) : badge ? (
            <Text style={[styles.note, { color: card.muted }]}>{badge.text}</Text>
          ) : null}

          <View style={styles.buttons}>{children}</View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/** Kartın altındaki yazı düğme ("Menüye dön") */
export function ResultLink({ title, onPress }: { title: string; onPress: () => void }) {
  const dayPhase = useDayPhase();
  const card = cardColors(dayPhase.dark);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
    >
      <Text style={[styles.linkText, { color: card.muted }]}>{title}</Text>
    </Pressable>
  );
}

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
  subtitle: {
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
  highlight: {
    marginTop: -6,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: palette.straw,
    color: palette.ink,
    fontFamily: fonts.extrabold,
    fontSize: fontSize.small,
  },
  note: {
    marginTop: -8,
    marginBottom: 14,
    fontFamily: fonts.semibold,
    fontSize: fontSize.caption,
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
