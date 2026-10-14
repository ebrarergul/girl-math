import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AgreementScreen } from '@/components/agreement-screen';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AppProvider } from '@/context/app-context';

SplashScreen.preventAutoHideAsync();

// Sözleşmenin onaylandığı bilgisi telefonda bu isimle saklanır
const AGREEMENT_KEY = 'girlmath.agreementAccepted';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // null: henüz telefondan okunmadı, true/false: okundu
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(AGREEMENT_KEY)
      .then((value) => setAccepted(value === 'true'))
      .catch(() => setAccepted(false));
  }, []);

  function handleAccept() {
    setAccepted(true);
    AsyncStorage.setItem(AGREEMENT_KEY, 'true');
  }

  return (
    <AppProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        {accepted === false && <AgreementScreen onAccept={handleAccept} />}
        {accepted === true && <AppTabs />}
      </ThemeProvider>
    </AppProvider>
  );
}
