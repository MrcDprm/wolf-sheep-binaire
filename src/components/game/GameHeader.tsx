/**
 * Oyun ekranlarının üst çubuğu
 *
 * Solda kapat, ortada başlık (seviye adı ve oklar ya da günün bulmacası), sağda süre.
 * Sağ taraf boş kalsa da genişliği korunur; başlık hep ortada durur.
 */
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDayPhase } from '../../hooks/useDayPhase';
import { useTranslation } from '../../i18n';
import { IconButton } from '../ui/IconButton';
import { fontSize, fonts } from '../../theme';

interface GameHeaderProps {
  onClose: () => void;
  /** Ortadaki başlık */
  children: ReactNode;
  /** Sağdaki süre */
  right?: ReactNode;
}

export function GameHeader({ onClose, children, right }: GameHeaderProps) {
  const t = useTranslation();
  const dayPhase = useDayPhase();
  return (
    <View style={styles.header}>
      <IconButton
        name="close"
        color={dayPhase.text}
        onPress={onClose}
        accessibilityLabel={t('game.close')}
      />
      <View style={styles.titleRow}>{children}</View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

/** Başlık yazısı; altında isteğe bağlı küçük bir satır (ör. tarih ve zorluk) */
export function GameTitle({ children, subtitle }: { children: string; subtitle?: string }) {
  const dayPhase = useDayPhase();
  return (
    <View style={styles.titleBox} accessible accessibilityRole="header">
      <Text style={[styles.title, { color: dayPhase.text }]} numberOfLines={1}>
        {children}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: dayPhase.textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    minWidth: 72,
    alignItems: 'flex-end',
  },
  titleBox: {
    flexShrink: 1,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    fontFamily: fonts.extrabold,
    fontSize: fontSize.heading,
  },
  subtitle: {
    marginTop: -4,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: fontSize.caption,
  },
});
