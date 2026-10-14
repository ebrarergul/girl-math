/**
 * CÜZDAN EKRANI
 *
 * Şimdilik sadece başlık var. İleride buraya dolap değeri, istatistikler ve
 * Starbucks Endeksi gelecek.
 */

import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing, Typography } from '@/constants/theme';

const colors = Colors.light;

export default function WalletScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Cüzdanım</Text>
        <Text style={styles.subtitle}>Girl Math hesapların yakında burada 💸</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.one,
  },
  title: {
    ...Typography.title,
    color: colors.text,
  },
  subtitle: {
    ...Typography.body,
    color: colors.textSecondary,
  },
});
