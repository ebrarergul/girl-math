/**
 * RENK SEÇİCİ
 *
 * Kıyafetin rengini seçtiren yatay kayan renk yuvarlakları (renk listesi Onur'un COLORS'ı).
 * - Dokununca seçilir: etrafında pembe halka + hafif titreşim.
 * - Seçili renge tekrar dokununca seçim kalkar (renk isteğe bağlı).
 * - Beyaz yuvarlağın ince kenarı var (beyaz zeminde kaybolmasın), "Desenli" çok renkli çizilir.
 * - En sonda gökkuşağı "Diğer" yuvarlağı: alttan palet penceresi açar (12 renk × 6 ton + griler).
 *   Listede olmayan bir ton seçilince sıranın başında o ton görünür (`customHex`); form onu
 *   `colorHex` olarak kaydeder, kombinler için en yakın renk adını (`colorNameForHex`) kullanır.
 * Altta seçilen rengin adı ya da neden sorduğumuzu anlatan kısa bir not yazar. `note` verilirse
 * (ör. fotoğraftan tahmin, "Bordo gibi sayılır") seçili rengin adı yerine o yazar.
 * Ekleme/düzenleme formu kullanır; ileride Dolap'ta "renge göre süz" için de kullanılabilir.
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { COLORS, colorHex, type ColorName } from '@/lib/colors';

const colors = Colors.light;

const SWATCH = 32;

// "Desenli" yuvarlağındaki renkler: listedeki gerçek kıyafet renklerinden
const PATTERN_COLORS = [colorHex('Pembe'), colorHex('Açık mavi'), colorHex('Sarı')] as const;

// HSL (renk tonu 0-360, doygunluk ve açıklık 0-100) → "#RRGGBB"
function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) =>
    Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(0)}${channel(8)}${channel(4)}`.toUpperCase();
}

// Palet: her satır bir renk tonu, soldan sağa açıktan koyuya (pastel → koyu, sonda soluk/toprak
// tonu); en altta griler. Kumaş kartelası gibi.
const PALETTE_HUES = [0, 15, 30, 45, 60, 90, 140, 175, 200, 225, 265, 320];
const PALETTE_TONES: [number, number][] = [
  [70, 88],
  [65, 75],
  [60, 60],
  [55, 45],
  [50, 30],
  [25, 50],
];
const PALETTE_ROWS: string[][] = [
  ...PALETTE_HUES.map((hue) => PALETTE_TONES.map(([s, l]) => hslToHex(hue, s, l))),
  [96, 82, 66, 50, 34, 18].map((l) => hslToHex(0, 0, l)),
];

// Gökkuşağı "Diğer" yuvarlağının renkleri
const RAINBOW = [
  hslToHex(0, 75, 60),
  hslToHex(60, 75, 60),
  hslToHex(140, 75, 60),
  hslToHex(200, 75, 60),
  hslToHex(265, 75, 60),
  hslToHex(320, 75, 60),
] as const;

type Props = {
  value: ColorName | undefined;
  onChange: (color: ColorName | undefined) => void;
  customHex?: string; // Paletten seçilmiş ton (varsa sıranın başında, seçili)
  onPickCustom?: (hex: string) => void; // Verilirse sonda "Diğer" yuvarlağı çıkar
  note?: string | null; // Seçili rengin adı yerine yazılacak not
};

export function ColorPicker({ value, onChange, customHex, onPickCustom, note }: Props) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  function handlePress(name: ColorName) {
    Haptics.selectionAsync();
    onChange(name === value && !customHex ? undefined : name);
  }

  function handlePickCustom(hex: string) {
    Haptics.selectionAsync();
    setPaletteOpen(false);
    onPickCustom?.(hex);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}>
        {/* Paletten seçilen ton: en başta, seçili; tekrar dokununca kalkar */}
        {customHex && (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              onChange(undefined);
            }}
            accessibilityLabel="Seçtiğin ton"
            accessibilityState={{ selected: true }}
            style={[styles.ring, styles.ringSelected]}>
            <ColorSwatch color={value ?? 'Desenli'} hex={customHex} />
          </Pressable>
        )}
        {COLORS.map((color) => {
          const selected = !customHex && color.name === value;
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
        {onPickCustom && (
          <Pressable
            onPress={() => setPaletteOpen(true)}
            accessibilityLabel="Diğer renkler"
            style={styles.ring}>
            <LinearGradient
              colors={RAINBOW}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rainbow}>
              <SymbolView name="plus" tintColor={colors.onPrimary} size={14} weight="bold" />
            </LinearGradient>
          </Pressable>
        )}
      </ScrollView>
      <Text style={[styles.caption, value && styles.captionSelected]}>
        {(value && note) ?? value ?? 'Kombin önerileri için rengini seç'}
      </Text>

      {onPickCustom && (
        <PaletteSheet
          visible={paletteOpen}
          selected={customHex}
          onSelect={handlePickCustom}
          onClose={() => setPaletteOpen(false)}
        />
      )}
    </View>
  );
}

// Alttan açılan palet penceresi (PlaceSheet gibi: karartmaya dokununca kapanır)
function PaletteSheet({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: string | undefined;
  onSelect: (hex: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Kapat" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.three }]}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>Diğer renkler</Text>
        <Text style={styles.sheetHint}>Kıyafetine en yakın tonu seç</Text>
        <ScrollView style={styles.paletteScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.palette}>
            {PALETTE_ROWS.map((row) => (
              <View key={row[0]} style={styles.paletteRow}>
                {row.map((hex) => {
                  const isSelected = hex === selected;
                  return (
                    <Pressable
                      key={hex}
                      onPress={() => onSelect(hex)}
                      accessibilityLabel={`Ton ${hex}`}
                      accessibilityState={{ selected: isSelected }}
                      style={[styles.paletteRing, isSelected && styles.ringSelected]}>
                      <View
                        style={[
                          styles.paletteSwatch,
                          { backgroundColor: hex },
                          hex === '#F5F5F5' && styles.swatchBorder,
                        ]}
                      />
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// Tek renk yuvarlağı. `hex` verilirse (paletten seçilen ton) o renkle çizilir.
export function ColorSwatch({
  color,
  hex,
  size = SWATCH,
}: {
  color: ColorName;
  hex?: string;
  size?: number;
}) {
  const shape = { width: size, height: size, borderRadius: Radius.pill };
  if (hex) {
    return <View style={[shape, styles.swatchBorder, { backgroundColor: hex }]} />;
  }
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
  rainbow: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
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
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.one,
    maxHeight: '75%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: Radius.pill,
    backgroundColor: colors.border,
    marginBottom: Spacing.two,
  },
  sheetTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  sheetHint: {
    ...Typography.caption,
    color: colors.textMuted,
    marginBottom: Spacing.two,
  },
  paletteScroll: {
    flexGrow: 0,
  },
  palette: {
    gap: Spacing.one,
    paddingBottom: Spacing.two,
  },
  // Her satır bir renk tonu; 6 yuvarlak satıra eşit yayılır
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paletteRing: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteSwatch: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
  },
});
