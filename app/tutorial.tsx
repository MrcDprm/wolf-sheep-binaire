/**
 * Eğitim ekranı — 4 adım
 *
 * Her adımda kısa bir metin ve keçe şerit üzerinde küçük bir örnek:
 * dokunma sırası, yan yana 3 yasağı, satır dengesi, hatanın sesi.
 * Bitince ya da atlanınca useSettingsStore.completeTutorial() çağrılır.
 */
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useTranslation } from '../src/i18n';
import { useDayPhase } from '../src/hooks/useDayPhase';
import { Piece } from '../src/components/pieces/Piece';
import { Button } from '../src/components/ui/Button';
import { Icon } from '../src/components/ui/Icon';
import { fontSize, fonts, palette, radius } from '../src/theme';
import type { CellValue } from '../src/types/game';

const STEPS = ['step1', 'step2', 'step3', 'step4'] as const;

// Her adımın örneği: şeritler (0 boş, 1 kurt, 2 koyun), hatalılar kırmızı halkalı
interface Strip {
  cells: CellValue[];
  error?: boolean;
  /** Hücreler arasına ok koy (dokunma sırası) */
  arrows?: boolean;
}

const EXAMPLES: Record<(typeof STEPS)[number], Strip[]> = {
  step1: [{ cells: [0, 1, 2], arrows: true }],
  step2: [{ cells: [2, 2, 2], error: true }, { cells: [2, 2, 1] }],
  step3: [{ cells: [1, 2, 1, 2, 2, 1] }],
  step4: [{ cells: [1, 1, 1], error: true }],
};

const SLOT = 46;

function ExampleStrip({ strip, felt, feltEdge }: { strip: Strip; felt: string; feltEdge: string }) {
  return (
    <View style={[styles.strip, { backgroundColor: felt, borderBottomColor: feltEdge }]}>
      {strip.cells.map((value, i) => (
        <View key={i} style={styles.stripItem}>
          {strip.arrows && i > 0 && <Icon name="chevronRight" size={18} color={palette.wool} />}
          <View style={[styles.slot, strip.error && styles.slotError]}>
            {value !== 0 && <Piece kind={value === 1 ? 'wolf' : 'sheep'} size={SLOT * 0.8} />}
          </View>
        </View>
      ))}
    </View>
  );
}

export default function TutorialScreen() {
  const router = useRouter();
  const t = useTranslation();
  const dayPhase = useDayPhase();
  const completeTutorial = useSettingsStore((s) => s.completeTutorial);
  const [step, setStep] = useState(0);

  // Ayarlardan açıldıysa geri dön, ilk açılıştaysa menüye geç
  const handleFinish = () => {
    completeTutorial();
    if (router.canGoBack()) router.back();
    else router.replace('/(game)');
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else handleFinish();
  };

  const key = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: dayPhase.sky }]}>
      <View style={styles.top}>
        <Pressable
          onPress={handleFinish}
          hitSlop={10}
          accessibilityRole="button"
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={[styles.skip, { color: dayPhase.textMuted }]}>{t('tutorial.skip')}</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, { color: dayPhase.text }]} accessibilityRole="header">
          {t('tutorial.title')}
        </Text>

        <View style={styles.examples}>
          {EXAMPLES[key].map((strip, i) => (
            <ExampleStrip key={i} strip={strip} felt={dayPhase.felt} feltEdge={dayPhase.feltEdge} />
          ))}
        </View>

        <Text style={[styles.stepTitle, { color: dayPhase.text }]}>
          {t(`tutorial.${key}Title`)}
        </Text>
        <Text style={[styles.stepBody, { color: dayPhase.textMuted }]}>
          {t(`tutorial.${key}Body`)}
        </Text>
      </View>

      <View style={styles.bottom}>
        <View
          style={styles.dots}
          accessible
          accessibilityLabel={t('tutorial.progress', { step: step + 1, total: STEPS.length })}
        >
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === step ? palette.straw : dayPhase.surfaceEdge },
                i === step && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <Button title={isLast ? t('tutorial.finish') : t('tutorial.next')} onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    minHeight: 44,
  },
  skip: {
    fontFamily: fonts.bold,
    fontSize: fontSize.body,
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.6,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.title,
    marginBottom: 24,
  },
  examples: {
    gap: 12,
    alignItems: 'center',
    marginBottom: 28,
  },
  strip: {
    flexDirection: 'row',
    padding: 8,
    gap: 6,
    borderRadius: radius.board - 6,
    borderBottomWidth: 4,
  },
  stripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slot: {
    width: SLOT,
    height: SLOT,
    borderRadius: radius.cell,
    backgroundColor: palette.slot,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotError: {
    backgroundColor: palette.slotError,
    borderWidth: 3,
    borderColor: palette.error,
  },
  stepTitle: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.heading,
    textAlign: 'center',
    marginBottom: 6,
  },
  stepBody: {
    fontFamily: fonts.medium,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * 1.45,
    textAlign: 'center',
    maxWidth: 340,
  },
  bottom: {
    paddingHorizontal: 28,
    paddingBottom: 20,
    gap: 18,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 22,
  },
});
