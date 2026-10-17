/**
 * HIZLI GİYDİM (Ana sayfa şeridi ve Dolap'ta basılı tutma ortak kullanır)
 *
 * Işık düğmesi gibi çalışır: bugün giyilmediyse "Giydim" sayar (titreşim + kutlama balonu,
 * balonda "Geri al"); bugün zaten giyildiyse bugünkü giyimi geri alır (Ana sayfa şeridi).
 * wearOnce ise hiç geri almaz: bugün zaten giyildiyse sadece "bugün zaten giyildi ✓" balonu
 * (içinde "Geri al") çıkar (Dolap'ta basılı tutma; "Basılı tut, Giydim sayılsın" sayıyı
 * azaltmasın diye).
 *
 * Kullanımı (ekranın en dışındaki görünümün içinde, sonda toastView gösterilir):
 *   const { toggleWear, wearOnce, toastView } = useQuickWear();
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
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

// Balonun ekranda kalma süresi (milisaniye); "Geri al"a basmaya yetecek kadar
const TOAST_DURATION = 4000;

type Toast = { id: number; text: string; undoItemId: string | null };

// Bugün giyildi mi? (✓ göstermek için)
export function isWornToday(item: ClothingItem): boolean {
  return item.wearDates.includes(todayString());
}

export function useQuickWear() {
  const { wearItem, undoWear } = useApp();

  // id her seferinde değişir ki aynı mesaj üst üste gelse de animasyon baştan oynasın
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
      showToast(`“${item.name}” bugün zaten giyildi ✓`, item.id);
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
      showToast(`${name} amorti edildi, resmen bedava 💅`, item.id);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      showToast(
        newWears === 1
          ? `${name} ilk kez giyildi: ∞ → ${formatTL(item.price)} /giyim 🎉`
          : `${name} artık ${formatTL(Math.round(item.price / newWears))} /giyim 💸`,
        item.id,
      );
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

  // Balon: sekme çubuğunun hemen üstünde, aşağıdan kayarak belirir
  const toastView = toast ? (
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
  ) : null;

  return { toggleWear, wearOnce, toastView };
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
