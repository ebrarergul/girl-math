import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AgreementScreen } from '@/components/agreement-screen';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { WelcomeScreen } from '@/components/welcome-screen';
import { AppProvider } from '@/context/app-context';

SplashScreen.preventAutoHideAsync();

// Sözleşmenin onaylandığı bilgisi telefonda bu isimle saklanır
const AGREEMENT_KEY = 'girlmath.agreementAccepted';
// Welcome ekranının görüldüğü bilgisi telefonda bu isimle saklanır
const WELCOME_KEY = 'girlmath.welcomeSeen';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // null: henüz telefondan okunmadı, true/false: okundu
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [welcomeSeen, setWelcomeSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.multiGet([AGREEMENT_KEY, WELCOME_KEY])
      .then(([[, agreement], [, welcome]]) => {
        setAccepted(agreement === 'true');
        setWelcomeSeen(welcome === 'true');
      })
      .catch(() => {
        setAccepted(false);
        setWelcomeSeen(false);
      });
  }, []);

  function handleAccept() {
    setAccepted(true);
    AsyncStorage.setItem(AGREEMENT_KEY, 'true');
  }

  function handleWelcomeStart() {
    setWelcomeSeen(true);
    AsyncStorage.setItem(WELCOME_KEY, 'true');
  }

  return (
    <AppProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        {accepted === false && <AgreementScreen onAccept={handleAccept} />}
        {accepted === true && welcomeSeen === false && (
          <WelcomeScreen onStart={handleWelcomeStart} />
        )}
        {accepted === true && welcomeSeen === true && <AppTabs />}
      </ThemeProvider>
    </AppProvider>
  );
}
