/**
 * GridCell — Tek Izgara Hücresi
 *
 * - value=0: boş (dokunulabilir)
 * - value=1: Kurt 🐺
 * - value=2: Koyun 🐑
 * - isLocked: ipucu/başlangıç hücresi — farklı arka plan, dokunulamaz
 * - hasError: kırmızı çerçeve + ! rozeti + Reanimated shake animasyonu
 */
import React, { useEffect, memo } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { Cell } from '../../types/game';

interface GridCellProps {
  cell: Cell;
  cellSize: number;
  accentColor: string;
  onTap: (row: number, col: number) => void;
}

const SYMBOL: Record<0 | 1 | 2, string> = {
  0: '',
  1: '🐺',
  2: '🐑',
};

function GridCellComponent({ cell, cellSize, accentColor, onTap }: GridCellProps) {
  const offsetX = useSharedValue(0);

  // Shake animasyonunu hasError değişince tetikle
  useEffect(() => {
    if (cell.hasError) {
      offsetX.value = withSequence(
        withTiming(-7, { duration: 45 }),
        withTiming(7, { duration: 45 }),
        withTiming(-5, { duration: 38 }),
        withTiming(5, { duration: 38 }),
        withTiming(-3, { duration: 30 }),
        withTiming(0, { duration: 25 }),
      );
    } else {
      offsetX.value = 0;
    }
  }, [cell.hasError]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }],
  }));

  const fontSize = cellSize > 44 ? 26 : cellSize > 32 ? 20 : 14;

  const cellStyle = [
    styles.cell,
    {
      width: cellSize - 3,
      height: cellSize - 3,
      borderRadius: Math.max(6, cellSize * 0.15),
    },
    cell.isLocked && styles.locked,
    cell.hasError && styles.error,
    cell.value === 0 && !cell.isLocked && { borderColor: accentColor + '55' },
  ];

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={cellStyle}
        onPress={() => onTap(cell.row, cell.col)}
        disabled={cell.isLocked}
        activeOpacity={0.7}
      >
        {cell.value !== 0 && (
          <Text style={[styles.symbol, { fontSize }]}>{SYMBOL[cell.value]}</Text>
        )}

        {/* Hata rozeti */}
        {cell.hasError && (
          <View style={styles.errorBadge} pointerEvents="none">
            <Text style={styles.errorBadgeText}>!</Text>
          </View>
        )}

        {/* Kilit göstergesi */}
        {cell.isLocked && cell.value !== 0 && (
          <View style={styles.lockDot} pointerEvents="none" />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export const GridCell = memo(GridCellComponent);

const styles = StyleSheet.create({
  cell: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1.5,
    overflow: 'visible',
  },
  locked: {
    backgroundColor: '#EDE7F6',
    borderColor: '#9575CD',
    borderWidth: 2,
  },
  error: {
    backgroundColor: '#FFEBEE',
    borderColor: '#E53935',
    borderWidth: 2,
  },
  symbol: {
    lineHeight: undefined,
    includeFontPadding: false,
    textAlign: 'center',
  },
  errorBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  errorBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 14,
    includeFontPadding: false,
  },
  lockDot: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#9575CD',
    opacity: 0.7,
  },
});
