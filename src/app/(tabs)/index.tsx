/**
 * ANA SAYFA
 *
 * Her gün açılan "bugün" ekranı:
 * - Saate göre selamlama ve bugünün tarihi
 * - Pembe "vitrin" kartı (sayfanın tek pembe vurgusu): her gün farklı bir Girl Math gerçeği;
 *   dokununca sıradakine geçer, altta kaçıncı gerçek olduğunu gösteren noktalar
 * - "Bugün ne giydin?" hızlı check-in şeridi (ışık düğmesi gibi: dokun ✓, tekrar dokun geri al).
 *   Bütün dolap değil, en fazla QUICK_WEAR_LIMIT parça (quickWearItems) + sonda "Tümü →" (Dolap)
 * - "Günün kombini": unutulan bir parçanın etrafında kombin (dokununca "Bununla ne giyerim?")
 * - "Senin için": tek beyaz kartta satırlar (today-row.tsx): etkinlik geri sayımı (7 gün kala),
 *   burç (gümüş madalyon + şanslı renk), Dolap Kahoot'u (sadece hafta sonu)
 * - "Unutulan parça" (başlığın sağında "Utanç Duvarı →")
 * Bütün bölüm başlıkları kartın üstünde, aynı stilde (sectionTitle); kartların içinde etiket yok.
 * "Dolabının yıldızı" kaldırıldı: Analizlerin → Aylık özet'te "Ayın yıldızı" olarak var.
 * Dolap boşsa ekleme butonu çıkar. Tüm sayılar getWardrobeStats'tan gelir.
 */

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FORGOTTEN_DAYS, lossText } from '@/components/clothing-card';
import { ScreenBackground } from '@/components/screen-background';
import { useQuickWear } from '@/components/quick-wear';
import { DailyOutfitCard } from '@/components/daily-outfit-card';
import { EventCountdownCard } from '@/components/event-countdown-card';
import { stringFromDate } from '@/components/event-picker';
import { HoroscopeStrip } from '@/components/horoscope-strip';
import { KahootCard } from '@/components/kahoot-card';
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
import { todayString, wearCount } from '@/lib/girl-math';
import { photoUri } from '@/lib/photos';
import { starbucksIndexText } from '@/lib/starbucks-index';
import { getWardrobeStats, type WardrobeStats } from '@/lib/stats';
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

// Saate göre selamlama
function greeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Günaydın aşko ☀️';
  if (hour >= 12 && hour < 18) return 'Merhaba aşko 🎀';
  return 'İyi akşamlar aşko 🌙';
}

// Bugünün tarihi, Türkçe büyük harfle: "14 EKİM SALI"
function todayLabel(): string {
  return new Date()
    .toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })
    .replace(',', '')
    .toLocaleUpperCase('tr');
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

// Yılın kaçıncı günü (vitrin kartı her gün başka bir gerçekle başlasın diye)
function dayOfYear(): number {
  const now = new Date();
  return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
}

// Vitrin kartındaki bir "Girl Math gerçeği"
type Fact = { label: string; value: number; currency: boolean; suffix?: string; text: string };

