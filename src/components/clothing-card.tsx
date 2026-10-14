/**
 * KIYAFET KARTI
 *
 * Dolap ekranındaki 2 sütunlu listede tek bir kıyafeti gösterir:
 * fotoğraf (yoksa pembe yer tutucu), giyilme rozeti, hedef çubuğu, ad, kategori,
 * üstü çizili satın alma fiyatı ve pembe renkli giyim başına maliyet.
 * Amorti edilen kıyafetin köşesinde kalp rozeti çıkar.
 * Basılı tutunca onLongPress çağrılır (Dolap'ta hızlı Giydim). Bugün giyildiyse giyim
 * rozeti pembe dolu olur ve başında ✓ çıkar.
 */

import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { comparisonText, findComparison } from '@/lib/comparisons';
import {
  costPerWear,
  daysSinceLastWear,
  isPaidOff,
  todayString,
  wearCount,
} from '@/lib/girl-math';
import { photoUri } from '@/lib/photos';
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

// Fiyatı "3.000 ₺" biçiminde yazar
export function formatTL(value: number): string {
  return `${value.toLocaleString('tr-TR')} ₺`;
}

// Bu kadar gün giyilmeyen parça "unutulmuş" sayılır (Ana sayfa uyarısı ve Utanç Duvarı)
export const FORGOTTEN_DAYS = 7;

// Utanç Duvarı "zarar" hesabı: bir kıyafetin parası 1 yılda "eritilmeli"; giyilmeden geçen
// her gün fiyatın 1/365'i boşa gider. Günlük tutar sadece anlamlıysa (≥ 10 ₺) gösterilir,
// asıl vurgu zamanla büyüyen toplam zarardadır.
const LOSS_YEAR_DAYS = 365;
const MIN_DAILY_LOSS_TO_SHOW = 10;

// Giyilmeden geçen günlerde boşa giden tutar (TL, tam sayı)
export function lossAmount(price: number, days: number): number {
  return days <= 0 ? 0 : Math.round((price / LOSS_YEAR_DAYS) * days);
}

// Örn: "📉 Sana günlük 16 ₺ zarar yazıyor. Şimdiye kadar boşa giden: 986 ₺ ≈ Brunch 🥞"
// Boşa giden tutar en ucuz kıyas kaleminden bile azsa null döner (satır gösterilmez).
export function lossText(price: number, days: number): string | null {
  const daily = price / LOSS_YEAR_DAYS;
  const total = lossAmount(price, days);
  const match = findComparison(total);
  if (!match) {
    return null;
  }
  const dailyPart =
    daily >= MIN_DAILY_LOSS_TO_SHOW
      ? `Sana günlük ${formatTL(Math.round(daily))} zarar yazıyor. `
      : '';
  return `📉 ${dailyPart}Şimdiye kadar boşa giden: ${formatTL(total)} ≈ ${match.name} ${match.emoji}`;
}

// Utanç Duvarı'ndaki parçalar: hiç giyilmeyenler ve FORGOTTEN_DAYS+ gündür giyilmeyenler,
// en çok zarar yazandan aza doğru
export function shameWallItems(
  items: ClothingItem[],
): { item: ClothingItem; days: number; loss: number }[] {
  return items
    .map((item) => {
      const days = daysSinceLastWear(item);
      return { item, days, loss: lossAmount(item.price, days) };
    })
    .filter((entry) => wearCount(entry.item) === 0 || entry.days >= FORGOTTEN_DAYS)
    .sort((a, b) => b.loss - a.loss || b.days - a.days);
}

// Ekranda gösterilen giyim başına maliyet. Hiç giyilmediyse "∞" (sonsuz): giymediğin
// kıyafetin giyim başına maliyeti matematiksel olarak sonsuzdur; ilk giyimde fiyata düşer.
// (Hesap kodu costPerWear aynı kalır, istatistikler ve bildirimler ona göre çalışır.)
export const INFINITE_COST = '∞';

export function costLabel(item: ClothingItem): string {
  return wearCount(item) === 0 ? INFINITE_COST : formatTL(costPerWear(item));
}

