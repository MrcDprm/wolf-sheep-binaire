/**
 * Eğitim Ekranı — 4 Adımlı Etkileşimli Tutorial
 *
 * Tamamlanınca useSettingsStore.completeTutorial() çağrılır.
 * "Atla" butonu her adımda mevcuttur.
 */
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useTranslation } from '../src/i18n';

const STEPS = ['step1', 'step2', 'step3', 'step4'] as const;

export default function TutorialScreen() {
  const router = useRouter();
  const t = useTranslation();
  const completeTutorial = useSettingsStore((s) => s.completeTutorial);
  const [step, setStep] = useState(0);

  const handleFinish = () => {
    completeTutorial();
    router.replace('/(game)');
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const key = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('tutorial.title')}</Text>

      {/* Adım göstergesi */}
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === step && styles.dotActive]}
          />
        ))}
      </View>

      {/* İçerik */}
      <View style={styles.card}>
        <Text style={styles.stepTitle}>{t(`tutorial.${key}Title`)}</Text>
        <Text style={styles.stepBody}>{t(`tutorial.${key}Body`)}</Text>
      </View>

      {/* Butonlar */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
          <Text style={styles.skipText}>{t('tutorial.skip')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
          <Text style={styles.nextText}>
            {isLast ? t('tutorial.finish') : t('tutorial.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#FFFDE7',
    gap: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  dotActive: {
    backgroundColor: '#F9A825',
    width: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  stepBody: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  skipBtn: {
    padding: 12,
  },
  skipText: {
    color: '#aaa',
    fontSize: 15,
  },
  nextBtn: {
    backgroundColor: '#F9A825',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  nextText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
