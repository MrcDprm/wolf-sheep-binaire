/**
 * İnce ilerleme çubuğu
 *
 * Ekran açılınca soldan dolar; `delay` ile alt alta çubuklar sırayla dolar.
 * Hareketi azalt ayarı açıksa doğrudan dolu görünür.
 */
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

interface ProgressBarProps {
  /** 0-1 arası doluluk */
  value: number;
  color: string;
  trackColor: string;
  height?: number;
  /** Dolmaya başlamadan önce bekleme (ms) */
  delay?: number;
}

export function ProgressBar({ value, color, trackColor, height = 8, delay = 0 }: ProgressBarProps) {
  const reduceMotion = useReducedMotion();
  const target = Math.min(1, Math.max(0, value));
  const progress = useSharedValue(reduceMotion ? target : 0);

  useEffect(() => {
    progress.value = reduceMotion
      ? target
      : withDelay(delay, withTiming(target, { duration: 650, easing: Easing.out(Easing.cubic) }));
  }, [target, delay, reduceMotion, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={[styles.track, { backgroundColor: trackColor, height, borderRadius: height / 2 }]}>
      <Animated.View style={[styles.fill, { backgroundColor: color, borderRadius: height / 2 }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
