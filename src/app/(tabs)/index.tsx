/**
 * ANA SAYFA
 *
 * Her gün açılan "bugün" ekranı:
 * - Saate göre selamlama ve bugünün tarihi
 * - Pembe "vitrin" kartı: her gün farklı bir Girl Math gerçeği; dokununca sıradakine geçer
 * - "Bugün ne giydin?" hızlı check-in şeridi (ışık düğmesi gibi: dokun ✓, tekrar dokun geri al)
 * - Dolap Tarotu: günün kartı, ince şerit (dokununca döner, dolaptan bir parça önerir)
 * - "Unutulan parça" (Utanç Duvarı'nın ilk hali) ve "Dolabının yıldızı" (en çok giyilen) kartları
 * Dolap boşsa ekleme butonu çıkar. Tüm sayılar getWardrobeStats'tan gelir.
 * İleride: vitrin kartının yerine "Günün kombini" (Onur'un kombin motoru hazır olunca).
 */

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FORGOTTEN_DAYS, formatTL, lossText } from '@/components/clothing-card';
import { ScreenBackground } from '@/components/screen-background';
import { useQuickWear } from '@/components/quick-wear';
import { TarotCard } from '@/components/tarot-card';
import {
  BottomTabInset,
  Colors,
  Fonts,
  Gradients,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { costPerWear, todayString, wearCount } from '@/lib/girl-math';
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

  const star = stats.mostWorn;

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
            <Text style={styles.subtitle}>Bugün hangi kıyafetin kendini amorti edecek?</Text>
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
                      <SymbolView name="sparkles" tintColor={colors.onPrimary} size={36} />
                    </View>
                    <Text style={styles.heroLabel}>{fact.label}</Text>
                    <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
                      {fact.value.toLocaleString('tr-TR')}
                      {fact.currency && <Text style={styles.heroCurrency}> ₺</Text>}
                      {fact.suffix && <Text style={styles.heroSuffix}> {fact.suffix}</Text>}
                    </Text>
                    <Text style={styles.heroText}>{fact.text}</Text>
                    <Text style={styles.heroHint}>Dokun, sıradaki gerçek →</Text>
                  </LinearGradient>
                </Pressable>
              )}

              {items.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Bugün ne giydin?</Text>
                  <Text style={styles.sectionNote}>
                    Dokun, Giydim sayılsın ✨ Tekrar dokunursan geri alınır.
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.stripScroll}
                    contentContainerStyle={styles.strip}>
                    {items.map((item) => (
                      <QuickWearButton
                        key={item.id}
                        item={item}
                        wornToday={item.wearDates.includes(today)}
                        onPress={() => toggleWear(item)}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              {items.length > 0 && <TarotCard items={items} onOpenItem={openItem} />}

              {forgotten && forgottenMessage && (
                <HighlightCard
                  eyebrow="UNUTULAN PARÇA"
                  icon="clock.badge.exclamationmark"
                  item={forgotten.item}
                  message={forgottenMessage}
                  extra={lossText(forgotten.item.price, forgotten.days)}
                  tone="warning"
                  onPress={() => openItem(forgotten.item)}
                />
              )}
              {forgotten && forgottenMessage && (
                <Pressable
                  onPress={() => router.push('/shame-wall')}
                  hitSlop={8}
                  style={styles.wallLink}>
                  <Text style={styles.wallLinkText}>{"Utanç Duvarı'nın tamamı →"}</Text>
                </Pressable>
              )}

              {star && (
                <HighlightCard
                  eyebrow="DOLABININ YILDIZI"
                  icon="star.fill"
                  medal
                  item={star}
                  message={`${wearCount(star)} kere giydin · ${formatTL(costPerWear(star))} /giyim`}
                  onPress={() => openItem(star)}
                />
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
            size={24}
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
      <Text style={styles.quickName} numberOfLines={1}>
        {item.name}
      </Text>
    </Pressable>
  );
}

// Fotoğraflı vurgu kartı: solda küçük fotoğraf, sağda başlık, kıyafet adı ve mesaj
function HighlightCard({
  eyebrow,
  icon,
  item,
  message,
  extra,
  tone = 'default',
  medal = false,
  onPress,
}: {
  eyebrow: string;
  icon?: SFSymbol; // Başlığın yanındaki küçük pembe simge
  item: ClothingItem;
  message: string;
  extra?: string | null; // Mesajın altında pembe vurgulu ek satır (ör. Utanç Duvarı zararı)
  tone?: 'default' | 'warning';
  medal?: boolean; // Fotoğrafın köşesinde gümüş "yıldız madalyası" (ödül rozeti)
  onPress: () => void;
}) {
  const uri = photoUri(item.photoFileName);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.highlight,
        tone === 'warning' && styles.highlightWarning,
        pressed && styles.highlightPressed,
      ]}>
      {/* Fotoğraf + (isteğe bağlı) köşeden taşan gümüş madalya */}
      <View>
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
        {medal && (
          <LinearGradient
            colors={Gradients.chrome}
            locations={[0, 0.35, 0.7, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.medal}>
            <SymbolView name="star.fill" tintColor={colors.primary} size={13} />
          </LinearGradient>
        )}
      </View>
      <View style={styles.highlightBody}>
        <View style={styles.eyebrowRow}>
          {icon && <SymbolView name={icon} tintColor={colors.primary} size={11} />}
          <Text style={styles.eyebrow}>{eyebrow}</Text>
        </View>
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
    gap: Spacing.three,
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
  wallLink: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.two,
  },
  wallLinkText: {
    ...Typography.bodyBold,
    color: colors.primary,
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
    padding: Spacing.four,
    gap: Spacing.one,
    overflow: 'hidden',
  },
  heroSparkle: {
    position: 'absolute',
    right: Spacing.four,
    top: Spacing.four,
    opacity: 0.35,
  },
  heroLabel: {
    ...Typography.label,
    color: colors.primarySoft,
  },
  heroValue: {
    ...Typography.hero,
    fontSize: 44,
    lineHeight: 52,
    color: colors.onPrimary,
  },
  heroCurrency: {
    fontFamily: Fonts?.sans,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0,
  },
  heroSuffix: {
    fontFamily: Fonts?.sans,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
  },
  heroText: {
    ...Typography.bodyBold,
    color: colors.onPrimary,
  },
  heroHint: {
    ...Typography.caption,
    color: colors.primarySoft,
    marginTop: Spacing.two,
  },
  section: {
    gap: Spacing.half,
  },
  sectionTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  sectionNote: {
    ...Typography.caption,
    color: colors.textMuted,
  },
  // Şerit ekranın iki kenarına kadar uzansın diye sayfanın iç boşluğu kadar dışarı taşırılır
  stripScroll: {
    marginHorizontal: -Spacing.four,
  },
  strip: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
    gap: Spacing.three,
  },
  quick: {
    width: 96,
    gap: Spacing.one,
  },
  quickPressed: {
    transform: [{ scale: 0.94 }],
  },
  quickPhoto: {
    width: 96,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickName: {
    ...Typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
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
  highlightWarning: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  highlightPressed: {
    transform: [{ scale: 0.98 }],
  },
  // Gümüş yıldız madalyası: fotoğrafın sağ üst köşesinden biraz dışarı taşar
  medal: {
    position: 'absolute',
    top: -Spacing.two,
    right: -Spacing.two,
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
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
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  eyebrow: {
    ...Typography.label,
    color: colors.primary,
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
