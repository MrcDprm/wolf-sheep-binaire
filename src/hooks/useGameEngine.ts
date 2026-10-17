/**
 * Oyun motoru hook'u
 *
 * Store, kural motoru, titreşim ve sesleri tek yerde toplar.
 * Oyun ekranı (`level/[id].tsx`) bu hook'u kullanır.
 */
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { findTripleAnimals } from '../engine/validator';
import { useGameStore } from '../store/useGameStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useUserStore } from '../store/useUserStore';
import { computeLevelScore } from '../utils/scoring';
import type { GameLevel } from '../types/game';
import { useHaptics } from './useHaptics';

const SOUND_MAP = {
  wolf: require('../../assets/sounds/wolf.mp3'),
  sheep: require('../../assets/sounds/sheep.mp3'),
  complete: require('../../assets/sounds/complete.mp3'),
};

type SoundName = keyof typeof SOUND_MAP;

export function useGameEngine(level: GameLevel | undefined) {
  const grid = useGameStore((s) => s.grid);
  const activeLevel = useGameStore((s) => s.level);
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const elapsedSeconds = useGameStore((s) => s.elapsedSeconds);
  const isComplete = useGameStore((s) => s.isComplete);
  const hasActiveError = useGameStore((s) => s.hasActiveError);
  const { initGame, tapCell, applyHint, resetUserCells, tickTimer, resetGame } = useGameStore.getState();

  const availableHints = useUserStore((s) => s.availableHints);
  const consumeHint = useUserStore((s) => s.consumeHint);
  const recordLevelResult = useUserStore((s) => s.recordLevelResult);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const { trigger: haptic } = useHaptics();

  // Ekrandaki seviye store'dakiyle aynı mı? (seviye değişirken eski tahta görünmesin)
  const ready = level !== undefined && activeLevel?.id === level.id;

  // --- Seviyeyi başlat ---
  useEffect(() => {
    if (!level) return;
    initGame(level);
    return () => resetGame();
  }, [level, initGame, resetGame]);

  // --- Süre ---
  useEffect(() => {
    if (!ready || isComplete) return;
    const timer = setInterval(tickTimer, 1000);
    return () => clearInterval(timer);
  }, [ready, isComplete, tickTimer]);

  // --- Bitince sonucu bir kez kaydet ---
  const result = useMemo(
    () => (ready && isComplete && level ? computeLevelScore({ hintsUsed, elapsedSeconds, level }) : null),
    // Süre bitişte donar; sonuç sadece tamamlanma anındaki değerlerle hesaplanır
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, isComplete, level],
  );

  useEffect(() => {
    if (result && level) recordLevelResult(level.id, result);
  }, [result, level, recordLevelResult]);

  // --- Sesler ---
  // Her ses bir kez yüklenir ve tekrar kullanılır
  const playersRef = useRef<Partial<Record<SoundName, AudioPlayer>>>({});

  const getPlayer = useCallback((type: SoundName) => {
    let player = playersRef.current[type];
    if (!player) {
      player = createAudioPlayer(SOUND_MAP[type]);
      // Kurt ve koyun üçlü düzelene kadar döngüde çalar
      player.loop = type !== 'complete';
      playersRef.current[type] = player;
    }
    return player;
  }, []);

  const playOnce = useCallback(
    (type: SoundName) => {
      try {
        const player = getPlayer(type);
        player.seekTo(0);
        player.play();
      } catch {
        // Ses çalınamadıysa oyun sessizce devam eder
      }
    },
    [getPlayer],
  );

  /** Döngüdeki sesi başlatır ya da durdurup başa sarar. */
  const setLooping = useCallback(
    (type: SoundName, on: boolean) => {
      try {
        const existing = playersRef.current[type];
        if (!on) {
          if (existing?.playing) {
            existing.pause();
            existing.seekTo(0);
          }
          return;
        }
        const player = existing ?? getPlayer(type);
        if (!player.playing) player.play();
      } catch {
        // Ses çalınamadıysa oyun sessizce devam eder
      }
    },
    [getPlayer],
  );

  useEffect(() => {
    const players = playersRef.current;
    return () => {
      Object.values(players).forEach((p) => p?.remove());
    };
  }, []);

  // Üçlü düzeltilene kadar: 3 kurt → uluma, 3 koyun → meleme
  const triples = useMemo(() => findTripleAnimals(grid), [grid]);
  const loopWolf = soundEnabled && ready && !isComplete && triples.wolf;
  const loopSheep = soundEnabled && ready && !isComplete && triples.sheep;

  useEffect(() => {
    setLooping('wolf', loopWolf);
  }, [loopWolf, setLooping]);

  useEffect(() => {
    setLooping('sheep', loopSheep);
  }, [loopSheep, setLooping]);

  // --- Hata titreşimi (her yeni hatada bir kez) ---
  const prevErrorRef = useRef(false);
  useEffect(() => {
    if (hasActiveError && !prevErrorRef.current) haptic('error');
    prevErrorRef.current = hasActiveError;
  }, [hasActiveError, haptic]);

  // --- Tamamlama titreşimi ve sesi ---
  useEffect(() => {
    if (!result) return;
    haptic('success');
    if (soundEnabled) playOnce('complete');
    // Sadece tamamlandığı an çalsın; ses ayarı değişince tekrar çalmasın
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // --- Hücreye dokunma ---
  const handleTapCell = useCallback(
    (row: number, col: number) => {
      tapCell(row, col);
      haptic('light');
    },
    [tapCell, haptic],
  );

  /** İpucu uygular. İpucu hakkı yoksa false döner (ekran uyarı gösterir). */
  const handleApplyHint = useCallback((): boolean => {
    if (availableHints <= 0) return false;
    if (applyHint()) {
      consumeHint();
      haptic('medium');
    }
    return true;
  }, [availableHints, applyHint, consumeHint, haptic]);

  return {
    ready,
    grid,
    elapsedSeconds,
    isComplete,
    hasActiveError,
    availableHints,
    result,
    handleTapCell,
    handleApplyHint,
    resetUserCells,
  };
}
