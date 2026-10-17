/**
 * Sonuç paylaşım ekranı
 *
 * Bitirilen seviyenin bilgisini (seviye, yıldız, süre, puan) bir kart
 * hâlinde gösterir; "Paylaş" kartın görüntüsünü paylaşır.
 * Bilgiler bağlantı parametresinden geldiği için sınırlar içinde okunur.
 */
import { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from '../src/i18n';
import { formatTime } from '../src/utils/scoring';
import { shareCard } from '../src/utils/shareImage';
import { getLevelById, TOTAL_LEVELS } from '../src/constants/levels';

/** Sayı değilse ya da aralık dışındaysa sınıra çeker */
function readInt(value: string | undefined, min: number, max: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}

export default function ShareResultScreen() {
  const t = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ level: string; stars: string; time: string; score: string }>();
  const cardRef = useRef<View>(null);

  const level = getLevelById(readInt(params.level, 1, TOTAL_LEVELS)) ?? getLevelById(1)!;
  const stars = readInt(params.stars, 0, 3);
  const time = readInt(params.time, 0, 359999);
  const score = readInt(params.score, 0, 12);

  const levelName = t('game.level', {
    difficulty: t(`difficulty.${level.difficulty}`),
    number: level.number,
  });

  const handleShare = () =>
    shareCard(
      cardRef,
      t('share.message', { level: levelName, time: formatTime(time) }),
      t('share.title', { level: levelName })
    );

  return (
    <View style={styles.container}>
      {/* Paylaşılan kart; Android'de görüntüsü alınabilsin diye collapsable={false} */}
      <View ref={cardRef} collapsable={false} style={styles.card}>
        <Text style={styles.emoji}>🐑🐺</Text>
        <Text style={styles.title}>{t('app.name')}</Text>
        <Text style={styles.level}>{levelName}</Text>
        <Text style={styles.stars}>{'⭐'.repeat(stars)}</Text>
        <Text style={styles.time}>{formatTime(time)}</Text>
        <Text style={styles.score}>{t('menu.points', { count: score })}</Text>
      </View>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareBtnText}>{t('share.button')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeBtnText}>{t('share.close')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A237E',
    gap: 16,
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A237E',
  },
  level: {
    fontSize: 16,
    color: '#555',
  },
  stars: {
    fontSize: 28,
  },
  time: {
    fontSize: 32,
    fontWeight: '800',
    color: '#388E3C',
  },
  score: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9A825',
  },
  shareBtn: {
    backgroundColor: '#F9A825',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 14,
  },
  shareBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  closeBtn: {
    paddingVertical: 8,
  },
  closeBtnText: {
    color: '#9FA8DA',
    fontSize: 15,
  },
});
