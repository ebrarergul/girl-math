/**
 * KAYITLI KOMBİN
 *
 * Kombinlerim (arşiv) sayfasındaki karta dokununca, kombinin kimliği (id) verilerek açılır.
 * Yukarıdan aşağı: kombin kolajı, adı (✏️ ile değiştirilir), "3 parça · 2 kere giydin · en son
 * 3 gün önce", parçaların listesi (dokununca kıyafet detayı), "Bu kombini sil".
 * Sağ üstte favori yıldızı. Altta "Bu kombini giydim ✨" (wearOutfit: bütün parçalara Giydim);
 * bugün zaten giyildiyse "Bugün giydin ✓" olur (yanında ↩ geri al), iki kere sayılmaz. Basınca kutlama balonu çıkar;
 * bugün ayrıca giyilmiş parça tekrar sayılmaz ve balonda söylenir.
 */

import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ColorSwatch } from '@/components/color-picker';
import { ClothingPhoto, OutfitCollage } from '@/components/outfit-collage';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { todayString } from '@/lib/girl-math';
import { outfitItems, outfitName } from '@/lib/outfits';

const colors = Colors.light;

// "en son bugün / dün / 3 gün önce" (tarihler "2026-10-14" biçiminde)
function lastWornText(dates: string[]): string | null {
  const last = dates[dates.length - 1];
  if (!last) {
    return null;
  }
  const days = Math.round((Date.parse(todayString()) - Date.parse(last)) / 86_400_000);
  if (days <= 0) return 'en son bugün';
  if (days === 1) return 'en son dün';
  return `en son ${days} gün önce`;
}

