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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BlushCard } from '@/components/blush-card';
import { FORGOTTEN_DAYS, formatTL } from '@/components/clothing-card';
import { CoachMark, useCoachMarks } from '@/components/coach-mark';
import { DailyOutfitCard, dailyOutfit } from '@/components/daily-outfit-card';
import { EmptyHome } from '@/components/empty-home';
import { EventCountdownCard, nextEvent } from '@/components/event-countdown-card';
import { stringFromDate } from '@/components/event-picker';
import { ExploreTiles } from '@/components/explore-tiles';
import { isOutfitWornToday, useQuickWear } from '@/components/quick-wear';
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
import { useCountUp } from '@/hooks/use-count-up';
import { costPerWear, todayString, wearCount } from '@/lib/girl-math';
import { outfitItems, outfitName, sortOutfits } from '@/lib/outfits';
import { photoUri } from '@/lib/photos';
import { getWardrobeStats, type WardrobeStats } from '@/lib/stats';
import type { ClothingItem, SavedOutfit } from '@/lib/types';

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
const QUICK_OUTFIT_LIMIT = 6;
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

// Ana sayfadaki Girl Math kartı: sadece Cüzdan'da OLMAYAN gerçekler (26 Kasım, "aynı bilgi iki yerde
// olmasın": bu ay giyim, dolap değeri, ortalama maliyet, amorti ve resmen bedava Cüzdan'da var)
// - Dolabının yıldızı: en çok giyilen parça
// - En uzun süredir askıda: FORGOTTEN_DAYS (7) gün ve üstü giyilmeyen parça
function buildFacts(stats: WardrobeStats): Fact[] {
  const facts: Fact[] = [];
  if (stats.mostWorn) {
    const star = stats.mostWorn;
    facts.push({
      label: 'Dolabının yıldızı',
      value: wearCount(star),
      currency: false,
      suffix: 'kere giydin',
      text: `“${star.name}” en çok giydiğin parça. Giyim başı maliyeti artık ${formatTL(costPerWear(star))} 💅`,
    });
  }
  if (stats.forgotten && stats.forgotten.days >= FORGOTTEN_DAYS) {
    facts.push({
      label: 'En uzun süredir askıda',
      value: stats.forgotten.days,
      currency: false,
      suffix: 'gün',
      text: `“${stats.forgotten.item.name}” seni bekliyor. Bu hafta bir şans ver 👀`,
    });
  }
  return facts;
}

