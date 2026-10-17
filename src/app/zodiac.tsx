/**
 * BURCUNU SEÇ
 *
 * Ayarlar'daki "Burcum" satırı ve Ana sayfadaki burç şeridi (burç seçilmemişse) açar.
 * 12 burçluk ızgara (ZodiacGrid); dokununca burç kaydedilir (setZodiac) ve sayfa kapanır.
 * Burç seçiliyse altta "Burcumu kaldır" (yorumlar gizlenir), değilse "Şimdi değil".
 */

import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ZodiacGrid } from '@/components/zodiac-grid';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import type { ZodiacName } from '@/lib/zodiac';

const colors = Colors.light;

export default function ZodiacScreen() {
  const router = useRouter();
  const { zodiac, setZodiac } = useApp();

  function choose(sign: ZodiacName | null) {
    setZodiac(sign);
    router.back();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Burcun',
          headerBackTitle: 'Geri',
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Yıldızlar dolabına baksın 🔮</Text>
        <Text style={styles.subtitle}>
          Burcuna göre her gün şanslı rengini ve dolabından bir parça öneririm. Gökyüzü telefonunda
          hesaplanır, burcun hiçbir yere gönderilmez.
        </Text>

        <ZodiacGrid value={zodiac} onSelect={choose} />

        <Pressable onPress={() => choose(null)} hitSlop={8} style={styles.skip}>
          <Text style={styles.skipText}>{zodiac ? 'Burcumu kaldır' : 'Şimdi değil'}</Text>
        </Pressable>
      </ScrollView>
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
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  title: {
    ...Typography.title,
    color: colors.text,
  },
  subtitle: {
    ...Typography.body,
    color: colors.textSecondary,
    marginBottom: Spacing.two,
  },
  skip: {
    alignSelf: 'center',
    padding: Spacing.two,
  },
  skipText: {
    ...Typography.bodyBold,
    color: colors.textMuted,
  },
});
