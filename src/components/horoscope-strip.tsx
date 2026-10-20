/**
 * BURÇ SATIRI (Ana sayfa, "Senin için" kartında bir satır)
 *
 * Solda küçük gümüş (krom) madalyon içinde pembe burç sembolü: "büyü" anı burası, ama gümüş
 * sadece bu küçük yuvarlakta (bütün şerit gri olunca donuk duruyordu). Ortada burç adı ve
 * altında şanslı renk, sağda Ay evresi simgesi ve ok. Dokununca burç sayfası (horoscope.tsx).
 * Burç seçilmemişse "Burcunu seç" der ve burç seçimini (zodiac.tsx) açar.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { ColorSwatch } from '@/components/color-picker';
import { ICON_SIZE, TodayRow, todayDetailStyle } from '@/components/today-row';
import { MOON_SYMBOLS, zodiacGlyph } from '@/components/zodiac-grid';
import { Colors, Gradients, Radius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { dailyHoroscope, getSky, zodiacSign } from '@/lib/zodiac';

const colors = Colors.light;

export function HoroscopeStrip() {
  const router = useRouter();
  const { zodiac, items } = useApp();
  const sky = getSky();
  const daily = zodiac ? dailyHoroscope(zodiac, items) : null;

  return (
    <TodayRow
      icon={
        // Gümüş madalyon
        <LinearGradient
          colors={Gradients.chrome}
          locations={[0, 0.35, 0.7, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.medal}>
          {zodiac ? (
            <Text style={styles.glyph}>{zodiacGlyph(zodiacSign(zodiac).emoji)}</Text>
          ) : (
            <SymbolView name="sparkles" tintColor={colors.primary} size={18} />
          )}
        </LinearGradient>
      }
      title={zodiac ?? 'Burcunu seç'}
      detail={
        daily ? (
          <View style={styles.luckyRow}>
            <Text style={todayDetailStyle}>Şanslı renk</Text>
            <ColorSwatch color={daily.luckyColor} size={10} />
            <Text style={[todayDetailStyle, styles.luckyName]}>{daily.luckyColor}</Text>
          </View>
        ) : (
          <Text style={todayDetailStyle}>Yıldızlar dolabına baksın</Text>
        )
      }
      right={
        <View style={styles.right}>
          <SymbolView name={MOON_SYMBOLS[sky.moonPhase]} tintColor={colors.textSecondary} size={16} />
          <SymbolView name="chevron.right" tintColor={colors.textMuted} size={13} />
        </View>
      }
      accessibilityLabel={zodiac ? 'Burç yorumunu aç' : 'Burcunu seç'}
      onPress={() => router.push(zodiac ? '/horoscope' : '/zodiac')}
    />
  );
}

const styles = StyleSheet.create({
  medal: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.primary,
  },
  luckyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  luckyName: {
    color: colors.text,
    fontWeight: '700',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
