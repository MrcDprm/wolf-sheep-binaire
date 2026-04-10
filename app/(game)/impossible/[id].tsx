/**
 * İmkansız Mod Ekranı
 *
 * - Kör Oynama: Hata gösterimi tamamen kapalı
 * - İpucu butonu gizli
 * - Tahta dolunca çözüm doğrulanır
 */
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGameEngine } from '../../../src/hooks/useGameEngine';
import { usePrecompute } from '../../../src/hooks/usePrecompute';
import { useUserStore } from '../../../src/store/useUserStore';
import { getLevelById } from '../../../src/constants/levels';
import { precomputePuzzleAsync } from '../../../src/engine/precompute';
import { useGameStore } from '../../../src/store/useGameStore';
import { useTranslation } from '../../../src/i18n';

export default function ImpossibleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const levelId = parseInt(id ?? '1001', 10);
  const level = getLevelById(levelId);
  const router = useRouter();
  const t = useTranslation();
  const isPremium = useUserStore((s) => s.isPremium);

  const [loading, setLoading] = useState(true);
  const { startGame, grid, isComplete } = useGameEngine();
  const getPrecomputed = useGameStore((s) => s.getPrecomputed);

  usePrecompute(level ?? null);

  // Premium kontrolü
  useEffect(() => {
    if (!isPremium) {
      router.replace('/(game)');
    }
  }, [isPremium]);

  useEffect(() => {
    if (!level) return;

    const key = `level_${level.id}`;
    const existing = getPrecomputed(key);

    if (existing) {
      startGame(level, 'impossible', existing);
      setLoading(false);
    } else {
      setLoading(true);
      precomputePuzzleAsync(level.gridSize, 'impossible')
        .then((puzzle) => {
          startGame(level, 'impossible', puzzle);
        })
        .finally(() => setLoading(false));
    }
  }, [levelId]);

  if (!isPremium) return null;

  if (!level) {
    return (
      <View style={styles.center}>
        <Text>Seviye bulunamadı</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7B1FA2" />
        <Text style={styles.loadingText}>İmkansız bulmaca hazırlanıyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Kör mod uyarı bandı */}
      <View style={styles.blindBanner}>
        <Text style={styles.blindTitle}>{t('game.blindMode')}</Text>
        <Text style={styles.blindSub}>{t('game.blindModeHint')}</Text>
      </View>

      <Text style={styles.levelTitle}>İmkansız Seviye {levelId - 999}</Text>

      {/* Grid bileşeni sonraki modülde eklenecek */}
      <View style={styles.gridPlaceholder}>
        <Text>🐑 Grid ({grid.length}x{grid.length}) 🐺</Text>
        <Text style={styles.note}>GameGrid sonraki modülde</Text>
      </View>

      {/* İpucu butonu TAMAMEN GİZLİ — isBlindMode true */}

      {isComplete && (
        <View style={styles.completeBanner}>
          <Text style={styles.completeText}>🎉 Başardın!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#EDE7F6',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  blindBanner: {
    width: '100%',
    backgroundColor: '#7B1FA2',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  blindTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  blindSub: {
    color: '#E1BEE7',
    fontSize: 12,
    marginTop: 2,
  },
  levelTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 12,
  },
  gridPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  note: {
    fontSize: 12,
    color: '#888',
  },
  completeBanner: {
    padding: 16,
    backgroundColor: '#CE93D8',
    borderRadius: 12,
    marginBottom: 24,
  },
  completeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4A148C',
  },
  loadingText: {
    color: '#555',
    marginTop: 8,
  },
});
