/**
 * UTANÇ DUVARI 👀
 *
 * Unutulan bütün parçalar: hiç giyilmeyenler ve FORGOTTEN_DAYS+ gündür giyilmeyenler,
 * en çok zarar yazandan aza doğru. En üstte toplam boşa giden para ve Girl Math kıyası.
 * Ana sayfadaki "Utanç Duvarı →" bağlantısıyla ve Cüzdan'daki "Utanç Duvarı" satırıyla açılır. Bir parçaya dokununca detayı açılır.
 *
 * 28 Kasım sadeleştirme (Ebrar: "pembe yazılar keskin, acemi site gibi"): üst kart pembe çerçeve yerine
 * BlushCard; liste Cüzdan'daki "Bedavaya en yakın" gibi tek beyaz kartta satırlar. Satırda pembe paragraf ve
 * emoji yok: sağda boşa giden tutar (koyu), altında gri gün/fiyat ve soluk kıyas. Sayfanın tek pembesi büyük rakam.
 */

import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BlushCard } from '@/components/blush-card';
import { formatTL, MIN_DAILY_LOSS_TO_SHOW, shameWallItems } from '@/components/clothing-card';
import { ClothingPhoto } from '@/components/outfit-collage';
import { Colors, Fonts, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { findComparison } from '@/lib/comparisons';
import { wearCount } from '@/lib/girl-math';
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

// Satırın en alt cümlesi: tek bilgi, tam cümle. 28 Kasım: "≈ Brunch · günde 22 ₺" ve "Bir brunch parası · her gün
// 22 ₺ artıyor" ilk bakışta anlaşılmadı (iki bilgi tek satırda karışıyordu). Kıyas sadece üst kartta (toplam için).
// Günlük tutar anlamlı değilse (< 10 ₺) null, satır çıkmaz.
function dailyLossText(price: number): string | null {
  const daily = Math.round(price / 365);
  return daily >= MIN_DAILY_LOSS_TO_SHOW ? `Giymediğin her gün ${formatTL(daily)} daha boşa gidiyor` : null;
}

// Sayfanın altındaki küçük gri not: zarar hesabını kullanıcının kendi parçasıyla, makara dille anlatır
// (28 Kasım: "Nasıl hesaplıyoruz?" yapay zekâ notu gibi duruyordu). Kıyafet adı tırnakta özne (ek almasın).
function HowItWorks({ item }: { item: ClothingItem }) {
  const daily = Math.round(item.price / 365);
  return (
    <View style={styles.howItWorks}>
      <Text style={styles.howTitle}>Bu rakamlar nereden çıktı?</Text>
      <Text style={styles.howText}>
        {`Girl Math kuralı: her parça kendi parasını bir yılda çıkarmalı. “${item.name}” ${formatTL(item.price)}, yani sana her gün ${formatTL(daily)} kira kesiyor. Dolabında bedava oturmasına izin verme aşko, ya giy ya kapının önüne koy 💅`}
      </Text>
    </View>
  );
}

export default function ShameWallScreen() {
  const router = useRouter();
  const { items } = useApp();
  const wall = shameWallItems(items);
  const totalLoss = wall.reduce((sum, entry) => sum + entry.loss, 0);
  const totalMatch = findComparison(totalLoss);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Utanç Duvarı',
          headerBackTitle: 'Geri',
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {wall.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💅</Text>
            <Text style={styles.emptyTitle}>Duvar bomboş!</Text>
            <Text style={styles.emptyText}>
              Dolabındaki her parça düzenli giyiliyor. Girl Math seninle gurur duyuyor.
            </Text>
          </View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(450)}>
              <BlushCard style={styles.summary}>
                <Text style={styles.summaryLabel}>TOPLAM BOŞA GİDEN</Text>
                <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
                  {totalLoss.toLocaleString('tr-TR')}
                  <Text style={styles.summaryCurrency}> ₺</Text>
                </Text>
                <Text style={styles.summaryText}>
                  {wall.length} parça askıda
                  {totalMatch ? ` · ≈ ${totalMatch.name}` : ''}
                </Text>
                <Text style={styles.summaryNote}>
                  Ya bu hafta giy ya da satışa koy. Girl Math affetmez 👀
                </Text>
              </BlushCard>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(450).delay(100)} style={styles.section}>
              <Text style={styles.sectionTitle}>Askıdakiler</Text>
              <View style={styles.listCard}>
                {wall.map(({ item, days, loss }, index) => {
                  const neverWorn = wearCount(item) === 0;
                  const detail = dailyLossText(item.price);
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                      accessibilityLabel={`${item.name}, ${formatTL(loss)} boşa gitti`}
                      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                      <ClothingPhoto item={item} style={styles.photo} />
                      <View style={[styles.rowBody, index > 0 && styles.rowDivider]}>
                        <View style={styles.rowTop}>
                          <View style={styles.rowText}>
                            <Text style={styles.rowName} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={styles.rowMeta} numberOfLines={1}>
                              {neverWorn ? `Hiç giyilmedi · ${days} gündür dolapta` : `${days} gündür askıda`}
                              {` · alış ${formatTL(item.price)}`}
                            </Text>
                          </View>
                          {/* Rakamın ne olduğu altında yazar */}
                          <View style={styles.rowAmount}>
                            <Text style={styles.rowLoss}>{formatTL(loss)}</Text>
                            <Text style={styles.rowLossLabel}>boşa gitti</Text>
                          </View>
                        </View>
                        {detail && <Text style={styles.rowDetail}>{detail}</Text>}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* "Neye göre?" sorusunun cevabı (28 Kasım): örnek duvardaki en pahalı parçadan */}
            <HowItWorks
              item={wall.reduce((top, entry) => (entry.item.price > top.price ? entry.item : top), wall[0].item)}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
    gap: Spacing.four,
  },
  summary: {
    padding: Spacing.four,
    gap: Spacing.one,
  },
  summaryLabel: {
    ...Typography.label,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...Typography.hero,
    fontSize: 44,
    lineHeight: 52,
    color: colors.primary,
  },
  summaryCurrency: {
    fontFamily: Fonts?.sans,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0,
  },
  summaryText: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  summaryNote: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  // Tek beyaz kartta satırlar (çizgi fotoğrafın sağından başlar), Cüzdan'daki "Bedavaya en yakın" gibi
  listCard: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    paddingLeft: Spacing.three,
    ...Shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rowPressed: {
    opacity: 0.6,
  },
  photo: {
    width: 44,
    borderRadius: Radius.sm,
  },
  rowBody: {
    flex: 1,
    gap: Spacing.half,
    paddingVertical: Spacing.three,
    paddingRight: Spacing.three,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  rowName: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  rowAmount: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
  rowLoss: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  rowLossLabel: {
    ...Typography.caption,
    color: colors.textMuted,
  },
  rowMeta: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  rowDetail: {
    ...Typography.caption,
    color: colors.textMuted,
  },
  howItWorks: {
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  howTitle: {
    ...Typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  howText: {
    ...Typography.caption,
    color: colors.textMuted,
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.six,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  emptyEmoji: {
    fontSize: 48,
    lineHeight: 56,
  },
  emptyTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  emptyText: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
