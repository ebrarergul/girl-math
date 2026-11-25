/**
 * WELCOME (KARŞILAMA) EKRANI
 *
 * Sözleşme onaylandıktan sonra bir kez gösterilir. Tek sayfa: "GIRL MATH / Hoş geldin aşko!",
 * tek beyaz kartta 3 adım (simge dairesi + başlık + açıklama, aralarında ince çizgi) ve
 * "Hadi başlayalım" → onStart (sekmeler; dolap boşsa Ana sayfada ekleme butonu çıkar).
 * 26 Kasım: ikinci sayfadaki burç sorusu kaldırıldı (ilk açılış kısa olsun, burç ana iş değil).
 * Burç Ana sayfa → Keşfet → "Burcun" ya da Ayarlar → Burcum'dan seçilir.
 */

import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/components/screen-background';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

const colors = Colors.light;

// Nasıl çalışır adımları. Yeni adım eklemek için bu listeye bir satır eklemek yeterli.
// symbol: satırın solundaki pembe iPhone simgesi (SF Symbols)
const STEPS: { symbol: SFSymbol; title: string; text: string }[] = [
  { symbol: 'hanger', title: 'Dolabını ekle', text: 'Kıyafetlerini fotoğrafı ve fiyatıyla kaydet.' },
  { symbol: 'sparkles', title: '"Giydim"e bas', text: 'Her giydiğinde tek dokunuşla işaretle.' },
  {
    symbol: 'cup.and.saucer',
    title: 'Maliyet düşsün',
    text: 'Giydikçe ucuzlasın, sonunda resmen bedava olsun.',
  },
];

type Props = {
  onStart: () => void;
};

export function WelcomeScreen({ onStart }: Props) {
  return (
    <ScreenBackground>
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.label}>GIRL MATH</Text>
            <Text style={styles.title}>Hoş geldin aşko!</Text>
            <Text style={styles.subtitle}>
              Dolabındaki her parçanın gerçek maliyetini birlikte hesaplayalım.
            </Text>
          </View>

          <View style={styles.card}>
            {STEPS.map((item, index) => (
              <View key={item.title} style={styles.row}>
                <View style={styles.iconCircle}>
                  <SymbolView name={item.symbol} tintColor={colors.primary} size={20} />
                </View>
                <View style={[styles.rowBody, index > 0 && styles.divider]}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={onStart}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            <Text style={styles.buttonText}>Hadi başlayalım</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    gap: Spacing.five,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
    ...Typography.label,
    color: colors.primary,
  },
  title: {
    ...Typography.hero,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Tek beyaz kart, adımlar satır satır (iPhone Ayarları gibi; çizgi simgenin sağından başlar)
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    paddingLeft: Spacing.three,
    ...Shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: Spacing.half,
    paddingVertical: Spacing.three,
    paddingRight: Spacing.three,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowTitle: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  rowText: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    ...Shadows.button,
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    ...Typography.heading,
    color: colors.onPrimary,
    textAlign: 'center',
  },
});
