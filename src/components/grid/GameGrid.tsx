/**
 * GameGrid — Ana Izgara Bileşeni
 *
 * - useWindowDimensions ile ekran genişliğine göre hücre boyutunu hesaplar
 * - Nested View ile satır × sütun render eder (FlatList overhead'i yoktur)
 * - useMemo ile satır dizilerini stabilize eder, gereksiz re-render'ı önler
 * - Her GridCell'e onTapCell callback'i, boyut ve vurgu rengi iletilir
 */
import React, { useMemo, memo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { GridCell } from './GridCell';
import type { Grid } from '../../types/game';
import { GRID_VERTICAL_RESERVE, MAX_APP_WIDTH, MAX_CELL_SIZE } from '../../constants/layout';

interface GameGridProps {
  grid: Grid;
  accentColor: string;
  onTapCell: (row: number, col: number) => void;
  /** Ekranın her iki yanında bırakılacak toplam yatay boşluk (px) */
  horizontalPadding?: number;
}

const DEFAULT_PADDING = 32;
/** Izgara çerçevesinin iç boşluğu (styles.grid.padding ile aynı) */
const FRAME_PADDING = 4;

function GameGridComponent({
  grid,
  accentColor,
  onTapCell,
  horizontalPadding = DEFAULT_PADDING,
}: GameGridProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const gridSize = grid.length;

  // Hücre boyutu: ızgara hem genişliğe hem yüksekliğe sığmalı, çok da büyümemeli
  const cellSize = useMemo(() => {
    if (gridSize === 0) return 48;
    const width = Math.min(screenWidth, MAX_APP_WIDTH) - horizontalPadding * 2;
    const height = screenHeight - GRID_VERTICAL_RESERVE;
    return Math.min(MAX_CELL_SIZE, Math.floor(Math.min(width, height) / gridSize));
  }, [screenWidth, screenHeight, gridSize, horizontalPadding]);

  const rows = useMemo(() => grid, [grid]);

  if (gridSize === 0) return null;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.grid,
          {
            // Hücreler + çerçevenin iki yandaki iç boşluğu
            width: cellSize * gridSize + FRAME_PADDING * 2,
            borderRadius: Math.max(10, cellSize * 0.18),
          },
        ]}
      >
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((cell) => (
              <GridCell
                key={`${cell.row}-${cell.col}`}
                cell={cell}
                cellSize={cellSize}
                accentColor={accentColor}
                onTap={onTapCell}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

export const GameGrid = memo(GameGridComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    backgroundColor: '#F5F5F5',
    padding: FRAME_PADDING,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
  },
});
