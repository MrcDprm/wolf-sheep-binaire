/**
 * Oyun motoru hook'u
 *
 * Store, kural motoru, süre, kayıt, titreşim ve sesleri tek yerde toplar.
 * Seviye ekranı (`level/[id].tsx`) ve günün bulmacası ekranı (`daily.tsx`) bu hook'u kullanır;
 * günün bulmacasının sonucu seviye ilerlemesine değil günlük kayda yazılır.
 */
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { warningSecondsFor } from '../constants/difficulties';
import { createSnapshot } from '../engine/savedGame';
import { findTripleAnimals } from '../engine/validator';
import { useDailyStore } from '../store/useDailyStore';
import { useGameStore } from '../store/useGameStore';
import { useSavedGamesStore } from '../store/useSavedGamesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useUserStore } from '../store/useUserStore';
import { computeLevelScore } from '../utils/scoring';
import type { GameLevel } from '../types/game';
import { useHaptics } from './useHaptics';
import { useSavedGamesHydrated } from './useSavedGamesHydrated';

// Sesler scripts/make-sounds.py ile sentezlenir; hiçbiri döngüde çalmaz
const SOUND_MAP = {
  wolf: require('../../assets/sounds/wolf.mp3'),
  sheep: require('../../assets/sounds/sheep.mp3'),
  error: require('../../assets/sounds/error.mp3'),
  complete: require('../../assets/sounds/complete.mp3'),
  timeup: require('../../assets/sounds/timeup.mp3'),
  hint: require('../../assets/sounds/hint.mp3'),
};

type SoundName = keyof typeof SOUND_MAP;

/** Uygulama ön planda mı? ("unknown" gibi ara durumlar ön plan sayılır, süre durmasın) */
const isForeground = (state: AppStateStatus) => state !== 'background' && state !== 'inactive';

/** Ayarlara göre seviyenin süre sınırı (kapalıysa null) */
const timeLimitFor = (level: GameLevel) =>
  useSettingsStore.getState().timeLimitEnabled ? level.timeLimit : null;

