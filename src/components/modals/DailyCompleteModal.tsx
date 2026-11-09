/**
 * Günün bulmacası tamamlama penceresi
 *
 * Sonuç kartında (ResultModal) tarih, yıldızlar, süre ve seri. Altında tek not: seri en
 * uzun seriyi geçtiyse "En uzun serin!", geçmediyse en uzun seri, ikisi de değilse
 * "Yeni bulmaca yarın". Düğmeler: Sonucu paylaş, Menüye dön.
 */
import { memo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from '../../i18n';
import { useDailyStore } from '../../store/useDailyStore';
import {
  addDailyResult,
  currentStreak,
  isNewLongestStreak,
  longestStreak,
} from '../../engine/dailyResults';
import { formatDayKey, formatDays } from '../../utils/dailyText';
import { formatTime } from '../../utils/scoring';
import { Button } from '../ui/Button';
import { ResultLink, ResultModal } from './ResultModal';
import type { GameLevel, LevelResult } from '../../types/game';

interface DailyCompleteModalProps {
  visible: boolean;
  /** Günün bulmacası (dailyDate dolu) */
  level: GameLevel;
  result: LevelResult;
  onClose: () => void;
}

function DailyCompleteModalComponent({ visible, level, result, onClose }: DailyCompleteModalProps) {
  const router = useRouter();
  const t = useTranslation();
  const date = level.dailyDate ?? '';
  const saved = useDailyStore((s) => s.results);
  // Sonuç kayda bir sonraki çizimde geçiyor; seri burada şimdiden bugünle hesaplanır
  const results = addDailyResult(saved, date, result);
  const streak = currentStreak(results, date);
  const longest = longestStreak(results);

  const badge = isNewLongestStreak(results, date)
    ? { text: t('daily.newLongest'), highlight: true }
    : longest > streak
      ? { text: t('daily.longest', { count: longest }), highlight: false }
      : { text: t('daily.comeBack'), highlight: false };

  const goShare = () => {
    onClose();
    router.push(
      `/share-result?daily=${date}&stars=${result.stars}&time=${result.time}&streak=${streak}`,
    );
  };

  const goMenu = () => {
    onClose();
    router.dismissTo('/(game)');
  };

  return (
    <ResultModal
      visible={visible}
      title={t('daily.complete')}
      subtitle={t('daily.subtitle', {
        date: formatDayKey(date, t),
        difficulty: t(`difficulty.${level.difficulty}`),
      })}
      stars={result.stars}
      facts={[
        { value: formatTime(result.time), label: t('game.time') },
        { value: formatDays(streak, t), label: t('daily.streak') },
      ]}
      badge={badge}
      onClose={onClose}
    >
      <Button title={t('game.shareResult')} onPress={goShare} />
      <ResultLink title={t('game.backToMenu')} onPress={goMenu} />
    </ResultModal>
  );
}

export const DailyCompleteModal = memo(DailyCompleteModalComponent);
