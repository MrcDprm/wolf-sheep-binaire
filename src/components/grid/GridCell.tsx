/**
 * Izgaranın tek hücresi
 *
 * Keçe tahtada hafif çukur bir yuva; içinde koyun ya da kurt taşı durur.
 * - Başta açık verilen ve ipucuyla açılan hücreler daha koyu yuvadadır, dokunulamaz.
 * - Taş konunca küçük bir zıplama, kural ihlalinde kırmızı halka ve sallanma.
 * - Hareketi azalt ayarı açıksa animasyon yapılmaz.
 */
import { memo, useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Piece } from '../pieces/Piece';
import { useTranslation } from '../../i18n';
import { palette, radius } from '../../theme';
import type { Cell } from '../../types/game';

interface GridCellProps {
  cell: Cell;
  /** Yuva dahil hücrenin kapladığı alan (px) */
  cellSize: number;
  /** Hücreler arası boşluk (px) */
  gap: number;
  onTap: (row: number, col: number) => void;
}

const VALUE_KEY = { 0: 'cell.empty', 1: 'cell.wolf', 2: 'cell.sheep' } as const;

function GridCellComponent({ cell, cellSize, gap, onTap }: GridCellProps) {
  const t = useTranslation();
  const reduceMotion = useReducedMotion();
  const offsetX = useSharedValue(0);
  const scale = useSharedValue(1);

  // Taş değişince zıpla (ilk çizimde değil)
  const previousValue = useRef(cell.value);
  useEffect(() => {
    if (previousValue.current === cell.value) return;
    previousValue.current = cell.value;
    if (cell.value !== 0 && !reduceMotion) {
      scale.value = 0.55;
      scale.value = withSpring(1, { damping: 11, stiffness: 260 });
    }
  }, [cell.value, reduceMotion, scale]);

  // Hata çıkınca salla
  useEffect(() => {
    if (cell.hasError && !reduceMotion) {
      offsetX.value = withSequence(
        withTiming(-6, { duration: 45 }),
        withTiming(6, { duration: 45 }),
        withTiming(-4, { duration: 38 }),
        withTiming(4, { duration: 38 }),
        withTiming(0, { duration: 30 }),
      );
    } else {
      offsetX.value = 0;
    }
  }, [cell.hasError, reduceMotion, offsetX]);

  const slotStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offsetX.value }] }));
  const pieceStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const size = cellSize - gap;
  const label = t('cell.label', {
    row: cell.row + 1,
    col: cell.col + 1,
    value: t(VALUE_KEY[cell.value]),
  });

  return (
    <Pressable
      onPress={() => onTap(cell.row, cell.col)}
      disabled={cell.isLocked}
      accessibilityRole="button"
      accessibilityLabel={cell.isLocked ? `${label}, ${t('cell.fixed')}` : label}
      accessibilityState={{ disabled: cell.isLocked }}
      style={{ margin: gap / 2 }}
    >
      <Animated.View
        style={[
          styles.slot,
          { width: size, height: size, borderRadius: Math.min(radius.cell, size * 0.28) },
          cell.isLocked && styles.slotGiven,
          cell.hasError && styles.slotError,
          slotStyle,
        ]}
      >
        {cell.value !== 0 && (
          <Animated.View style={pieceStyle}>
            <Piece kind={cell.value === 1 ? 'wolf' : 'sheep'} size={size * 0.82} />
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export const GridCell = memo(GridCellComponent);

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.slot,
  },
  slotGiven: {
    backgroundColor: palette.slotGiven,
  },
  slotError: {
    backgroundColor: palette.slotError,
    borderWidth: 3,
    borderColor: palette.error,
  },
});
