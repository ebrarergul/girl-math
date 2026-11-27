import { TopTabs } from 'expo-router/js-top-tabs';
import { useColorScheme } from 'react-native';

import { GlassTabBar } from '@/components/glass-tab-bar';
import { Colors } from '@/constants/theme';

// Sekmeler (28 Kasım, Onur): Instagram gibi parmakla yana kayan sayfalar. iPhone'un kendi sekme
// çubuğu (NativeTabs) kaydırmayı desteklemediği için alttaki çubuk artık bizim GlassTabBar'ımız
// (sıvı cam kapsül, glass-tab-bar.tsx). Buradaki sıra = çubuktaki ve kaydırmadaki sıra.
// Simgeler glass-tab-bar.tsx içindeki TAB_ITEMS listesinde.
export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <TopTabs
      tabBarPosition="bottom"
      tabBar={(props) => <GlassTabBar {...props} />}
      // animationEnabled false: çubuktan dokununca sayfa doğrudan açılır (aradaki sekmeler hızla
      // geçmesin; iPhone'un kendi çubuğu da böyle). Parmakla kaydırma yine sayfayı kaydırır.
      // Dokununca kayan pembe hap animasyonu glass-tab-bar.tsx'te.
      screenOptions={{ sceneStyle: { backgroundColor: colors.background }, animationEnabled: false }}>
      <TopTabs.Screen name="index" options={{ title: 'Ana sayfa' }} />
      <TopTabs.Screen name="wardrobe" options={{ title: 'Dolap' }} />
      {/* Kombinler (26 Kasım): eskiden Dolap'taki ⊞ butonunun arkasındaydı */}
      <TopTabs.Screen name="outfits" options={{ title: 'Kombinler' }} />
      <TopTabs.Screen name="wallet" options={{ title: 'Cüzdan' }} />

      {/* Onur'un deneme paneli. __DEV__ sadece geliştirmede (Expo Go) doğrudur,
          App Store sürümünde bu sekme otomatik olarak gizlenir. */}
      <TopTabs.Protected guard={__DEV__}>
        <TopTabs.Screen name="explore" options={{ title: 'Test' }} />
      </TopTabs.Protected>
    </TopTabs>
  );
}
