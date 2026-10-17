/**
 * Keçe tahta
 *
 * Yeşil keçe zemin, kenarında dikiş çizgisi, altında koyu bir kalınlık.
 * Hücre boyutu ekranın hem genişliğine hem yüksekliğine sığacak şekilde hesaplanır.
 */
import { memo, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { GridCell } from './GridCell';
import { useDayPhase } from '../../hooks/useDayPhase';
import { EDGE, palette, radius } from '../../theme';
import { GRID_VERTICAL_RESERVE, MAX_APP_WIDTH, MAX_CELL_SIZE } from '../../constants/layout';
import type { Grid } from '../../types/game';

interface GameGridProps {
  grid: Grid;
  onTapCell: (row: number, col: number) => void;
}

/** Ekran kenarı ile tahta arasındaki boşluk (px, her yanda) */
const SCREEN_PADDING = 20;
/** Keçenin kenarı ile hücreler arasındaki boşluk (px) */
const BOARD_PADDING = 10;
/** Hücreler arası boşluk (px) */
const GAP = 5;

function GameGridComponent({ grid, onTapCell }: GameGridProps) {
  const dayPhase = useDayPhase();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const gridSize = grid.length;

  const cellSize = useMemo(() => {
    if (gridSize === 0) return 48;
    const width = Math.min(screenWidth, MAX_APP_WIDTH) - (SCREEN_PADDING + BOARD_PADDING) * 2;
    const height = screenHeight - GRID_VERTICAL_RESERVE;
    return Math.min(MAX_CELL_SIZE, Math.floor(Math.min(width, height) / gridSize));
  }, [screenWidth, screenHeight, gridSize]);

  if (gridSize === 0) return null;

  return (
    <View style={styles.wrap}>
      {/* Keçenin kalınlığı */}
      <View style={[styles.edge, { backgroundColor: dayPhase.feltEdge }]} />
      <View style={[styles.board, { backgroundColor: dayPhase.felt }]}>
        <View style={styles.stitch} pointerEvents="none" />
        {grid.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((cell) => (
              <GridCell
                key={`${cell.row}-${cell.col}`}
                cell={cell}
                cellSize={cellSize}
                gap={GAP}
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
  wrap: {
    paddingBottom: EDGE + 3,
  },
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: EDGE + 3,
    bottom: 0,
    borderRadius: radius.board,
  },
  board: {
    padding: BOARD_PADDING,
    borderRadius: radius.board,
  },
  stitch: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: radius.board - 5,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.stitch,
  },
  row: {
    flexDirection: 'row',
  },
});
