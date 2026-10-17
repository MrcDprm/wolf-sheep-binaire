/**
 * Dokunsal düğme
 *
 * Düğmenin altında koyu bir "kenar" durur; basınca düğme kenarın üstüne iner.
 * - primary: saman sarısı ana eylem (Devam et, İpucu)
 * - secondary: gökyüzü üzerinde yarı saydam yüzey (Seviyeler, Sıfırla)
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useDayPhase } from '../../hooks/useDayPhase';
import { EDGE, fontSize, fonts, palette, radius } from '../../theme';

interface ButtonProps {
  title: string;
  /** Başlığın altındaki küçük satır (ör. "Kolay 12") */
  subtitle?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  /** Yazının solundaki küçük öğe (ikon, rozet) */
  leading?: ReactNode;
  /** Yazının sağındaki küçük öğe */
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** Gökyüzü dışındaki zeminlerde (ör. pencere kartı) ikincil düğmenin renkleri */
  colors?: { face: string; edge: string; text: string };
}

export function Button({
  title,
  subtitle,
  onPress,
  variant = 'primary',
  disabled = false,
  leading,
  trailing,
  style,
  accessibilityLabel,
  colors,
}: ButtonProps) {
  const dayPhase = useDayPhase();
  const primary = variant === 'primary';

  const face = colors?.face ?? (primary ? palette.straw : dayPhase.surface);
  const edge = colors?.edge ?? (primary ? palette.strawEdge : dayPhase.surfaceEdge);
  const color = colors?.text ?? (primary ? palette.ink : dayPhase.text);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
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
            <View style={styles.row}>
              {leading}
              <Text style={[styles.title, { color }, !primary && styles.titleSecondary]}>{title}</Text>
              {trailing}
            </View>
            {subtitle ? <Text style={[styles.subtitle, { color }]}>{subtitle}</Text> : null}
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.heading,
    lineHeight: fontSize.heading * 1.25,
  },
  titleSecondary: {
    fontFamily: fonts.bold,
    fontSize: fontSize.body + 1,
  },
  subtitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.small,
    lineHeight: fontSize.small * 1.2,
    opacity: 0.8,
  },
});
