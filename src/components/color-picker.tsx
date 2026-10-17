/**
 * RENK SEÇİCİ
 *
 * Kıyafetin rengini seçtiren yatay kayan renk yuvarlakları (renk listesi Onur'un COLORS'ı).
 * - Dokununca seçilir: etrafında pembe halka + hafif titreşim.
 * - Seçili renge tekrar dokununca seçim kalkar (renk isteğe bağlı).
 * - Beyaz yuvarlağın ince kenarı var (beyaz zeminde kaybolmasın), "Desenli" çok renkli çizilir.
 * Altta seçilen rengin adı ya da neden sorduğumuzu anlatan kısa bir not yazar. `note` verilirse
 * (ör. fotoğraftan tahmin) seçili rengin adı yerine o yazar.
 * Ekleme/düzenleme formu kullanır; ileride Dolap'ta "renge göre süz" için de kullanılabilir.
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { COLORS, colorHex, type ColorName } from '@/lib/colors';

const colors = Colors.light;

const SWATCH = 32;

// "Desenli" yuvarlağındaki renkler: listedeki gerçek kıyafet renklerinden
const PATTERN_COLORS = [colorHex('Pembe'), colorHex('Açık mavi'), colorHex('Sarı')] as const;

type Props = {
  value: ColorName | undefined;
  onChange: (color: ColorName | undefined) => void;
  note?: string | null; // Seçili rengin adı yerine yazılacak not
};

export function ColorPicker({ value, onChange, note }: Props) {
  function handlePress(name: ColorName) {
    Haptics.selectionAsync();
    onChange(name === value ? undefined : name);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}>
        {COLORS.map((color) => {
          const selected = color.name === value;
          return (
            <Pressable
              key={color.name}
              onPress={() => handlePress(color.name)}
              accessibilityLabel={color.name}
              accessibilityState={{ selected }}
              style={[styles.ring, selected && styles.ringSelected]}>
              <ColorSwatch color={color.name} />
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={[styles.caption, value && styles.captionSelected]}>
        {(value && note) ?? value ?? 'Kombin önerileri için rengini seç 🎨'}
      </Text>
    </View>
  );
}

// Tek renk yuvarlağı (renk seçici ve detay sayfası kullanır). Beyazın ince kenarı var,
// "Desenli" çok renkli çizilir.
export function ColorSwatch({ color, size = SWATCH }: { color: ColorName; size?: number }) {
  const shape = { width: size, height: size, borderRadius: Radius.pill };
  if (color === 'Desenli') {
    return (
      <LinearGradient
        colors={PATTERN_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[shape, styles.swatchBorder]}
      />
    );
  }
  return (
    <View
      style={[
        shape,
        { backgroundColor: colorHex(color) },
        color === 'Beyaz' && styles.swatchBorder,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  // Sıra ekranın iki kenarına kadar uzansın; ilk yuvarlak yine başlıkla aynı hizada başlar
  scroll: {
    marginHorizontal: -Spacing.four,
  },
  row: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  // Seçim halkası: seçilmemişken görünmez, seçilince pembe
  ring: {
    width: SWATCH + 8,
    height: SWATCH + 8,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSelected: {
    borderColor: colors.primary,
  },
  swatchBorder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  caption: {
    ...Typography.caption,
    color: colors.textMuted,
  },
  captionSelected: {
    color: colors.text,
    fontWeight: '600',
  },
});
