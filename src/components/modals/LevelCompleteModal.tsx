/**
 * LevelCompleteModal — Seviye Tamamlama Ekranı
 *
 * - Şeffaf Modal + Reanimated scale-in kart animasyonu
 * - Yıldız göstergesi (kazanılan sarı, kalanlar gri)
 * - Puan dökümü: Baz + Zaman Bonusu + Toplam
 * - Süre göstergesi
 * - "Sonraki Seviye", "Paylaş", "Menüye Dön" butonları
 */
import React, { useEffect, memo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { formatTime } from '../../utils/scoring';
import { useTranslation } from '../../i18n';
import type { LevelResult } from '../../types/game';

interface LevelCompleteModalProps {
  visible: boolean;
  levelId: number;
  result: LevelResult;
  baseScore: number;
  timeBonus: number;
  accentColor: string;
  onClose: () => void;
}

function StarIcon({ filled, size = 32 }: { filled: boolean; size?: number }) {
  return (
    <Text style={{ fontSize: size, opacity: filled ? 1 : 0.25 }}>⭐</Text>
  );
}

function ScoreRow({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <View style={scoreRowStyles.row}>
      <Text style={scoreRowStyles.label}>{label}</Text>
      <Text style={[scoreRowStyles.value, highlight && scoreRowStyles.highlightValue]}>
        {value}
      </Text>
    </View>
  );
}

const scoreRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  highlightValue: {
    fontSize: 20,
    color: '#F9A825',
  },
});

function LevelCompleteModalComponent({
  visible,
  levelId,
  result,
  baseScore,
  timeBonus,
  accentColor,
  onClose,
}: LevelCompleteModalProps) {
  const router = useRouter();
  const t = useTranslation();

  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withDelay(50, withSpring(1, { damping: 14, stiffness: 180 }));
      opacity.value = withDelay(50, withTiming(1, { duration: 200 }));
    } else {
      scale.value = 0.6;
      opacity.value = 0;
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const starLabel = ['', t('stars.noStar'), t('stars.good'), t('stars.great'), t('stars.perfect')];

  const handleNextLevel = () => {
    onClose();
    router.replace(`/(game)/level/${levelId + 1}`);
  };

  const handleShare = () => {
    onClose();
    router.push(
      `/share-result?level=${levelId}&stars=${result.stars}&time=${result.time}&score=${result.score}&percentile=50`
    );
  };

  const handleMenu = () => {
    onClose();
    router.replace('/(game)');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Başlık */}
          <Text style={styles.title}>{t('game.levelComplete')}</Text>

          {/* Yıldızlar */}
          <View style={styles.starsRow}>
            {[1, 2, 3].map((i) => (
              <StarIcon key={i} filled={i <= result.stars} size={38} />
            ))}
          </View>
          <Text style={[styles.starLabel, { color: accentColor }]}>
            {starLabel[result.stars + 1]}
          </Text>

          {/* Süre */}
          <View style={styles.timeBadge}>
            <Text style={styles.timeEmoji}>⏱</Text>
            <Text style={styles.timeText}>{formatTime(result.time)}</Text>
          </View>

          {/* Puan dökümü */}
          <View style={styles.scoreBox}>
            <ScoreRow label={t('scoring.baseScore')} value={`+${baseScore}`} />
            {timeBonus > 0 && (
              <ScoreRow label={t('scoring.timeBonus')} value={`+${timeBonus}`} />
            )}
            <View style={styles.divider} />
            <ScoreRow label={t('scoring.totalScore')} value={`${result.score}`} highlight />
          </View>

          {/* Butonlar */}
          <TouchableOpacity
            style={[styles.btnPrimary, { backgroundColor: accentColor }]}
            onPress={handleNextLevel}
          >
            <Text style={styles.btnPrimaryText}>{t('game.nextLevel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={handleShare}>
            <Text style={[styles.btnSecondaryText, { color: accentColor }]}>
              {t('game.shareResult')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnGhost} onPress={handleMenu}>
            <Text style={styles.btnGhostText}>{t('game.backToMenu')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

export const LevelCompleteModal = memo(LevelCompleteModalComponent);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  starLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: -4,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  timeEmoji: {
    fontSize: 18,
  },
  timeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
    fontVariant: ['tabular-nums'],
  },
  scoreBox: {
    width: '100%',
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 14,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
    marginVertical: 6,
  },
  btnPrimary: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  btnSecondary: {
    width: '100%',
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '700',
  },
  btnGhost: {
    paddingVertical: 6,
  },
  btnGhostText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
});
