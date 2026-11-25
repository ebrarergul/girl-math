/**
 * CÜZDAN EKRANI
 *
 * Dolabın parasal özeti, tek hikâye olarak (26 Kasım, "bir sürü sayı var, anlaşılıyor mu?" üzerine):
 * - Toz pembe kart: dolap değeri (koyu büyük rakam) + Starbucks Endeksi; ince çizginin altında "Giyerek geri
 *   kazandığın" (pembe rakam + %, dolan pembe çubuk; stats.amortizedValue) ve tek satır "N parça resmen bedava ·
 *   N parça hiç giyilmedi".
 * - "Bedavaya en yakın": hedefe en yakın 3 parça, fotoğraf + kendi küçük çubuğu + "12 giyim daha, resmen
 *   bedava". Büyük çubuğun nasıl hesaplandığını somut olarak anlatır; dokununca parçanın detayı.
 * - Kalkanlar: 4 küçük kutu (ortalama maliyet, toplam giyim soyuttu; amorti/hiç giyilmeyen karta taşındı).
 * Tüm sayılar getWardrobeStats'tan gelir. Altta tek kartta Analizlerin + Utanç Duvarı + Almalı mıyım? satırları
 * (Utanç Duvarı'nın her zaman açık girişi burası; Ana sayfadaki bağlantı sadece unutulan parça varken çıkar).
 * Aylık harcama ("bu ay dolaba giren") Analizlerin → Aylık özet'te; burada tekrar edilmez.
 */

import { useRouter } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BlushCard } from '@/components/blush-card';
import { formatTL, shameWallItems } from '@/components/clothing-card';
import { CoachMark, useCoachMarks } from '@/components/coach-mark';
import { ClothingPhoto } from '@/components/outfit-collage';
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
import { useCountUp } from '@/hooks/use-count-up';
import { starbucksIndexText } from '@/lib/starbucks-index';
import { isPaidOff, wearCount } from '@/lib/girl-math';
import { getWardrobeStats } from '@/lib/stats';
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

// "Bedavaya en yakın" listesinde kaç parça
const CLOSEST_LIMIT = 3;

// Hedefine en yakın (henüz amorti olmamış) parçalar: önce giyim/hedef oranı yüksek olan, eşitse az kalan
function closestToFree(items: ClothingItem[]): ClothingItem[] {
  return items
    .filter((item) => !isPaidOff(item))
    .sort(
      (a, b) =>
        wearCount(b) / b.targetWears - wearCount(a) / a.targetWears ||
        a.targetWears - wearCount(a) - (b.targetWears - wearCount(b)),
    )
    .slice(0, CLOSEST_LIMIT);
}