function buildFacts(stats: WardrobeStats): Fact[] {
  const facts: Fact[] = [
    {
      label: 'BU AY',
      value: stats.wearsThisMonth,
      currency: false,
      suffix: 'kere giydin ✨',
      text:
        stats.wearsThisMonth > 0
          ? 'Her "Giydim" maliyeti biraz daha eritiyor. Devam aşko!'
          : 'Bu ay ilk "Giydim" seni bekliyor. Aşağıdan bir parçaya dokun!',
    },
    {
      label: 'GIRL MATH KAZANCIN',
      value: stats.girlMathSavings,
      currency: true,
      text: 'Giydikçe kazandığın. Bankan bunu tanımıyor ama biz tanıyoruz 💅',
    },
    {
      label: 'DOLABIN',
      value: stats.totalValue,
      currency: true,
      text: `Dolabın ${starbucksIndexText(stats.totalValue)}`,
    },
  ];
  if (stats.averageCostPerWear !== null) {
    facts.push({
      label: 'ORTALAMA GİYİM MALİYETİN',
      value: stats.averageCostPerWear,
      currency: true,
      text: 'Dolabındaki bir parçayı bir kere giymek sana ortalama bu kadara geliyor.',
    });
  }
  if (stats.paidOffCount > 0) {
    facts.push({
      label: 'RESMEN BEDAVA',
      value: stats.paidOffCount,
      currency: false,
      suffix: 'parça ♥',
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

  // Vitrin kartı: her gün farklı gerçekle başlar, dokundukça sıradakine geçer
  const facts = buildFacts(stats);
  const [factOffset, setFactOffset] = useState(0);
  const fact = facts[(dayOfYear() + factOffset) % facts.length];

  function nextFact() {
    Haptics.selectionAsync();
    setFactOffset((current) => current + 1);
  }

  // Hızlı Giydim (ortak): dokun ✓, tekrar dokun geri al; balonda "Geri al"
  const { toggleWear, toastView } = useQuickWear();

  function openItem(item: ClothingItem) {
    router.push({ pathname: '/item/[id]', params: { id: item.id } });
  }

  // Unutulan parça uyarısı: hiç giyilmediyse ya da uzun süredir giyilmediyse gösterilir.
  // Mesajlarda kıyafet adı tırnak içinde özne olur, Türkçe ek gerekmez.
  const forgotten = stats.forgotten;
  let forgottenMessage: string | null = null;
  if (forgotten) {
    const name = `“${forgotten.item.name}”`;
    if (wearCount(forgotten.item) === 0) {
      forgottenMessage = `${name} daha hiç giyilmedi 👀 Giymeye başla, maliyeti düşsün!`;
    } else if (forgotten.days >= FORGOTTEN_DAYS) {
      forgottenMessage = `${name} ${forgotten.days} gündür askıda 👀 Ya bu hafta giy ya da satışa koy!`;
    }
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            {/* Sağ üstte Ayarlar */}
            <Pressable
              onPress={() => router.push('/settings')}
              accessibilityLabel="Ayarlar"
              hitSlop={8}
              style={({ pressed }) => [styles.settingsButton, pressed && styles.heroPressed]}>
              <SymbolView name="gearshape.fill" tintColor={colors.primary} size={20} />
            </Pressable>
            <Text style={styles.label}>{todayLabel()}</Text>
            <Text style={styles.title}>{greeting()}</Text>
            <Text style={styles.subtitle}>Bugün ne giysen kâr? 💅</Text>
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
              {/* Vitrin kartı: dokununca sıradaki Girl Math gerçeği */}
              {isLoaded && (
                <Pressable
                  onPress={nextFact}
                  accessibilityLabel="Sıradaki Girl Math gerçeği"
                  style={({ pressed }) => [styles.heroWrap, pressed && styles.heroPressed]}>
                  <LinearGradient
                    colors={[colors.primaryPressed, colors.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}>
                    <View style={styles.heroSparkle}>
                      <SymbolView name="sparkles" tintColor={colors.onPrimary} size={24} />
                    </View>
                    <Text style={styles.heroLabel}>{fact.label}</Text>
                    <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
                      {fact.value.toLocaleString('tr-TR')}
                      {fact.currency && <Text style={styles.heroCurrency}> ₺</Text>}
                      {fact.suffix && <Text style={styles.heroSuffix}> {fact.suffix}</Text>}
                    </Text>
                    <Text style={styles.heroText}>{fact.text}</Text>
                    {/* Sayfa noktaları: kaçıncı gerçek (dokununca sıradakine geçtiği belli olsun) */}
                    <View style={styles.heroDots}>
                      {facts.map((current) => (
                        <View
                          key={current.label}
                          style={[styles.heroDot, current === fact && styles.heroDotActive]}
                        />
                      ))}
                    </View>
                  </LinearGradient>
                </Pressable>
              )}

              {items.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Bugün ne giydin?</Text>
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
                        <View style={[styles.quickPhoto, styles.quickAll]}>
                          <SymbolView
                            name="square.grid.2x2"
                            tintColor={colors.primary}
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

              <DailyOutfitCard items={items} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Senin için</Text>
                <TodayGroup>
                  <EventCountdownCard items={items} />
                  <HoroscopeStrip />
                  <KahootCard />
                </TodayGroup>
              </View>

              {forgotten && forgottenMessage && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Unutulan parça</Text>
                    <Pressable onPress={() => router.push('/shame-wall')} hitSlop={8}>
                      <Text style={styles.sectionLink}>{'Utanç Duvarı →'}</Text>
                    </Pressable>
                  </View>
                  <HighlightCard
                    item={forgotten.item}
                    message={forgottenMessage}
                    extra={lossText(forgotten.item.price, forgotten.days)}
                    onPress={() => openItem(forgotten.item)}
                  />
                </View>
              )}

            </>
          )}
        </ScrollView>

        {toastView}
      </SafeAreaView>
    </ScreenBackground>
  );
}

// "Bugün ne giydin?" şeridindeki küçük fotoğraf. Bugün giyildiyse köşede pembe ✓ çıkar
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

// Fotoğraflı vurgu kartı: solda küçük fotoğraf, sağda kıyafet adı ve mesaj (başlık kartın üstünde)
function HighlightCard({
  item,
  message,
  extra,
  onPress,
}: {
  item: ClothingItem;
  message: string;
  extra?: string | null; // Mesajın altında pembe vurgulu ek satır (ör. Utanç Duvarı zararı)
  onPress: () => void;
}) {
  const uri = photoUri(item.photoFileName);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.highlight, pressed && styles.highlightPressed]}>
      <View style={styles.thumb}>
        {uri ? (
          <Image source={{ uri }} style={styles.thumbImage} contentFit="cover" />
        ) : (
          <SymbolView
            name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
            tintColor={colors.primary}
            size={24}
            weight="light"
          />
        )}
      </View>
      <View style={styles.highlightBody}>
        <Text style={styles.highlightName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.highlightMessage}>{message}</Text>
        {extra && <Text style={styles.highlightExtra}>{extra}</Text>}
      </View>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        tintColor={colors.textMuted}
        size={14}
      />
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
    gap: Spacing.four,
  },
  header: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    paddingRight: Spacing.six - Spacing.two, // sağdaki ⚙️ butonuna yer: yazı onun altına girmesin
    gap: Spacing.one,
  },
  settingsButton: {
    position: 'absolute',
    right: 0,
    top: Spacing.three,
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    ...Shadows.card,
  },
  label: {
    ...Typography.label,
    color: colors.primary,
  },
  title: {
    ...Typography.title,
    color: colors.text,
  },
  subtitle: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  heroWrap: {
    borderRadius: Radius.xl,
    ...Shadows.button,
  },
  heroPressed: {
    transform: [{ scale: 0.98 }],
  },
  hero: {
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.one,
    overflow: 'hidden',
  },
  heroSparkle: {
    position: 'absolute',
    right: Spacing.three,
    top: Spacing.three,
    opacity: 0.3,
  },
  heroLabel: {
    ...Typography.label,
    color: colors.primarySoft,
  },
  heroValue: {
    ...Typography.hero,
    color: colors.onPrimary,
  },
  heroCurrency: {
    fontFamily: Fonts?.sans,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0,
  },
  heroSuffix: {
    fontFamily: Fonts?.sans,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0,
  },
  heroText: {
    ...Typography.body,
    color: colors.onPrimary,
  },
  heroDots: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  heroDot: {
    width: 5,
    height: 5,
    borderRadius: Radius.pill,
    backgroundColor: colors.onPrimary,
    opacity: 0.35,
  },
  heroDotActive: {
    width: 14,
    opacity: 1,
  },
  // Bölüm: başlık kartın üstünde (daily-outfit-card.tsx da aynı stili kullanır)
  section: {
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  sectionLink: {
    ...Typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  // Şerit ekranın iki kenarına kadar uzansın diye sayfanın iç boşluğu kadar dışarı taşırılır
  stripScroll: {
    marginHorizontal: -Spacing.four,
  },
  strip: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.half,
    paddingBottom: Spacing.one,
    gap: Spacing.three,
  },
  quick: {
    width: 72,
    gap: Spacing.one,
  },
  quickPressed: {
    transform: [{ scale: 0.94 }],
  },
  quickPhoto: {
    width: 72,
    aspectRatio: 3 / 4,
    borderRadius: Radius.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Shadows.card,
  },
  // Giyildiyse çerçeve açık pembe: asıl işaret köşedeki ✓, şerit fazla "dolu" görünmesin
  quickPhotoWorn: {
    borderColor: colors.accent,
  },
  // "Tümü →" kutusu: fotoğraf kutusuyla aynı boy, beyaz
  quickAll: {
    backgroundColor: colors.card,
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
  quickName: {
    ...Typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  quickNameWorn: {
    color: colors.primary,
    fontWeight: '700',
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    ...Shadows.card,
  },
  highlightPressed: {
    transform: [{ scale: 0.98 }],
  },
  thumb: {
    width: 64,
    aspectRatio: 3 / 4,
    borderRadius: Radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  highlightBody: {
    flex: 1,
    gap: Spacing.half,
  },
  highlightName: {
    ...Typography.heading,
    color: colors.text,
  },
  highlightExtra: {
    ...Typography.bodyBold,
    color: colors.primary,
    marginTop: Spacing.one,
  },
  highlightMessage: {
    ...Typography.body,
    color: colors.textSecondary,
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
