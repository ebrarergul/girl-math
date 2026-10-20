/**
 * ANALİZLERİN 📊
 *
 * Dolabının analizleri (hesaplar Onur'un `@/lib/insights` dosyasında):
 *   🎨 Renk analizi (colorStats): "Bu ay / Tüm zamanlar", hangi renkleri giyiyorsun
 *   📅 Aylık özet (monthlySummary): bu ayın satırları + ayın yorumu
 *   🏷️ Satmayı düşün (sellList): 90+ gündür giyilmeyen, amorti olmamış parçalar
 * Cüzdan'daki "Analizlerin" kartıyla açılır.
 */

import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatTL } from '@/components/clothing-card';
import { ColorSwatch } from '@/components/color-picker';
import { ClothingPhoto } from '@/components/outfit-collage';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { colorHex } from '@/lib/colors';
import { wearCount } from '@/lib/girl-math';
import { colorStats, monthlySummary, sellList, type ColorPeriod } from '@/lib/insights';
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

const PERIODS: { value: ColorPeriod; label: string }[] = [
  { value: 'month', label: 'Bu ay' },
  { value: 'all', label: 'Tüm zamanlar' },
];

export default function InsightsScreen() {
  const { items } = useApp();

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Analizlerin 📊',
          headerBackTitle: 'Cüzdan',
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ColorSection items={items} />
        <MonthlySection items={items} />
        <SellSection items={items} />
      </ScrollView>
    </SafeAreaView>
  );
}