export default function HomeScreen() {
  const router = useRouter();
  const { items, outfits, isLoaded } = useApp();
  // "Kombinlerin" sırası: favoriler önce, en fazla 6 (tek dokunuşla bütün kombini giy)
  // (parçası işaretlenmemiş fotoğraflı kombin çıkmaz: giyince sayılacak parça yok)
  const quickOutfits = sortOutfits(outfits)
    .filter((outfit) => outfitItems(outfit, items).length > 0)
    .slice(0, QUICK_OUTFIT_LIMIT);
  const stats = getWardrobeStats(items);
  const isEmpty = isLoaded && items.length === 0;
  const today = todayString();

  // Gerçek kartı: her gün farklı gerçekle başlar, dokundukça sıradakine geçer
  const facts = buildFacts(stats);
  const [factOffset, setFactOffset] = useState(0);
  const fact = facts.length > 0 ? facts[(dayOfYear() + factOffset) % facts.length] : null;

  function nextFact() {
    Haptics.selectionAsync();
    setFactOffset((current) => current + 1);
  }

  // Hızlı Giydim (ortak): dokun ✓, tekrar dokun geri al; balonda "Geri al"
  const { toggleWear, toggleOutfit, toastView } = useQuickWear();

  // Kartta aynı anda tek sıra: kayıtlı kombin varsa "Kombin" ile açılır, "Parça"ya geçilebilir
  const [wearMode, setWearMode] = useState<'outfits' | 'items'>('outfits');
  const showOutfits = quickOutfits.length > 0 && wearMode === 'outfits';

  // Tanıtım okları (birer kez, sırayla): Giydim şeridi → Girl Math gerçeği → Keşfet
  // "home-fact" sadece birden fazla gerçek varken (dokununca sıradakine geçtiği için)
  const coach = useCoachMarks(
    ['home-wear', ...(facts.length > 1 ? ['home-fact'] : []), 'home-explore'],
    items.length > 0,
  );

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
            <EmptyHome onAdd={() => router.push('/add-item')} />
          ) : (
            <>
              {/* Ana eylem: bugün ne giydin? */}
              {items.length > 0 && (
                <Animated.View entering={FadeInDown.duration(450)}>
                  {/* Toz pembe yansıma: sol üstten pembe, beyaza açılır */}
                  <BlushCard>
                    <View style={styles.wearHeader}>
                      <View style={styles.wearHeaderText}>
                        <Text style={styles.cardTitle}>Bugün ne giydin?</Text>
                        <Text style={styles.cardHint}>
                          {showOutfits ? 'Dokun, bütün kombin sayılsın' : 'Dokun, maliyeti düşsün'}
                        </Text>
                      </View>
                      {/* Kombin | Parça seçici (sadece kayıtlı kombin varsa) */}
                      {quickOutfits.length > 0 && (
                        <View style={styles.modeSwitch}>
                          {(
                            [
                              ['outfits', 'Kombin'],
                              ['items', 'Parça'],
                            ] as const
                          ).map(([mode, label]) => (
                            <Pressable
                              key={mode}
                              onPress={() => {
                                if (mode !== wearMode) {
                                  Haptics.selectionAsync();
                                  setWearMode(mode);
                                }
                              }}
                              style={[styles.modeItem, wearMode === mode && styles.modeItemOn]}>
                              <Text style={[styles.modeText, wearMode === mode && styles.modeTextOn]}>
                                {label}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Ok balonu şeridin üstünde (kaydırılan şeridin içinde kesilirdi) */}
                    <CoachMark
                      visible={coach.active === 'home-wear'}
                      text={
                        showOutfits
                          ? 'Bugün giydiğin kombine dokun, bütün parçalar sayılsın'
                          : 'Bugün giydiysen fotoğrafına dokun'
                      }
                      align="left"
                      arrowOffset={showOutfits ? 52 : 36}
                      onDismiss={() => coach.done('home-wear')}>
                      {showOutfits ? (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.stripScroll}
                          contentContainerStyle={styles.strip}>
                          {quickOutfits.map((outfit) => (
                            <OutfitQuickButton
                              key={outfit.id}
                              outfit={outfit}
                              items={items}
                              onPress={() => {
                                coach.done('home-wear');
                                toggleOutfit(outfit);
                              }}
                            />
                          ))}
                        </ScrollView>
                      ) : (
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
                              onPress={() => {
                                coach.done('home-wear');
                                toggleWear(item);
                              }}
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
                      )}
                    </CoachMark>
                  </BlushCard>
                </Animated.View>
              )}

              {/* Etkinlik yaklaştıysa (7 gün) tek satır */}
              {nextEvent(items) && (
                <Animated.View entering={FadeInDown.duration(450).delay(60)}>
                  <TodayGroup>
                    <EventCountdownCard items={items} />
                  </TodayGroup>
                </Animated.View>
              )}

              {/* Girl Math gerçeği: dokununca sıradaki */}
              {isLoaded && fact && (
                <Animated.View entering={FadeInDown.duration(450).delay(120)}>
                  <CoachMark
                    visible={coach.active === 'home-fact'}
                    text="Dokun, sıradaki Girl Math gerçeği gelsin"
                    onDismiss={() => coach.done('home-fact')}>
                    <BlushCard
                      // Tek gerçek varsa dokunulmaz (sıradaki yok)
                      onPress={
                        facts.length > 1
                          ? () => {
                              coach.done('home-fact');
                              nextFact();
                            }
                          : undefined
                      }
                      accessibilityLabel="Sıradaki Girl Math gerçeği"
                      style={styles.fact}>
                      <Text style={styles.factLabel}>{fact.label}</Text>
                      <Text style={styles.factValue} numberOfLines={1} adjustsFontSizeToFit>
                        {/* key: her yeni gerçekte rakam yeniden 0'dan sayar */}
                        <CountUpNumber key={fact.label} value={fact.value} />
                        {fact.currency && <Text style={styles.factCurrency}> ₺</Text>}
                        {fact.suffix && <Text style={styles.factSuffix}> {fact.suffix}</Text>}
                      </Text>
                      <Text style={styles.factText}>{fact.text}</Text>
                      {/* Sayfa noktaları: kaçıncı gerçek (dokununca sıradakine geçtiği belli olsun) */}
                      {facts.length > 1 && (
                        <View style={styles.dots}>
                          {facts.map((current) => (
                            <View
                              key={current.label}
                              style={[styles.dot, current === fact && styles.dotActive]}
                            />
                          ))}
                        </View>
                      )}
                    </BlushCard>
                  </CoachMark>
                </Animated.View>
              )}

              {/* Kombin çıkmıyorsa (dolap çok küçük) boş kutu bırakıp fazladan boşluk yapmasın */}
              {dailyOutfit(items) && (
                <Animated.View entering={FadeInDown.duration(450).delay(180)}>
                  <DailyOutfitCard items={items} />
                </Animated.View>
              )}

              <Animated.View entering={FadeInDown.duration(450).delay(240)}>
                <CoachMark
                  visible={coach.active === 'home-explore'}
                  text="Burç yorumun ve hafta sonu Quiz burada"
                  onDismiss={() => coach.done('home-explore')}
                  style={styles.section}>
                  <Text style={styles.sectionTitle}>Keşfet</Text>
                  <ExploreTiles onOpen={() => coach.done('home-explore')} />
                </CoachMark>
              </Animated.View>
            </>
          )}
        </ScrollView>

        {toastView}
      </SafeAreaView>
    </ScreenBackground>
  );
}

