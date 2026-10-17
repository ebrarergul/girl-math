/**
 * AYARLAR
 *
 * iPhone ayarları tarzında gruplar halinde:
 * - BİLDİRİMLER: izin durumu + "Bildirimleri aç" (izin daha önce reddedildiyse iPhone
 *   Ayarları'nı açar), deneme bildirimi
 * - GIRL MATH: Burcum (burç seçimi), Kullanım Sözleşmesi'ni tekrar okuma, gizlilik notu, sürüm
 * - VERİLER: "Bütün verileri sil" (iki kez sorar; sadece dolap silinir, sözleşme kalır)
 * Ana sayfanın sağ üstündeki ⚙️ butonuyla açılır.
 */

import Constants from 'expo-constants';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useCallback, useState, type ReactNode } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { zodiacGlyph } from '@/components/zodiac-grid';
import { useApp } from '@/context/app-context';
import {
  hasNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
} from '@/lib/notifications';
import { zodiacSign } from '@/lib/zodiac';

const colors = Colors.light;

export default function SettingsScreen() {
  const router = useRouter();
  const { items, resetAll, zodiac } = useApp();

  // Bildirim izni: null = henüz okunmadı. Ekrana her dönüldüğünde yeniden okunur
  // (kullanıcı iPhone Ayarları'ndan izni açıp geri gelmiş olabilir).
  const [notificationsOn, setNotificationsOn] = useState<boolean | null>(null);
  useFocusEffect(
    useCallback(() => {
      hasNotificationPermission()
        .then(setNotificationsOn)
        .catch(() => setNotificationsOn(false));
    }, []),
  );

  async function handleEnableNotifications() {
    const granted = await requestNotificationPermission();
    setNotificationsOn(granted);
    if (!granted) {
      // iPhone izin penceresini sadece bir kez gösterir; reddedildiyse ayarlardan açılmalı
      Alert.alert(
        'Bildirimler kapalı',
        'Girl Math bildirimlerini iPhone Ayarları’ndan açabilirsin.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Ayarları aç', onPress: () => Linking.openSettings() },
        ],
      );
    }
  }

  async function handleTestNotification() {
    const sent = await sendTestNotification();
    Alert.alert(
      sent ? 'Deneme bildirimi yolda 🔔' : 'Bildirim gönderilemedi',
      sent
        ? '5 saniye içinde gelecek. Görmek için uygulamadan çıkabilirsin.'
        : 'Önce bildirimleri açman gerekiyor.',
    );
  }

  // Geri alınamaz olduğu için iki kez sorar; silince Ana sayfaya döner
  function handleResetAll() {
    Alert.alert(
      'Bütün verileri sil?',
      `Dolabındaki ${items.length} parça, fotoğrafları ve bütün giyim geçmişin silinecek.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Devam',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Son kez soruyorum aşko 🥲', 'Bu işlem geri alınamaz.', [
              { text: 'Vazgeç', style: 'cancel' },
              {
                text: 'Sil',
                style: 'destructive',
                onPress: () => {
                  resetAll();
                  router.dismissAll();
                  router.navigate('/');
                  Alert.alert('Dolabın tertemiz 🫧', 'Yeni bir başlangıç için ilk parçanı ekle.');
                },
              },
            ]),
        },
      ],
    );
  }

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Ayarlar',
          headerBackTitle: 'Geri',
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="BİLDİRİMLER">
          <Row
            icon="bell.fill"
            title="Bildirimler"
            detail={notificationsOn === null ? '…' : notificationsOn ? 'Açık' : undefined}
            action={notificationsOn === false ? 'Aç' : undefined}
            onPress={notificationsOn === false ? handleEnableNotifications : undefined}
          />
          <Row
            icon="paperplane.fill"
            title="Deneme bildirimi gönder"
            onPress={handleTestNotification}
            chevron
          />
        </Section>
        <Text style={styles.note}>
          Ödül, takılma ve akşam 20:00 hatırlatması bildirimleri. Hepsi telefonunda oluşturulur.
        </Text>

        <Section title="GIRL MATH">
          <Row
            icon="moon.stars.fill"
            title="Burcum"
            detail={zodiac ? `${zodiacGlyph(zodiacSign(zodiac).emoji)} ${zodiac}` : 'Seçilmedi'}
            onPress={() => router.push('/zodiac')}
            chevron
          />
          <Row
            icon="doc.text.fill"
            title="Kullanım Sözleşmesi"
            onPress={() => router.push('/agreement')}
            chevron
          />
          <Row icon="info.circle.fill" title="Sürüm" detail={version} />
        </Section>

        <Section title="VERİLER">
          <Row
            icon="trash.fill"
            title="Bütün verileri sil"
            destructive
            onPress={items.length > 0 ? handleResetAll : undefined}
            detail={items.length === 0 ? 'Dolap boş' : undefined}
          />
        </Section>

        <View style={styles.privacy}>
          <SymbolView name="lock.fill" tintColor={colors.primary} size={18} />
          <View style={styles.privacyBody}>
            <Text style={styles.privacyTitle}>Gizlilik</Text>
            <Text style={styles.privacyText}>
              Hesap yok, sunucu yok. Kıyafetlerin, fiyatların ve fotoğrafların sadece bu telefonda
              durur; hiçbir yere gönderilmez.
            </Text>
          </View>
        </View>

        <Text style={styles.signature}>Ebrar & Onur tarafından sevgiyle yapıldı 🎀</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Beyaz, yuvarlak köşeli grup (iPhone Ayarları'ndaki gibi)
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

// Gruptaki tek satır: solda pembe simge, ortada başlık, sağda bilgi / buton / ok
function Row({
  icon,
  title,
  detail,
  action,
  chevron = false,
  destructive = false,
  onPress,
}: {
  icon: SFSymbol;
  title: string;
  detail?: string;
  action?: string;
  chevron?: boolean;
  destructive?: boolean; // Kırmızı: geri alınamaz işlemler (silme)
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
        <SymbolView name={icon} tintColor={colors.onPrimary} size={15} />
      </View>
      <Text style={[styles.rowTitle, destructive && styles.rowTitleDestructive]}>{title}</Text>
      {detail && <Text style={styles.rowDetail}>{detail}</Text>}
      {action && (
        <View style={styles.actionPill}>
          <Text style={styles.actionText}>{action}</Text>
        </View>
      )}
      {chevron && (
        <SymbolView name="chevron.right" tintColor={colors.textMuted} size={13} weight="semibold" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  section: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  sectionTitle: {
    ...Typography.label,
    color: colors.textSecondary,
    marginLeft: Spacing.two,
  },
  group: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.primarySoft,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm - 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDestructive: {
    backgroundColor: colors.danger,
  },
  rowTitleDestructive: {
    color: colors.danger,
  },
  rowTitle: {
    ...Typography.body,
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  rowDetail: {
    ...Typography.body,
    fontSize: 16,
    color: colors.textSecondary,
  },
  actionPill: {
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  actionText: {
    ...Typography.bodyBold,
    color: colors.onPrimary,
  },
  note: {
    ...Typography.caption,
    color: colors.textMuted,
    marginHorizontal: Spacing.two,
  },
  privacy: {
    flexDirection: 'row',
    gap: Spacing.three,
    backgroundColor: colors.primarySoft,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    marginTop: Spacing.four,
  },
  privacyBody: {
    flex: 1,
    gap: Spacing.half,
  },
  privacyTitle: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  privacyText: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  signature: {
    ...Typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});
