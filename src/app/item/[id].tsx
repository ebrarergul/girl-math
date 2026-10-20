/**
 * KIYAFET DETAY EKRANI
 *
 * Dolaptaki bir karta basınca açılır. Üstte pembe alanda solda bilgi rozetleri,
 * sağda büyük fotoğraf; altında maliyet, kıyas cümlesi, hedef çubuğu ve
 * Starbucks Endeksi. En altta "Giydim" ve "Geri al" butonları.
 * "Giydim"e basınca maliyet rakamı zıplar ve kısa bir kutlama balonu çıkar.
 * Etkinlik için alındıysa (Onur'un events.ts'i): ETKİNLİK satırı ve geri sayım kartı; etkinlik
 * günü maliyet yeşil "0 ₺" (sadece gösterim, Sözleşme Madde 3), fotoğrafta "🆓 Bugün bedava"
 * rozeti ve buton "Bugün bedavaya giy ✨".
 */

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutDown,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { INFINITE_COST, formatTL, itemComparisonText } from '@/components/clothing-card';
import { ColorSwatch } from '@/components/color-picker';
import { dateFromString } from '@/components/event-picker';
import { PlaceSheet } from '@/components/place-sheet';
import { Colors, Fonts, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import type { ColorName } from '@/lib/colors';
import { eventCountdownText, eventLabel, isEventDay } from '@/lib/events';
import { costPerWear, daysSinceLastWear, isPaidOff, wearCount } from '@/lib/girl-math';
import { photoUri } from '@/lib/photos';
import { placeLabel, type PlaceName } from '@/lib/places';
import { starbucksIndexList } from '@/lib/starbucks-index';
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

// Kıyas kartının "yeni cümle" animasyonu: Giydim / geri al ile cümle değişince kart hafif
// küçük ve saydam başlar, biraz büyüyüp ("pıt") yerine oturur
const compareEntering = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 12 }, { scale: 0.94 }] },
  60: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1.03 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
}).duration(450);

// Son giyilme bilgisini insan diliyle yazar
function lastWornText(wears: number, days: number): string {
  if (wears === 0) return 'Hiç giyilmedi';
  if (days === 0) return 'Bugün';
  if (days === 1) return 'Dün';
  return `${days} gün önce`;
}