// Girl Math gerçeğindeki büyük rakam: 0'dan sayarak yükselir (Text içinde Text)
function CountUpNumber({ value }: { value: number }) {
  return <Text>{useCountUp(value).toLocaleString('tr-TR')}</Text>;
}

// "Kombinlerin" sırasındaki kombin: 2×2 küçük fotoğraf mozaiği + ad. Bugün giyildiyse pembe çerçeve + ✓
function OutfitQuickButton({
  outfit,
  items,
  onPress,
}: {
  outfit: SavedOutfit;
  items: ClothingItem[];
  onPress: () => void;
}) {
  const pieces = outfitItems(outfit, items).slice(0, 4);
  const worn = isOutfitWornToday(outfit, items);
  const name = outfitName(outfit, items);
  const outfitPhoto = photoUri(outfit.photoFileName ?? null); // Fotoğraflı kombin: mozaik yerine fotoğraf

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${name}: bu kombini giydim`}
      style={({ pressed }) => [styles.outfitQuick, pressed && styles.quickPressed]}>
      <View style={[styles.outfitMosaic, worn && styles.quickPhotoWorn]}>
        {outfitPhoto && <Image source={{ uri: outfitPhoto }} style={styles.thumbImage} contentFit="cover" />}
        {!outfitPhoto && pieces.map((piece, index) => {
          const uri = photoUri(piece.photoFileName);
          return (
            <View
              key={piece.id}
              style={[
                styles.outfitCell,
                pieces.length <= 2 && styles.outfitCellTall,
                // 3 parçada boş kare kalmasın: üçüncü alt satırı boydan boya kaplar
                pieces.length === 3 && index === 2 && styles.outfitCellWide,
                pieces.length === 1 && styles.outfitCellWide,
              ]}>
              {uri ? (
                <Image source={{ uri }} style={styles.thumbImage} contentFit="cover" />
              ) : (
                <SymbolView
                  name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
                  tintColor={colors.primary}
                  size={14}
                  weight="light"
                />
              )}
            </View>
          );
        })}
        {worn && (
          <View style={styles.quickCheck}>
            <SymbolView name="checkmark" tintColor={colors.onPrimary} size={11} weight="bold" />
          </View>
        )}
      </View>
      <Text style={[styles.quickName, worn && styles.quickNameWorn]} numberOfLines={1}>
        {name}
      </Text>
    </Pressable>
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
  // "İyi akşamlar aşko": pembe (26 Kasım, Ebrar)
  title: {
    ...Typography.title,
    color: colors.primary,
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
  wearHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  wearHeaderText: {
    flex: 1,
  },
  // Kombin | Parça seçici: yarı saydam beyaz zemin, seçili taraf beyaz + gölge
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.glass,
    borderRadius: Radius.pill,
    padding: Spacing.half,
  },
  modeItem: {
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  modeItemOn: {
    backgroundColor: colors.card,
    ...Shadows.card,
  },
  modeText: {
    ...Typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeTextOn: {
    color: colors.primary,
  },
  outfitQuick: {
    width: 104,
    gap: Spacing.one,
  },
  // 2×2 mozaik (2 parçada yan yana iki uzun kutu)
  outfitMosaic: {
    width: 104,
    height: 96,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.card,
  },
  outfitCell: {
    width: 49,
    height: 45,
    backgroundColor: colors.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  outfitCellTall: {
    height: 92,
  },
  outfitCellWide: {
    width: 100,
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
});
