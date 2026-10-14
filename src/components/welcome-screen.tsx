/**
 * WELCOME (KARŞILAMA) EKRANI
 *
 * Sözleşme onaylandıktan sonra bir kez gösterilir ve uygulamanın nasıl çalıştığını
 * 3 kısa kartla anlatır. Kullanıcı alttaki butona basınca onStart çağrılır.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

const colors = Colors.light;

// Nasıl çalışır kartları. Yeni kart eklemek için bu listeye bir satır eklemek yeterli.
const STEPS = [
  { emoji: '👗', title: 'Dolabını ekle', text: 'Kıyafetlerini fotoğrafı ve fiyatıyla kaydet.' },
  { emoji: '✨', title: '"Giydim"e bas', text: 'Her giydiğinde tek dokunuşla işaretle.' },
  { emoji: '☕', title: 'Maliyet düşsün', text: 'Giydikçe ucuzlasın, sonunda resmen bedava olsun.' },
];

type Props = {
  onStart: () => void;
};

export function WelcomeScreen({ onStart }: Props) {
  return (
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
              <Text style={styles.iconText}>{step.emoji}</Text>
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
          onPress={onStart}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>Hadi başlayalım 💖</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
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
  iconText: {
    fontSize: 24,
    lineHeight: 30,
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
