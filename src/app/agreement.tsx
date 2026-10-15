/**
 * KULLANIM SÖZLEŞMESİ (tekrar okuma)
 *
 * Ayarlar'dan açılır. İlk açılıştaki sözleşme ekranının aynısını gösterir; alttaki butona
 * basınca (ya da sola kaydırınca) Ayarlar'a geri dönülür.
 */

import { Stack, useRouter } from 'expo-router';

import { AgreementScreen } from '@/components/agreement-screen';

export default function AgreementPage() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AgreementScreen onAccept={() => router.back()} />
    </>
  );
}
