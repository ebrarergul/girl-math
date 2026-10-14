/**
 * GEÇİCİ DENEME PANELİ
 *
 * Hafıza merkezinin (AppContext) çalıştığını telefonda görmek için.
 * Gerçek Dolap ekranı yapılınca bu dosya ve explore.tsx'teki <DevTestPanel /> satırı silinecek.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { comparisonText } from '@/lib/comparisons';
import { costPerWear, isPaidOff, wearCount } from '@/lib/girl-math';

const colors = Colors.light;

export function DevTestPanel() {
  const { items, isLoaded, addItem, wearItem, undoWear, deleteItem } = useApp();

  function addSample() {
    addItem({ name: 'Siyah deri ceket', category: 'Dış giyim', price: 3000, photoFileName: null });
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>🧪 Deneme paneli (geçici)</Text>

      {!isLoaded && <Text style={styles.muted}>Yükleniyor...</Text>}
      {isLoaded && items.length === 0 && <Text style={styles.muted}>Dolap boş.</Text>}

      <Pressable style={styles.primaryButton} onPress={addSample}>
        <Text style={styles.primaryButtonText}>+ Örnek kıyafet ekle</Text>
      </Pressable>

      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.priceStrike}>{item.price} TL</Text>
          <Text style={styles.price}>Giyim başına: {costPerWear(item)} TL</Text>
          <Text style={styles.muted}>
            Giyilme: {wearCount(item)} / {item.targetWears}
            {isPaidOff(item) ? ' · Amorti edildi 🎉' : ''}
          </Text>
          {wearCount(item) > 0 && (
            <Text style={styles.comparison}>{comparisonText(costPerWear(item))}</Text>
          )}

          <View style={styles.row}>
            <Pressable style={styles.primaryButton} onPress={() => wearItem(item.id)}>
              <Text style={styles.primaryButtonText}>Giydim</Text>
            </Pressable>
            <Pressable style={styles.softButton} onPress={() => undoWear(item.id)}>
              <Text style={styles.softButtonText}>Geri al</Text>
            </Pressable>
            <Pressable style={styles.softButton} onPress={() => deleteItem(item.id)}>
              <Text style={styles.softButtonText}>Sil</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
  },
  title: {
    ...Typography.heading,
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
    ...Shadows.card,
  },
  name: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  priceStrike: {
    ...Typography.priceStrike,
    color: colors.textMuted,
  },
  price: {
    ...Typography.price,
    color: colors.primary,
  },
  comparison: {
    ...Typography.bodyBold,
    color: colors.primary,
  },
  muted: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    alignSelf: 'flex-start',
  },
  primaryButtonText: {
    ...Typography.button,
    color: colors.onPrimary,
  },
  softButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  softButtonText: {
    ...Typography.button,
    color: colors.primary,
  },
});
