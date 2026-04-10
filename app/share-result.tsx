/**
 * Sonuç Paylaşım Ekranı
 *
 * Bölüm tamamlama bilgisini (seviye, süre, yıldız, yüzdelik dilim)
 * güzel bir kart halinde gösterir ve paylaşım sağlar.
 */
import { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from '../src/i18n';
import { formatTime } from '../src/utils/scoring';
import { captureAndShare } from '../src/utils/shareImage';

export default function ShareResultScreen() {
  const t = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    level: string;
    stars: string;
    time: string;
    score: string;
    percentile: string;
  }>();

  const cardRef = useRef<any>(null);

  const level = params.level ?? '1';
  const stars = parseInt(params.stars ?? '0', 10);
  const time = parseInt(params.time ?? '0', 10);
  const score = parseInt(params.score ?? '0', 10);
  const percentile = parseInt(params.percentile ?? '50', 10);

  const starEmoji = ['', '⭐', '⭐⭐', '⭐⭐⭐'][stars] ?? '';

  const handleShare = async () => {
    const message = t('share.message', {
      level,
      time: formatTime(time),
      percentile,
    });
    const title = t('share.title', { level });
    await captureAndShare(cardRef, message, title);
  };

  return (
    <View style={styles.container}>
      {/* Paylaşım kartı */}
      <View ref={cardRef} style={styles.card}>
        <Text style={styles.emoji}>🐑🐺</Text>
        <Text style={styles.title}>Koyun & Kurt</Text>
        <Text style={styles.level}>Seviye {level}</Text>
        <Text style={styles.stars}>{starEmoji}</Text>
        <Text style={styles.time}>{formatTime(time)}</Text>
        <Text style={styles.percentile}>En İyi %{percentile}</Text>
        <Text style={styles.score}>{score} Puan</Text>
      </View>

      {/* Butonlar */}
      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareBtnText}>Paylaş</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeBtnText}>Kapat</Text>
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
  percentile: {
    fontSize: 14,
    color: '#888',
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