// Kıyafetin gerçek hayat kıyası. Detay, Ana sayfa ve Paylaş kartı bunu kullanır.
// - Hiç giyilmediyse: null (ekran kendi mesajını gösterir)
// - 1 kere: maliyet henüz düşmedi, "düştü" denmez → "Şimdilik bir konser bileti değerinde 🎤 …"
// - 2+ kere: "Maliyeti bir maniküre düştü! 💅"
export function itemComparisonText(item: ClothingItem): string | null {
  const wears = wearCount(item);
  if (wears === 0) {
    return null;
  }
  if (wears === 1) {
    const match = findComparison(item.price);
    return match
      ? `Şimdilik bir ${match.unit} değerinde ${match.emoji} İkinci giyimde yarıya düşecek!`
      : 'Resmen bedava! 🎉';
  }
  return comparisonText(costPerWear(item));
}

type Props = {
  item: ClothingItem;
  onPress?: () => void;
  onLongPress?: () => void;
};

export function ClothingCard({ item, onPress, onLongPress }: Props) {
  const wears = wearCount(item);
  const paidOff = isPaidOff(item);
  const uri = photoUri(item.photoFileName);
  const wornToday = item.wearDates.includes(todayString());
  const progress = Math.min(wears / item.targetWears, 1);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.photoBox}>
        {uri ? (
          <Image source={{ uri }} style={styles.photo} contentFit="cover" transition={150} />
        ) : (
          <SymbolView
            name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
            tintColor={colors.primary}
            size={36}
            weight="light"
          />
        )}

        <View style={[styles.wearBadge, wornToday && styles.wearBadgeToday]}>
          <Text style={[styles.wearBadgeText, wornToday && styles.wearBadgeTextToday]}>
            {wornToday ? '✓ ' : ''}
            {wears}/{item.targetWears} giyim
          </Text>
        </View>

        {paidOff && (
          <View style={styles.heartBadge}>
            <Text style={styles.heartText}>♥</Text>
          </View>
        )}
      </View>

      {/* Hedef çubuğu: hedefe ne kadar yaklaşıldığını gösterir */}
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.category}>{item.category}</Text>

        <View style={styles.priceBlock}>
          {/* Pembe fiyatın üstündeki satır: maliyet düştüyse üstü çizili satın alma fiyatı;
              henüz düşmediyse bir sonraki adımın ipucu ("1. giyimde → 2.500 ₺",
              "2. giyimde → 1.250 ₺"). Satır hep dolu olduğu için bütün kartlar aynı boyda kalır. */}
          {wears >= 2 ? (
            <Text style={styles.oldPrice}>{formatTL(item.price)}</Text>
          ) : (
            <Text style={styles.nextHint} numberOfLines={1}>
              {wears + 1}. giyimde → {formatTL(Math.round(item.price / (wears + 1)))}
            </Text>
          )}
          <Text style={styles.cost}>
            {costLabel(item)}
            <Text style={styles.perWear}> /giyim</Text>
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.two,
    gap: Spacing.two,
    ...Shadows.card,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
  },
  photoBox: {
    aspectRatio: 3 / 4, // Fotoğraflar 3:4 dikey kırpılıyor, kart da aynı oranda: kıyafet tam görünür
    borderRadius: Radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  wearBadge: {
    position: 'absolute',
    left: Spacing.two,
    top: Spacing.two,
    backgroundColor: colors.card,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  wearBadgeText: {
    ...Typography.caption,
    color: colors.primary,
  },
  wearBadgeToday: {
    backgroundColor: colors.primary,
  },
  wearBadgeTextToday: {
    color: colors.onPrimary,
  },
  heartBadge: {
    position: 'absolute',
    right: Spacing.two,
    top: Spacing.two,
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartText: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.highlight,
  },
  track: {
    height: 4,
    marginHorizontal: Spacing.one,
    borderRadius: Radius.pill,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: colors.primary,
  },
  info: {
    paddingHorizontal: Spacing.one,
    paddingBottom: Spacing.one,
  },
  name: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  category: {
    ...Typography.caption,
    color: colors.textMuted,
  },
  priceBlock: {
    marginTop: Spacing.two,
  },
  // Okunur ama pembe fiyattan daha geri planda
  nextHint: {
    ...Typography.caption,
    color: colors.primary,
    opacity: 0.75,
  },
  oldPrice: {
    ...Typography.priceStrike,
    color: colors.textMuted,
  },
  cost: {
    ...Typography.price,
    color: colors.primary,
  },
  perWear: {
    ...Typography.caption,
    color: colors.textMuted,
  },
});
