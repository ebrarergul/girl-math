/**
 * CÜZDAN EKRANI
 *
 * Dolabın parasal özeti: dolap değeri ve Starbucks Endeksi karşılığı, şaka istatistik
 * "Girl Math kazancın" ve 4 küçük istatistik kutusu. Tüm sayılar getWardrobeStats'tan gelir.
 */

import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatTL } from '@/components/clothing-card';
import { StatTile } from '@/components/stat-tile';
import { ScreenBackground } from '@/components/screen-background';
import {
  BottomTabInset,
  Colors,
  Fonts,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { findComparison } from '@/lib/comparisons';
import { todayString } from '@/lib/girl-math';
import { starbucksIndexText } from '@/lib/starbucks-index';
import { getWardrobeStats } from '@/lib/stats';

const colors = Colors.light;

export default function WalletScreen() {
  const router = useRouter();
  const { items, isLoaded } = useApp();
  const stats = getWardrobeStats(items);
  const isEmpty = isLoaded && items.length === 0;

  // Bu ay dolaba giren: bu ay eklenen parçaların sayısı ve toplam fiyatı (aylık harcama özeti)
  const thisMonth = todayString().slice(0, 7); // Örn: "2026-10"
  const addedThisMonth = items.filter((item) => item.createdAt.startsWith(thisMonth));
  const spentThisMonth = addedThisMonth.reduce((sum, item) => sum + item.price, 0);
  const spentMatch = findComparison(spentThisMonth);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.label}>GIRL MATH</Text>
              <Text style={styles.title}>Cüzdanım</Text>
            </View>
            {/* Dolap kartını Story olarak paylaş (dolap boşken paylaşacak bir şey yok) */}
            {!isEmpty && isLoaded && (
              <Pressable
                onPress={() => router.push('/share')}
                accessibilityLabel="Dolabını paylaş"
                style={({ pressed }) => [styles.shareButton, pressed && styles.emptyButtonPressed]}>
                <SymbolView
                  name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
                  tintColor={colors.onPrimary}
                  size={20}
                  weight="bold"
                />
              </Pressable>
            )}
          </View>

          {isEmpty ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <SymbolView
                  name={{ ios: 'creditcard', android: 'account_balance_wallet', web: 'wallet' }}
                  tintColor={colors.primary}
                  size={34}
                  weight="light"
                />
              </View>
              <Text style={styles.emptyTitle}>Cüzdanın seni bekliyor</Text>
              <Text style={styles.emptyText}>
                Dolabına parça ekledikçe Girl Math hesapların burada belirecek.
              </Text>
              <Pressable
                onPress={() => router.push('/add-item')}
                style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}>
                <Text style={styles.emptyButtonText}>İlk parçanı ekle</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Dolap değeri: rakam dergi yazı tipinde, ₺ sade yazı tipinde */}
              <View style={styles.hero}>
                <Text style={styles.heroLabel}>DOLAP DEĞERİN</Text>
                <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
                  {stats.totalValue.toLocaleString('tr-TR')}
                  <Text style={styles.heroCurrency}> ₺</Text>
                </Text>
                <Text style={styles.heroNote}>{stats.totalItems} parça</Text>
                <View style={styles.divider} />
                <Text style={styles.starbucks}>
                  Dolabın {starbucksIndexText(stats.totalValue)}
                </Text>
              </View>

              <StatTile
                label="GIRL MATH kazancın"
                value={formatTL(stats.girlMathSavings)}
                caption="Giydikçe kazandığın. Bankan bunu tanımıyor ama biz tanıyoruz 💅"
                tone="primary"
              />

              <StatTile
                label="Bu ay dolaba giren"
                value={formatTL(spentThisMonth)}
                caption={
                  addedThisMonth.length === 0
                    ? 'Bu ay hiç alışveriş yok, cüzdanın sana minnettar 🫶'
                    : `${addedThisMonth.length} yeni parça 🛍️${
                        spentMatch
                          ? ` · ${Math.floor(spentThisMonth / spentMatch.price)} ${spentMatch.unit} ${spentMatch.emoji} demek`
                          : ''
                      }`
                }
              />

              <View style={styles.row}>
                <StatTile
                  label="Ortalama maliyet"
                  value={
                    stats.averageCostPerWear === null ? '—' : formatTL(stats.averageCostPerWear)
                  }
                  caption="giyim başına"
                />
                <StatTile
                  label="Toplam giyim"
                  value={String(stats.totalWears)}
                  caption={`bu ay ${stats.wearsThisMonth}`}
                />
              </View>
              <View style={styles.row}>
                <StatTile
                  label="Amorti edilen"
                  value={`${stats.paidOffCount} / ${stats.totalItems}`}
                  caption="parça resmen bedava"
                />
                <StatTile
                  label="Hiç giyilmeyen"
                  value={String(stats.neverWornCount)}
                  caption="parça sırasını bekliyor"
                />
              </View>
            </>
          )}

          {/* "Almalı mıyım?" dolap boşken de görünür: ilk alışverişten önce de işe yarar */}
          {isLoaded && (
            <Pressable
              onPress={() => router.push('/should-i-buy')}
              style={({ pressed }) => [styles.askCard, pressed && styles.askCardPressed]}>
              <Text style={styles.askEmoji}>🤔</Text>
              <View style={styles.askBody}>
                <Text style={styles.askTitle}>Almalı mıyım?</Text>
                <Text style={styles.askText}>{"Almadan önce Girl Math'e sor"}</Text>
              </View>
              <SymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                tintColor={colors.primary}
                size={14}
              />
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: Spacing.four,
    paddingBottom: Spacing.one,
  },
  headerText: {
    gap: Spacing.one,
  },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  label: {
    ...Typography.label,
    color: colors.primary,
  },
  title: {
    ...Typography.title,
    color: colors.text,
  },
  hero: {
    backgroundColor: colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.one,
    ...Shadows.card,
  },
  heroLabel: {
    ...Typography.label,
    color: colors.textSecondary,
  },
  heroValue: {
    ...Typography.hero,
    fontSize: 44,
    lineHeight: 52,
    color: colors.primary,
  },
  heroCurrency: {
    fontFamily: Fonts?.sans,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0,
  },
  heroNote: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: Spacing.two,
  },
  starbucks: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  askCard: {
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
  askCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  askEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  askBody: {
    flex: 1,
    gap: Spacing.half,
  },
  askTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  askText: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    gap: Spacing.two,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    ...Typography.heading,
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: Spacing.three,
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    ...Shadows.button,
  },
  emptyButtonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.95 }],
  },
  emptyButtonText: {
    ...Typography.button,
    color: colors.onPrimary,
  },
});
