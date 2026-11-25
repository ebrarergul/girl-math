/**
 * ANA SAYFA
 *
 * Her gün açılan "bugün" ekranı (25 Kasım 2026 yeni düzen, taslak B "krem + pembe vurgu"):
 * - Küçük gri tarih + dergi yazısıyla selamlama; sağ üstte Ayarlar
 * - "Bugün ne giydin?" (sayfanın ana eylemi, beyaz kart): hızlı check-in şeridi (ışık düğmesi gibi:
 *   dokun ✓, tekrar dokun geri al). Bütün dolap değil, en fazla QUICK_WEAR_LIMIT parça
 *   (quickWearItems) + sonda "Tümü →" (Dolap)
 * - Etkinlik geri sayımı (sadece 7 gün kala, tek satır)
 * - Girl Math gerçeği (beyaz kart, koyu büyük rakam): her gün farklısıyla başlar, dokununca
 *   sıradakine geçer, altta kaçıncı gerçek olduğunu gösteren noktalar
 * - "Günün kombini": unutulan bir parçanın etrafında kombin (dokununca "Bununla ne giyerim?")
 * - "Keşfet": küçük kutular (Burcun, Analiz, Almalı mıyım?, hafta sonu Kahoot) – explore-tiles.tsx
 * Ekstralar yeni kullanıcıyı boğmasın diye Keşfet'te; pembe sadece vurgu (seçili parça, bağlantı).
 * Kaldırılanlar: pembe vitrin kartı, gümüş burç şeridi, "Unutulan parça" (Utanç Duvarı Cüzdan'da),
 * "Dolabının yıldızı" (Aylık özette "Ayın yıldızı").
 * Dolap boşsa ekleme butonu çıkar. Tüm sayılar getWardrobeStats'tan gelir.
 */

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DailyOutfitCard } from '@/components/daily-outfit-card';
import { EventCountdownCard, nextEvent } from '@/components/event-countdown-card';
import { stringFromDate } from '@/components/event-picker';
import { ExploreTiles } from '@/components/explore-tiles';
import { useQuickWear } from '@/components/quick-wear';
import { ScreenBackground } from '@/components/screen-background';
import { TodayGroup } from '@/components/today-row';
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
import { todayString } from '@/lib/girl-math';
import { photoUri } from '@/lib/photos';
import { starbucksIndexText } from '@/lib/starbucks-index';
import { getWardrobeStats, type WardrobeStats } from '@/lib/stats';
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

// Saate göre selamlama (başlıkta emoji yok)
function greeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Günaydın aşko';
  if (hour >= 12 && hour < 18) return 'Merhaba aşko';
  return 'İyi akşamlar aşko';
}

// Bugünün tarihi: "Salı, 25 Kasım"
function todayLabel(): string {
  const now = new Date();
  const weekday = now.toLocaleDateString('tr-TR', { weekday: 'long' });
  const dayMonth = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  return `${weekday.charAt(0).toLocaleUpperCase('tr')}${weekday.slice(1)}, ${dayMonth}`;
}

// "Bugün ne giydin?" şeridinde en fazla kaç parça (fazlası için sondaki "Tümü →" Dolap'ı açar)
const QUICK_WEAR_LIMIT = 8;
// Sık giyilenler bu kadar güne bakılarak bulunur
const QUICK_WEAR_DAYS = 30;

// Şeritteki parçalar: son 30 günde en sık giyilenler (eşitse en son eklenen). Bugünkü giyimler
// sayılmaz, yoksa dokunduğun parça parmağının altından kayardı. Bugün Dolap'tan giyilip
// listeye girmeyen parça ✓ ile başa eklenir. Hiç giyim yoksa en son eklenenler gelir.
// Not (20 Ekim): geçici çözüm, Ebrar sonra yeniden düşünecek (CLAUDE.md → Bilinen durumlar).
function quickWearItems(items: ClothingItem[], today: string): ClothingItem[] {
  const since = new Date();
  since.setDate(since.getDate() - QUICK_WEAR_DAYS);
  const sinceString = stringFromDate(since); // "2026-09-20"
  const recentWears = (item: ClothingItem) =>
    item.wearDates.filter((date) => date >= sinceString && date < today).length;

  // items en yeni en başta geliyor; sort eşitlerde bu sırayı korur
  const top = [...items]
    .sort((a, b) => recentWears(b) - recentWears(a))
    .slice(0, QUICK_WEAR_LIMIT);
  const wornElsewhere = items.filter(
    (item) => item.wearDates.includes(today) && !top.includes(item),
  );
  return [...wornElsewhere, ...top].slice(0, Math.max(QUICK_WEAR_LIMIT, wornElsewhere.length));
}

// Yılın kaçıncı günü (gerçek kartı her gün başka bir gerçekle başlasın diye)
function dayOfYear(): number {
  const now = new Date();
  return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
}

