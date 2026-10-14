/**
 * GIRL MATH KULLANIM SÖZLEŞMESİ
 *
 * Uygulama ilk kez açıldığında gösterilen eğlenceli karşılama ekranı.
 * Kullanıcı alttaki butona basınca onAccept çağrılır ve uygulamaya geçilir.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/components/screen-background';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

const colors = Colors.light;

// Sözleşme maddeleri. Yeni madde eklemek için bu listeye bir satır eklemek yeterli.
const ARTICLES = [
  'Nakit parayla alınan her şey bedavadır.',
  'İade edilen üründen gelen para, havadan kazanılmış ekstra kazançtır.',
  'Aylar önceden ödenen her şey etkinlik günü geldiğinde 0 TL sayılır.',
  'İndirimden bir şey almak para harcatmaz, para kazandırır.',
];

type Props = {
  onAccept: () => void;
};

export function AgreementScreen({ onAccept }: Props) {
  return (
    <ScreenBackground>
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.scroll}>📜</Text>
            <Text style={styles.title}>GIRL MATH{'\n'}KULLANIM SÖZLEŞMESİ</Text>
            <Text style={styles.subtitle}>Devam etmeden önce lütfen dikkatle okuyunuz 🎀</Text>
          </View>

          {ARTICLES.map((text, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Madde {index + 1}</Text>
              </View>
              <Text style={styles.articleText}>{text}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={onAccept}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            <Text style={styles.buttonText}>
              💖 Okudum, anladım ve banka bakiyemi görmezden gelmeyi kabul ediyorum!
            </Text>
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
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  scroll: {
    fontSize: 48,
    lineHeight: 56,
  },
  title: {
    ...Typography.title,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Shadows.card,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  badgeText: {
    ...Typography.caption,
    color: colors.primary,
  },
  articleText: {
    ...Typography.heading,
    color: colors.text,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.four,
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
