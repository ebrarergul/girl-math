/**
 * HIZLI GİYDİM (Ana sayfa şeridi ve Dolap'ta basılı tutma ortak kullanır)
 *
 * Işık düğmesi gibi çalışır: bugün giyilmediyse "Giydim" sayar (titreşim + kutlama balonu,
 * balonda "Geri al"); bugün zaten giyildiyse bugünkü giyimi geri alır (Ana sayfa şeridi).
 * wearOnce ise hiç geri almaz: bugün zaten giyildiyse sadece "bugün zaten giyildi ✓" balonu
 * (içinde "Geri al") çıkar (Dolap'ta basılı tutma; "Basılı tut, Giydim sayılsın" sayıyı
 * azaltmasın diye).
 *
 * toggleOutfit (26 Kasım): kayıtlı kombin için aynı ışık düğmesi – bütün parçalara Giydim (wearOutfit,
 * yer sormaz) ya da bugün giyildiyse geri al (undoWearOutfit). Ana sayfadaki "Kombinlerin" sırası kullanır.
 *
 * Kullanımı (ekranın en dışındaki görünümün içinde, sonda toastView gösterilir):
 *   const { toggleWear, wearOnce, toggleOutfit, toastView } = useQuickWear();
 *   <Pressable onPress={() => toggleWear(item)} />
 *   ...
 *   {toastView}
 */

import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { formatTL } from '@/components/clothing-card';
import { BottomTabInset, Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { todayString, wearCount } from '@/lib/girl-math';
import { outfitItems, outfitName } from '@/lib/outfits';
import type { ClothingItem, SavedOutfit } from '@/lib/types';

const colors = Colors.light;

// Balonun ekranda kalma süresi (milisaniye); "Geri al"a basmaya yetecek kadar
const TOAST_DURATION = 4000;

// undo: balondaki "Geri al"a basınca ne yapılacağı (yoksa düğme çıkmaz)
type Toast = { id: number; text: string; undo: (() => void) | null };

// Bugün giyildi mi? (✓ göstermek için)
export function isWornToday(item: ClothingItem): boolean {
  return item.wearDates.includes(todayString());
}

// Kombin bugün giyildi mi? (kombinin bugünkü tarihi var VE parçalardan en az biri gerçekten bugün giyildi;
// kayıtlı kombin sayfasıyla aynı kural)
export function isOutfitWornToday(outfit: SavedOutfit, items: ClothingItem[]): boolean {
  const today = todayString();
  return (
    outfit.wornDates.includes(today) &&
    outfitItems(outfit, items).some((piece) => piece.wearDates.includes(today))
  );
}

export function useQuickWear() {
  const { items, wearItem, undoWear, wearOutfit, undoWearOutfit } = useApp();

  // id her seferinde değişir ki aynı mesaj üst üste gelse de animasyon baştan oynasın
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastCount = useRef(0);
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(text: string, undo: (() => void) | null = null) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastCount.current += 1;
    setToast({ id: toastCount.current, text, undo });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION);
  }

  // Kıyafet adı tırnak içinde özne olur, Türkçe ek gerekmez
  function toggleWear(item: ClothingItem) {
    const name = `“${item.name}”`;
    if (isWornToday(item)) {
      undoWear(item.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showToast(`${name} bugünden çıkarıldı ↩`);
      return;
    }
    addWear(item);
  }

  // Sadece ekler: bugün zaten giyildiyse saymaz, balonda haber verir (geri almak balondan)
  function wearOnce(item: ClothingItem) {
    if (isWornToday(item)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showToast(`“${item.name}” bugün zaten giyildi ✓`, () => undoWear(item.id));
      return;
    }
    addWear(item);
  }

  function addWear(item: ClothingItem) {
    const name = `“${item.name}”`;
    const newWears = wearCount(item) + 1;
    wearItem(item.id);
    // Titreşim: hedefe ulaştıysa "başarı" titreşimi, değilse tek bir "tık"
    if (newWears === item.targetWears) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`${name} amorti edildi, resmen bedava 💅`, () => undoWear(item.id));
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      showToast(
        newWears === 1
          ? `${name} ilk kez giyildi: ∞ → ${formatTL(item.price)} /giyim 🎉`
          : `${name} artık ${formatTL(Math.round(item.price / newWears))} /giyim 💸`,
        () => undoWear(item.id),
      );
    }
  }

  // Kayıtlı kombin: dokun = bütün parçalara Giydim, tekrar dokun = bugünkü giyimi geri al
  function toggleOutfit(outfit: SavedOutfit) {
    const name = `“${outfitName(outfit, items)}”`;
    if (isOutfitWornToday(outfit, items)) {
      undoWearOutfit(outfit.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showToast(`${name} bugünden çıkarıldı ↩`);
      return;
    }
    const today = todayString();
    const fresh = outfitItems(outfit, items).filter((piece) => !piece.wearDates.includes(today));
    wearOutfit(outfit.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast(
      fresh.length > 0
        ? `${name} giyildi: ${fresh.length} parçanın maliyeti düştü 💸`
        : `${name} kaydedildi, parçalar bugün zaten sayılmıştı ✓`,
      () => undoWearOutfit(outfit.id),
    );
  }

  function handleUndo() {
    if (toast?.undo) {
      toast.undo();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }

  // Balon: sekme çubuğunun hemen üstünde, aşağıdan kayarak belirir
  const toastView = toast ? (
    <View style={styles.toastWrap} pointerEvents="box-none">
      <Animated.View
        key={toast.id}
        entering={FadeInDown.springify()}
        exiting={FadeOutDown}
        style={styles.toast}>
        <Text style={styles.toastText}>{toast.text}</Text>
        {toast.undo && (
          <Pressable onPress={handleUndo} hitSlop={8}>
            <Text style={styles.toastUndo}>Geri al</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  ) : null;

  // showToast: başka akışlar da aynı balonu kullanabilsin (Ana sayfa "Fotoğrafla")
  return { toggleWear, wearOnce, toggleOutfit, showToast, toastView };
}

const styles = StyleSheet.create({
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
});
