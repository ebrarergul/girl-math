/**
 * KIYAFET KARTI
 *
 * Dolap ekranındaki 2 sütunlu listede tek bir kıyafeti gösterir:
 * fotoğraf (yoksa pembe yer tutucu), giyilme rozeti, hedef çubuğu, ad, kategori,
 * üstü çizili satın alma fiyatı ve pembe renkli giyim başına maliyet.
 * Amorti edilen kıyafetin köşesinde kalp rozeti çıkar.
 */

import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { costPerWear, isPaidOff, wearCount } from '@/lib/girl-math';
import { photoUri } from '@/lib/photos';
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

// Fiyatı "3.000 ₺" biçiminde yazar
export function formatTL(value: number): string {
  return `${value.toLocaleString('tr-TR')} ₺`;
}

type Props = {
  item: ClothingItem;
  onPress?: () => void;
};

export function ClothingCard({ item, onPress }: Props) {
  const wears = wearCount(item);
  const cost = costPerWear(item);
  const paidOff = isPaidOff(item);
  const uri = photoUri(item.photoFileName);
  const progress = Math.min(wears / item.targetWears, 1);

  return (
    <Pressable
      onPress={onPress}
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

        <View style={styles.wearBadge}>
          <Text style={styles.wearBadgeText}>
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
          {/* Üstü çizili satın alma fiyatı her zaman pembe fiyatın üstünde durur. Maliyet henüz
              düşmediyse görünmez ama yerini korur: böylece bütün kartlar aynı boyda olur. */}
          <Text style={[styles.oldPrice, cost >= item.price && styles.hidden]}>
            {formatTL(item.price)}
          </Text>
          <Text style={styles.cost}>
            {formatTL(cost)}
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
  hidden: {
    opacity: 0,
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
