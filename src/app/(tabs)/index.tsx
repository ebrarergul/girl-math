/**
 * ANA SAYFA
 *
 * Şimdilik büyük başlık ve dolaptaki parça sayısını gösteren tek bir kart var.
 * İleride buraya günün kombini, bildirimler ve kısa istatistikler gelecek.
 */

import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';

const colors = Colors.light;

export default function HomeScreen() {
  const { items, isLoaded } = useApp();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.label}>Girl Math</Text>
        <Text style={styles.title}>Merhaba aşko 🎀</Text>
        <Text style={styles.subtitle}>Bugün hangi kıyafetin kendini amorti edecek?</Text>
      </View>

      <View style={[styles.card, Shadows.card]}>
        <Text style={styles.cardLabel}>Dolabındaki parça</Text>
        <Text style={styles.cardValue}>{isLoaded ? items.length : '…'}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    paddingTop: Spacing.four,
    gap: Spacing.one,
  },
  label: {
    ...Typography.label,
    color: colors.primary,
  },
  title: {
    ...Typography.title,
    color: colors.text,
  },
  subtitle: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  cardLabel: {
    ...Typography.label,
    color: colors.textSecondary,
  },
  cardValue: {
    ...Typography.hero,
    color: colors.primary,
  },
});
