/**
 * Oyun Motoru Birleştirici Hook
 *
 * Store + Engine + Haptics + Audio'yu tek bir arayüzde toplar.
 * Oyun ekranı (`level/[id].tsx`) bu hook'u kullanır.
 */
import { Audio } from "expo-av";
import { useCallback, useEffect, useRef } from "react";
import { isBoardFilled } from "../engine/solver";
import { rawFromGrid } from "../engine/validator";
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

  const { availableHints, isPremium, consumeHint } = useUserStore();
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const { trigger: haptic } = useHaptics();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

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

  // --- Hata Haptik & Ses ---
  const prevErrorRef = useRef(false);
  useEffect(() => {
    if (hasActiveError && !prevErrorRef.current) {
      haptic("error");
      if (soundEnabled) playSound("wolf");
    }
    prevErrorRef.current = hasActiveError;
  // haptic ve playSound stabil callback'ler, soundEnabled değeri effect içinde okunur
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveError]);

  // --- Tamamlama Haptik & Ses ---
  useEffect(() => {
    if (isComplete) {
      haptic("success");
      if (soundEnabled) playSound("complete");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  // --- Ses yardımcısı ---
  const playSound = useCallback(async (type: keyof typeof SOUND_MAP) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(SOUND_MAP[type]);
      soundRef.current = sound;
      await sound.playAsync();
    } catch {
      // Ses dosyası yüklenemediyse sessizce devam et
    }
  }, []);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

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
    availableHints: isPremium ? Infinity : availableHints,
    blindCheckNeeded,
    handleTapCell,
    handleApplyHint,
    resetUserCells,
    startGame,
  };
}
