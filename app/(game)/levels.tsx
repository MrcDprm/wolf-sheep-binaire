/**
 * Seviye seçme ekranı
 *
 * Üstte 6 zorluk sekmesi, altında o zorluğun 50 seviyesi.
 * Bitirilen seviyelerde yıldızlar görünür; kilitli seviyelere dokunulamaz.
 */
import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDayPhase } from '../../src/hooks/useDayPhase';
import { useTranslation } from '../../src/i18n';
import { useUserStore } from '../../src/store/useUserStore';
import { DIFFICULTIES, LEVELS_PER_DIFFICULTY } from '../../src/constants/difficulties';
import { LEVELS, getLevelById, isLevelUnlocked, nextLevelToPlay } from '../../src/constants/levels';
import type { Difficulty } from '../../src/types/game';

export default function LevelsScreen() {
  const router = useRouter();
  const t = useTranslation();
  const dayPhase = useDayPhase();
  const completedLevels = useUserStore((s) => s.completedLevels);

  // Açılışta oynanacak seviyenin zorluğu seçili gelir
  const [tab, setTab] = useState<Difficulty>(
    () => getLevelById(nextLevelToPlay(completedLevels))?.difficulty ?? 'easiest',
  );

  const levels = LEVELS.filter((l) => l.difficulty === tab);
  const doneInTab = levels.filter((l) => completedLevels[String(l.id)]).length;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: dayPhase.bgFrom }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('game.back')}
        >
          <Text style={[styles.backArrow, { color: dayPhase.accent }]}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('levels.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Zorluk sekmeleri */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={styles.tabsScroll}
      >
        {DIFFICULTIES.map((d) => {
          const active = d.id === tab;
          return (
            <TouchableOpacity
              key={d.id}
              onPress={() => setTab(d.id)}
              style={[styles.tab, active && { backgroundColor: dayPhase.accent }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t(`difficulty.${d.id}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.progress}>
        {t('levels.progress', { done: doneInTab, total: LEVELS_PER_DIFFICULTY })}
      </Text>

      {/* 50 seviye, 5 sütun */}
      <ScrollView contentContainerStyle={styles.grid}>
        {levels.map((level) => {
          const result = completedLevels[String(level.id)];
          const unlocked = isLevelUnlocked(level.id, completedLevels);
          return (
            <TouchableOpacity
              key={level.id}
              disabled={!unlocked}
              onPress={() => router.push(`/(game)/level/${level.id}`)}
              style={styles.cellWrap}
              accessibilityRole="button"
              accessibilityLabel={
                unlocked
                  ? t('game.level', { difficulty: t(`difficulty.${tab}`), number: level.number })
                  : t('levels.locked')
              }
            >
              <View
                style={[
                  styles.cell,
                  !unlocked && styles.cellLocked,
                  unlocked && !result && { borderColor: dayPhase.accent },
                ]}
              >
                {unlocked ? (
                  <>
                    <Text style={styles.cellNumber}>{level.number}</Text>
                    <Text style={styles.cellStars}>
                      {result ? '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars) : ' '}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.lock}>🔒</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backArrow: {
    fontSize: 34,
    lineHeight: 36,
    width: 36,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  headerSpacer: {
    width: 36,
  },
  tabsScroll: {
    flexGrow: 0,
  },
  tabs: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.07)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444',
  },
  tabTextActive: {
    color: '#fff',
  },
  progress: {
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 32,
  },
  cellWrap: {
    width: '20%',
    aspectRatio: 1,
    padding: 4,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  cellLocked: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  cellNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
  },
  cellStars: {
    fontSize: 11,
    color: '#F9A825',
    marginTop: 2,
  },
  lock: {
    fontSize: 16,
    opacity: 0.5,
  },
});
