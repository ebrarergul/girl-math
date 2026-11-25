/**
 * TOZ PEMBE YANSIMALI KART
 *
 * Beyaz kart ama sol üstten toz pembe bir yansıma beyaza açılır (Gradients.blush). 26 Kasım'da
 * "Bugün ne giydin?" kartında beğenildi; sayfaların BÜYÜK kartlarında kullanılır (Ana sayfa: Bugün ne
 * giydin?, Girl Math gerçeği, Günün kombini; Cüzdan: dolap değeri). Küçük kutular beyaz kalır,
 * yoksa yansıma özelliğini kaybeder ve sayfa yine "pembe pembe" olur.
 *
 * Gölge dışta, geçiş içte (köşeler kırpılınca gölge kaybolmasın diye iki katman).
 *   <BlushCard style={{ padding: Spacing.three }}>...</BlushCard>
 *   <BlushCard onPress={...}>...</BlushCard>   // dokunulabilir kart (basınca hafif küçülür)
 */

import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Gradients, Radius, Shadows, Spacing } from '@/constants/theme';

const colors = Colors.light;

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>; // İç kısım (padding, gap…)
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function BlushCard({ children, style, onPress, accessibilityLabel }: Props) {
  const inner = (
    <LinearGradient
      colors={Gradients.blush}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.inner, style]}>
      {children}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [styles.shadow, pressed && styles.pressed]}>
        {inner}
      </Pressable>
    );
  }
  return <View style={styles.shadow}>{inner}</View>;
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: Radius.lg,
    backgroundColor: colors.card,
    ...Shadows.card,
  },
  inner: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
    overflow: 'hidden',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
