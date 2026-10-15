/**
 * DOLAP TAROTU (günün kartı)
 *
 * Ana sayfadaki yatay şerit. Kapalıyken gümüş (Y2K krom) zeminde minik bir tarot kartı
 * arkası; dokununca döner ve pembe kart yüzü, kartın adı, anlamı ve dolaptan önerilen
 * parça görünür.
 * - Günde bir kart: kart ve öneri tarihe göre seçilir, gün boyunca hep aynı kalır.
 * - Uygulama yeniden açılınca kart yine kapalı gelir ama çevirince aynı kart çıkar.
 * - Açıkken: kart yüzüne ya da yazılara dokununca kapanır; "Bugün bunu giy" satırı detayı açar.
 * Kartların temaları PDF'teki tarife uyar: unutulmuş ya da farklı bir parça önerir.
 *
 * ⚠️ pickTarotItem() GEÇİCİDİR – Onur'un kombin motoru (src/lib/outfits.ts) gelince
 * öneriyi o yapacak; sadece bu fonksiyonun içi değişecek, görünüş aynı kalır.
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { formatTL } from '@/components/clothing-card';
import { Colors, Gradients, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { costPerWear, daysSinceLastWear, isPaidOff, todayString, wearCount } from '@/lib/girl-math';
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

// Kartın hangi türde parça önereceği
type Strategy =
  | 'forgotten'
  | 'oldLove'
  | 'neverWorn'
  | 'expensive'
  | 'closest'
  | 'favorite'
  | 'highCost'
  | 'leastWorn'
  | 'random';

// symbol: kart yüzündeki iPhone simgesi (SF Symbols)
type TarotCardData = { name: string; symbol: SFSymbol; meaning: string; strategy: Strategy };

// Deste. Yeni kart eklemek için bu listeye bir satır eklemek yeterli.
const DECK: TarotCardData[] = [
  {
    name: 'Asılan Adam',
    symbol: 'arrow.triangle.2.circlepath',
    meaning: 'Olaylara farklı açıdan bakma vakti.',
    strategy: 'forgotten',
  },
  {
    name: 'Aşıklar',
    symbol: 'heart.fill',
    meaning: 'Eski bir aşk yeniden alevleniyor.',
    strategy: 'oldLove',
  },
  {
    name: 'Ay',
    symbol: 'moon.stars.fill',
    meaning: 'Gizemli bir gün, sürprizlere açık ol.',
    strategy: 'neverWorn',
  },
  { name: 'Yıldız', symbol: 'star.fill', meaning: 'Bugün parlama günün.', strategy: 'expensive' },
  {
    name: 'Güç',
    symbol: 'bolt.fill',
    meaning: 'Hedefine çok yakınsın, bırakma.',
    strategy: 'closest',
  },
  {
    name: 'Güneş',
    symbol: 'sun.max.fill',
    meaning: 'Enerjin yüksek, kendin ol.',
    strategy: 'favorite',
  },
  {
    name: 'İmparatoriçe',
    symbol: 'crown.fill',
    meaning: 'Lüks hissetmeyi hak ediyorsun.',
    strategy: 'highCost',
  },
  { name: 'Ermiş', symbol: 'flame.fill', meaning: 'Sade ve sakin bir gün.', strategy: 'leastWorn' },
  {
    name: 'Kader Çarkı',
    symbol: 'dice.fill',
    meaning: 'Bugün şans senden yana.',
    strategy: 'random',
  },
];

// Tarihten sabit bir sayı üretir: aynı gün hep aynı sayı, ertesi gün başka
function daySeed(): number {
  let hash = 0;
  for (const char of todayString()) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1000003;
  }
  return hash;
}

// Listeden "en büyük puanlı" parçayı seçer
function maxBy(list: ClothingItem[], score: (item: ClothingItem) => number) {
  return list.reduce<ClothingItem | undefined>(
    (best, item) => (best === undefined || score(item) > score(best) ? item : best),
    undefined,
  );
}

// ⚠️ GEÇİCİ öneri kuralı – Onur'un kombin motoru gelince bunun içi değişecek.
// Kartın temasına uygun parça yoksa en uzun süredir giyilmeyen parçaya düşer.
function pickTarotItem(items: ClothingItem[], strategy: Strategy, seed: number): ClothingItem {
  const worn = items.filter((item) => wearCount(item) > 0);
  const forgotten = maxBy(items, daysSinceLastWear) ?? items[0];
  let pick: ClothingItem | undefined;
  switch (strategy) {
    case 'oldLove':
      pick = maxBy(worn, daysSinceLastWear);
      break;
    case 'neverWorn': {
      const never = items.filter((item) => wearCount(item) === 0);
      pick = never.length > 0 ? never[seed % never.length] : undefined;
      break;
    }
    case 'expensive':
      pick = maxBy(items, (item) => item.price);
      break;
    case 'closest':
      pick = maxBy(
        items.filter((item) => !isPaidOff(item)),
        (item) => wearCount(item) - item.targetWears,
      );
      break;
    case 'favorite':
      pick = maxBy(worn, wearCount);
      break;
    case 'highCost':
      pick = maxBy(worn, costPerWear);
      break;
    case 'leastWorn':
      pick = maxBy(items, (item) => -wearCount(item));
      break;
    case 'random':
      pick = items[seed % items.length];
      break;
  }
  return pick ?? forgotten;
}

// Önerinin altındaki kısa sebep cümlesi
function reasonText(item: ClothingItem, strategy: Strategy): string {
  const wears = wearCount(item);
  if (strategy === 'expensive') return `${formatTL(item.price)} değerinde bir parça`;
  if (strategy === 'closest' && !isPaidOff(item))
    return `Amortiye ${item.targetWears - wears} giyim kaldı`;
  if (strategy === 'favorite' && wears > 0) return `${wears} kere giydin, favorin`;
  if (strategy === 'highCost' && wears > 0) return `Hâlâ ${formatTL(costPerWear(item))} /giyim`;
  if (wears === 0) return 'Daha hiç giyilmedi';
  const days = daysSinceLastWear(item);
  if (days === 0) return 'Bugün giyildi';
  if (days === 1) return 'Dün giyildi';
  return `${days} gündür askıda`;
}

type Props = {
  items: ClothingItem[];
  onOpenItem: (item: ClothingItem) => void;
};

export function TarotCard({ items, onOpenItem }: Props) {
  const seed = daySeed();
  const card = DECK[seed % DECK.length];
  const item = pickTarotItem(items, card.strategy, seed);

  // Dönme animasyonu: 0 = kapalı (gümüş), 180 = açık
  const [flipped, setFlipped] = useState(false);
  const rotation = useSharedValue(0);
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotation.value}deg` }],
  }));
  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(rotation.value, [0, 180], [180, 360])}deg` },
    ],
  }));
  // Kapalıyken alçak şerit (Ana sayfada vitrin kartıyla yarışmasın); dönerken uzar, çünkü
  // açık yüzde kartın anlamı ve öneri var
  const containerStyle = useAnimatedStyle(() => ({
    height: interpolate(rotation.value, [0, 180], [CLOSED_HEIGHT, OPEN_HEIGHT]),
  }));

  // Kartı çevir: kapalıysa açar, açıksa kapatır
  function flip() {
    Haptics.impactAsync(
      flipped ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
    );
    rotation.set(withTiming(flipped ? 0 : 180, { duration: 650 }));
    setFlipped(!flipped);
  }

  return (
    <Animated.View style={containerStyle}>
      {/* Kapalı yüz: gümüş şerit, solda minik tarot kartı arkası */}
      <Animated.View
        style={[styles.face, styles.back, backStyle]}
        pointerEvents={flipped ? 'none' : 'auto'}>
        <LinearGradient
          colors={Gradients.chrome}
          locations={[0, 0.35, 0.7, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fill}>
          <Pressable onPress={flip} style={styles.row} accessibilityLabel="Günün kartını çek">
            <View style={[styles.miniCard, styles.miniCardBack]}>
              <SymbolView name="sparkle" tintColor={colors.primary} size={9} />
              <SymbolView name="moon.stars" tintColor={colors.primary} size={20} weight="light" />
              <SymbolView name="sparkle" tintColor={colors.primary} size={9} />
            </View>
            <View style={styles.body}>
              <Text style={styles.eyebrow}>DOLAP TAROTU</Text>
              <Text style={styles.title}>Günün kartı</Text>
              <Text style={styles.hint}>Dokun, kartını çek</Text>
            </View>
            <SymbolView name="sparkles" tintColor={colors.primary} size={22} />
          </Pressable>
        </LinearGradient>
      </Animated.View>

      {/* Açık yüz: solda pembe kart yüzü, sağda adı, anlamı ve öneri */}
      <Animated.View
        style={[styles.face, styles.front, frontStyle]}
        pointerEvents={flipped ? 'auto' : 'none'}>
        <View style={styles.row}>
          <Pressable onPress={flip} accessibilityLabel="Kartı kapat">
            <LinearGradient
              colors={[colors.primary, colors.highlight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.miniCard, styles.miniCardFront]}>
              <SymbolView name="sparkle" tintColor={colors.onPrimary} size={10} />
              <SymbolView name={card.symbol} tintColor={colors.onPrimary} size={28} />
              <SymbolView name="sparkle" tintColor={colors.onPrimary} size={10} />
            </LinearGradient>
          </Pressable>

          <View style={styles.body}>
            <Pressable onPress={flip} accessibilityLabel="Kartı kapat">
              <Text style={styles.eyebrow}>GÜNÜN KARTI</Text>
              <Text style={styles.title}>{card.name}</Text>
              <Text style={styles.meaning}>{card.meaning}</Text>
            </Pressable>
            <Pressable
              onPress={() => onOpenItem(item)}
              style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}>
              <View style={styles.suggestionText}>
                <Text style={styles.suggestionName} numberOfLines={1}>
                  <Text style={styles.suggestionLabel}>Bugün bunu giy: </Text>
                  {item.name}
                </Text>
                <Text style={styles.suggestionReason}>{reasonText(item, card.strategy)}</Text>
              </View>
              <SymbolView
                name="chevron.right"
                tintColor={colors.primary}
                size={14}
                weight="semibold"
              />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const CLOSED_HEIGHT = 112;
const OPEN_HEIGHT = 172;

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.lg,
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
    ...Shadows.card,
  },
  back: {
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  front: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  fill: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.half,
  },
  // Minik tarot kartı (gerçek kart oranı 2:3)
  miniCard: {
    width: 76,
    height: 114,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  // Kapalı şeritteki kart arkası daha küçük (aynı 2:3 oran)
  miniCardBack: {
    width: 52,
    height: 78,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  miniCardFront: {
    borderWidth: 2,
    borderColor: colors.primarySoft,
  },
  eyebrow: {
    ...Typography.label,
    color: colors.primary,
  },
  title: {
    ...Typography.title,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text,
  },
  hint: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  meaning: {
    ...Typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: colors.primarySoft,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    marginTop: Spacing.one,
  },
  suggestionPressed: {
    opacity: 0.7,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionLabel: {
    ...Typography.caption,
    color: colors.primary,
  },
  suggestionName: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  suggestionReason: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
});
