/**
 * Aç/kapa anahtarı
 *
 * Sistem Switch'i yerine kullanılır: iOS 26'da UISwitch büyüdü ama React Native ona
 * eski boyutta (51x31) yer ayırıyor, anahtar satırda kayık duruyordu. Bu bileşen her
 * platformda aynı boyutta ve uygulamanın renkleriyle çizilir.
 */
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const THUMB = 26;
const PAD = (TRACK_HEIGHT - THUMB) / 2;
const TRAVEL = TRACK_WIDTH - THUMB - PAD * 2;

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  onColor: string;
  offColor: string;
  thumbColor: string;
}

export function Toggle({ value, onValueChange, accessibilityLabel, onColor, offColor, thumbColor }: ToggleProps) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 160 });
  }, [value, progress]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * TRAVEL }],
  }));

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      style={[styles.track, { backgroundColor: value ? onColor : offColor }]}
    >
      <Animated.View style={[styles.thumb, { backgroundColor: thumbColor }, thumbStyle]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: PAD,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
  },
});
