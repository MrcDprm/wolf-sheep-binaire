/**
 * Liderlik Tablosu Ekranı
 *
 * İki sekme:
 * - Global: Toplam puana göre sıralama
 * - Günlük: Bugünkü bulmaca süresine göre sıralama
 */
import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import {
  fetchGlobalLeaderboard,
  fetchDailyLeaderboard,
  type LeaderboardEntry,
} from '../src/services/firebase/leaderboardService';
import { useTranslation } from '../src/i18n';
import { formatTime } from '../src/utils/scoring';

type Tab = 'global' | 'daily';

export default function LeaderboardScreen() {
  const t = useTranslation();
  const [tab, setTab] = useState<Tab>('global');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const fetch = tab === 'global' ? fetchGlobalLeaderboard : fetchDailyLeaderboard;
    fetch()
      .then(setData)
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <View style={styles.container}>
      {/* Tab seçici */}
      <View style={styles.tabs}>
        {(['global', 'daily'] as Tab[]).map((t_) => (
          <TouchableOpacity
            key={t_}
            style={[styles.tab, tab === t_ && styles.tabActive]}
            onPress={() => setTab(t_)}
          >
            <Text style={[styles.tabText, tab === t_ && styles.tabTextActive]}>
              {t(`leaderboard.${t_}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#388E3C" style={{ marginTop: 32 }} />
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('leaderboard.noData')}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.rank}>#{item.rank}</Text>
              <Text style={styles.name} numberOfLines={1}>{item.displayName}</Text>
              <Text style={styles.score}>
                {tab === 'daily' && item.time !== undefined
                  ? formatTime(item.time)
                  : `${item.score} puan`}
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9',
  },
  tabs: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: '#888',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#388E3C',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    gap: 8,
  },
  rank: {
    width: 36,
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  score: {
    fontSize: 14,
    fontWeight: '700',
    color: '#388E3C',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#aaa',
    fontSize: 15,
  },
});
