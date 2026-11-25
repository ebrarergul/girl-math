/**
 * TANITIM OKLARI (bir kerelik ipuçları)
 *
 * 26 Kasım, Ebrar: "ilk kullanacağı her şeye küçük bir ok gitsin, bir kere tıklatsın, sonra uygulama
 * normale döner". Her ipucunun bir kimliği var ('wallet-buy' gibi); görülenler telefonda saklanır
 * (useApp → seenTips / markTipSeen), bir daha çıkmaz.
 *
 * Kullanımı:
 *   const coach = useCoachMarks(['wallet-buy', 'wallet-share']);   // sayfadaki sıra
 *   <CoachMark visible={coach.active === 'wallet-buy'} text="Almadan önce sor"
 *     onDismiss={() => coach.done('wallet-buy')}>
 *     <LinkRow ... onPress={() => { coach.done('wallet-buy'); router.push(...) }} />
 *   </CoachMark>
 * - Bir sayfada aynı anda tek ok görünür (listede ilk görülmemiş olan); biri bitince sıradaki çıkar.
 * - Ok, hedefe dokununca ya da balonun kendisine dokununca kaybolur.
 * - placement: balon hedefin üstünde ('above') ya da altında ('below');
 *   align: balon hedefin ortasında / solunda / sağında; arrowOffset: ok kenardan kaç piksel içeride.
 * Dikkat: kaydırılan listelerin (ScrollView/FlatList) içinde balon liste sınırında kesilir; hedefi
 * listenin dışından sarmak gerekir.
 */

import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';

const colors = Colors.light;
const BUBBLE_WIDTH = 230;

// Sayfanın ipuçları: ilk görülmemiş olan "active". enabled=false ise hiçbiri (ör. dolap boşken)
export function useCoachMarks(ids: string[], enabled = true) {
  const { seenTips, markTipSeen, isLoaded } = useApp();
  const active = enabled && isLoaded ? (ids.find((id) => !seenTips.includes(id)) ?? null) : null;
  return { active, done: markTipSeen };
}

type Props = {
  visible: boolean;
  text: string;
  onDismiss: () => void;
  placement?: 'above' | 'below';
  align?: 'center' | 'left' | 'right';
  arrowOffset?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function CoachMark({
  visible,
  text,
  onDismiss,
  placement = 'above',
  align = 'center',
  arrowOffset = 20,
  style,
  children,
}: Props) {
  return (
    // Balon görünürken hedef öne alınır (yoksa sonraki kardeşler balonun üstüne çizilir)
    <View style={[style, visible && styles.raised]}>
      {children}
      {visible && (
        <Bubble
          text={text}
          onPress={onDismiss}
          placement={placement}
          align={align}
          arrowOffset={arrowOffset}
        />
      )}
    </View>
  );
}

function Bubble({
  text,
  onPress,
  placement,
  align,
  arrowOffset,
}: {
  text: string;
  onPress: () => void;
  placement: 'above' | 'below';
  align: 'center' | 'left' | 'right';
  arrowOffset: number;
}) {
  // Hedefe doğru hafifçe zıplar
  const bounce = useSharedValue(0);
  const direction = placement === 'above' ? -1 : 1;
  useEffect(() => {
    bounce.set(
      withRepeat(
        withSequence(
          withTiming(5 * direction, { duration: 450, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 450, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
      ),
    );
  }, [bounce, direction]);
  const bounceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.get() }] }));

  const arrow = (
    <SymbolView
      name={placement === 'above' ? 'arrowtriangle.down.fill' : 'arrowtriangle.up.fill'}
      tintColor={colors.primary}
      size={12}
      style={[
        styles.arrow,
        placement === 'above' ? styles.arrowBelowPill : styles.arrowAbovePill,
        align === 'left' && { alignSelf: 'flex-start', marginLeft: arrowOffset - 6 },
        align === 'right' && { alignSelf: 'flex-end', marginRight: arrowOffset - 6 },
      ]}
    />
  );

  return (
    <Animated.View
      entering={FadeIn.duration(300).delay(250)}
      exiting={FadeOut.duration(150)}
      pointerEvents="box-none"
      style={[
        styles.anchor,
        placement === 'above' ? styles.anchorAbove : styles.anchorBelow,
        align === 'center' && styles.alignCenter,
        align === 'left' && styles.alignLeft,
        align === 'right' && styles.alignRight,
      ]}>
      <Animated.View style={[styles.bubble, bounceStyle]}>
        {placement === 'below' && arrow}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onPress();
          }}
          accessibilityLabel={`İpucu: ${text}. Kapatmak için dokun.`}
          style={styles.pill}>
          <Text style={styles.pillText}>{text}</Text>
        </Pressable>
        {placement === 'above' && arrow}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  raised: {
    zIndex: 20,
    elevation: 20,
  },
  anchor: {
    position: 'absolute',
    width: BUBBLE_WIDTH,
  },
  anchorAbove: {
    bottom: '100%',
    marginBottom: Spacing.one,
  },
  anchorBelow: {
    top: '100%',
    marginTop: Spacing.one,
  },
  alignCenter: {
    left: '50%',
    marginLeft: -BUBBLE_WIDTH / 2,
    alignItems: 'center',
  },
  alignLeft: {
    left: 0,
    alignItems: 'flex-start',
  },
  alignRight: {
    right: 0,
    alignItems: 'flex-end',
  },
  bubble: {
    alignItems: 'center',
  },
  pill: {
    backgroundColor: colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    ...Shadows.button,
  },
  pillText: {
    ...Typography.caption,
    fontWeight: '700',
    color: colors.onPrimary,
    textAlign: 'center',
  },
  arrow: {
    width: 12,
    height: 12,
  },
  arrowBelowPill: {
    marginTop: -3,
  },
  arrowAbovePill: {
    marginBottom: -3,
  },
});