/**
 * Oynanan seviyenin anlık halini telefona yazar ("gir çık" yapınca süre ve tahta sıfırlanmasın).
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

  const snapshot = createSnapshot(level, grid, elapsedSeconds, hintsUsed);
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
  const canUndo = useGameStore((s) => s.history.length > 0);
  const lastHint = useGameStore((s) => s.lastHint);
  const isPaused = useGameStore((s) => s.isPaused);
  const { initGame, tapCell, applyHint, resetUserCells, undo, pause, resume, tickTimer, resetGame } =
    useGameStore.getState();

  const availableHints = useUserStore((s) => s.availableHints);
  const consumeHint = useUserStore((s) => s.consumeHint);
  const recordLevelResult = useUserStore((s) => s.recordLevelResult);
  const setLastLevel = useUserStore((s) => s.setLastLevel);
  const recordDailyResult = useDailyStore((s) => s.recordResult);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const { trigger: haptic } = useHaptics();

  // Ekrandaki seviye store'dakiyle aynı mı? (seviye değişirken eski tahta görünmesin)
  const ready = level !== undefined && activeLevel?.id === level.id;
  // Yarım kalan seviyeler telefondan yüklenmeden seviye başlatılmaz
  const savesReady = useSavedGamesHydrated();

  // --- Seviyeyi başlat: yarım kaldıysa kaldığı yerden ---
  // ("Devam et" de bir dahaki sefere bu zorluktan devam etsin; günün bulmacası bunu değiştirmez)
  useEffect(() => {
    if (!level || !savesReady) return;
    initGame(level, timeLimitFor(level), useSavedGamesStore.getState().games[String(level.id)]);
    if (level.dailyDate === undefined) setLastLevel(level.id);
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
      // Arka plana geçerken kaydet (telefon uygulamayı kapatsa da kaldığı yer kalır) ve duraklat:
      // oyuncu dönünce süre hemen akmaz, "Devam et"e basınca devam eder
      if (!foreground) {
        saveProgress();
        pause();
      }
    });
    return () => sub.remove();
  }, [pause]);

  useEffect(() => {
    if (!ready || isComplete || isTimeUp || isPaused || !appActive) return;
    const timer = setInterval(tickTimer, 1000);
    return () => clearInterval(timer);
  }, [ready, isComplete, isTimeUp, isPaused, appActive, tickTimer]);

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
    if (!result || !level) return;
    if (level.dailyDate !== undefined) recordDailyResult(level.dailyDate, result);
    else recordLevelResult(level.id, result);
  }, [result, level, recordLevelResult, recordDailyResult]);

  // --- Sesler ---
  // Her ses bir kez yüklenir ve tekrar kullanılır
  const playersRef = useRef<Partial<Record<SoundName, AudioPlayer>>>({});

  const getPlayer = useCallback((type: SoundName) => {
    let player = playersRef.current[type];
    if (!player) {
      player = createAudioPlayer(SOUND_MAP[type]);
      playersRef.current[type] = player;
    }
    return player;
  }, []);

  /** Sesi baştan bir kez çalar; başka bir ses çalıyorsa önce onu susturur (sesler üst üste binmez) */
  const playOnce = useCallback(
    (type: SoundName) => {
      try {
        for (const [name, other] of Object.entries(playersRef.current)) {
          if (name !== type && other?.playing) other.pause();
        }
        const player = getPlayer(type);
        player.seekTo(0);
        player.play();
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

  // Hata satırı için hangi hayvanın üçlüsü var (hatalar yalnızca tahta doluyken gösterilir)
  const triples = useMemo(() => findTripleAnimals(grid), [grid]);

  /**
   * Bir hamleden (dokunma, ipucu) sonra tahta yeni dolup hatalı çıktıysa bir kez titreşim ve
   * tek kısa ses: koyun üçlüsü → meleme, kurt üçlüsü → uluma (hata satırıyla aynı sıra).
   * Hatalı dolu tahtada düzeltirken her dokunuşta tekrarlamaz. Hata bildirildiyse true.
   */
  const announceMistake = useCallback(
    (wasWrong: boolean): boolean => {
      const { hasActiveError: wrong, grid: board } = useGameStore.getState();
      if (!wrong || wasWrong) return false;
      haptic('error');
      if (soundEnabled) {
        // Üçlü yoksa hata satır/sütun dengesindedir: iki tok nota
        const animals = findTripleAnimals(board);
        playOnce(animals.sheep ? 'sheep' : animals.wolf ? 'wolf' : 'error');
      }
      return true;
    },
    [haptic, soundEnabled, playOnce],
  );

  // --- Süre titreşimleri: sayaç kırmızıya dönünce uyarı, süre dolunca hata (birer kez) ---
  const prevRunningOutRef = useRef(false);
  useEffect(() => {
    if (timeRunningOut && !prevRunningOutRef.current) haptic('warning');
    prevRunningOutRef.current = timeRunningOut;
  }, [timeRunningOut, haptic]);

  const prevTimeUpRef = useRef(false);
  useEffect(() => {
    if (isTimeUp && !prevTimeUpRef.current) {
      haptic('error');
      if (soundEnabled) playOnce('timeup');
    }
    prevTimeUpRef.current = isTimeUp;
    // Sadece süre dolduğu an çalsın; ses ayarı değişince tekrar çalmasın
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const before = useGameStore.getState();
      if (before.isComplete || before.isTimeUp) return;
      tapCell(row, col);
      if (!announceMistake(before.hasActiveError)) haptic('light');
    },
    [tapCell, haptic, announceMistake],
  );

  /** Son hamleyi geri alır; tahtayı hatalı dolu bırakırsa dokunuş gibi bildirilir */
  const handleUndo = useCallback(() => {
    const before = useGameStore.getState();
    if (!undo()) return;
    if (!announceMistake(before.hasActiveError)) haptic('light');
  }, [undo, haptic, announceMistake]);

  /** İpucu uygular. İpucu hakkı yoksa false döner (ekran uyarı gösterir). */
  const handleApplyHint = useCallback((): boolean => {
    if (availableHints <= 0) return false;
    const wasWrong = useGameStore.getState().hasActiveError;
    if (applyHint()) {
      consumeHint();
      // İpucu son boşluğu doldurup tahtayı hatalı bıraktıysa hata sesi önceliklidir
      if (!announceMistake(wasWrong)) {
        haptic('medium');
        if (soundEnabled) playOnce('hint');
      }
    }
    return true;
  }, [availableHints, applyHint, consumeHint, haptic, announceMistake, soundEnabled, playOnce]);

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
    canUndo,
    lastHint,
    isPaused,
    pause,
    resume,
    handleTapCell,
    handleUndo,
    handleApplyHint,
    resetUserCells,
    restartLevel,
  };
}
