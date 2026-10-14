import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

// Simgeler: "sf" iPhone'un kendi simge seti (SF Symbols), "md" Android'in simge seti (Material)
export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      tintColor={colors.primary}
      indicatorColor={colors.primarySoft}
      labelStyle={{ selected: { color: colors.primary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Ana sayfa</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="wardrobe">
        <NativeTabs.Trigger.Label>Dolap</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="hanger" md="checkroom" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="wallet">
        <NativeTabs.Trigger.Label>Cüzdan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'creditcard', selected: 'creditcard.fill' }}
          md="account_balance_wallet"
        />
      </NativeTabs.Trigger>

      {/* Onur'un deneme paneli. __DEV__ sadece geliştirmede (Expo Go) doğrudur,
          App Store sürümünde bu sekme otomatik olarak gizlenir. */}
      {__DEV__ && (
        <NativeTabs.Trigger name="explore">
          <NativeTabs.Trigger.Label>Test</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="wrench.and.screwdriver" md="build" />
        </NativeTabs.Trigger>
      )}
    </NativeTabs>
  );
}
