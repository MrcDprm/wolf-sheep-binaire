/**
 * Oyun Motoru Birleştirici Hook
 *
 * Store + Engine + Haptics + Audio'yu tek bir arayüzde toplar.
 * Oyun ekranı (`level/[id].tsx`) bu hook'u kullanır.
 */
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { isBoardFilled } from "../engine/solver";
import { findTripleAnimals, rawFromGrid } from "../engine/validator";
import type { PrecomputedEntry } from "../store/useGameStore";
import { useGameStore } from "../store/useGameStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useUserStore } from "../store/useUserStore";
import type { GameLevel, GameMode } from "../types/game";
import { useHaptics } from "./useHaptics";

// Ses dosyası referansları (assets/sounds/ altında olmalı)
const SOUND_MAP = {
  wolf: require("../../assets/sounds/wolf.mp3"),
  sheep: require("../../assets/sounds/sheep.mp3"),
  complete: require("../../assets/sounds/complete.mp3"),
};

export function useGameEngine() {
  const {
    grid,
    level,
    hintsUsed,
    elapsedSeconds,
    isBlindMode,
    isComplete,
    hasActiveError,
    tapCell,
    applyHint,
    resetUserCells,
    tickTimer,
    initGame,
  } = useGameStore();

  const { availableHints, consumeHint } = useUserStore();
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const { trigger: haptic } = useHaptics();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playersRef = useRef<Partial<Record<keyof typeof SOUND_MAP, AudioPlayer>>>({});

  // --- Timer ---
  useEffect(() => {
    if (isComplete) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(tickTimer, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isComplete, tickTimer]);

  // --- Ses yardımcıları ---
  // Her ses bir kez yüklenir ve tekrar kullanılır
  const getPlayer = useCallback((type: keyof typeof SOUND_MAP) => {
    let player = playersRef.current[type];
    if (!player) {
      player = createAudioPlayer(SOUND_MAP[type]);
      // Kurt ve koyun üçlü düzelene kadar döngüde çalar
      player.loop = type !== "complete";
      playersRef.current[type] = player;
    }
    return player;
  }, []);

  const playOnce = useCallback(
    (type: keyof typeof SOUND_MAP) => {
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
    (type: keyof typeof SOUND_MAP, on: boolean) => {
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

  // --- Üçlü sesleri: üçlü düzeltilene kadar döngüde çalar ---
  const triples = useMemo(() => findTripleAnimals(grid), [grid]);
  const loopWolf = soundEnabled && !isBlindMode && !isComplete && triples.wolf;
  const loopSheep = soundEnabled && !isBlindMode && !isComplete && triples.sheep;

  useEffect(() => {
    setLooping("wolf", loopWolf);
  }, [loopWolf, setLooping]);

  useEffect(() => {
    setLooping("sheep", loopSheep);
  }, [loopSheep, setLooping]);

  // --- Hata titreşimi (her yeni hatada bir kez) ---
  const prevErrorRef = useRef(false);
  useEffect(() => {
    if (hasActiveError && !prevErrorRef.current) haptic("error");
    prevErrorRef.current = hasActiveError;
  }, [hasActiveError, haptic]);

  // --- Tamamlama titreşimi ve sesi ---
  useEffect(() => {
    if (!isComplete) return;
    haptic("success");
    if (soundEnabled) playOnce("complete");
  // Sadece tamamlandığı an çalsın; ses ayarı değişince tekrar çalmasın
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  // --- Hücreye dokunma ---
  const handleTapCell = useCallback(
    (row: number, col: number) => {
      tapCell(row, col);
      haptic("light");
    },
    [tapCell, haptic],
  );

  // --- İpucu kullan ---
  const handleApplyHint = useCallback(() => {
    if (isBlindMode) return; // İmkansız modda ipucu yok

    const canUse = consumeHint(); // Store'dan düş (regular function, not a hook)
    if (!canUse) return; // Yetersiz ipucu

    applyHint();
    haptic("medium");
  }, [isBlindMode, consumeHint, applyHint, haptic]);

  // --- Oyunu başlat ---
  const startGame = useCallback(
    (lvl: GameLevel, mode: GameMode, precomputed: PrecomputedEntry) => {
      initGame(lvl, mode, precomputed);
    },
    [initGame],
  );

  // --- İmkansız modda tahta dolunca kontrol ---
  const blindCheckNeeded =
    isBlindMode && !isComplete && grid.length > 0
      ? isBoardFilled(rawFromGrid(grid))
      : false;

  return {
    grid,
    level,
    hintsUsed,
    elapsedSeconds,
    isBlindMode,
    isComplete,
    hasActiveError,
    availableHints,
    blindCheckNeeded,
    handleTapCell,
    handleApplyHint,
    resetUserCells,
    startGame,
  };
}
