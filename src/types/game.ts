// Hücre değeri: 0=Boş, 1=Kurt, 2=Koyun
export type CellValue = 0 | 1 | 2;

export interface Cell {
  row: number;
  col: number;
  value: CellValue;
  isLocked: boolean;   // başta açık verilen ya da ipucuyla açılan hücre — dokunulamaz
  hasError: boolean;   // kural ihlali işaretleyici
}

export type Grid = Cell[][];

// Sayısal grid gösterimi (algoritma içi kullanım)
export type RawGrid = CellValue[][];

export type Difficulty = 'easiest' | 'easy' | 'medium' | 'hard' | 'veryHard' | 'impossible';

export interface GameLevel {
  /** 1-300 arası genel seviye numarası */
  id: number;
  difficulty: Difficulty;
  /** Zorluk içindeki sıra (1-50) */
  number: number;
  /** Başlangıç tahtası */
  puzzle: RawGrid;
  /** Tek çözüm */
  solution: RawGrid;
  /** 2 yıldız için izin verilen en fazla ipucu */
  maxHintsForPerfect: number;
}

export interface LevelResult {
  stars: 0 | 1 | 2 | 3;
  time: number;       // saniye cinsinden süre
  score: number;      // yıldıza göre puan
  hintsUsed: number;
}

export type DayPhase = 'morning' | 'afternoon' | 'evening' | 'night';