// Kutlama balonunun ekranda kalma süresi (milisaniye)
const TOAST_DURATION = 2200;

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items, wearItem, undoWear, deleteItem } = useApp();
  const item = items.find((current) => current.id === id);

  // "Giydim"e basınca önce "Nereye gidiyorsun?" penceresi açılır
  const [placeOpen, setPlaceOpen] = useState(false);

  // Kutlama balonu: id her seferinde değişir ki aynı mesaj üst üste gelse de animasyon baştan oynasın
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastCount = useRef(0);
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastCount.current += 1;
    setToast({ id: toastCount.current, text });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION);
  }

  // Maliyet rakamının "zıplama" animasyonu: önce büyür, sonra yaylanarak eski boyuna döner
  const costScale = useSharedValue(1);
  const costAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: costScale.value }],
  }));

  function popCost() {
    costScale.set(withSequence(withTiming(1.3, { duration: 140 }), withSpring(1)));
  }

  const headerOptions = {
    title: '',
    headerBackTitle: 'Dolap',
    headerTintColor: colors.primary,
    headerStyle: { backgroundColor: colors.primarySoft },
    headerShadowVisible: false,
  };

  // Kıyafet silindiyse ya da bulunamadıysa
  if (!item) {
    return (
      <View style={styles.missing}>
        <Stack.Screen options={headerOptions} />
        <Text style={styles.missingText}>Bu parça dolabında yok 🫥</Text>
      </View>
    );
  }

  const wears = wearCount(item);
  // Son giyimin yeri (seçildiyse): "☕ Kahve"
  const lastPlace = item.wearPlaces?.[item.wearDates.length - 1] ?? null;
  const cost = costPerWear(item);
  const paidOff = isPaidOff(item);
  const uri = photoUri(item.photoFileName);
  const progress = Math.min(wears / item.targetWears, 1);
  const remaining = Math.max(item.targetWears - wears, 0);
  const starbucks = starbucksIndexList(item.price).slice(0, 3);
  // Etkinlik: geri sayım cümlesi ve bugün etkinlik günü mü (o gün maliyet 0 ₺ gösterilir)
  const countdown = eventCountdownText(item);
  const eventDay = isEventDay(item);

  // "Giydim": kaydı yap, rakamı zıplat, duruma göre kutlama mesajı göster
  // Pencerede yer seçilince (ya da "Geç" → null) giyim kaydedilir
  function handleWear(place: PlaceName | null) {
    setPlaceOpen(false);
    const newWears = wears + 1;
    const newCost = Math.round(item!.price / newWears);
    wearItem(item!.id, place);
    popCost();

    // Titreşim: hedefe ulaştıysa iPhone'un "başarı" titreşimi, değilse tek bir "tık"
    if (newWears === item!.targetWears) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (newWears === item!.targetWears) {
      showToast('Amorti edildi! Bu parça artık resmen bedava 💅');
    } else if (eventDay) {
      showToast('🎉 Bedavaya harika görünüyorsun! Bugün 0 ₺');
    } else if (newWears === 1) {
      showToast(`İlk giyim! 🎉 Maliyet ∞ → ${formatTL(newCost)} oldu`);
    } else if (cost - newCost > 0) {
      showToast(`${formatTL(cost - newCost)} indirim kazandın 💸`);
    } else {
      showToast(`${newWears}. giyim, harikasın ✨`);
    }
  }

  // Uyarıdaki "Bunun yerine" parçası seçildi: o giyilir, onun sayfası açılır
  function handleWearInstead(other: ClothingItem, place: PlaceName) {
    setPlaceOpen(false);
    wearItem(other.id, place);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: '/item/[id]', params: { id: other.id } });
  }

  function handleUndo() {
    undoWear(item!.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    popCost();
    showToast('Son giyim geri alındı ↩');
  }

  function handleDelete() {
    Alert.alert('Bu parçayı silelim mi?', `"${item!.name}" dolabından kalıcı olarak silinecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          deleteItem(item!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      {/* Sağ üstte paylaş simgesi (Story kartı) ve "Düzenle" (aynı formu dolu açar) */}
      <Stack.Screen
        options={{
          ...headerOptions,
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push({ pathname: '/share', params: { id: item.id } })}
                accessibilityLabel="Paylaş"
                hitSlop={8}>
                <SymbolView
                  name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
                  tintColor={colors.primary}
                  size={20}
                  weight="semibold"
                />
              </Pressable>
              <Pressable
                onPress={() => router.push({ pathname: '/add-item', params: { id: item.id } })}
                hitSlop={8}>
                <Text style={styles.editText}>Düzenle</Text>
              </Pressable>
            </View>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pembe üst alan: solda bilgi rozetleri, sağda büyük fotoğraf */}
        <View style={styles.hero}>
          <View style={styles.facts}>
            <Fact label="Kategori" value={item.category} />
            {item.color && (
              // Paletten ton seçildiyse yuvarlak o tonda, yanında "Bordo tonu"
              <Fact
                label="Renk"
                value={item.colorHex ? `${item.color} tonu` : item.color}
                color={item.color}
                hex={item.colorHex}
              />
            )}
            <Fact label="Giyim" value={`${wears} / ${item.targetWears}`} />
            {/* Son yer ayrı satır değil, son giyimin yanında: "Bugün · 🌙 Gece" (sütun kısa kalsın) */}
            <Fact
              label="Son giyim"
              value={`${lastWornText(wears, daysSinceLastWear(item))}${lastPlace ? ` · ${placeLabel(lastPlace)}` : ''}`}
            />
            {item.event && (
              <Fact
                label="Etkinlik"
                value={`${eventLabel(item.event)} · ${dateFromString(item.event.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}`}
              />
            )}
          </View>
          <View style={styles.photoBox}>
            {uri ? (
              <Image source={{ uri }} style={styles.photo} contentFit="cover" transition={150} />
            ) : (
              <SymbolView
                name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
                tintColor={colors.primary}
                size={64}
                weight="ultraLight"
              />
            )}
            {eventDay && (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>🆓 Bugün bedava</Text>
              </View>
            )}
            {paidOff && (
              <View style={styles.heartBadge}>
                <Text style={styles.heartText}>♥</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{item.name}</Text>
            {eventDay ? (
              // Etkinlik günü: parası çoktan ödendi, bugün 0 ₺ (üstü çizili normal maliyet)
              <View style={styles.priceBox}>
                <Text style={styles.oldPrice}>{wears === 0 ? INFINITE_COST : formatTL(cost)}</Text>
                <Animated.Text style={[styles.cost, styles.costFree, costAnimatedStyle]}>
                  0<Text style={styles.costCurrency}> ₺</Text>
                </Animated.Text>
                <Text style={styles.perWear}>bugün, etkinlik günü 🆓</Text>
              </View>
            ) : (
              <View style={styles.priceBox}>
                {cost < item.price && <Text style={styles.oldPrice}>{formatTL(item.price)}</Text>}
                {/* Rakam dergi yazı tipinde; ₺ sade yazı tipinde (dergi yazı tipinde "Ł" gibi görünüyor).
                  Hiç giyilmediyse ∞ (sonsuz) */}
                <Animated.Text style={[styles.cost, costAnimatedStyle]}>
                  {wears === 0 ? INFINITE_COST : cost.toLocaleString('tr-TR')}
                  {wears > 0 && <Text style={styles.costCurrency}> ₺</Text>}
                </Animated.Text>
                <Text style={styles.perWear}>giyim başına</Text>
              </View>
            )}
          </View>

          {/* Kıyas cümlesi: sayfanın yıldızı (büyük, kalın, beyaz kart). Giyim sayısı değişince
              key değişir, kart yeniden doğar ve compareEntering animasyonu oynar */}
          <Animated.View
            key={`compare-${wears}`}
            entering={compareEntering}
            style={styles.compareCard}>
            <Text style={styles.compareText}>
              {itemComparisonText(item) ??
                'Giymediğin sürece maliyeti sonsuz 😱 İlk "Giydim" ile düşmeye başlasın!'}
            </Text>
          </Animated.View>

          {/* Etkinlik geri sayımı (Onur'un cümlesi): küçük sade satır; etkinlik günü yeşil */}
          {countdown && (
            <View style={styles.eventRow}>
              <View style={styles.eventIcon}>
                <SymbolView
                  name={eventDay ? 'gift' : 'calendar'}
                  tintColor={eventDay ? colors.success : colors.primary}
                  size={16}
                />
              </View>
              <Text style={[styles.eventText, eventDay && styles.eventTextToday]}>{countdown}</Text>
            </View>
          )}


          {/* Kombin önerisi ekranı (Onur'un kombin motoru) */}
          <Pressable
            onPress={() => router.push({ pathname: '/outfit/[id]', params: { id: item.id } })}
            style={({ pressed }) => [styles.outfitCard, pressed && styles.outfitCardPressed]}>
            <View style={styles.outfitIcon}>
              <SymbolView
                name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                tintColor={colors.primary}
                size={18}
              />
            </View>
            <View style={styles.outfitBody}>
              <Text style={styles.outfitTitle}>Bununla ne giyerim?</Text>
              <Text style={styles.outfitText}>Dolabından kombin önerisi</Text>
            </View>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              tintColor={colors.textMuted}
              size={13}
            />
          </Pressable>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Hedef</Text>
              <Text style={styles.sectionNote}>
                {paidOff ? 'Amorti edildi ♥' : `${remaining} giyim kaldı`}
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>

          {starbucks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Starbucks Endeksi</Text>
              <Text style={styles.sectionNote}>Bu parçanın fiyatı şuna eşit:</Text>
              <View style={styles.indexCard}>
                {starbucks.map((entry) => (
                  <View key={entry.comparison.name} style={styles.indexRow}>
                    <Text style={styles.indexEmoji}>{entry.comparison.emoji}</Text>
                    <Text style={styles.indexName}>{entry.comparison.name}</Text>
                    <Text style={styles.indexCount}>× {entry.count}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* En altta küçük not: ne zaman eklendi (üstteki bilgi sütunu kısa kalsın diye burada) */}
          <View style={styles.bottomInfo}>
            <Text style={styles.addedText}>
              {item.createdAt.split('-').reverse().join('.')} tarihinde eklendi
            </Text>
            <Pressable onPress={handleDelete} style={styles.deleteButton}>
              <Text style={styles.deleteText}>Bu parçayı sil</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Kutlama balonu: butonların hemen üstünde aşağıdan kayarak belirir */}
      {toast && (
        <View style={styles.toastWrap} pointerEvents="none">
          <Animated.View
            key={toast.id}
            entering={FadeInDown.springify()}
            exiting={FadeOutDown}
            style={styles.toast}>
            <Text style={styles.toastText}>{toast.text}</Text>
          </Animated.View>
        </View>
      )}

      <View style={styles.footer}>
        {wears > 0 && (
          <Pressable
            onPress={handleUndo}
            accessibilityLabel="Son giyimi geri al"
            style={({ pressed }) => [styles.undoButton, pressed && styles.undoPressed]}>
            <SymbolView
              name={{ ios: 'arrow.uturn.backward', android: 'undo', web: 'undo' }}
              tintColor={colors.primary}
              size={20}
              weight="bold"
            />
          </Pressable>
        )}
        <Pressable
          onPress={() => setPlaceOpen(true)}
          style={({ pressed }) => [styles.wearButton, pressed && styles.wearPressed]}>
          <Text style={styles.wearText}>{eventDay ? 'Bugün bedavaya giy ✨' : 'Giydim ✨'}</Text>
        </Pressable>
      </View>
      <PlaceSheet
        visible={placeOpen}
        item={item}
        items={items}
        onSelect={handleWear}
        onWearInstead={handleWearInstead}
        onNewOutfit={() => {
          setPlaceOpen(false);
          router.push({ pathname: '/outfit/[id]', params: { id: item.id } });
        }}
        onClose={() => setPlaceOpen(false)}
      />
    </SafeAreaView>
  );
}

// Pembe alandaki küçük bilgi satırı (etiket + değer)
// color verilirse değerin solunda küçük renk yuvarlağı çıkar (RENK satırı)
function Fact({
  label,
  value,
  color,
  hex,
}: {
  label: string;
  value: string;
  color?: ColorName;
  hex?: string;
}) {
  return (
    <View style={styles.fact}>
      {/* Türkçe kurala göre büyük harf: "Giyim" → "GİYİM" */}
      <Text style={styles.factLabel}>{label.toLocaleUpperCase('tr')}</Text>
      <View style={styles.factValueRow}>
        {color && <ColorSwatch color={color} hex={hex} size={14} />}
        <Text style={styles.factValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: Spacing.four,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingLeft: Spacing.two,
  },
  editText: {
    ...Typography.bodyBold,
    fontSize: 16,
    color: colors.primary,
    paddingHorizontal: Spacing.two,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  missingText: {
    ...Typography.heading,
    color: colors.textSecondary,
  },
  hero: {
    flexDirection: 'row',
    backgroundColor: colors.primarySoft,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  facts: {
    flex: 1,
    justifyContent: 'space-around',
    gap: Spacing.three,
  },
  fact: {
    gap: Spacing.half,
  },
  factLabel: {
    ...Typography.label,
    color: colors.textSecondary,
  },
  factValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
  },
  factValue: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  photoBox: {
    width: '58%',
    aspectRatio: 3 / 4,
    borderRadius: Radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Shadows.card,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  heartBadge: {
    position: 'absolute',
    right: Spacing.two,
    top: Spacing.two,
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartText: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.highlight,
  },
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  name: {
    ...Typography.title,
    color: colors.text,
    flex: 1,
  },
  priceBox: {
    alignItems: 'flex-end',
  },
  oldPrice: {
    ...Typography.priceStrike,
    color: colors.textMuted,
  },
  cost: {
    ...Typography.hero,
    color: colors.primary,
  },
  costCurrency: {
    fontFamily: Fonts?.sans,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0,
  },
  perWear: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  // Etkinlik günü: maliyet yeşil 0 ₺
  costFree: {
    color: colors.success,
  },
  freeBadge: {
    position: 'absolute',
    left: Spacing.two,
    top: Spacing.two,
    backgroundColor: colors.success,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  freeBadgeText: {
    ...Typography.caption,
    color: colors.onPrimary,
    fontWeight: '800',
  },
  // Kıyas cümlesi: beyaz kart, büyük kalın yazı (Girl Math'in asıl "anı")
  compareCard: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    ...Shadows.card,
  },
  compareText: {
    ...Typography.heading,
    color: colors.text,
  },
  // Etkinlik geri sayımı: çerçevesiz küçük satır (simge + yazı)
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  eventIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventText: {
    ...Typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  eventTextToday: {
    color: colors.success,
    fontWeight: '700',
  },
  // "Bununla ne giyerim?" satırı (Cüzdan'daki satırlarla aynı: beyaz, çerçevesiz, gri ok)
  outfitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    ...Shadows.card,
  },
  outfitCardPressed: {
    opacity: 0.7,
  },
  outfitIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outfitBody: {
    flex: 1,
    gap: Spacing.half,
  },
  outfitTitle: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  outfitText: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  section: {
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  sectionNote: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  track: {
    height: 10,
    borderRadius: Radius.pill,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: colors.primary,
  },
  indexCard: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    ...Shadows.card,
  },
  indexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  indexEmoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  indexName: {
    ...Typography.body,
    color: colors.text,
    flex: 1,
  },
  indexCount: {
    ...Typography.price,
    color: colors.primary,
  },
  bottomInfo: {
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  addedText: {
    ...Typography.caption,
    color: colors.textMuted,
  },
  deleteButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.two,
  },
  deleteText: {
    ...Typography.bodyBold,
    color: colors.danger,
  },
  toastWrap: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  toast: {
    backgroundColor: colors.text,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    ...Shadows.card,
  },
  toastText: {
    ...Typography.bodyBold,
    color: colors.card,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  undoButton: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoPressed: {
    backgroundColor: colors.primarySoft,
  },
  wearButton: {
    flex: 1,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  wearPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  wearText: {
    ...Typography.heading,
    color: colors.onPrimary,
  },
});
