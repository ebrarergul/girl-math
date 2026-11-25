/**
 * EKRAN ZEMİNİ
 *
 * Düz sıcak krem zemin (tema `background`). Beyaz kartlar bu zeminde öne çıkar.
 * (25 Kasım 2026'ya kadar üstten süzülen bir "pembe ışık" vardı; "çok pembe, göz yoruyor"
 * denince kaldırıldı. Bileşen yerinde kaldı ki zemin tek yerden değiştirilebilsin.)
 * Kullanımı: ekranın en dışına sarılır, içindeki SafeAreaView'un zemini şeffaf olur.
 *   <ScreenBackground>
 *     <SafeAreaView style={{ flex: 1 }}>...</SafeAreaView>
 *   </ScreenBackground>
 * Sekmeler, Welcome ve Sözleşme ekranlarında kullanılır.
 */

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

const colors = Colors.light;

export function ScreenBackground({ children }: { children: ReactNode }) {
  return <View style={styles.fill}>{children}</View>;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
