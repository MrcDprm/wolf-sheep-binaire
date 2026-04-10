/**
 * Günlük Bulmaca Ekranı
 *
 * Saat 10:00'dan itibaren Firebase'den çekilen günlük bulmacayı gösterir.
 * Tamamlandığında günlük liderlik tablosuna süre kaydedilir.
 */
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { fetchTodayPuzzle, type DailyPuzzleData } from '../../src/services/firebase/dailyService';
import { secondsUntilDailyReset, formatCountdown } from '../../src/utils/dateHelpers';
import { useTranslation } from '../../src/i18n';

export default function DailyScreen() {
  const t = useTranslation();
  const [puzzle, setPuzzle] = useState<DailyPuzzleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(secondsUntilDailyReset());

  useEffect(() => {
    fetchTodayPuzzle()
      .then(setPuzzle)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(secondsUntilDailyReset());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#388E3C" />
      </View>
    );
  }

  if (!puzzle) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>{t('dailyPuzzle.title')}</Text>
        <Text style={styles.body}>Bugünkü bulmaca henüz hazır değil.</Text>
        <Text style={styles.countdown}>
          {t('dailyPuzzle.nextIn', { time: formatCountdown(countdown) })}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('dailyPuzzle.title')}</Text>
      <Text style={styles.body}>{puzzle.dateKey}</Text>
      <Text style={styles.gridInfo}>
        {puzzle.gridSize}x{puzzle.gridSize} Grid
      </Text>
      {/* GameGrid bileşeni bir sonraki modülde eklenecek */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#E8F5E9',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    color: '#555',
  },
  countdown: {
    fontSize: 20,
    fontWeight: '700',
    color: '#388E3C',
    marginTop: 8,
  },
  gridInfo: {
    fontSize: 14,
    color: '#777',
  },
});
