/**
 * İSTATİSTİK KUTUSU
 *
 * Cüzdan ve Ana sayfada kullanılan küçük kutu: üstte küçük etiket, ortada büyük değer,
 * altta isteğe bağlı açıklama. tone="primary" verilirse pembe dolgulu (vurgulu) olur.
 *
 * Kullanımı:
 *   <StatTile label="Toplam giyim" value="42" caption="bu ay 9" />
 *   <StatTile label="Dolap değeri" value={formatTL(18400)} tone="primary" />
 */

import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

const colors = Colors.light;

type Props = {
  // Normal yazılır ("Toplam giyim"), Türkçe kurala göre büyük harfe çevrilir.
  // İngilizce kelimeler baştan büyük yazılır, yoksa "Girl" → "GİRL" olur: "GIRL MATH kazancın"
  label: string;
  value: string;
  caption?: string;
  tone?: 'default' | 'primary';
};

export function StatTile({ label, value, caption, tone = 'default' }: Props) {
  const primary = tone === 'primary';

  return (
    <View style={[styles.tile, primary && styles.tilePrimary]}>
      <Text style={[styles.label, primary && styles.textOnPrimary]}>
        {label.toLocaleUpperCase('tr')}
      </Text>
      <Text
        style={[styles.value, primary && styles.textOnPrimary]}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {value}
      </Text>
      {caption && (
        <Text style={[styles.caption, primary && styles.textOnPrimary]}>{caption}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
    ...Shadows.card,
  },
  tilePrimary: {
    backgroundColor: colors.primary,
    ...Shadows.button,
  },
  label: {
    ...Typography.label,
    color: colors.textSecondary,
  },
  // Rakamlar sade yazı tipinde: dergi yazı tipinde ₺ işareti "Ł" gibi görünüyor
  value: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.text,
  },
  caption: {
    ...Typography.caption,
    color: colors.textMuted,
  },
  textOnPrimary: {
    color: colors.onPrimary,
  },
});
