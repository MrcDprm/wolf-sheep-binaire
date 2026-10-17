/**
 * Arka Plan Ön-Hesaplama Hook'u
 *
 * Oyuncu aktif seviyeyi oynarken, bir sonraki seviye için grid'i
 * arka planda sessizce hesaplar ve store'a kaydeder.
 *
 * Kullanım:
 *   usePrecompute(currentLevel); // oyun ekranında çağrılır
 */
import { useEffect, useState } from 'react';
import type { GameLevel } from '../types/game';
import { PrecomputeManager } from '../engine/precompute';
import { useGameStore } from '../store/useGameStore';
import { getLevelById } from '../constants/levels';

export function usePrecompute(currentLevel: GameLevel | null): void {
  const storePrecomputed = useGameStore((s) => s.storePrecomputed);
  const getPrecomputed = useGameStore((s) => s.getPrecomputed);
  // Yönetici bileşen başına bir kez oluşturulur
  const [manager] = useState(
    () => new PrecomputeManager((key, puzzle) => storePrecomputed(key, puzzle))
  );

  useEffect(() => {
    if (!currentLevel) return;

    // Mevcut seviyenin +1 ve +2'sini önceden hesapla
    for (const offset of [1, 2]) {
      const nextLevel = getLevelById(currentLevel.id + offset);
      if (!nextLevel) continue;

      const key = `level_${nextLevel.id}`;
      if (getPrecomputed(key)) continue; // Zaten hesaplandı

      manager.enqueue(key, nextLevel.gridSize, nextLevel.difficulty);
    }

    return () => {
      // Seviye değişirse eski hesaplamayı iptal etme — tamamlansın
    };
  }, [currentLevel?.id]);

  // Bileşen unmount olunca tüm aktif hesaplamaları iptal et
  useEffect(() => {
    return () => {
      manager.cancelAll();
    };
  }, [manager]);
}
