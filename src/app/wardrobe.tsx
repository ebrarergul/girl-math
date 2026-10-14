/**
 * DOLAP EKRANI
 *
 * Şimdilik sadece başlık var. 4. aşamada buraya 2 sütunlu kıyafet kartları,
 * arama ve kategori hapları gelecek.
 */

import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing, Typography } from '@/constants/theme';

const colors = Colors.light;

export default function WardrobeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Dolabım</Text>
        <Text style={styles.subtitle}>Kıyafetlerin yakında burada 👗</Text>
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
