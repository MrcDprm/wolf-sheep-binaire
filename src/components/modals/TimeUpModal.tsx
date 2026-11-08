/**
 * Süre doldu penceresi
 *
 * Süre sınırı açıkken süre biterse açılır: seviye kaybedilmiştir, tahta kilitlidir.
 * Düğmeler: Tekrar dene (tahta ve süre baştan), Seviyeler, Menüye dön.
 * Kartın dışına dokununca kapanmaz; altında süre sınırının Ayarlar'dan kapatılabileceği yazar.
 * Hareketi azalt ayarı açıksa kart doğrudan görünür.
 */
import { memo, useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from '../../i18n';
import { useDayPhase } from '../../hooks/useDayPhase';
import { formatDuration } from '../../utils/scoring';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { cardColors, fontSize, fonts, palette } from '../../theme';

interface TimeUpModalProps {
  visible: boolean;
  levelName: string;
  /** Seviyenin süresi (saniye) */
  timeLimit: number;
  onRetry: () => void;
  onLevels: () => void;
  onMenu: () => void;
}

function TimeUpModalComponent({
  visible,
  levelName,
  timeLimit,
  onRetry,
  onLevels,
  onMenu,
}: TimeUpModalProps) {
  const t = useTranslation();
  const dayPhase = useDayPhase();
  const reduceMotion = useReducedMotion();
  const card = cardColors(dayPhase.dark);

  const overlay = useSharedValue(1);
  const cardScale = useSharedValue(1);

  useEffect(() => {
    if (!visible || reduceMotion) return;
    overlay.value = 0;
    overlay.value = withTiming(1, { duration: 180 });
    cardScale.value = 0.85;
    cardScale.value = withSpring(1, { damping: 14, stiffness: 200 });
  }, [visible, reduceMotion, overlay, cardScale]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onMenu}
    >
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Animated.View style={[styles.card, { backgroundColor: card.background }, cardStyle]}>
          <View style={[styles.clock, { backgroundColor: card.button.face }]}>
            <Icon
              name="clock"
              size={34}
              color={dayPhase.dark ? palette.errorOnDark : palette.error}
            />
          </View>

          <Text style={[styles.title, { color: card.text }]} accessibilityRole="header">
            {t('timeUp.title')}
          </Text>
          <Text style={[styles.levelName, { color: card.muted }]}>{levelName}</Text>
          <Text style={[styles.body, { color: card.text }]}>
            {t('timeUp.body', { time: formatDuration(timeLimit, t) })}
          </Text>

          <View style={styles.buttons}>
            <Button
              title={t('timeUp.retry')}
              onPress={onRetry}
              leading={<Icon name="reset" size={20} color={palette.ink} />}
            />
            <Button
              title={t('menu.levels')}
              variant="secondary"
              colors={card.button}
              onPress={onLevels}
            />
            <Pressable
              onPress={onMenu}
              accessibilityRole="button"
              style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
            >
              <Text style={[styles.linkText, { color: card.muted }]}>{t('game.backToMenu')}</Text>
            </Pressable>
          </View>

          <Text style={[styles.tip, { color: card.muted }]}>{t('timeUp.tip')}</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export const TimeUpModal = memo(TimeUpModalComponent);

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
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
  },
  clock: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
  body: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.body,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 18,
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
  tip: {
    fontFamily: fonts.medium,
    fontSize: fontSize.caption,
    textAlign: 'center',
    marginTop: 4,
  },
});
