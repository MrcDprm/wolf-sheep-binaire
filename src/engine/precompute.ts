/**
 * Asenkron Grid Ön-Hesaplama Motoru
 *
 * React Native tek bir JS thread'inde çalışır. 12x12 grid üretimi
 * senkron çalıştırılırsa UI thread'ini dondurur.
 *
 * Çözüm:
 * - setTimeout(resolve, 0) ile JS event loop'a kontrol iade edilir.
 * - Her fazla "ağır" işlem adımı (çözüm üretme, benzersizlik kontrolü,
 *   hücre silme döngüsü) ayrı bir mikro-görev (micro-task) olarak
 *   Promise zincirine eklenir.
 * - Böylece kullanıcı dokunuşları, animasyonlar ve layout hesapları
 *   grid üretimi sırasında kesintisiz devam eder.
 *
 * Kullanım:
 *   const puzzle = await precomputePuzzleAsync(10, 'normal');
 */

import type { Difficulty } from '../types/game';
import type { GeneratedPuzzle } from './generator';
import { generateSolution, generatePuzzle } from './generator';

/** Bir sonraki event loop tick'ine kadar bekle (UI thread serbest bırak) */
const yieldToUI = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Arka planda asenkron olarak puzzle üretir.
 * Her ağır hesaplama adımı arasında UI thread'e dönülür.
 *
 * @param size Grid boyutu (6, 8, 10, 12)
 * @param difficulty Zorluk seviyesi
 * @param signal AbortSignal — iptal için
 */
export async function precomputePuzzleAsync(
  size: number,
  difficulty: Difficulty,
  signal?: AbortSignal
): Promise<GeneratedPuzzle> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  // Adım 1: UI thread'e önce kontrol ver
  await yieldToUI();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  // Adım 2: Tam dolu çözüm üret
  let solutionRaw = generateSolution(size);
  await yieldToUI();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  // Adım 3: Çözümden hücre silerek puzzle oluştur
  let initialRaw = generatePuzzle(solutionRaw, difficulty);
  await yieldToUI();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  return { initialRaw, solutionRaw };
}

// ---------------------------------------------------------------------------
// Önbellek yöneticisi — birden fazla sonraki seviye için
// ---------------------------------------------------------------------------

type PrecomputeCallback = (key: string, puzzle: GeneratedPuzzle) => void;

interface PrecomputeJob {
  key: string;
  size: number;
  difficulty: Difficulty;
  controller: AbortController;
}

/**
 * Birden fazla puzzle'ı sırayla arka planda hesaplar.
 * Her biri tamamlandığında `onReady` callback'i çağrılır.
 *
 * @example
 * const manager = new PrecomputeManager((key, puzzle) => {
 *   store.storePrecomputed(key, puzzle);
 * });
 * manager.enqueue('level_42', 10, 'normal');
 * manager.enqueue('level_43', 10, 'normal');
 */
export class PrecomputeManager {
  private queue: PrecomputeJob[] = [];
  private running = false;
  private onReady: PrecomputeCallback;

  constructor(onReady: PrecomputeCallback) {
    this.onReady = onReady;
  }

  enqueue(key: string, size: number, difficulty: Difficulty): void {
    // Aynı key zaten kuyruktaysa ekleme
    if (this.queue.some((j) => j.key === key)) return;

    const controller = new AbortController();
    this.queue.push({ key, size, difficulty, controller });

    if (!this.running) this.processNext();
  }

  cancel(key: string): void {
    const job = this.queue.find((j) => j.key === key);
    if (job) {
      job.controller.abort();
      this.queue = this.queue.filter((j) => j.key !== key);
    }
  }

  cancelAll(): void {
    this.queue.forEach((j) => j.controller.abort());
    this.queue = [];
    this.running = false;
  }

  private async processNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.running = false;
      return;
    }

    this.running = true;
    const job = this.queue[0];

    try {
      const puzzle = await precomputePuzzleAsync(
        job.size,
        job.difficulty,
        job.controller.signal
      );
      this.onReady(job.key, puzzle);
    } catch {
      // AbortError veya beklenmedik hata — sessizce geç
    } finally {
      this.queue.shift();
      this.processNext();
    }
  }
}
