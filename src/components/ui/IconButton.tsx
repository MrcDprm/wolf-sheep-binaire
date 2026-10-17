/**
 * Yalnız ikonlu düğme (kapat, geri, önceki/sonraki seviye)
 *
 * Dokunma alanı 44x44: parmakla rahat basılır.
 */
import { Pressable, StyleSheet } from 'react-native';
import { Icon, type IconName } from './Icon';

interface IconButtonProps {
  name: IconName;
  color: string;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  size?: number;
}

export function IconButton({
  name,
  color,
  onPress,
  accessibilityLabel,
  disabled = false,
  size = 26,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.button, (pressed || disabled) && styles.dim, disabled && styles.off]}
    >
      <Icon name={name} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: {
    opacity: 0.6,
  },
  off: {
    opacity: 0.25,
  },
});
