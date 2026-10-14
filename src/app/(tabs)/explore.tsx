/**
 * TEST EKRANI (SADECE GELİŞTİRMEDE)
 *
 * Sadece Onur'un deneme panelini gösterir. Sekmesi __DEV__ ile korunur: Expo Go'da
 * görünür, App Store sürümünde gizlenir.
 */

import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DevTestPanel } from '@/components/dev-test-panel';
import { BottomTabInset, Colors, Spacing } from '@/constants/theme';

const colors = Colors.light;

export default function TestScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <DevTestPanel />
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
    paddingBottom: BottomTabInset + Spacing.three,
  },
});
