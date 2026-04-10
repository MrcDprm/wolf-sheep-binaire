// Hücre değeri: 0=Boş, 1=Kurt, 2=Koyun
export type CellValue = 0 | 1 | 2;

export interface Cell {
  row: number;
  col: number;
  value: CellValue;
  isLocked: boolean;   // ipucu veya başlangıç hücresi — dokunulamaz
  hasError: boolean;   // kural ihlali işaretleyici
}

export type Grid = Cell[][];

// Sayısal grid gösterimi (serialization / algoritma içi kullanım)
export type RawGrid = CellValue[][];

export type Difficulty = 'easy' | 'medium' | 'normal' | 'hard' | 'impossible';
export type GameMode = 'campaign' | 'daily' | 'impossible';

export type GridSize = 6 | 8 | 10 | 12;

export interface GameLevel {
  id: number;
  difficulty: Difficulty;
  gridSize: GridSize;
  /** Kusursuz (3 yıldız) tamamlama için kullanılabilecek max ipucu sayısı */
  maxHintsForPerfect: number;
  /** İmkansız mod: başlangıçta verilen hücre sayısı (minimum clue) */
  minClues?: number;
}

export interface LevelResult {
  stars: 0 | 1 | 2 | 3;
  time: number;       // saniye cinsinden süre
  score: number;      // baz puan + zaman bonusu
  hintsUsed: number;
}

export interface GameError {
  row: number;
  col: number;
  reason: 'triple' | 'imbalance';
}

export type DayPhase = 'morning' | 'afternoon' | 'evening' | 'night';
