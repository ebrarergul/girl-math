/**
 * ANA SAYFA
 *
 * Her gün açılan "bugün" ekranı: selamlama, "Bugün ne giydin?" hızlı check-in şeridi,
 * iki küçük istatistik, "Unutulan parça"
 * uyarısı (Utanç Duvarı'nın ilk hali) ve "Dolabının yıldızı" (en çok giyilen) kartı. Dolap boşsa ekleme
 * butonu çıkar. Tüm sayılar getWardrobeStats'tan gelir.
 * İleride: "Günün kombini" kartı (Onur'un kombin motoru hazır olunca).
 */

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatTL } from '@/components/clothing-card';
import { StatTile } from '@/components/stat-tile';
import { ScreenBackground } from '@/components/screen-background';
import { BottomTabInset, Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { comparisonText, findComparison } from '@/lib/comparisons';
import { costPerWear, todayString, wearCount } from '@/lib/girl-math';
import { photoUri } from '@/lib/photos';
import { getWardrobeStats } from '@/lib/stats';
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

// Bu kadar gün giyilmeyen parça "unutulmuş" sayılır ve Ana sayfada uyarı çıkar
const FORGOTTEN_DAYS = 7;

// Utanç Duvarı "zarar" hesabı: bir kıyafetin parası 1 yılda "eritilmeli"; giyilmeden geçen
// her gün fiyatın 1/365'i boşa gider. Günlük tutar sadece anlamlıysa (≥ 10 ₺) gösterilir,
// asıl vurgu zamanla büyüyen toplam zarardadır.
const LOSS_YEAR_DAYS = 365;
const MIN_DAILY_LOSS_TO_SHOW = 10;

// Örn: "📉 Sana günlük 16 ₺ zarar yazıyor. Şimdiye kadar boşa giden: 986 ₺ ≈ Brunch 🥞"
// Boşa giden tutar en ucuz kıyas kaleminden bile azsa null döner (satır gösterilmez).
function lossText(price: number, days: number): string | null {
  const daily = price / LOSS_YEAR_DAYS;
  const total = Math.round(daily * days);
  const match = findComparison(total);
  if (days <= 0 || !match) {
    return null;
  }
  const dailyPart =
    daily >= MIN_DAILY_LOSS_TO_SHOW
      ? `Sana günlük ${formatTL(Math.round(daily))} zarar yazıyor. `
      : '';
  return `📉 ${dailyPart}Şimdiye kadar boşa giden: ${formatTL(total)} ≈ ${match.name} ${match.emoji}`;
}
// Check-in balonunun ekranda kalma süresi (milisaniye); "Geri al"a basmaya yetecek kadar
const TOAST_DURATION = 4000;

type Toast = { id: number; text: string; undoItemId: string | null };

export default function HomeScreen() {
  const router = useRouter();
  const { items, isLoaded, wearItem, undoWear } = useApp();
  const stats = getWardrobeStats(items);
  const isEmpty = isLoaded && items.length === 0;
  const today = todayString();

  // Check-in balonu (detay sayfasındakiyle aynı mantık, ek olarak "Geri al" düğmesi var)
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastCount = useRef(0);
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(text: string, undoItemId: string | null = null) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastCount.current += 1;
    setToast({ id: toastCount.current, text, undoItemId });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION);
  }

  // "Bugün ne giydin?" şeridi ışık düğmesi gibi çalışır: bir dokunuş ✓ koyar (Giydim),
  // ✓ olana tekrar dokunmak bugünkü giyimi geri alır (✓ kalkar).
  function handleQuickWear(item: ClothingItem) {
    const name = `“${item.name}”`;
    if (item.wearDates.includes(today)) {
      undoWear(item.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showToast(`${name} bugünden çıkarıldı ↩`);
      return;
    }
    const newWears = wearCount(item) + 1;
    wearItem(item.id);
    // Titreşim: hedefe ulaştıysa "başarı" titreşimi, değilse tek bir "tık"
    if (newWears === item.targetWears) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (newWears === item.targetWears) {
      showToast(`${name} amorti edildi, resmen bedava 💅`, item.id);
    } else if (newWears === 1) {
      showToast(`${name} ilk kez giyildi 🎉`, item.id);
    } else {
      showToast(`${name} artık ${formatTL(Math.round(item.price / newWears))} /giyim 💸`, item.id);
    }
  }

  function handleUndo() {
    if (toast?.undoItemId) {
      undoWear(toast.undoItemId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }

  function openItem(item: ClothingItem) {
    router.push({ pathname: '/item/[id]', params: { id: item.id } });
  }

  // Unutulan parça uyarısı: hiç giyilmediyse ya da uzun süredir giyilmediyse gösterilir.
  // Mesajlarda kıyafet adı tırnak içinde özne olur, Türkçe ek gerekmez.
  const forgotten = stats.forgotten;
  let forgottenMessage: string | null = null;
  if (forgotten) {
    const name = `“${forgotten.item.name}”`;
    if (wearCount(forgotten.item) === 0) {
      forgottenMessage = `${name} daha hiç giyilmedi 👀 Giymeye başla, maliyeti düşsün!`;
    } else if (forgotten.days >= FORGOTTEN_DAYS) {
      forgottenMessage = `${name} ${forgotten.days} gündür askıda 👀 Ya bu hafta giy ya da satışa koy!`;
    }
  }

  const star = stats.mostWorn;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.label}>GIRL MATH</Text>
            <Text style={styles.title}>Merhaba aşko 🎀</Text>
            <Text style={styles.subtitle}>Bugün hangi kıyafetin kendini amorti edecek?</Text>
          </View>

          {isEmpty ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <SymbolView
                  name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
                  tintColor={colors.primary}
                  size={34}
                  weight="light"
                />
              </View>
              <Text style={styles.emptyTitle}>{"Girl Math'e hoş geldin"}</Text>
              <Text style={styles.emptyText}>
                İlk parçanı ekle, her giydiğinde maliyetinin nasıl düştüğünü gör.
              </Text>
              <Pressable
                onPress={() => router.push('/add-item')}
                style={({ pressed }) => [styles.emptyButton, pressed && styles.buttonPressed]}>
                <Text style={styles.emptyButtonText}>İlk parçanı ekle</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {items.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Bugün ne giydin?</Text>
                  <Text style={styles.sectionNote}>
                    Dokun, Giydim sayılsın ✨ Tekrar dokunursan geri alınır.
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.stripScroll}
                    contentContainerStyle={styles.strip}>
                    {items.map((item) => (
                      <QuickWearButton
                        key={item.id}
                        item={item}
                        wornToday={item.wearDates.includes(today)}
                        onPress={() => handleQuickWear(item)}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.row}>
                <StatTile label="Dolabındaki parça" value={isLoaded ? String(items.length) : '…'} />
                <StatTile
                  label="Bu ay giyim"
                  value={String(stats.wearsThisMonth)}
                  caption={stats.wearsThisMonth > 0 ? 'harikasın ✨' : 'ilk "Giydim" seni bekliyor'}
                />
              </View>

              {forgotten && forgottenMessage && (
                <HighlightCard
                  eyebrow="UNUTULAN PARÇA"
                  item={forgotten.item}
                  message={forgottenMessage}
                  extra={lossText(forgotten.item.price, forgotten.days)}
                  tone="warning"
                  onPress={() => openItem(forgotten.item)}
                />
              )}

              {star && (
                <HighlightCard
                  eyebrow="DOLABININ YILDIZI ⭐"
                  item={star}
                  message={`${wearCount(star)} kere giydin, ${formatTL(costPerWear(star))} /giyim. ${comparisonText(costPerWear(star))}`}
                  onPress={() => openItem(star)}
                />
              )}
            </>
          )}
        </ScrollView>

        {/* Check-in balonu: sekme çubuğunun hemen üstünde belirir */}
        {toast && (
          <View style={styles.toastWrap} pointerEvents="box-none">
            <Animated.View
              key={toast.id}
              entering={FadeInDown.springify()}
              exiting={FadeOutDown}
              style={styles.toast}>
              <Text style={styles.toastText}>{toast.text}</Text>
              {toast.undoItemId && (
                <Pressable onPress={handleUndo} hitSlop={8}>
                  <Text style={styles.toastUndo}>Geri al</Text>
                </Pressable>
              )}
            </Animated.View>
          </View>
        )}
      </SafeAreaView>
    </ScreenBackground>
  );
}

// "Bugün ne giydin?" şeridindeki küçük fotoğraf. Bugün giyildiyse köşede pembe ✓ çıkar
function QuickWearButton({
  item,
  wornToday,
  onPress,
}: {
  item: ClothingItem;
  wornToday: boolean;
  onPress: () => void;
}) {
  const uri = photoUri(item.photoFileName);

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${item.name}: Giydim`}
      style={({ pressed }) => [styles.quick, pressed && styles.quickPressed]}>
      <View style={[styles.quickPhoto, wornToday && styles.quickPhotoWorn]}>
        {uri ? (
          <Image source={{ uri }} style={styles.thumbImage} contentFit="cover" />
        ) : (
          <SymbolView
            name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
            tintColor={colors.primary}
            size={24}
            weight="light"
          />
        )}
        {wornToday && (
          <View style={styles.quickCheck}>
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              tintColor={colors.onPrimary}
              size={12}
              weight="bold"
            />
          </View>
        )}
      </View>
      <Text style={styles.quickName} numberOfLines={1}>
        {item.name}
      </Text>
    </Pressable>
  );
}

// Fotoğraflı vurgu kartı: solda küçük fotoğraf, sağda başlık, kıyafet adı ve mesaj
function HighlightCard({
  eyebrow,
  item,
  message,
  extra,
  tone = 'default',
  onPress,
}: {
  eyebrow: string;
  item: ClothingItem;
  message: string;
  extra?: string | null; // Mesajın altında pembe vurgulu ek satır (ör. Utanç Duvarı zararı)
  tone?: 'default' | 'warning';
  onPress: () => void;
}) {
  const uri = photoUri(item.photoFileName);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.highlight,
        tone === 'warning' && styles.highlightWarning,
        pressed && styles.highlightPressed,
      ]}>
      <View style={styles.thumb}>
        {uri ? (
          <Image source={{ uri }} style={styles.thumbImage} contentFit="cover" />
        ) : (
          <SymbolView
            name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
            tintColor={colors.primary}
            size={24}
            weight="light"
          />
        )}
      </View>
      <View style={styles.highlightBody}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.highlightName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.highlightMessage}>{message}</Text>
        {extra && <Text style={styles.highlightExtra}>{extra}</Text>}
      </View>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        tintColor={colors.textMuted}
        size={14}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  header: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    gap: Spacing.one,
  },
  label: {
    ...Typography.label,
    color: colors.primary,
  },
  title: {
    ...Typography.title,
    color: colors.text,
  },
  subtitle: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.half,
  },
  sectionTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  sectionNote: {
    ...Typography.caption,
    color: colors.textMuted,
  },
  // Şerit ekranın iki kenarına kadar uzansın diye sayfanın iç boşluğu kadar dışarı taşırılır
  stripScroll: {
    marginHorizontal: -Spacing.four,
  },
  strip: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
    gap: Spacing.three,
  },
  quick: {
    width: 76,
    gap: Spacing.one,
  },
  quickPressed: {
    transform: [{ scale: 0.94 }],
  },
  quickPhoto: {
    width: 76,
    aspectRatio: 3 / 4,
    borderRadius: Radius.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Shadows.card,
  },
  quickPhotoWorn: {
    borderColor: colors.primary,
  },
  quickCheck: {
    position: 'absolute',
    right: Spacing.one,
    top: Spacing.one,
    width: 20,
    height: 20,
    borderRadius: Radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickName: {
    ...Typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  toastWrap: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    bottom: BottomTabInset + Spacing.five,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: colors.text,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    ...Shadows.card,
  },
  toastText: {
    ...Typography.bodyBold,
    color: colors.card,
    flexShrink: 1,
  },
  toastUndo: {
    ...Typography.bodyBold,
    color: colors.highlight,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    ...Shadows.card,
  },
  highlightWarning: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  highlightPressed: {
    transform: [{ scale: 0.98 }],
  },
  thumb: {
    width: 64,
    aspectRatio: 3 / 4,
    borderRadius: Radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  highlightBody: {
    flex: 1,
    gap: Spacing.half,
  },
  eyebrow: {
    ...Typography.label,
    color: colors.primary,
  },
  highlightName: {
    ...Typography.heading,
    color: colors.text,
  },
  highlightExtra: {
    ...Typography.bodyBold,
    color: colors.primary,
    marginTop: Spacing.one,
  },
  highlightMessage: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.two,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    ...Typography.heading,
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: Spacing.three,
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    ...Shadows.button,
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.95 }],
  },
  emptyButtonText: {
    ...Typography.button,
    color: colors.onPrimary,
  },
});
