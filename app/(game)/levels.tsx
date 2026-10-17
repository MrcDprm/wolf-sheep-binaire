/**
 * Seviye seçme ekranı
 *
 * Üstte 6 zorluk sekmesi, altında o zorluğun 50 seviyesi.
 * - Bitirilen seviye: keçe yeşili karo, kazanılan yıldızlar
 * - Sıradaki seviye: saman sarısı karo
 * - Kilitli seviye: soluk karo, kilit; dokunulamaz
 */
import { useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDayPhase } from '../../src/hooks/useDayPhase';
import { useTranslation } from '../../src/i18n';
import { useUserStore } from '../../src/store/useUserStore';
import { DIFFICULTIES, LEVELS_PER_DIFFICULTY } from '../../src/constants/difficulties';
import { LEVELS, getLevelById, isLevelUnlocked, nextLevelToPlay } from '../../src/constants/levels';
import { IconButton } from '../../src/components/ui/IconButton';
import { Icon } from '../../src/components/ui/Icon';
import { fontSize, fonts, palette, radius } from '../../src/theme';
import type { Difficulty } from '../../src/types/game';

export default function LevelsScreen() {
  const router = useRouter();
  const t = useTranslation();
  const dayPhase = useDayPhase();
  const completedLevels = useUserStore((s) => s.completedLevels);

  const nextId = nextLevelToPlay(completedLevels);
  // Açılışta oynanacak seviyenin zorluğu seçili gelir
  const [tab, setTab] = useState<Difficulty>(() => getLevelById(nextId)?.difficulty ?? 'easiest');

  // Seçili sekme ekran dışındaysa ilk çizimde görünür hale kaydır
  const tabsRef = useRef<ScrollView>(null);
  const scrolledOnce = useRef(false);

  const levels = LEVELS.filter((l) => l.difficulty === tab);
  const doneInTab = levels.filter((l) => completedLevels[String(l.id)]).length;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: dayPhase.sky }]}>
      <View style={styles.header}>
        <IconButton
          name="back"
          color={dayPhase.text}
          onPress={() => router.back()}
          accessibilityLabel={t('game.back')}
        />
        <Text style={[styles.title, { color: dayPhase.text }]} accessibilityRole="header">
          {t('levels.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Zorluk sekmeleri */}
      <ScrollView
        ref={tabsRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={styles.tabsScroll}
        accessibilityRole="tablist"
      >
        {DIFFICULTIES.map((d) => {
          const active = d.id === tab;
          return (
            <Pressable
              key={d.id}
              onPress={() => setTab(d.id)}
              onLayout={(e) => {
                if (active && !scrolledOnce.current) {
                  scrolledOnce.current = true;
                  tabsRef.current?.scrollTo({
                    x: Math.max(0, e.nativeEvent.layout.x - 16),
                    animated: false,
                  });
                }
              }}
              style={[styles.tab, { backgroundColor: active ? palette.straw : dayPhase.surface }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabText, { color: active ? palette.ink : dayPhase.text }]}>
                {t(`difficulty.${d.id}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.progress, { color: dayPhase.textMuted }]}>
        {t('levels.progress', { done: doneInTab, total: LEVELS_PER_DIFFICULTY })}
      </Text>

      {/* 50 seviye, 5 sütun */}
      <ScrollView contentContainerStyle={styles.grid}>
        {levels.map((level) => {
          const result = completedLevels[String(level.id)];
          const unlocked = isLevelUnlocked(level.id, completedLevels);
          const isNext = level.id === nextId && !result;
          const name = t('game.level', {
            difficulty: t(`difficulty.${tab}`),
            number: level.number,
          });

          const face = result ? dayPhase.felt : isNext ? palette.straw : dayPhase.surface;
          const edge = result
            ? dayPhase.feltEdge
            : isNext
              ? palette.strawEdge
              : dayPhase.surfaceEdge;
          const numberColor = result ? palette.wool : isNext ? palette.ink : dayPhase.text;

          return (
            <Pressable
              key={level.id}
              disabled={!unlocked}
              onPress={() => router.push(`/(game)/level/${level.id}`)}
              style={styles.tileWrap}
              accessibilityRole="button"
              accessibilityLabel={
                !unlocked
                  ? `${name}, ${t('levels.locked')}`
                  : result
                    ? `${name}, ${t('levels.stars', { count: result.stars })}`
                    : name
              }
              accessibilityState={{ disabled: !unlocked }}
            >
              {({ pressed }) => (
                <View
                  style={[
                    styles.tile,
                    { backgroundColor: face, borderBottomColor: edge },
                    !unlocked && styles.tileLocked,
                    pressed && styles.tilePressed,
                  ]}
                >
                  {unlocked ? (
                    <>
                      <Text style={[styles.number, { color: numberColor }]}>{level.number}</Text>
                      {result && (
                        <View style={styles.stars}>
                          {[1, 2, 3].map((i) => (
                            <Icon
                              key={i}
                              name="star"
                              size={12}
                              color={i <= result.stars ? palette.straw : 'rgba(255,248,236,0.35)'}
                            />
                          ))}
                        </View>
                      )}
                    </>
                  ) : (
                    <Icon name="lock" size={18} color={dayPhase.textMuted} />
                  )}
                </View>
              )}
            </Pressable>
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
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.extrabold,
    fontSize: fontSize.title,
  },
  headerSpacer: {
    width: 44,
  },
  tabsScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  tabs: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  tabText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.small,
  },
  progress: {
    paddingHorizontal: 20,
    marginBottom: 6,
    fontFamily: fonts.semibold,
    fontSize: fontSize.caption,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 32,
  },
  tileWrap: {
    width: '20%',
    aspectRatio: 1,
    padding: 5,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.tile,
    borderBottomWidth: 4,
  },
  tileLocked: {
    opacity: 0.55,
  },
  tilePressed: {
    borderBottomWidth: 1,
    marginTop: 3,
  },
  number: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.heading,
    lineHeight: fontSize.heading * 1.15,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
});