export default function WalletScreen() {
  const router = useRouter();
  const { items, isLoaded } = useApp();
  const stats = getWardrobeStats(items);
  const isEmpty = isLoaded && items.length === 0;
  // Büyük rakamlar sayfa açılınca 0'dan sayarak yükselir
  const shownValue = useCountUp(stats.totalValue);
  const shownAmortized = useCountUp(stats.amortizedValue);
  const shownPercent = useCountUp(stats.amortizedPercent);

  // Utanç Duvarı satırı: kaç parça askıda ve toplam ne kadar zarar yazıyor (duvar sayfasıyla aynı hesap)
  const wall = shameWallItems(items);
  const wallLoss = wall.reduce((sum, entry) => sum + entry.loss, 0);
  const closest = closestToFree(items);

  // Tanıtım okları (birer kez, sırayla): Almalı mıyım? → Analizlerin → Story paylaş
  const coach = useCoachMarks(['wallet-buy', 'wallet-insights', 'wallet-share'], !isEmpty);

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
              <CoachMark
                visible={coach.active === 'wallet-share'}
                text="Dolabını Story'de paylaş"
                placement="below"
                align="right"
                arrowOffset={24}
                onDismiss={() => coach.done('wallet-share')}>
                <Pressable
                  onPress={() => {
                    coach.done('wallet-share');
                    router.push('/share');
                  }}
                  accessibilityLabel="Dolabını paylaş"
                  style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}>
                  <SymbolView
                    name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
                    tintColor={colors.primary}
                    size={20}
                    weight="semibold"
                  />
                </Pressable>
              </CoachMark>
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
              {/* Toz pembe yansımalı büyük kart (Ana sayfanın büyük kartları gibi); küçük kutular beyaz kalır */}
              <Animated.View entering={FadeInDown.duration(450)}>
                <BlushCard style={styles.hero}>
                  <Text style={styles.heroLabel}>DOLAP DEĞERİN</Text>
                  <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
                    {shownValue.toLocaleString('tr-TR')}
                    <Text style={styles.heroCurrency}> ₺</Text>
                  </Text>
                  <Text style={styles.starbucks}>
                    Dolabın {starbucksIndexText(stats.totalValue)}
                  </Text>
                  <View style={styles.divider} />
                  {/* Giyerek geri kazandığın: dolabın ne kadarı giyilerek "geri kazanıldı" + dolan çubuk */}
                  <View style={styles.savingsRow}>
                    <Text style={styles.heroLabel}>GİYEREK GERİ KAZANDIĞIN</Text>
                    <Text style={styles.savingsPercent}>%{shownPercent}</Text>
                  </View>
                  <Text style={styles.savingsValue} numberOfLines={1}>
                    {formatTL(shownAmortized)}
                  </Text>
                  <View style={styles.track}>
                    <View style={[styles.bar, { width: `${shownPercent}%` }]} />
                  </View>
                  <Text style={styles.savingsCaption}>
                    {`${stats.paidOffCount} parça resmen bedava · ${stats.neverWornCount} parça hiç giyilmedi`}
                  </Text>
                </BlushCard>
              </Animated.View>

              {/* Bedavaya en yakın: büyük çubuğun hesabını somut parçalarla anlatır */}
              {closest.length > 0 && (
                <Animated.View entering={FadeInDown.duration(450).delay(100)} style={styles.section}>
                  <Text style={styles.sectionTitle}>Bedavaya en yakın</Text>
                  <View style={styles.closestCard}>
                    {closest.map((item, index) => {
                      const wears = wearCount(item);
                      const left = item.targetWears - wears;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() =>
                            router.push({ pathname: '/item/[id]', params: { id: item.id } })
                          }
                          style={({ pressed }) => [styles.closestRow, pressed && styles.closestPressed]}>
                          <ClothingPhoto item={item} style={styles.closestPhoto} />
                          <View style={[styles.closestBody, index > 0 && styles.closestDivider]}>
                            <View style={styles.closestTop}>
                              <Text style={styles.closestName} numberOfLines={1}>
                                {item.name}
                              </Text>
                              <Text style={styles.closestCount}>{`${wears}/${item.targetWears}`}</Text>
                            </View>
                            <View style={styles.miniTrack}>
                              <View
                                style={[
                                  styles.miniBar,
                                  { width: `${Math.round((wears / item.targetWears) * 100)}%` },
                                ]}
                              />
                            </View>
                            <Text style={styles.closestText}>
                              {wears === 0
                                ? 'Henüz hiç giyilmedi, ilk adım seni bekliyor'
                                : left === 1
                                  ? '1 giyim daha, resmen bedava!'
                                  : `${left} giyim daha, resmen bedava`}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </Animated.View>
              )}
            </>
          )}

          {/* iPhone Ayarları gibi tek kartta satırlar: Analizlerin (dolap boşken yok) + Almalı mıyım?
              ("Almalı mıyım?" dolap boşken de görünür: ilk alışverişten önce de işe yarar) */}
          {isLoaded && (
            <Animated.View entering={FadeInDown.duration(450).delay(240)} style={styles.linkGroup}>
              {!isEmpty && (
                <CoachMark
                  visible={coach.active === 'wallet-insights'}
                  text="Aylık özetin ve renklerin burada"
                  align="left"
                  arrowOffset={20}
                  onDismiss={() => coach.done('wallet-insights')}>
                  <LinkRow
                    icon="chart.bar"
                    title="Analizlerin"
                    text="Aylık özet, renklerin, satmayı düşün"
                    onPress={() => {
                      coach.done('wallet-insights');
                      router.push('/insights');
                    }}
                  />
                </CoachMark>
              )}
              {!isEmpty && (
                <LinkRow
                  icon="clock.badge.exclamationmark"
                  title="Utanç Duvarı"
                  text={
                    wall.length === 0
                      ? 'Duvar bomboş, helal olsun'
                      : `${wall.length} parça askıda · ${formatTL(wallLoss)} boşa gidiyor`
                  }
                  onPress={() => router.push('/shame-wall')}
                  divider
                />
              )}
              <CoachMark
                visible={coach.active === 'wallet-buy'}
                text="Bir şey almadan önce buraya sor"
                align="left"
                arrowOffset={20}
                onDismiss={() => coach.done('wallet-buy')}>
                <LinkRow
                  icon="bag.badge.questionmark"
                  title="Almalı mıyım?"
                  text="Almadan önce Girl Math'e sor"
                  onPress={() => {
                    coach.done('wallet-buy');
                    router.push('/should-i-buy');
                  }}
                  divider={!isEmpty}
                />
              </CoachMark>
            </Animated.View>
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
    padding: Spacing.four,
    gap: Spacing.one,
  },
  heroLabel: {
    ...Typography.label,
    color: colors.textSecondary,
  },
  heroValue: {
    ...Typography.hero,
    fontSize: 44,
    lineHeight: 52,
    color: colors.text,
  },
  heroCurrency: {
    fontFamily: Fonts?.sans,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: Spacing.three,
  },
  starbucks: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savingsPercent: {
    ...Typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  // Amorti çubuğu
  track: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
    marginTop: Spacing.two,
  },
  bar: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: colors.progress,
  },
  savingsCaption: {
    ...Typography.caption,
    color: colors.textMuted,
    marginTop: Spacing.two,
  },
  savingsValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.primary,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  // "Bedavaya en yakın": tek beyaz kartta satırlar (çizgi fotoğrafın sağından başlar)
  closestCard: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    paddingLeft: Spacing.three,
    ...Shadows.card,
  },
  closestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  closestPressed: {
    opacity: 0.6,
  },
  closestPhoto: {
    width: 44,
    borderRadius: Radius.sm,
  },
  closestBody: {
    flex: 1,
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    paddingRight: Spacing.three,
  },
  closestDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  closestTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  closestName: {
    ...Typography.bodyBold,
    color: colors.text,
    flexShrink: 1,
  },
  closestCount: {
    ...Typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  miniTrack: {
    height: 5,
    borderRadius: Radius.pill,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
  },
  miniBar: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: colors.progress,
  },
  closestText: {
    ...Typography.caption,
    color: colors.textSecondary,
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