// Kartta gösterilen bir "Girl Math gerçeği"
type Fact = { label: string; value: number; currency: boolean; suffix?: string; text: string };

function buildFacts(stats: WardrobeStats): Fact[] {
  const facts: Fact[] = [
    {
      label: 'Bu ay',
      value: stats.wearsThisMonth,
      currency: false,
      suffix: 'kere giydin',
      text:
        stats.wearsThisMonth > 0
          ? 'Her "Giydim" maliyeti biraz daha eritiyor. Devam aşko!'
          : 'Bu ay ilk "Giydim" seni bekliyor. Yukarıdan bir parçaya dokun!',
    },
    {
      label: 'Girl Math kazancın',
      value: stats.girlMathSavings,
      currency: true,
      text: 'Giydikçe kazandığın. Bankan bunu tanımıyor ama biz tanıyoruz 💅',
    },
    {
      label: 'Dolabın',
      value: stats.totalValue,
      currency: true,
      // Etiket zaten "Dolabın": cümle "= 156 iced latte…" yerine "156 iced latte…" diye başlar
      text: starbucksIndexText(stats.totalValue).replace(/^=\s*/, ''),
    },
  ];
  if (stats.averageCostPerWear !== null) {
    facts.push({
      label: 'Ortalama giyim maliyetin',
      value: stats.averageCostPerWear,
      currency: true,
      text: 'Dolabındaki bir parçayı bir kere giymek sana ortalama bu kadara geliyor.',
    });
  }
  if (stats.paidOffCount > 0) {
    facts.push({
      label: 'Resmen bedava',
      value: stats.paidOffCount,
      currency: false,
      suffix: 'parça',
      text: 'Bu parçalar kendini amorti etti. Ekonomi dehasısın!',
    });
  }
  return facts;
}

export default function HomeScreen() {
  const router = useRouter();
  const { items, isLoaded } = useApp();
  const stats = getWardrobeStats(items);
  const isEmpty = isLoaded && items.length === 0;
  const today = todayString();

  // Gerçek kartı: her gün farklı gerçekle başlar, dokundukça sıradakine geçer
  const facts = buildFacts(stats);
  const [factOffset, setFactOffset] = useState(0);
  const fact = facts[(dayOfYear() + factOffset) % facts.length];

  function nextFact() {
    Haptics.selectionAsync();
    setFactOffset((current) => current + 1);
  }

  // Hızlı Giydim (ortak): dokun ✓, tekrar dokun geri al; balonda "Geri al"
  const { toggleWear, toastView } = useQuickWear();

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.date}>{todayLabel()}</Text>
              <Text style={styles.title}>{greeting()}</Text>
            </View>
            <Pressable
              onPress={() => router.push('/settings')}
              accessibilityLabel="Ayarlar"
              hitSlop={8}
              style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}>
              <SymbolView name="gearshape" tintColor={colors.text} size={20} />
            </Pressable>
          </View>

          {isEmpty ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <SymbolView
                  name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
                  tintColor={colors.primary}
                  size={34}
                  weight="light"
                />
              </View>
              <Text style={styles.emptyTitle}>{"Girl Math'e hoş geldin"}</Text>
              <Text style={styles.emptyText}>
                İlk parçanı ekle, her giydiğinde maliyetinin nasıl düştüğünü gör.
              </Text>
              <Pressable
                onPress={() => router.push('/add-item')}
                style={({ pressed }) => [styles.emptyButton, pressed && styles.buttonPressed]}>
                <Text style={styles.emptyButtonText}>İlk parçanı ekle</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Ana eylem: bugün ne giydin? */}
              {items.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Bugün ne giydin?</Text>
                  <Text style={styles.cardHint}>Dokun, maliyeti düşsün</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.stripScroll}
                    contentContainerStyle={styles.strip}>
                    {quickWearItems(items, today).map((item) => (
                      <QuickWearButton
                        key={item.id}
                        item={item}
                        wornToday={item.wearDates.includes(today)}
                        onPress={() => toggleWear(item)}
                      />
                    ))}
                    {items.length > QUICK_WEAR_LIMIT && (
                      <Pressable
                        onPress={() => router.push('/wardrobe')}
                        accessibilityLabel="Bütün dolabı aç"
                        style={({ pressed }) => [styles.quick, pressed && styles.quickPressed]}>
                        <View style={styles.quickPhoto}>
                          <SymbolView
                            name="square.grid.2x2"
                            tintColor={colors.textSecondary}
                            size={20}
                            weight="light"
                          />
                        </View>
                        <Text style={styles.quickName}>Tümü →</Text>
                      </Pressable>
                    )}
                  </ScrollView>
                </View>
              )}

              {/* Etkinlik yaklaştıysa (7 gün) tek satır */}
              {nextEvent(items) && (
                <TodayGroup>
                  <EventCountdownCard items={items} />
                </TodayGroup>
              )}

              {/* Girl Math gerçeği: dokununca sıradaki */}
              {isLoaded && (
                <Pressable
                  onPress={nextFact}
                  accessibilityLabel="Sıradaki Girl Math gerçeği"
                  style={({ pressed }) => [styles.card, styles.fact, pressed && styles.pressed]}>
                  <Text style={styles.factLabel}>{fact.label}</Text>
                  <Text style={styles.factValue} numberOfLines={1} adjustsFontSizeToFit>
                    {fact.value.toLocaleString('tr-TR')}
                    {fact.currency && <Text style={styles.factCurrency}> ₺</Text>}
                    {fact.suffix && <Text style={styles.factSuffix}> {fact.suffix}</Text>}
                  </Text>
                  <Text style={styles.factText}>{fact.text}</Text>
                  {/* Sayfa noktaları: kaçıncı gerçek (dokununca sıradakine geçtiği belli olsun) */}
                  <View style={styles.dots}>
                    {facts.map((current) => (
                      <View
                        key={current.label}
                        style={[styles.dot, current === fact && styles.dotActive]}
                      />
                    ))}
                  </View>
                </Pressable>
              )}

              <DailyOutfitCard items={items} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Keşfet</Text>
                <ExploreTiles />
              </View>
            </>
          )}
        </ScrollView>

        {toastView}
      </SafeAreaView>
    </ScreenBackground>
  );
}

