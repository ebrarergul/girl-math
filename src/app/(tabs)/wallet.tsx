/**
 * CÜZDAN EKRANI
 *
 * Dolabın parasal özeti: dolap değeri ve Starbucks Endeksi karşılığı, şaka istatistik
 * "Girl Math kazancın" (sayfanın tek pembe vurgusu) ve 4 küçük istatistik kutusu. Tüm sayılar
 * getWardrobeStats'tan gelir. Altta tek kartta Analizlerin + Almalı mıyım? satırları.
 * Aylık harcama ("bu ay dolaba giren") Analizlerin → Aylık özet'te; burada tekrar edilmez.
 */

import { useRouter } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
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
import { starbucksIndexText } from '@/lib/starbucks-index';
import { getWardrobeStats } from '@/lib/stats';

const colors = Colors.light;

export default function WalletScreen() {
  const router = useRouter();
  const { items, isLoaded } = useApp();
  const stats = getWardrobeStats(items);
  const isEmpty = isLoaded && items.length === 0;

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
                style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}>
                <SymbolView
                  name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
                  tintColor={colors.primary}
                  size={20}
                  weight="semibold"
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

          {/* iPhone Ayarları gibi tek kartta satırlar: Analizlerin (dolap boşken yok) + Almalı mıyım?
              ("Almalı mıyım?" dolap boşken de görünür: ilk alışverişten önce de işe yarar) */}
          {isLoaded && (
            <View style={styles.linkGroup}>
              {!isEmpty && (
                <LinkRow
                  icon="chart.bar"
                  title="Analizlerin"
                  text="Aylık özet, renklerin, satmayı düşün"
                  onPress={() => router.push('/insights')}
                />
              )}
              <LinkRow
                icon="bag.badge.questionmark"
                title="Almalı mıyım?"
                text="Almadan önce Girl Math'e sor"
                onPress={() => router.push('/should-i-buy')}
                divider={!isEmpty}
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

// Alttaki karttaki tek satır: pembe simge, başlık + açıklama, sağda ok
function LinkRow({
  icon,
  title,
  text,
  onPress,
  divider,
}: {
  icon: SFSymbol;
  title: string;
  text: string;
  onPress: () => void;
  divider?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}>
      <View style={styles.linkIcon}>
        <SymbolView name={icon} tintColor={colors.primary} size={18} />
      </View>
      <View style={[styles.linkBody, divider && styles.linkDivider]}>
        <View style={styles.linkText}>
          <Text style={styles.linkTitle}>{title}</Text>
          <Text style={styles.linkCaption}>{text}</Text>
        </View>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          tintColor={colors.textMuted}
          size={13}
        />
      </View>
    </Pressable>
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
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  shareButtonPressed: {
    transform: [{ scale: 0.95 }],
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
  // iPhone Ayarları gibi: tek beyaz kart, satırlar arasında ince çizgi (simgenin sağından başlar)
  linkGroup: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    paddingLeft: Spacing.three,
    ...Shadows.card,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  linkRowPressed: {
    opacity: 0.6,
  },
  // Açık pembe daire içinde pembe simge
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingRight: Spacing.three,
  },
  linkDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  linkText: {
    flex: 1,
    gap: Spacing.half,
  },
  linkTitle: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  linkCaption: {
    ...Typography.caption,
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
