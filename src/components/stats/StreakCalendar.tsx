/**
 * Seri takvimi
 *
 * Son 5 hafta keçe tahtadaki gibi yuvalar hâlinde, haftalar Pazartesi başlar.
 * Günün bulmacasının çözüldüğü güne bir koyun oturur: seri uzadıkça sürü büyür.
 * Çözülmeyen günde ayın günü yazar; bugün saman sarısı çerçeveli, gelecek günler soluk.
 * Ekran okuyucu 35 yuvayı tek tek okumaz, takvimi tek cümleyle özetler.
 */
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from '../../i18n';
import { MAX_APP_WIDTH } from '../../constants/layout';
import type { CalendarDay } from '../../utils/stats';
import { Piece } from '../pieces/Piece';
import { fonts, palette } from '../../theme';

interface StreakCalendarProps {
  weeks: CalendarDay[][];
  /** Keçe dışındaki yatay boşluk toplamı (px): yuva boyu buna göre hesaplanır */
  horizontalInset: number;
}

const GAP = 6;

export function StreakCalendar({ weeks, horizontalInset }: StreakCalendarProps) {
  const t = useTranslation();
  const { width } = useWindowDimensions();
  const cell = Math.floor((Math.min(width, MAX_APP_WIDTH) - horizontalInset - GAP * 6) / 7);
  const days = weeks.flat();
  const solvedCount = days.filter((d) => d.solved).length;

  // Ay aralığı: "Ekim – Kasım" ya da tek ay
  const first = days[0];
  const last = days[days.length - 1];
  const range =
    first && last
      ? first.month === last.month
        ? t(`calendar.months.${first.month}`)
        : `${t(`calendar.months.${first.month}`)} – ${t(`calendar.months.${last.month}`)}`
      : '';

  return (
    <View
      accessible
      accessibilityLabel={t('stats.calendarLabel', { count: solvedCount, weeks: weeks.length })}
    >
      <Text style={styles.range}>{range}</Text>
      <View style={styles.row}>
        {Array.from({ length: 7 }, (_, i) => (
          <Text key={i} style={[styles.weekday, { width: cell }]} numberOfLines={1}>
            {t(`calendar.weekHeader.${i}`)}
          </Text>
        ))}
      </View>
      <View style={styles.weeks}>
        {weeks.map((week) => (
          <View key={week[0].key} style={styles.row}>
            {week.map((day) => (
              <View
                key={day.key}
                style={[
                  styles.slot,
                  { width: cell, height: cell, borderRadius: cell * 0.28 },
                  day.future && styles.future,
                  day.today && styles.today,
                ]}
              >
                {day.solved ? (
                  <Piece kind="sheep" size={Math.round(cell * 0.78)} />
                ) : day.future ? null : (
                  <Text style={[styles.date, day.today && styles.dateToday]}>{day.date}</Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  range: {
    color: palette.wool,
    opacity: 0.85,
    fontFamily: fonts.bold,
    fontSize: 13,
    marginBottom: 6,
  },
  weeks: {
    gap: GAP,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  weekday: {
    textAlign: 'center',
    color: palette.wool,
    opacity: 0.75,
    fontFamily: fonts.semibold,
    fontSize: 11,
    marginBottom: 4,
  },
  // Tahtadaki boş yuva gibi koyu keçe çukuru
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.slot,
  },
  future: {
    opacity: 0.35,
  },
  today: {
    borderWidth: 2.5,
    borderColor: palette.straw,
  },
  date: {
    color: palette.wool,
    opacity: 0.6,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  dateToday: {
    opacity: 1,
  },
});
