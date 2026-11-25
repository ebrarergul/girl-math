/**
 * AYARLAR
 *
 * iPhone ayarları tarzında gruplar halinde:
 * - BİLDİRİMLER: izin durumu + "Bildirimleri aç" (izin daha önce reddedildiyse iPhone
 *   Ayarları'nı açar), deneme bildirimi
 * - GIRL MATH: Burcum (burç seçimi), Kullanım Sözleşmesi'ni tekrar okuma, gizlilik notu, sürüm
 * - VERİLER: "Yedeği dışa aktar" / "Yedeği yükle" (Onur'un backup.ts'i: tek dosya, fotoğraflar
 *   dahil; yüklemeden önce özetle onay sorar) ve "Bütün verileri sil" (iki kez sorar; sadece dolap
 *   silinir, sözleşme kalır)
 * Ana sayfanın sağ üstündeki ⚙️ butonuyla açılır.
 * 26 Kasım (taslak B): grup başlıkları sade ("Bildirimler"), simgeler açık gül dairede pembe çizgi
 * (eskiden her satırda pembe dolgulu kare vardı), çizgiler simgenin sağından, gizlilik kutusu sade not.
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
import { backupErrorText, exportBackup, readBackup } from '@/lib/backup';
import {
  hasNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
} from '@/lib/notifications';
import { zodiacSign } from '@/lib/zodiac';

const colors = Colors.light;

export default function SettingsScreen() {
  const router = useRouter();
  const { items, outfits, quizResults, resetAll, restoreAll, zodiac } = useApp();
  // Yedek hazırlanırken satırda "Hazırlanıyor…" yazar (büyük dolapta birkaç saniye sürebilir)
  const [exporting, setExporting] = useState(false);

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

  // Yedek: tek dosya + iPhone'un paylaşım penceresi ("Dosyalar'a Kaydet", iCloud, WhatsApp…)
  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const ok = await exportBackup({ items, outfits, zodiac, quizResults });
      if (!ok) {
        Alert.alert('Yedek hazırlanamadı', 'Bu cihazda paylaşım penceresi açılamadı.');
      }
    } finally {
      setExporting(false);
    }
  }

  // Yedeği yükle: önce dosyayı okur (hiçbir şeyi değiştirmez), özetle onay sorar, sonra değiştirir
  async function handleImport() {
    const read = await readBackup();
    if (!read.ok) {
      if (read.reason !== 'canceled') {
        Alert.alert('Yüklenemedi', backupErrorText(read.reason));
      }
      return;
    }
    Alert.alert(
      '📥 Yedeği yükle?',
      `${read.summary}\n\nŞu anki dolabın silinip yedektekiyle değiştirilecek.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Yükle',
          style: 'destructive',
          onPress: () => {
            const ok = restoreAll(read.backup);
            Alert.alert(
              ok ? '✅ Dolabın geri geldi!' : 'Bir sorun oldu',
              ok ? read.summary : 'Mevcut dolabına dokunulmadı.',
            );
          },
        },
      ],
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
        <Section title="Bildirimler">
          <Row
            first
            icon="bell"
            title="Bildirimler"
            detail={notificationsOn === null ? '…' : notificationsOn ? 'Açık' : undefined}
            action={notificationsOn === false ? 'Aç' : undefined}
            onPress={notificationsOn === false ? handleEnableNotifications : undefined}
          />
          <Row
            icon="paperplane"
            title="Deneme bildirimi gönder"
            onPress={handleTestNotification}
            chevron
          />
        </Section>
        <Text style={styles.note}>
          Ödül, takılma ve akşam 20:00 hatırlatması bildirimleri. Hepsi telefonunda oluşturulur.
        </Text>

        <Section title="Girl Math">
          <Row
            first
            icon="moon.stars"
            title="Burcum"
            detail={zodiac ? `${zodiacGlyph(zodiacSign(zodiac).emoji)} ${zodiac}` : 'Seçilmedi'}
            onPress={() => router.push('/zodiac')}
            chevron
          />
          <Row
            icon="doc.text"
            title="Kullanım Sözleşmesi"
            onPress={() => router.push('/agreement')}
            chevron
          />
          <Row icon="info.circle" title="Sürüm" detail={version} />
        </Section>

        <Section title="Veriler">
          <Row
            first
            icon="square.and.arrow.up"
            title="Yedeği dışa aktar"
            detail={exporting ? 'Hazırlanıyor…' : items.length === 0 ? 'Dolap boş' : undefined}
            onPress={items.length > 0 && !exporting ? handleExport : undefined}
            chevron={items.length > 0 && !exporting}
          />
          <Row
            icon="square.and.arrow.down"
            title="Yedeği yükle"
            onPress={handleImport}
            chevron
          />
          <Row
            icon="trash"
            title="Bütün verileri sil"
            destructive
            onPress={items.length > 0 ? handleResetAll : undefined}
            detail={items.length === 0 ? 'Dolap boş' : undefined}
          />
        </Section>
        <Text style={styles.note}>
          Uygulamayı silmeden ya da telefon değiştirmeden önce yedek al. Yedek tek dosyadır
          (fotoğraflar dahil); Dosyalar’a, iCloud’a ya da kendine WhatsApp’tan gönderebilirsin.
        </Text>

        <View style={styles.privacy}>
          <SymbolView name="lock" tintColor={colors.textSecondary} size={16} />
          <View style={styles.privacyBody}>
            <Text style={styles.privacyTitle}>Gizlilik</Text>
            <Text style={styles.privacyText}>
              Hesap yok, sunucu yok. Kıyafetlerin, fiyatların ve fotoğrafların sadece bu telefonda
              durur; hiçbir yere gönderilmez.
            </Text>
          </View>
        </View>

        <Text style={styles.signature}>Ebrar & Onur tarafından sevgiyle yapıldı</Text>
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

// Gruptaki tek satır: solda açık gül dairede pembe simge, ortada başlık, sağda bilgi / buton / ok.
// first: gruptaki ilk satır (üstünde çizgi yok); çizgi simgenin sağından başlar (iPhone Ayarları gibi)
function Row({
  icon,
  title,
  detail,
  action,
  chevron = false,
  destructive = false,
  first = false,
  onPress,
}: {
  first?: boolean;
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
        <SymbolView
          name={icon}
          tintColor={destructive ? colors.danger : colors.primary}
          size={16}
        />
      </View>
      <View style={[styles.rowBody, !first && styles.rowDivider]}>
        <Text style={[styles.rowTitle, destructive && styles.rowTitleDestructive]}>{title}</Text>
        {detail && <Text style={styles.rowDetail}>{detail}</Text>}
        {action && (
          <View style={styles.actionPill}>
            <Text style={styles.actionText}>{action}</Text>
          </View>
        )}
        {chevron && (
          <SymbolView
            name="chevron.right"
            tintColor={colors.textMuted}
            size={13}
            weight="semibold"
          />
        )}
      </View>
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
    ...Typography.heading,
    color: colors.text,
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
    paddingLeft: Spacing.three,
  },
  rowPressed: {
    backgroundColor: colors.backgroundElement,
  },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingRight: Spacing.three,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDestructive: {
    backgroundColor: colors.backgroundElement,
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
  // Gizlilik: kutu değil, kilit simgeli sade not
  privacy: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.two,
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
    ...Typography.caption,
    color: colors.textSecondary,
  },
  signature: {
    ...Typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});