// 🎨 Renk analizi: dönem seçici + yüzde çubuğu + renk listesi
function ColorSection({ items }: { items: ClothingItem[] }) {
  const [period, setPeriod] = useState<ColorPeriod>('month');
  const stats = colorStats(items, period);

  const choose = (value: ColorPeriod) => {
    if (value === period) return;
    Haptics.selectionAsync();
    setPeriod(value);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🎨 Hangi renkleri giyiyorsun?</Text>

      <View style={styles.periods}>
        {PERIODS.map(({ value, label }) => {
          const selected = value === period;
          return (
            <Pressable
              key={value}
              onPress={() => choose(value)}
              style={[styles.periodPill, selected && styles.periodPillSelected]}>
              <Text style={[styles.periodText, selected && styles.periodTextSelected]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.colorHeadline}>{stats.text}</Text>

      {stats.shares.length > 0 && (
        <>
          {/* Yatay yüzde çubuğu: her dilim kendi renginde, genişliği giyim sayısı kadar */}
          <View style={styles.bar}>
            {stats.shares.map((share) => (
              <View
                key={share.color}
                style={[
                  styles.barSlice,
                  { flex: share.wears, backgroundColor: colorHex(share.color) },
                  share.color === 'Beyaz' && styles.barSliceWhite,
                ]}
              />
            ))}
          </View>

          <View style={styles.legend}>
            {stats.shares.map((share) => (
              <View key={share.color} style={styles.legendRow}>
                <ColorSwatch color={share.color} size={18} />
                <Text style={styles.legendName}>{share.color}</Text>
                <Text style={styles.legendValue}>
                  {share.wears} giyim · %{share.percent}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {stats.mostProfitable && (
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{stats.mostProfitable.text}</Text>
        </View>
      )}

      {stats.uncoloredCount > 0 && (
        <Text style={styles.note}>
          {stats.uncoloredCount} parçanın rengi girilmemiş, analize katılmadı. Detay sayfasındaki
          &quot;Düzenle&quot;den renk ekleyebilirsin 🎨
        </Text>
      )}
    </View>
  );
}

// 📅 Aylık özet: bu ayın hazır satırları + en altta pembe balonda ayın yorumu
function MonthlySection({ items }: { items: ClothingItem[] }) {
  const router = useRouter();
  const summary = monthlySummary(items);

  return (
    <View style={styles.section}>
      <View style={styles.monthHeaderRow}>
        <View style={styles.monthHeader}>
          <Text style={styles.monthLabel}>AYLIK ÖZET</Text>
          <Text style={styles.monthTitle}>{summary.title}</Text>
        </View>
        {/* Bu ayın özetini Story kartı olarak paylaş */}
        <Pressable
          onPress={() => router.push({ pathname: '/share', params: { month: '1' } })}
          accessibilityLabel="Aylık özetini paylaş"
          style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}>
          <SymbolView
            name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
            tintColor={colors.primary}
            size={18}
            weight="semibold"
          />
        </Pressable>
      </View>

      <View style={styles.monthLines}>
        {summary.lines.map((line) => (
          <Text key={line} style={styles.monthLine}>
            {line}
          </Text>
        ))}
      </View>

      <View style={styles.verdict}>
        <Text style={styles.verdictText}>{summary.verdict}</Text>
      </View>
    </View>
  );
}

// 🏷️ Satmayı düşün: 90+ gündür giyilmeyen parçalar + tahmini ikinci el değeri
function SellSection({ items }: { items: ClothingItem[] }) {
  const router = useRouter();
  const list = sellList(items);

  return (
    <View style={styles.section}>
      <View style={styles.monthHeader}>
        <Text style={styles.sectionTitle}>🏷️ Satmayı düşün</Text>
        <Text style={styles.sellSubtitle}>
          3 aydır askıda bekleyen, kendini amorti etmemiş parçalar
        </Text>
      </View>

      {list.candidates.length === 0 ? (
        <Text style={styles.sellEmpty}>{list.text}</Text>
      ) : (
        <>
          <View>
            {list.candidates.map(({ item, days, estimate }, index) => (
              <Pressable
                key={item.id}
                onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                style={({ pressed }) => [
                  styles.sellRow,
                  index > 0 && styles.sellRowDivider,
                  pressed && styles.sellRowPressed,
                ]}>
                <ClothingPhoto item={item} style={styles.sellThumb} />
                <View style={styles.sellBody}>
                  <Text style={styles.sellName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.sellMeta}>
                    {wearCount(item) === 0
                      ? `Hiç giyilmedi · ${days} gündür dolapta`
                      : `${days} gündür askıda`}{' '}
                    · {formatTL(item.price)}
                  </Text>
                </View>
                <View style={styles.sellEstimate}>
                  <Text style={styles.sellEstimateValue}>~{formatTL(estimate)}</Text>
                  <Text style={styles.sellEstimateLabel}>tahmini</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{list.text}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.three,
    ...Shadows.card,
  },
  sectionTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  periods: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  periodPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: colors.backgroundElement,
  },
  periodPillSelected: {
    backgroundColor: colors.primary,
  },
  periodText: {
    ...Typography.bodyBold,
    color: colors.textSecondary,
  },
  periodTextSelected: {
    color: colors.onPrimary,
  },
  colorHeadline: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  bar: {
    flexDirection: 'row',
    height: 16,
    gap: 2,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  barSlice: {
    height: '100%',
  },
  // Beyaz dilim beyaz kartta kaybolmasın
  barSliceWhite: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  legend: {
    gap: Spacing.two,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  legendName: {
    ...Typography.body,
    color: colors.text,
    flex: 1,
  },
  legendValue: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  bubble: {
    backgroundColor: colors.primarySoft,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  bubbleText: {
    ...Typography.bodyBold,
    color: colors.primaryPressed,
  },
  note: {
    ...Typography.caption,
    color: colors.textMuted,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  monthHeader: {
    flex: 1,
    gap: Spacing.one,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonPressed: {
    transform: [{ scale: 0.92 }],
  },
  monthLabel: {
    ...Typography.label,
    color: colors.primary,
  },
  monthTitle: {
    ...Typography.title,
    color: colors.text,
  },
  monthLines: {
    gap: Spacing.two,
  },
  monthLine: {
    ...Typography.body,
    color: colors.text,
  },
  verdict: {
    backgroundColor: colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.three,
    ...Shadows.button,
  },
  verdictText: {
    ...Typography.bodyBold,
    color: colors.onPrimary,
    textAlign: 'center',
  },
  sellSubtitle: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  sellEmpty: {
    ...Typography.bodyBold,
    color: colors.text,
    textAlign: 'center',
    paddingVertical: Spacing.two,
  },
  sellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  sellRowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sellRowPressed: {
    opacity: 0.6,
  },
  sellThumb: {
    width: 44,
    aspectRatio: 3 / 4,
    borderRadius: Radius.sm,
  },
  sellBody: {
    flex: 1,
    gap: Spacing.half,
  },
  sellName: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  sellMeta: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  sellEstimate: {
    alignItems: 'flex-end',
  },
  sellEstimateValue: {
    ...Typography.bodyBold,
    color: colors.primary,
  },
  sellEstimateLabel: {
    ...Typography.caption,
    color: colors.textMuted,
  },
});
