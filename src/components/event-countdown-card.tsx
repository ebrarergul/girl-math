/**
 * ETKİNLİK GERİ SAYIM KARTI (Ana sayfa)
 *
 * Zaman Aşımı = Bedava: etkinliğine 7 gün ya da daha az kalmış parçalardan en yakını. Solda
 * küçük fotoğraf, sağda "ETKİNLİK · 3 GÜN KALDI" / "YARIN" / "BUGÜN 🆓" ve Onur'un geri sayım
 * cümlesi (eventCountdownText). Etkinlik günü yeşil çerçeveli. Dokununca kıyafetin detayı açılır.
 * Yakında etkinlik yoksa hiçbir şey göstermez.
 */

import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ClothingPhoto } from '@/components/outfit-collage';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { eventCountdownText, eventStatus } from '@/lib/events';
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

// Ana sayfada kaç gün kala görünmeye başlar
const SHOW_DAYS_BEFORE = 7;

// Kalan gün: bugün 0, yarın 1, ileride gün sayısı; geçtiyse ya da etkinlik yoksa null
function daysLeft(item: ClothingItem): number | null {
  const status = eventStatus(item);
  if (!status) return null;
  if (status.kind === 'today') return 0;
  if (status.kind === 'tomorrow') return 1;
  if (status.kind === 'upcoming') return status.days;
  return null;
}

export function EventCountdownCard({ items }: { items: ClothingItem[] }) {
  const router = useRouter();

  const next = items
    .map((item) => ({ item, days: daysLeft(item) }))
    .filter(
      (entry): entry is { item: ClothingItem; days: number } =>
        entry.days !== null && entry.days <= SHOW_DAYS_BEFORE,
    )
    .sort((a, b) => a.days - b.days)[0];
  const text = next ? eventCountdownText(next.item) : null;
  if (!next || !text) {
    return null;
  }

  const today = next.days === 0;
  const eyebrow = today
    ? 'ETKİNLİK · BUGÜN 🆓'
    : next.days === 1
      ? 'ETKİNLİK · YARIN'
      : `ETKİNLİK · ${next.days} GÜN KALDI`;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: next.item.id } })}
      style={({ pressed }) => [styles.card, today && styles.cardToday, pressed && styles.pressed]}>
      <ClothingPhoto item={next.item} style={styles.photo} />
      <View style={styles.body}>
        <Text style={[styles.eyebrow, today && styles.eyebrowToday]}>{eyebrow}</Text>
        <Text style={styles.text}>{text}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: colors.accent,
    padding: Spacing.three,
    ...Shadows.card,
  },
  // Etkinlik günü: yeşil çerçeve ("bugün bedava")
  cardToday: {
    borderColor: colors.success,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  photo: {
    width: 56,
    borderRadius: Radius.sm,
  },
  body: {
    flex: 1,
    gap: Spacing.half,
  },
  eyebrow: {
    ...Typography.label,
    color: colors.primary,
  },
  eyebrowToday: {
    color: colors.success,
  },
  text: {
    ...Typography.bodyBold,
    color: colors.text,
  },
});
