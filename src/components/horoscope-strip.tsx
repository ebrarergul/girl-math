/**
 * BURÇ ŞERİDİ (Ana sayfa)
 *
 * Eski Dolap Tarotu şeridinin yerinde, aynı gümüş (krom) zemin ve boyda: "büyü" anı burası.
 * Solda beyaz mini kartta pembe burç sembolü, ortada "BURCUN · BUGÜN", burç adı ve 🍀 şanslı
 * renk, sağda Ay evresi simgesi. Dokununca burç sayfası (horoscope.tsx) açılır.
 * Burç seçilmemişse "Burcunu seç" der ve burç seçimini (zodiac.tsx) açar.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorSwatch } from '@/components/color-picker';
import { MOON_SYMBOLS, zodiacGlyph } from '@/components/zodiac-grid';
import { Colors, Gradients, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { dailyHoroscope, getSky, zodiacSign } from '@/lib/zodiac';

const colors = Colors.light;

export function HoroscopeStrip() {
  const router = useRouter();
  const { zodiac, items } = useApp();
  const sky = getSky();
  const daily = zodiac ? dailyHoroscope(zodiac, items) : null;

  return (
    <Pressable
      onPress={() => router.push(zodiac ? '/horoscope' : '/zodiac')}
      accessibilityLabel={zodiac ? 'Burç yorumunu aç' : 'Burcunu seç'}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <LinearGradient
        colors={Gradients.chrome}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}>
        {/* Mini kart: burç sembolü (seçilmediyse kristal küre) */}
        <View style={styles.miniCard}>
          {zodiac ? (
            <Text style={styles.glyph}>{zodiacGlyph(zodiacSign(zodiac).emoji)}</Text>
          ) : (
            <SymbolView name="sparkles" tintColor={colors.primary} size={24} />
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.eyebrow}>{zodiac ? 'BURCUN · BUGÜN' : 'BURÇ YORUMU'}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {zodiac ?? 'Burcunu seç'}
          </Text>
          {daily ? (
            <View style={styles.luckyRow}>
              <Text style={styles.hint}>🍀 Şanslı renk</Text>
              <ColorSwatch color={daily.luckyColor} size={12} />
              <Text style={styles.luckyName}>{daily.luckyColor}</Text>
            </View>
          ) : (
            <Text style={styles.hint}>Yıldızlar dolabına baksın 🔮</Text>
          )}
        </View>

        <SymbolView name={MOON_SYMBOLS[sky.moonPhase]} tintColor={colors.text} size={22} />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 112,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.card,
    ...Shadows.card,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  fill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  // Tarot kartı oranında (2:3) beyaz mini kart
  miniCard: {
    width: 52,
    height: 78,
    borderRadius: Radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 30,
    lineHeight: 36,
    color: colors.primary,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.half,
  },
  eyebrow: {
    ...Typography.label,
    color: colors.primary,
  },
  title: {
    ...Typography.title,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text,
  },
  luckyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  hint: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  luckyName: {
    ...Typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
});
