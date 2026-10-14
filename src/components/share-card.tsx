/**
 * PAYLAŞILABİLİR KARTLAR (Instagram Story / TikTok)
 *
 * Story boyutunda (dikey 9:16) pembe geçişli kartlar. share.tsx bunların fotoğrafını çekip
 * iPhone'un paylaşım penceresini açar.
 * - ItemShareCard: tek kıyafet ("“Ceket” artık 67 ₺ /giyim")
 * - WardrobeShareCard: dolap özeti ("Dolabım = 51 iced latte 🧋", Girl Math kazancım)
 * Kartın genişliği dışarıdan verilir; yükseklik 16/9 oranında otomatik.
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { INFINITE_COST, formatTL, itemComparisonText } from '@/components/clothing-card';
import { Colors, Fonts, Radius, Spacing, Typography } from '@/constants/theme';
import { costPerWear, isPaidOff, wearCount } from '@/lib/girl-math';
import { photoUri } from '@/lib/photos';
import { starbucksIndexText } from '@/lib/starbucks-index';
import type { WardrobeStats } from '@/lib/stats';
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

// Ortak çerçeve: pembe geçişli zemin, üstte ve altta marka imzası
function CardFrame({ width, children }: { width: number; children: ReactNode }) {
  return (
    <LinearGradient
      colors={[colors.primarySoft, colors.accent, colors.highlight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.frame, { width }]}>
      <Text style={styles.brandTop}>GIRL MATH 🎀</Text>
      <View style={styles.body}>{children}</View>
      <Text style={styles.brandBottom}>girl math’e göre her şey mantıklı 💅</Text>
    </LinearGradient>
  );
}

// Büyük rakam: rakam dergi yazı tipinde, ₺ sade yazı tipinde (dergi yazı tipinde "Ł" gibi görünüyor)
// value null ise ∞ (sonsuz) yazılır: hiç giyilmemiş parçanın giyim başına maliyeti
function BigAmount({ value, suffix }: { value: number | null; suffix?: string }) {
  return (
    <Text style={styles.bigAmount} numberOfLines={1} adjustsFontSizeToFit>
      {value === null ? INFINITE_COST : value.toLocaleString('tr-TR')}
      {value !== null && <Text style={styles.bigCurrency}> ₺</Text>}
      {suffix && <Text style={styles.bigSuffix}> {suffix}</Text>}
    </Text>
  );
}

export function ItemShareCard({ item, width }: { item: ClothingItem; width: number }) {
  const wears = wearCount(item);
  const cost = costPerWear(item);
  const uri = photoUri(item.photoFileName);

  return (
    <CardFrame width={width}>
      <View style={styles.photoBox}>
        {uri ? (
          <Image source={{ uri }} style={styles.photo} contentFit="cover" />
        ) : (
          <SymbolView
            name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
            tintColor={colors.primary}
            size={56}
            weight="ultraLight"
          />
        )}
        {isPaidOff(item) && (
          <View style={styles.paidBadge}>
            <Text style={styles.paidBadgeText}>♥ Amorti edildi</Text>
          </View>
        )}
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.lead} numberOfLines={1}>
          “{item.name}” artık
        </Text>
        <BigAmount value={wears > 0 ? cost : null} suffix="/giyim" />
        {cost < item.price && <Text style={styles.strike}>{formatTL(item.price)} yerine</Text>}
        <Text style={styles.punchline}>
          {itemComparisonText(item) ?? 'Daha yeni aldım, takipte kalın 👀'}
        </Text>
        {wears > 0 && <Text style={styles.note}>{wears} kere giydim ✨</Text>}
      </View>
    </CardFrame>
  );
}

export function WardrobeShareCard({ stats, width }: { stats: WardrobeStats; width: number }) {
  return (
    <CardFrame width={width}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>Dolabım</Text>
        <Text style={styles.punchline}>{starbucksIndexText(stats.totalValue)}</Text>
      </View>

      <View style={styles.statBox}>
        <Text style={styles.statLabel}>GIRL MATH KAZANCIM</Text>
        <BigAmount value={stats.girlMathSavings} />
        <Text style={styles.note}>Bankam bunu tanımıyor ama Girl Math tanıyor 💅</Text>
      </View>

      <View style={styles.textBlock}>
        {stats.paidOffCount > 0 && (
          <Text style={styles.note}>{stats.paidOffCount} parça resmen bedava ♥</Text>
        )}
        <Text style={styles.note}>
          {stats.totalItems} parça · {stats.totalWears} kere Giydim ✨
        </Text>
      </View>
    </CardFrame>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 9 / 16,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  brandTop: {
    ...Typography.label,
    fontSize: 12,
    color: colors.primary,
    textAlign: 'center',
  },
  brandBottom: {
    ...Typography.caption,
    color: colors.primaryPressed,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.four,
    paddingVertical: Spacing.three,
  },
  photoBox: {
    alignSelf: 'center',
    width: '72%',
    aspectRatio: 3 / 4,
    borderRadius: Radius.lg,
    backgroundColor: colors.card,
    borderWidth: 4,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
  },
  paidBadge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    backgroundColor: colors.card,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  paidBadgeText: {
    ...Typography.caption,
    color: colors.primary,
  },
  textBlock: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  title: {
    ...Typography.hero,
    color: colors.text,
  },
  lead: {
    ...Typography.heading,
    color: colors.text,
  },
  bigAmount: {
    ...Typography.hero,
    fontSize: 48,
    lineHeight: 56,
    color: colors.primary,
  },
  bigCurrency: {
    fontFamily: Fonts?.sans,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0,
  },
  bigSuffix: {
    fontFamily: Fonts?.sans,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
    color: colors.primaryPressed,
  },
  strike: {
    ...Typography.body,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  punchline: {
    ...Typography.heading,
    color: colors.text,
    textAlign: 'center',
  },
  note: {
    ...Typography.bodyBold,
    color: colors.primaryPressed,
    textAlign: 'center',
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  statLabel: {
    ...Typography.label,
    color: colors.textSecondary,
  },
});
