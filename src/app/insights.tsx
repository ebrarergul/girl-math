/**
 * ANALİZLERİN
 *
 * Dolabının analizleri (hesaplar Onur'un `@/lib/insights` dosyasında):
 *   Renk analizi (colorStats): "Bu ay / Tüm zamanlar", hangi renkleri giyiyorsun
 *   Aylık özet (monthlySummary): bu ayın rakamları + ayın yorumu (Story'de paylaşılır)
 *   Satmayı düşün (sellList): 90+ gündür giyilmeyen, amorti olmamış parçalar
 * Cüzdan'daki "Analizlerin" kartıyla açılır.
 *
 * Tasarım: emoji sadece eğlenceli cümlelerde (ayın yorumu). Başlık ve listeler sade;
 * bu yüzden Onur'un hazır cümleleri (lines, text) yerine sayıları kendimiz diziyoruz.
 */

import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
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
          title: 'Analizlerin',
          headerBackTitle: 'Cüzdan',
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MonthlySection items={items} />
        <ColorSection items={items} />
        <SellSection items={items} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Bölüm başlığı: küçük pembe etiket + başlık (+ sağda isteğe bağlı buton)
function SectionHeader({
  label,
  title,
  action,
}: {
  label: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

// Aylık özetteki "etiket — değer" satırı
function StatRow({ label, value, first }: { label: string; value: string; first?: boolean }) {
  return (
    <View style={[styles.statRow, !first && styles.divider]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// Aylık özet: bu ayın rakamları + ayın yorumu (sağ üstte Story'de paylaş)
function MonthlySection({ items }: { items: ClothingItem[] }) {
  const router = useRouter();
  const summary = monthlySummary(items);
  // "Ekim 2026 özetin 💅" → "Ekim 2026"
  const monthName = summary.title.replace(/ özetin.*$/, '');

  // Geçen aya göre değişim: "+%20" / "−%15"
  let change = '';
  if (summary.previousWears > 0) {
    const percent = Math.round(
      ((summary.wears - summary.previousWears) / summary.previousWears) * 100
    );
    if (percent !== 0) change = ` · geçen aya göre ${percent > 0 ? '+' : '−'}%${Math.abs(percent)}`;
  }

  const rows = [
    {
      label: 'Dolaba giren',
      value:
        summary.newItemCount > 0
          ? `${summary.newItemCount} parça · ${formatTL(summary.spent)}`
          : 'Yok',
    },
    { label: 'Giydim', value: `${summary.wears} kere${change}` },
    summary.star && {
      label: 'Ayın yıldızı',
      value: `${summary.star.item.name} · ${summary.star.wears} kere`,
    },
    summary.paidOffCount > 0 && { label: 'Amorti olan', value: `${summary.paidOffCount} parça` },
    summary.unwornCount > 0 && { label: 'Hiç giyilmeyen', value: `${summary.unwornCount} parça` },
  ].filter((row): row is { label: string; value: string } => Boolean(row));

  return (
    <View style={styles.section}>
      <SectionHeader
        label={monthName.toLocaleUpperCase('tr')}
        title="Aylık özetin"
        action={
          <Pressable
            onPress={() => router.push({ pathname: '/share', params: { month: '1' } })}
            accessibilityLabel="Aylık özetini paylaş"
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}>
            <SymbolView
              name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
              tintColor={colors.primary}
              size={16}
              weight="semibold"
            />
          </Pressable>
        }
      />

      <View>
        {rows.map((row, index) => (
          <StatRow key={row.label} label={row.label} value={row.value} first={index === 0} />
        ))}
      </View>

      {/* Ayın yorumu: buton gibi değil, alıntı gibi */}
      <View style={styles.quote}>
        <Text style={styles.quoteText}>{summary.verdict}</Text>
      </View>
    </View>
  );
}

// Renk analizi: dönem seçici + yüzde çubuğu + renk listesi
function ColorSection({ items }: { items: ClothingItem[] }) {
  const [period, setPeriod] = useState<ColorPeriod>('month');
  const stats = colorStats(items, period);
  const top = stats.shares[0];

  const choose = (value: ColorPeriod) => {
    if (value === period) return;
    Haptics.selectionAsync();
    setPeriod(value);
  };

  return (
    <View style={styles.section}>
      <SectionHeader
        label="RENKLERİN"
        title={top ? `En çok ${top.color.toLocaleLowerCase('tr')} giyiyorsun` : 'Henüz veri yok'}
        action={top && <Text style={styles.bigPercent}>%{top.percent}</Text>}
      />

      {/* iPhone tarzı iki parçalı seçici */}
      <View style={styles.segment}>
        {PERIODS.map(({ value, label }) => {
          const selected = value === period;
          return (
            <Pressable
              key={value}
              onPress={() => choose(value)}
              style={[styles.segmentItem, selected && styles.segmentItemSelected]}>
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {top ? (
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
                <ColorSwatch color={share.color} size={12} />
                <Text style={styles.legendName}>{share.color}</Text>
                <Text style={styles.legendValue}>%{share.percent}</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.muted}>
          {period === 'month'
            ? 'Bu ay rengi girilmiş bir parçaya henüz "Giydim" demedin.'
            : 'Rengi girilmiş parçalara "Giydim" dedikçe burası dolacak.'}
        </Text>
      )}

      {stats.mostProfitable && (
        <View style={[styles.statRow, styles.divider]}>
          <Text style={styles.statLabel}>En çok kâr ettiren</Text>
          <View style={styles.inline}>
            <ColorSwatch color={stats.mostProfitable.color} size={12} />
            <Text style={styles.statValue}>
              {stats.mostProfitable.color} · {formatTL(stats.mostProfitable.savings)}
            </Text>
          </View>
        </View>
      )}

      {stats.uncoloredCount > 0 && (
        <Text style={styles.muted}>
          {stats.uncoloredCount} parçanın rengi girilmemiş; detaydaki Düzenle&apos;den ekleyebilirsin.
        </Text>
      )}
    </View>
  );
}

// Satmayı düşün: 90+ gündür giyilmeyen parçalar + tahmini ikinci el değeri
function SellSection({ items }: { items: ClothingItem[] }) {
  const router = useRouter();
  const list = sellList(items);

  return (
    <View style={styles.section}>
      <SectionHeader label="SATMAYI DÜŞÜN" title="3 aydır askıda" />

      {list.candidates.length === 0 ? (
        <View style={styles.empty}>
          <SymbolView
            name={{ ios: 'checkmark.seal', android: 'verified', web: 'verified' }}
            tintColor={colors.primary}
            size={28}
            weight="light"
          />
          <Text style={styles.emptyText}>
            Satılacak bir şey yok. Dolabındaki her parça işini yapıyor.
          </Text>
        </View>
      ) : (
        <>
          <View>
            {list.candidates.map(({ item, days, estimate }, index) => (
              <Pressable
                key={item.id}
                onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                style={({ pressed }) => [
                  styles.sellRow,
                  index > 0 && styles.divider,
                  pressed && styles.rowPressed,
                ]}>
                <ClothingPhoto item={item} style={styles.sellThumb} />
                <View style={styles.sellBody}>
                  <Text style={styles.sellName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.muted}>
                    {wearCount(item) === 0 ? `Hiç giyilmedi · ${days} gün` : `${days} gündür askıda`}
                  </Text>
                </View>
                <Text style={styles.sellEstimate}>~{formatTL(estimate)}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.statRow, styles.divider]}>
            <Text style={styles.statLabel}>Tahmini ikinci el değeri</Text>
            <Text style={[styles.statValue, styles.primaryText]}>
              ~{formatTL(list.totalEstimate)}
            </Text>
          </View>
          <Text style={styles.muted}>Alış fiyatının yaklaşık %40&apos;ı, kesin değil.</Text>
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
    padding: Spacing.four,
    gap: Spacing.three,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerText: {
    flex: 1,
    gap: Spacing.one,
  },
  label: {
    ...Typography.label,
    color: colors.primary,
  },
  title: {
    ...Typography.title,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  },
  bigPercent: {
    ...Typography.title,
    color: colors.primary,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    transform: [{ scale: 0.92 }],
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.two + Spacing.half,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  statLabel: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  statValue: {
    ...Typography.bodyBold,
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  primaryText: {
    color: colors.primary,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexShrink: 1,
  },
  quote: {
    backgroundColor: colors.primarySoft,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  quoteText: {
    ...Typography.body,
    fontStyle: 'italic',
    color: colors.primaryPressed,
    textAlign: 'center',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundElement,
    borderRadius: Radius.pill,
    padding: Spacing.half,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two - Spacing.half,
    borderRadius: Radius.pill,
  },
  segmentItemSelected: {
    backgroundColor: colors.card,
    ...Shadows.card,
  },
  segmentText: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  segmentTextSelected: {
    color: colors.text,
  },
  bar: {
    flexDirection: 'row',
    height: 10,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.two,
  },
  legendRow: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingRight: Spacing.three,
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
  muted: {
    ...Typography.caption,
    color: colors.textMuted,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  emptyText: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rowPressed: {
    opacity: 0.6,
  },
  sellThumb: {
    width: 40,
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
  sellEstimate: {
    ...Typography.bodyBold,
    color: colors.primary,
  },
});
