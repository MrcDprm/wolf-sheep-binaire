/**
 * Araç düğmesi (Sıfırla, Geri al, İpucu)
 *
 * Dokunsal Button gibi altında kenarı olan, basınca kenarın üstüne inen düğme; ama ikon
 * üstte, kısa yazı altta durur, böylece üçü dar telefonlarda da yan yana sığar.
 * İsteğe bağlı sayı rozeti ikonun köşesinde durur (kalan ipucu).
 */
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useDayPhase } from '../../hooks/useDayPhase';
import { EDGE, fontSize, fonts, palette, radius } from '../../theme';
import { Icon, type IconName } from './Icon';

interface ToolButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  /** Saman sarısı ana eylem (İpucu) */
  primary?: boolean;
  disabled?: boolean;
  /** İkonun köşesindeki sayı */
  badge?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function ToolButton({
  icon,
  label,
  onPress,
  primary = false,
  disabled = false,
  badge,
  accessibilityLabel,
  style,
}: ToolButtonProps) {
  const dayPhase = useDayPhase();
  const face = primary ? palette.straw : dayPhase.surface;
  const edge = primary ? palette.strawEdge : dayPhase.surfaceEdge;
  const color = primary ? palette.ink : dayPhase.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={[styles.wrap, disabled && styles.disabled, style]}
    >
      {({ pressed }) => (
        <>
          <View style={[styles.edge, { backgroundColor: edge }]} />
          <View
            style={[
              styles.face,
              { backgroundColor: face, transform: [{ translateY: pressed ? EDGE : 0 }] },
            ]}
          >
            <View>
              <Icon name={icon} size={22} color={color} />
              {badge !== undefined && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {label}
            </Text>
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
  disabled: {
    opacity: 0.45,
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
    borderRadius: radius.button,
    minHeight: 56,
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: fontSize.small,
    lineHeight: fontSize.small * 1.25,
  },
  badge: {
    position: 'absolute',
    top: -7,
    left: 16,
    minWidth: 24,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.ink,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.caption - 1,
    lineHeight: 16,
    color: palette.straw,
  },
});
