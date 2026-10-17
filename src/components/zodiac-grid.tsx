/**
 * BURÇ IZGARASI
 *
 * 12 burç, 3'erli satırlar halinde (Onur'un ZODIAC_SIGNS listesi). Her kutuda burç sembolü,
 * adı ve tarih aralığı ("23 Eki – 21 Kas"; herkes ezbere bilmeyebilir). Seçili burç pembe dolgulu,
 * yazısı beyaz. Dokununca hafif titreşim + onSelect.
 * Ayarlar'daki burç seçimi (zodiac.tsx) ve Welcome ekranı kullanır.
 *
 * Ayrıca MOON_SYMBOLS (Ay evresi simgeleri), mercuryNote (Merkür retrosu notu) ve zodiacGlyph:
 * burç sembolünü emoji yerine yazı gibi gösterir (iPhone normalde mor kutulu emoji çiziyor;
 * böylece tema rengine boyanabilir, SF Symbols simgeleriyle aynı dilde durur).
 */

import * as Haptics from 'expo-haptics';
import type { SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { ZODIAC_SIGNS, type MoonPhase, type Sky, type ZodiacName } from '@/lib/zodiac';

const colors = Colors.light;

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

// Sembolün sonuna "yazı gibi göster" işareti (U+FE0E) eklenir
const TEXT_STYLE = String.fromCharCode(0xfe0e);
export function zodiacGlyph(emoji: string): string {
  return `${emoji}${TEXT_STYLE}`;
}

// Burcun tarih aralığı: başlangıcı ile bir sonraki burcun başlangıcından bir gün öncesi
export function zodiacRange(name: ZodiacName): string {
  const index = ZODIAC_SIGNS.findIndex((sign) => sign.name === name);
  const [startMonth, startDay] = ZODIAC_SIGNS[index].start;
  const [nextMonth, nextDay] = ZODIAC_SIGNS[(index + 1) % ZODIAC_SIGNS.length].start;
  // Bir sonraki burcun başlangıcından bir gün önce (2001 artık yıl değil; tarih aralığı için yeterli)
  const end = new Date(2001, nextMonth - 1, nextDay - 1);
  return `${startDay} ${MONTHS[startMonth - 1]} – ${end.getDate()} ${MONTHS[end.getMonth()]}`;
}

// Ay evresinin iPhone simgesi
export const MOON_SYMBOLS: Record<MoonPhase, SFSymbol> = {
  Yeniay: 'moonphase.new.moon',
  'Büyüyen Ay': 'moonphase.waxing.crescent',
  Dolunay: 'moonphase.full.moon',
  'Küçülen Ay': 'moonphase.waning.crescent',
};

// Merkür retrosu notu: retrodaysa kaç gün kaldı, 2 hafta içinde başlayacaksa kaç gün var
export function mercuryNote(sky: Sky): string | null {
  const { retrograde, daysLeft, daysUntilNext } = sky.mercury;
  if (retrograde) {
    return daysLeft !== null ? `☿ Merkür retroda · ${daysLeft} gün kaldı` : '☿ Merkür retroda';
  }
  if (daysUntilNext !== null && daysUntilNext <= 14) {
    return `☿ Merkür retrosuna ${daysUntilNext} gün`;
  }
  return null;
}

type Props = {
  value: ZodiacName | null;
  onSelect: (sign: ZodiacName) => void;
};

export function ZodiacGrid({ value, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {ZODIAC_SIGNS.map((sign) => {
        const selected = sign.name === value;
        return (
          <Pressable
            key={sign.name}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(sign.name);
            }}
            accessibilityLabel={sign.name}
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.cell,
              selected && styles.cellSelected,
              pressed && styles.cellPressed,
            ]}>
            <Text style={[styles.glyph, selected && styles.textSelected]}>
              {zodiacGlyph(sign.emoji)}
            </Text>
            <Text style={[styles.name, selected && styles.textSelected]}>{sign.name}</Text>
            <Text style={[styles.range, selected && styles.rangeSelected]}>
              {zodiacRange(sign.name)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  cell: {
    width: '31.6%',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.accent,
    gap: Spacing.half,
  },
  cellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...Shadows.button,
  },
  cellPressed: {
    transform: [{ scale: 0.96 }],
  },
  glyph: {
    fontSize: 30,
    lineHeight: 36,
    color: colors.primary,
  },
  name: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  range: {
    ...Typography.caption,
    fontSize: 10,
    color: colors.textMuted,
  },
  textSelected: {
    color: colors.onPrimary,
  },
  rangeSelected: {
    color: colors.primarySoft,
  },
});
