/**
 * WELCOME (KARŞILAMA) EKRANI
 *
 * Sözleşme onaylandıktan sonra bir kez gösterilir. İki sayfa:
 * 1) Uygulamanın nasıl çalıştığını 3 kısa kartla anlatır; "Hadi başlayalım" 2. sayfaya geçer.
 * 2) "Son bir şey: burcun ne? 🔮" – 12 burçluk ızgara (ZodiacGrid). Seçince setZodiac ile
 *    kaydedilir; "Dolabıma git 💖" ya da "Şimdi değil" (burç seçilmez) onStart'ı çağırır.
 * Burç sonradan Ayarlar → Burcum'dan da seçilebilir.
 */

import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/components/screen-background';
import { ZodiacGrid } from '@/components/zodiac-grid';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';

const colors = Colors.light;

// Nasıl çalışır kartları. Yeni kart eklemek için bu listeye bir satır eklemek yeterli.
// symbol: kartın solundaki pembe iPhone simgesi (SF Symbols)
const STEPS: { symbol: SFSymbol; title: string; text: string }[] = [
  { symbol: 'hanger', title: 'Dolabını ekle', text: 'Kıyafetlerini fotoğrafı ve fiyatıyla kaydet.' },
  { symbol: 'sparkles', title: '"Giydim"e bas', text: 'Her giydiğinde tek dokunuşla işaretle.' },
  {
    symbol: 'cup.and.saucer.fill',
    title: 'Maliyet düşsün',
    text: 'Giydikçe ucuzlasın, sonunda resmen bedava olsun.',
  },
];

type Props = {
  onStart: () => void;
};

export function WelcomeScreen({ onStart }: Props) {
  const { zodiac, setZodiac } = useApp();
  const [step, setStep] = useState<'intro' | 'zodiac'>('intro');

  if (step === 'zodiac') {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.screen}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.emoji}>🔮</Text>
              <Text style={styles.title}>Son bir şey: burcun ne?</Text>
              <Text style={styles.subtitle}>
                Her gün şanslı rengini ve dolabından yıldızların seçtiği parçayı söylerim.
              </Text>
            </View>
            <ZodiacGrid value={zodiac} onSelect={setZodiac} />
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={onStart}
              disabled={!zodiac}
              style={({ pressed }) => [
                styles.button,
                !zodiac && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.buttonText}>Dolabıma git 💖</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setZodiac(null);
                onStart();
              }}
              hitSlop={8}
              style={styles.skip}>
              <Text style={styles.skipText}>Şimdi değil</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.emoji}>🎀</Text>
            <Text style={styles.label}>GIRL MATH</Text>
            <Text style={styles.title}>Hoş geldin aşko!</Text>
            <Text style={styles.subtitle}>
              Dolabındaki her parçanın gerçek maliyetini birlikte hesaplayalım.
            </Text>
          </View>

          {STEPS.map((step, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.iconCircle}>
                <SymbolView name={step.symbol} tintColor={colors.primary} size={24} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{step.title}</Text>
                <Text style={styles.cardText}>{step.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={() => setStep('zodiac')}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            <Text style={styles.buttonText}>Hadi başlayalım 💖</Text>
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  emoji: {
    fontSize: 56,
    lineHeight: 64,
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.three,
    ...Shadows.card,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: Spacing.half,
  },
  cardTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  cardText: {
    ...Typography.body,
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
  buttonDisabled: {
    opacity: 0.4,
  },
  skip: {
    alignSelf: 'center',
    paddingTop: Spacing.three,
  },
  skipText: {
    ...Typography.bodyBold,
    color: colors.textMuted,
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
