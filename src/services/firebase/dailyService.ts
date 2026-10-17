/**
 * Firestore `daily_puzzles` koleksiyonu okuma servisi
 *
 * Document ID formatı: "YYYY-MM-DD"
 * Saat 10:00'dan itibaren aktif olur (istemci taraflı kontrol).
 */
import { doc, getDoc } from 'firebase/firestore';
import { firestoreDb } from './config';
import type { FirestoreDailyPuzzle } from '../../types/firebase';
import type { RawGrid } from '../../types/game';
import { getTodayKey } from '../../utils/dateHelpers';

export interface DailyPuzzleData {
  dateKey: string;
  gridSize: number;
  initialRaw: RawGrid;
  solutionRaw: RawGrid;
}

/**
 * Bugünün günlük bulmacasını Firestore'dan çeker.
 * Döküman yoksa null döner (henüz oluşturulmamış).
 */
export async function fetchTodayPuzzle(): Promise<DailyPuzzleData | null> {
  const dateKey = getTodayKey();
  const snap = await getDoc(doc(firestoreDb(), 'daily_puzzles', dateKey));

  if (!snap.exists()) return null;

  const data = snap.data() as FirestoreDailyPuzzle;
  const size = data.gridSize;

  // Düzleştirilmiş diziyi 2D grid'e dönüştür
  const initialRaw: RawGrid = [];
  const solutionRaw: RawGrid = [];

  for (let r = 0; r < size; r++) {
    initialRaw.push(data.initialBoard.slice(r * size, (r + 1) * size) as RawGrid[0]);
    solutionRaw.push(data.solutionBoard.slice(r * size, (r + 1) * size) as RawGrid[0]);
  }

  return { dateKey, gridSize: size, initialRaw, solutionRaw };
}
