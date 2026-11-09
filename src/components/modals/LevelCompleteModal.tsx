/**
 * Seviye tamamlama penceresi
 *
 * Sonuç kartında (ResultModal) seviye adı, yıldızlar, süre ve kazanılan puan;
 * süre rekoru kırıldıysa "Yeni rekor!", kırılmadıysa en iyi süre.
 * Düğmeler: Sonraki seviye, Sonucu paylaş, Menüye dön.
 * Sonraki seviye başka bir zorluktaysa (ör. Kolay 50 → Orta 1) düğmede adı yazar.
 */
import { memo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { formatTime } from '../../utils/scoring';
import { useTranslation } from '../../i18n';
import { useDayPhase } from '../../hooks/useDayPhase';
import { getLevelById, levelAfter } from '../../constants/levels';
import { useUserStore } from '../../store/useUserStore';
import { Button } from '../ui/Button';
import { ResultLink, ResultModal } from './ResultModal';
import { cardColors, fontSize, fonts } from '../../theme';
import type { GameLevel, LevelResult } from '../../types/game';

interface LevelCompleteModalProps {
  visible: boolean;
  levelId: number;
  result: LevelResult;
  onClose: () => void;
}

function LevelCompleteModalComponent({
  visible,
  levelId,
  result,
  onClose,
}: LevelCompleteModalProps) {
  const router = useRouter();
  const t = useTranslation();
  const dayPhase = useDayPhase();
  const card = cardColors(dayPhase.dark);
  const level = getLevelById(levelId);
  const completedLevels = useUserStore((s) => s.completedLevels);
  // Rekor bilgisi sonuç kaydedilince gelir; bu seviyeye aitse gösterilir
  const lastRecord = useUserStore((s) => s.lastRecord);
  const record = lastRecord?.levelId === levelId ? lastRecord : null;
  // Bu seviyenin sonucu kayda bir sonraki çizimde geçiyor; burada şimdiden bitmiş sayılır
  const nextId = levelAfter(levelId, { ...completedLevels, [String(levelId)]: result });
  const nextLevel = nextId === null ? undefined : getLevelById(nextId);

  const goNext = () => {
    if (nextId === null) return;
    onClose();
    router.replace(`/(game)/level/${nextId}`);
  };

  const goShare = () => {
    onClose();
    router.push(
      `/share-result?level=${levelId}&stars=${result.stars}&time=${result.time}&score=${result.score}`,
    );
  };

  // Yığındaki menüye geri döner (replace menüyü üstüne yeniden açıyordu; geri kaydırınca
  // Seviyeler ekranı çıkıyordu)
  const goMenu = () => {
    onClose();
    router.dismissTo('/(game)');
  };

  const nameOf = (l: GameLevel) =>
    t('game.level', { difficulty: t(`difficulty.${l.difficulty}`), number: l.number });
  const levelName = level ? nameOf(level) : '';
  // Sonraki seviye başka zorluktaysa düğmede nereye gidileceği yazar
  const nextSubtitle =
    nextLevel && nextLevel.difficulty !== level?.difficulty ? nameOf(nextLevel) : undefined;

  // Önceki en iyi süre geçildiyse rekor; geçilmediyse en iyi süre (ilk çözümde ikisi de yok)
  const badge = record?.isNew
    ? { text: t('game.newRecord'), highlight: true }
    : record && record.best < result.time
      ? { text: t('game.best', { time: formatTime(record.best) }), highlight: false }
      : undefined;

  return (
    <ResultModal
      visible={visible}
      title={t('game.levelComplete')}
      subtitle={levelName}
      stars={result.stars}
      facts={[
        { value: formatTime(result.time), label: t('game.time') },
        { value: `+${result.score}`, label: t('scoring.totalScore') },
      ]}
      badge={badge}
      onClose={onClose}
    >
      {nextId !== null ? (
        <Button title={t('game.nextLevel')} subtitle={nextSubtitle} onPress={goNext} />
      ) : (
        <Text style={[styles.allDone, { color: card.text }]}>{t('game.allDone')}</Text>
      )}
      <Button
        title={t('game.shareResult')}
        variant="secondary"
        colors={card.button}
        onPress={goShare}
      />
      <ResultLink title={t('game.backToMenu')} onPress={goMenu} />
    </ResultModal>
  );
}

export const LevelCompleteModal = memo(LevelCompleteModalComponent);

const styles = StyleSheet.create({
  allDone: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.body,
    textAlign: 'center',
    marginBottom: 6,
  },
});
