/**
 * GÜNÜN KOMBİNİ (Ana sayfa kartı)
 *
 * Girl Math dokunuşu: en uzun süredir giyilmeyen parçalardan biri seçilir ve Onur'un kombin
 * motoru (outfitFor) onun etrafında kombin kurar. Kombin gün boyu aynı kalır, ertesi gün değişir
 * (en unutulan 3 parça arasından güne göre seçilir; kombin kurulamazsa sıradakine geçilir).
 * Kartta küçük kolaj + kombin cümlesi + "Kombini gör →"; dokununca "Bununla ne giyerim?" ekranı
 * o parçayla açılır. Dolapta kombin kurulacak parça yoksa kart hiç görünmez.
 */

import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ClothingPhoto } from '@/components/outfit-collage';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { daysSinceLastWear, todayString } from '@/lib/girl-math';
import { outfitFor, type Outfit } from '@/lib/outfits';
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

// Kaç unutulan parça arasından güne göre seçilir (her gün aynı parça çıkmasın)
const DAILY_CHOICES = 3;
// Kolajdaki küçük kartlar
const THUMB_WIDTH = 56;
const TILTS = ['-5deg', '4deg', '-3deg', '5deg', '-4deg', '3deg'];
const MAX_THUMBS = 4;

// Tarihten her gün değişen ama gün içinde sabit bir sayı üretir
function daySeed(): number {
  let hash = 0;
  for (const char of todayString()) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1000003;
  }
  return hash;
}

// Günün kombini: unutulan parçalardan sırayla dener, ilk kurulabilen kombini döner
export function dailyOutfit(items: ClothingItem[]): Outfit | null {
  const forgotten = [...items].sort((a, b) => daysSinceLastWear(b) - daysSinceLastWear(a));
  const start = daySeed() % Math.min(DAILY_CHOICES, Math.max(forgotten.length, 1));
  const ordered = [...forgotten.slice(start), ...forgotten.slice(0, start)];
  for (const item of ordered) {
    const outfit = outfitFor(item, items);
    if (outfit.items.length > 1) {
      return outfit;
    }
  }
  return null;
}

export function DailyOutfitCard({ items }: { items: ClothingItem[] }) {
  const router = useRouter();
  const outfit = dailyOutfit(items);
  if (!outfit) {
    return null;
  }
  const base = outfit.items[0];
  const thumbs = outfit.items.slice(0, MAX_THUMBS);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/outfit/[id]', params: { id: base.id } })}
      accessibilityLabel="Günün kombinini gör"
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.eyebrowRow}>
        <SymbolView name="sparkles" tintColor={colors.primary} size={11} />
        <Text style={styles.eyebrow}>GÜNÜN KOMBİNİ</Text>
      </View>

      <View style={styles.row}>
        {/* Küçük kolaj: yamuk, üst üste binen kartlar */}
        <View style={styles.thumbs}>
          {thumbs.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.thumb,
                {
                  marginLeft: index === 0 ? 0 : -THUMB_WIDTH * 0.35,
                  transform: [{ rotate: TILTS[index % TILTS.length] }],
                  zIndex: thumbs.length - index,
                },
              ]}>
              <ClothingPhoto item={item} style={styles.thumbPhoto} />
            </View>
          ))}
        </View>

        <View style={styles.body}>
          <Text style={styles.text} numberOfLines={3}>
            {outfit.text}
          </Text>
          <Text style={styles.link}>Kombini gör →</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Shadows.card,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  eyebrow: {
    ...Typography.label,
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  thumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one,
    paddingLeft: Spacing.half,
  },
  thumb: {
    width: THUMB_WIDTH,
    backgroundColor: colors.card,
    borderRadius: Radius.sm + 2,
    padding: 2,
    ...Shadows.card,
  },
  thumbPhoto: {
    width: '100%',
    borderRadius: Radius.sm,
  },
  body: {
    flex: 1,
    gap: Spacing.one,
  },
  text: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  link: {
    ...Typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
});
