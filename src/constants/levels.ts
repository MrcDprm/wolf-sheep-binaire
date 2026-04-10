/**
 * 400 Temel Seviye + İmkansız Mod Metadata
 *
 * Her GameLevel nesnesinin:
 *  - gridSize: Takuzu grid boyutu
 *  - difficulty: Arka plan hesaplama için zorluk adı
 *  - maxHintsForPerfect: 3 yıldız için izin verilen max ipucu
 */
import type { GameLevel, Difficulty, GridSize } from '../types/game';

function createLevels(
  startId: number,
  count: number,
  difficulty: Difficulty,
  gridSize: GridSize,
  maxHints: number
): GameLevel[] {
  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    difficulty,
    gridSize,
    maxHintsForPerfect: maxHints,
  }));
}

export const CAMPAIGN_LEVELS: GameLevel[] = [
  // Kolay: 1-100 → 6x6
  ...createLevels(1, 100, 'easy', 6, 3),
  // Orta: 101-200 → 8x8
  ...createLevels(101, 100, 'medium', 8, 4),
  // Normal: 201-300 → 10x10
  ...createLevels(201, 100, 'normal', 10, 5),
  // Zor: 301-400 → 12x12
  ...createLevels(301, 100, 'hard', 12, 6),
];

/** İmkansız mod (premium): 500 seviye, 6-10 arası rastgele boyut */
const IMPOSSIBLE_GRID_SIZES: GridSize[] = [6, 8, 10];

export const IMPOSSIBLE_LEVELS: GameLevel[] = Array.from(
  { length: 500 },
  (_, i) => {
    const size =
      IMPOSSIBLE_GRID_SIZES[Math.floor(Math.random() * IMPOSSIBLE_GRID_SIZES.length)];
    return {
      id: 1000 + i + 1,
      difficulty: 'impossible' as Difficulty,
      gridSize: size,
      maxHintsForPerfect: 0, // İmkansız modda hint yok
      minClues: undefined,
    };
  }
);

export function getLevelById(id: number): GameLevel | undefined {
  if (id >= 1000) {
    return IMPOSSIBLE_LEVELS.find((l) => l.id === id);
  }
  return CAMPAIGN_LEVELS.find((l) => l.id === id);
}

export function getNextLevel(currentId: number): GameLevel | undefined {
  if (currentId >= 1000) {
    return IMPOSSIBLE_LEVELS.find((l) => l.id === currentId + 1);
  }
  return CAMPAIGN_LEVELS.find((l) => l.id === currentId + 1);
}