export default function SavedOutfitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    items,
    outfits,
    toggleFavoriteOutfit,
    renameOutfit,
    deleteOutfit,
    wearOutfit,
    undoWearOutfit,
  } = useApp();

  const outfit = outfits.find((current) => current.id === id);

  // Kutlama balonu: birkaç saniye görünüp kaybolur
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const headerOptions = {
    title: '',
    headerBackTitle: 'Kombinlerim',
    headerTintColor: colors.primary,
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
  };

  // Kombin silindiyse ya da bulunamadıysa
  if (!outfit) {
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <Stack.Screen options={headerOptions} />
        <View style={styles.missing}>
          <Text style={styles.missingText}>Bu kombin bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pieces = outfitItems(outfit, items);
  const name = outfitName(outfit, items);
  // "Bugün giyildi" sadece parçalardan en az biri gerçekten bugün giyildiyse geçerli. (Eski
  // kayıtlarda parçaların Giydim'i geri alındığı halde kombinde bugünün tarihi kalmış olabilir.)
  const today = todayString();
  const wornToday =
    outfit.wornDates.includes(today) && pieces.some((piece) => piece.wearDates.includes(today));
  const wornDates = wornToday
    ? outfit.wornDates
    : outfit.wornDates.filter((date) => date !== today);
  const worn = wornDates.length;
  const lastWorn = lastWornText(wornDates);

  function handleFavorite() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavoriteOutfit(outfit!.id);
  }

  // iPhone'da ad sorar; boş bırakılırsa otomatik ada döner
  function handleRename() {
    if (Platform.OS !== 'ios') {
      return;
    }
    Alert.prompt(
      'Kombinin adı',
      'Boş bırakırsan otomatik ad kullanılır',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Kaydet', onPress: (text?: string) => renameOutfit(outfit!.id, text ?? null) },
      ],
      'plain-text',
      outfit!.name ?? '',
    );
  }

  function handleWear() {
    const today = todayString();
    const already = pieces.filter((piece) => piece.wearDates.includes(today));
    const fresh = pieces.length - already.length;
    wearOutfit(outfit!.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (already.length === 0) {
      setToast(`Giydin! ${fresh} parçanın maliyeti düştü 💸`);
    } else if (fresh === 0) {
      setToast('Parçaların hepsi bugün zaten sayılmıştı, kombin de kaydedildi ✨');
    } else if (already.length === 1) {
      setToast(`“${already[0].name}” bugün zaten sayılmıştı, diğerleri eklendi ✨`);
    } else {
      setToast(`${already.length} parça bugün zaten sayılmıştı, diğerleri eklendi ✨`);
    }
  }

  function handleUndo() {
    undoWearOutfit(outfit!.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToast('Bugünkü giyim geri alındı ↩');
  }

  function handleDelete() {
    Alert.alert(
      'Bu kombini silelim mi?',
      `"${name}" arşivden silinecek. Kıyafetlerin dolabında kalır.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            deleteOutfit(outfit!.id);
            router.back();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          ...headerOptions,
          headerRight: () => (
            <Pressable
              onPress={handleFavorite}
              hitSlop={8}
              accessibilityLabel={outfit.favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}>
              <SymbolView
                name={outfit.favorite ? 'star.fill' : 'star'}
                tintColor={outfit.favorite ? colors.highlight : colors.primary}
                size={22}
                weight="semibold"
              />
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <OutfitCollage pieces={pieces} />

        <View style={styles.titleBlock}>
          <Pressable onPress={handleRename} style={styles.titleRow} hitSlop={8}>
            <Text style={styles.title}>{name}</Text>
            {Platform.OS === 'ios' && (
              <SymbolView name="pencil" tintColor={colors.primary} size={16} weight="semibold" />
            )}
          </Pressable>
          <Text style={styles.subtitle}>
            {[
              `${pieces.length} parça`,
              worn > 0 ? `${worn} kere giydin` : 'henüz giyilmedi',
              lastWorn,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>

        {/* Parçalar: dokununca kıyafet detayı açılır */}
        <View style={styles.list}>
          {pieces.map((piece, index) => (
            <Pressable
              key={piece.id}
              onPress={() => router.push({ pathname: '/item/[id]', params: { id: piece.id } })}
              style={({ pressed }) => [
                styles.row,
                index === pieces.length - 1 && styles.rowLast,
                pressed && styles.rowPressed,
              ]}>
              <ClothingPhoto item={piece} style={styles.rowPhoto} />
              <View style={styles.rowBody}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {piece.name}
                </Text>
                <View style={styles.rowMeta}>
                  {piece.color && <ColorSwatch color={piece.color} size={10} />}
                  <Text style={styles.rowNote}>
                    {piece.color ? `${piece.category} · ${piece.color}` : piece.category}
                  </Text>
                </View>
              </View>
              <SymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                tintColor={colors.textMuted}
                size={13}
                weight="semibold"
              />
            </Pressable>
          ))}
        </View>

        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>Bu kombini sil</Text>
        </Pressable>
      </ScrollView>

      {toast && (
        <View style={styles.toastWrap} pointerEvents="none">
          <Animated.View
            entering={FadeInDown.springify()}
            exiting={FadeOutDown}
            style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </Animated.View>
        </View>
      )}

      <View style={styles.footer}>
        {wornToday && (
          <Pressable
            onPress={handleUndo}
            accessibilityLabel="Bugünkü giyimi geri al"
            style={({ pressed }) => [styles.undoButton, pressed && styles.undoPressed]}>
            <SymbolView
              name={{ ios: 'arrow.uturn.backward', android: 'undo', web: 'undo' }}
              tintColor={colors.primary}
              size={20}
              weight="bold"
            />
          </Pressable>
        )}
        <Pressable
          onPress={handleWear}
          disabled={wornToday}
          style={({ pressed }) => [
            styles.wearButton,
            wornToday && styles.wearButtonDone,
            pressed && styles.wearButtonPressed,
          ]}>
          <Text style={[styles.wearText, wornToday && styles.wearTextDone]}>
            {wornToday ? 'Bugün giydin ✓' : 'Bu kombini giydim ✨'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingText: {
    ...Typography.heading,
    color: colors.textSecondary,
  },
  titleBlock: {
    gap: Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    ...Typography.title,
    color: colors.text,
    flexShrink: 1,
  },
  subtitle: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  // Beyaz, yuvarlak köşeli parça listesi
  list: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    backgroundColor: colors.primarySoft,
  },
  rowPhoto: {
    width: 48,
    borderRadius: Radius.sm,
  },
  rowBody: {
    flex: 1,
    gap: Spacing.half,
  },
  rowName: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  rowNote: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  deleteButton: {
    alignSelf: 'center',
    padding: Spacing.two,
  },
  deleteText: {
    ...Typography.bodyBold,
    color: colors.danger,
  },
  // Kutlama balonu: butonun hemen üstünde
  toastWrap: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    bottom: 96,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: colors.text,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    ...Shadows.card,
  },
  toastText: {
    ...Typography.bodyBold,
    color: colors.onPrimary,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  // Geri al: detay sayfasındaki ↩ ile aynı
  undoButton: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoPressed: {
    backgroundColor: colors.primarySoft,
  },
  wearButton: {
    flex: 1,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  // Bugün giyildiyse: beyaz zemin, pembe yazı (artık basılmaz)
  wearButtonDone: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.accent,
    shadowOpacity: 0,
  },
  wearButtonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  wearText: {
    ...Typography.heading,
    color: colors.onPrimary,
  },
  wearTextDone: {
    color: colors.primary,
  },
});