// "Bugün ne giydin?" şeridindeki küçük fotoğraf. Bugün giyildiyse pembe çerçeve + köşede ✓
function QuickWearButton({
  item,
  wornToday,
  onPress,
}: {
  item: ClothingItem;
  wornToday: boolean;
  onPress: () => void;
}) {
  const uri = photoUri(item.photoFileName);

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${item.name}: Giydim`}
      style={({ pressed }) => [styles.quick, pressed && styles.quickPressed]}>
      <View style={[styles.quickPhoto, wornToday && styles.quickPhotoWorn]}>
        {uri ? (
          <Image source={{ uri }} style={styles.thumbImage} contentFit="cover" />
        ) : (
          <SymbolView
            name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
            tintColor={colors.primary}
            size={20}
            weight="light"
          />
        )}
        {wornToday && (
          <View style={styles.quickCheck}>
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              tintColor={colors.onPrimary}
              size={12}
              weight="bold"
            />
          </View>
        )}
      </View>
      <Text style={[styles.quickName, wornToday && styles.quickNameWorn]} numberOfLines={1}>
        {item.name}
      </Text>
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
    flex: 1,
    gap: Spacing.one,
  },
  date: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  title: {
    ...Typography.title,
    color: colors.text,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  // Beyaz kart (Bugün ne giydin?, Girl Math gerçeği)
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    ...Shadows.card,
  },
  cardTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  cardHint: {
    ...Typography.caption,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: Spacing.half,
  },
  // Şerit kartın iki kenarına kadar uzansın diye kartın iç boşluğu kadar dışarı taşırılır
  stripScroll: {
    marginHorizontal: -Spacing.three,
    marginTop: Spacing.three,
  },
  strip: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.half,
    gap: Spacing.two + Spacing.one,
  },
  quick: {
    width: 72,
    gap: Spacing.one,
  },
  quickPressed: {
    transform: [{ scale: 0.94 }],
  },
  // Fotoğrafsız parça ve "Tümü" kutusu açık sıcak gri zeminde (beyaz kartın içinde kaybolmasın)
  quickPhoto: {
    width: 72,
    aspectRatio: 3 / 4,
    borderRadius: Radius.md,
    backgroundColor: colors.backgroundElement,
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Bugün giyildi: pembe çerçeve (seçili durum = pembenin kullanıldığı yer)
  quickPhotoWorn: {
    borderColor: colors.primary,
  },
  quickCheck: {
    position: 'absolute',
    right: Spacing.one,
    top: Spacing.one,
    width: 20,
    height: 20,
    borderRadius: Radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  quickName: {
    ...Typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  quickNameWorn: {
    color: colors.primary,
    fontWeight: '700',
  },
  fact: {
    gap: Spacing.one,
  },
  factLabel: {
    ...Typography.caption,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  // Koyu büyük rakam: dergi yazı tipi; ₺ sade yazı tipinde (dergi yazı tipinde "Ł" gibi görünüyor)
  factValue: {
    ...Typography.hero,
    color: colors.text,
  },
  factCurrency: {
    fontFamily: Fonts?.sans,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0,
  },
  factSuffix: {
    fontFamily: Fonts?.sans,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  factText: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: Radius.pill,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 14,
    backgroundColor: colors.text,
  },
  // Bölüm: başlık kartın üstünde (daily-outfit-card.tsx da aynı stili kullanır)
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
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
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.95 }],
  },
  emptyButtonText: {
    ...Typography.button,
    color: colors.onPrimary,
  },
});
