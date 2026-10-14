/**
 * EKRAN ZEMİNİ: üstten süzülen "pembe ışık"
 *
 * Ekranın üst kısmı açık pembe, aşağı indikçe yumuşakça normal zemin rengine karışır
 * (referans taslaklardaki pembe hava). Beyaz kartlar bu zeminde öne çıkar.
 * Kullanımı: ekranın en dışına sarılır, içindeki SafeAreaView'un zemini şeffaf olur.
 *   <ScreenBackground>
 *     <SafeAreaView style={{ flex: 1 }}>...</SafeAreaView>
 *   </ScreenBackground>
 * Sekmeler, Welcome ve Sözleşme ekranlarında kullanılır. Detay ve form sayfaları sade kalır.
 */

import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';

const colors = Colors.light;

// Pembenin ekranın ne kadarına kadar süreceği (0 = en üst, 1 = en alt)
const FADE_END = 0.45;

export function ScreenBackground({ children }: { children: ReactNode }) {
  return (
    <LinearGradient
      colors={[colors.primarySoft, colors.background]}
      locations={[0, FADE_END]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.fill}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
