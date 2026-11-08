/**
 * Oyun motoru hook'u
 *
 * Store, kural motoru, süre, kayıt, titreşim ve sesleri tek yerde toplar.
 * Oyun ekranı (`level/[id].tsx`) bu hook'u kullanır.
 */
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { warningSecondsFor } from '../constants/difficulties';
import { createSnapshot } from '../engine/savedGame';
import { findTripleAnimals } from '../engine/validator';
import { useGameStore } from '../store/useGameStore';
import { useSavedGamesStore } from '../store/useSavedGamesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useUserStore } from '../store/useUserStore';
import { computeLevelScore } from '../utils/scoring';
import type { GameLevel } from '../types/game';
import { useHaptics } from './useHaptics';
import { useSavedGamesHydrated } from './useSavedGamesHydrated';

const SOUND_MAP = {
  wolf: require('../../assets/sounds/wolf.mp3'),
  sheep: require('../../assets/sounds/sheep.mp3'),
  complete: require('../../assets/sounds/complete.mp3'),
};

type SoundName = keyof typeof SOUND_MAP;

/** Uygulama ön planda mı? ("unknown" gibi ara durumlar ön plan sayılır, süre durmasın) */
const isForeground = (state: AppStateStatus) => state !== 'background' && state !== 'inactive';

/** Ayarlara göre seviyenin süre sınırı (kapalıysa null) */
const timeLimitFor = (level: GameLevel) =>
  useSettingsStore.getState().timeLimitEnabled ? level.timeLimit : null;

/**
 * Oynanan seviyenin anlık hâlini telefona yazar ("gir çık" yapınca süre ve tahta sıfırlanmasın).
 * Seviye bittiyse ya da süresi dolduysa kaydı siler. Hiç dokunulmamış tahta kaydedilmez.
 */
function saveProgress() {
  const { level, grid, elapsedSeconds, hintsUsed, isComplete, isTimeUp } = useGameStore.getState();
  if (!level || grid.length === 0) return;

  const savedGames = useSavedGamesStore.getState();
  if (isComplete || isTimeUp) {
    savedGames.clearGame(level.id);
    return;
  }

  const snapshot = createSnapshot(level, grid, elapsedSeconds);
  // İlk saniyede alınan ipucu da kaydedilsin (ipucu hücresi kilitli olduğu için tahtadan anlaşılmaz)
  const untouched =
    elapsedSeconds === 0 &&
    hintsUsed === 0 &&
    grid.every((row) => row.every((cell) => cell.isLocked || cell.value === 0));
  if (!untouched) savedGames.saveGame(level.id, snapshot);
}

