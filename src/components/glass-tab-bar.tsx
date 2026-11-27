/**
 * ALT SEKME ÇUBUĞU – sıvı cam kapsül (Onur ekledi, 28 Kasım)
 *
 * Sekmeler Instagram gibi parmakla yana kaysın diye iPhone'un kendi sekme çubuğu (NativeTabs)
 * yerine bu çubuk kullanılıyor (kendi çubuğu kaydırmayı desteklemiyor). Görünüşü ona benzetildi:
 * - Ekranın altında yüzen kapsül; iOS 26'da iPhone'un gerçek "sıvı cam" efekti (expo-glass-effect),
 *   eski iPhone'larda / Android'de yarı saydam beyaz kapsül.
 * - Seçili sekmenin arkasındaki toz pembe hap parmağı takip ederek kayar, yolda hafifçe uzar.
 * - Sekme değişince (dokunarak ya da kaydırarak) hafif titreşim.
 * Sekme sırası ve adları app-tabs.tsx'te; simgeler aşağıdaki TAB_ITEMS listesinde.
 * Ekranların altındaki boşluk (BottomTabInset, theme.ts) bu çubuğun yüksekliğine göre ayarlı.
 */

import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import type { MaterialTopTabBarProps } from 'expo-router/js-top-tabs';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

type TabItem = {
  icon: SymbolViewProps['name'];
  selectedIcon: SymbolViewProps['name'];
};

// Her sekmenin simgesi (route adı → simge). "ios" iPhone'un SF Symbols seti, "android"/"web" Material seti.
const TAB_ITEMS: Record<string, TabItem> = {
  index: {
    icon: { ios: 'house', android: 'home', web: 'home' },
    selectedIcon: { ios: 'house.fill', android: 'home', web: 'home' },
  },
  wardrobe: {
    icon: { ios: 'hanger', android: 'checkroom', web: 'checkroom' },
    selectedIcon: { ios: 'hanger', android: 'checkroom', web: 'checkroom' },
  },
  outfits: {
    icon: { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
    selectedIcon: { ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' },
  },
  wallet: {
    icon: { ios: 'creditcard', android: 'account_balance_wallet', web: 'account_balance_wallet' },
    selectedIcon: {
      ios: 'creditcard.fill',
      android: 'account_balance_wallet',
      web: 'account_balance_wallet',
    },
  },
  explore: {
    icon: { ios: 'wrench.and.screwdriver', android: 'build', web: 'build' },
    selectedIcon: { ios: 'wrench.and.screwdriver.fill', android: 'build', web: 'build' },
  },
};

// Gerçek sıvı cam sadece iOS 26+'da var; bazı iOS 26 beta sürümlerinde API eksik olabiliyor (çökmesin diye)
const USE_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

// Ölçüler iOS 26'nın kendi sekme çubuğuyla aynı (28 Kasım araştırması: FabBar kütüphanesinin ölçümleri)
const BAR_HEIGHT = 62;
const BAR_PADDING = 2; // Kapsülün kenarı ile pembe hap arasındaki boşluk
const SIDE_MARGIN = 21; // Çubuğun ekran kenarlarından uzaklığı
const PILL_STRETCH = 1.12; // Hap iki sekmenin ortasındayken bu kadar uzar ("jöle" hissi)

export function GlassTabBar({ state, descriptors, emitter, position, jumpTo, insets }: MaterialTopTabBarProps) {
  const colors = Colors.light;
  const [rowWidth, setRowWidth] = useState(0);
  const count = state.routes.length;
  const tabWidth = rowWidth > 0 ? (rowWidth - BAR_PADDING * 2) / count : 0;

  // Sekme değişince hafif titreşim (ilk açılışta değil)
  const lastIndex = useRef(state.index);
  useEffect(() => {
    if (lastIndex.current !== state.index) {
      lastIndex.current = state.index;
      Haptics.selectionAsync();
    }
  }, [state.index]);

  // position: kaydırma sırasında 0, 0.3, 0.8, 1… gibi akan sekme sırası. Hap buna göre yer değiştirir.
  // Çubuktan dokununca sayfa animasyonsuz açılır ve position bir anda yeni sekmeye atlar; hap atlamasın
  // diye tapOffset önce farkı geri alır (hap eski yerinde kalır), sonra yay gibi 0'a iner (hap kayar).
  const [tapOffset] = useState(() => new Animated.Value(0));
  const pillPosition = Animated.add(position, tapOffset);
  const indexes = state.routes.map((_, index) => index);
  const halfSteps = indexes.flatMap((index) => (index < count - 1 ? [index, index + 0.5] : [index]));
  const pillStyle =
    tabWidth > 0 && count > 1
      ? {
          width: tabWidth,
          transform: [
            {
              translateX: pillPosition.interpolate({
                inputRange: indexes,
                outputRange: indexes.map((index) => index * tabWidth),
                extrapolate: 'clamp',
              }),
            },
            {
              scaleX: pillPosition.interpolate({
                inputRange: halfSteps,
                outputRange: halfSteps.map((step) => (Number.isInteger(step) ? 1 : PILL_STRETCH)),
                extrapolate: 'clamp',
              }),
            },
          ],
        }
      : { width: 0 };

  const tabs = (
    <View style={styles.row} onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}>
      <Animated.View
        pointerEvents="none"
        style={[styles.pill, { backgroundColor: colors.primarySoft }, pillStyle]}
      />
      {state.routes.map((route, index) => {
        const item = TAB_ITEMS[route.name] ?? TAB_ITEMS.index;
        const focused = state.index === index;
        const tint = focused ? colors.primary : colors.textSecondary;
        const label = descriptors[route.key]?.options.title ?? route.name;

        function handlePress() {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            tapOffset.stopAnimation();
            tapOffset.setValue(state.index - index); // hap şimdilik eski sekmede dursun
            jumpTo(route.key); // sayfa doğrudan açılır
            Animated.spring(tapOffset, {
              toValue: 0, // hap yeni sekmeye kayar
              useNativeDriver: true,
              damping: 20,
              stiffness: 220,
            }).start();
          }
        }

        return (
          <Pressable
            key={route.key}
            onPress={handlePress}
            onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}>
            <SymbolView name={focused ? item.selectedIcon : item.icon} tintColor={tint} size={22} />
            <Text style={[styles.label, { color: tint }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: Math.max(insets.bottom - 12, Spacing.three) }]}>
      {USE_GLASS ? (
        <GlassView glassEffectStyle="regular" colorScheme="light" style={styles.bar}>
          {tabs}
        </GlassView>
      ) : (
        <View
          style={[
            styles.bar,
            Shadows.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            styles.barFallback,
          ]}>
          {tabs}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: SIDE_MARGIN,
    right: SIDE_MARGIN,
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: Radius.pill,
  },
  barFallback: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    padding: BAR_PADDING,
  },
  pill: {
    position: 'absolute',
    top: BAR_PADDING,
    bottom: BAR_PADDING,
    left: BAR_PADDING,
    borderRadius: Radius.pill,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
  },
  tabPressed: {
    opacity: 0.6,
  },
  label: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
  },
});