export function useGameEngine(level: GameLevel | undefined) {
  const grid = useGameStore((s) => s.grid);
  const activeLevel = useGameStore((s) => s.level);
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const elapsedSeconds = useGameStore((s) => s.elapsedSeconds);
  const isComplete = useGameStore((s) => s.isComplete);
  const hasActiveError = useGameStore((s) => s.hasActiveError);
  const timeLimit = useGameStore((s) => s.timeLimit);
  const isTimeUp = useGameStore((s) => s.isTimeUp);
  const { initGame, tapCell, applyHint, resetUserCells, tickTimer, resetGame } = useGameStore.getState();

  const availableHints = useUserStore((s) => s.availableHints);
  const consumeHint = useUserStore((s) => s.consumeHint);
  const recordLevelResult = useUserStore((s) => s.recordLevelResult);
  const setLastLevel = useUserStore((s) => s.setLastLevel);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const { trigger: haptic } = useHaptics();

  // Ekrandaki seviye store'dakiyle aynı mı? (seviye değişirken eski tahta görünmesin)
  const ready = level !== undefined && activeLevel?.id === level.id;
  // Yarım kalan seviyeler telefondan yüklenmeden seviye başlatılmaz
  const savesReady = useSavedGamesHydrated();

  // --- Seviyeyi başlat: yarım kaldıysa kaldığı yerden ---
  // ("Devam et" de bir dahaki sefere bu zorluktan devam etsin)
  useEffect(() => {
    if (!level || !savesReady) return;
    initGame(level, timeLimitFor(level), useSavedGamesStore.getState().games[String(level.id)]);
    setLastLevel(level.id);
    return () => {
      // Çıkarken (kapat, oklar, Sonraki seviye) kaldığı yer kaydedilir
      saveProgress();
      resetGame();
    };
  }, [level, savesReady, initGame, resetGame, setLastLevel]);

  // Tahta değişince kaydet; bitince ya da süre dolunca kaydı sil
  useEffect(() => {
    if (ready) saveProgress();
  }, [ready, grid, isComplete, isTimeUp]);

  /** Süre dolunca "Tekrar dene": tahta ve süre baştan */
  const restartLevel = useCallback(() => {
    if (!level) return;
    useSavedGamesStore.getState().clearGame(level.id);
    initGame(level, timeLimitFor(level));
  }, [level, initGame]);

  // --- Süre (uygulama arka plandayken durur) ---
  const [appActive, setAppActive] = useState(() => isForeground(AppState.currentState));
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const foreground = isForeground(state);
      setAppActive(foreground);
      // Arka plana geçerken de kaydet: telefon uygulamayı kapatsa da kaldığı yer kalır
      if (!foreground) saveProgress();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!ready || isComplete || isTimeUp || !appActive) return;
    const timer = setInterval(tickTimer, 1000);
    return () => clearInterval(timer);
  }, [ready, isComplete, isTimeUp, appActive, tickTimer]);

  // Süre sınırı varsa kalan süre; sona yaklaşınca sayaç kırmızıya döner
  const secondsLeft = timeLimit === null ? null : Math.max(0, timeLimit - elapsedSeconds);
  const timeRunningOut =
    timeLimit !== null &&
    secondsLeft !== null &&
    !isComplete &&
    !isTimeUp &&
    secondsLeft <= warningSecondsFor(timeLimit);

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

  // Üçlü düzeltilene kadar: 3 kurt → uluma, 3 koyun → meleme (süre dolunca susar)
  const triples = useMemo(() => findTripleAnimals(grid), [grid]);
  const playing = soundEnabled && ready && !isComplete && !isTimeUp;
  const loopWolf = playing && triples.wolf;
  const loopSheep = playing && triples.sheep;

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

  // --- Süre titreşimleri: sayaç kırmızıya dönünce uyarı, süre dolunca hata (birer kez) ---
  const prevRunningOutRef = useRef(false);
  useEffect(() => {
    if (timeRunningOut && !prevRunningOutRef.current) haptic('warning');
    prevRunningOutRef.current = timeRunningOut;
  }, [timeRunningOut, haptic]);

  const prevTimeUpRef = useRef(false);
  useEffect(() => {
    if (isTimeUp && !prevTimeUpRef.current) haptic('error');
    prevTimeUpRef.current = isTimeUp;
  }, [isTimeUp, haptic]);

  // --- Tamamlama titreşimi ve sesi ---
  useEffect(() => {
    if (!result) return;
    haptic('success');
    if (soundEnabled) playOnce('complete');
    // Sadece tamamlandığı an çalsın; ses ayarı değişince tekrar çalmasın
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // --- Hücreye dokunma (bitmiş ya da süresi dolmuş tahtada boşuna titremesin) ---
  const handleTapCell = useCallback(
    (row: number, col: number) => {
      const { isComplete: done, isTimeUp: timeUp } = useGameStore.getState();
      if (done || timeUp) return;
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
    timeLimit,
    secondsLeft,
    timeRunningOut,
    isTimeUp,
    isComplete,
    hasActiveError,
    triples,
    availableHints,
    result,
    handleTapCell,
    handleApplyHint,
    resetUserCells,
    restartLevel,
  };
}
