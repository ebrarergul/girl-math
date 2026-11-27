/**
 * PAYLAŞILABİLİR KARTLAR (Instagram Story / TikTok)
 *
 * Story boyutunda (dikey 9:16) kartlar; 28 Kasım'dan beri her paylaşım yerinin kendi tasarımı var.
 * share.tsx bunların fotoğrafını çekip iPhone'un paylaşım penceresini açar.
 * - ItemShareCard (28 Kasım, yeni tasarım): koyu pembe zeminde "fiyat düştü" çıkartması – beyaz kenarlı eğik
 *   fotoğraf, sarı yıldız rozeti (7. giyim / RESMEN BEDAVA / YENİ PARÇA / BUGÜN BEDAVA), üstü çizili alış fiyatı,
 *   dev giyim başı fiyat, kıyas hapı, altta "Girl Math" imzası.
 * - WardrobeShareCard (28 Kasım, yeni): scrapbook – en çok giyilen 5 parça bantlı polaroid, pembe kareli kâğıt,
 *   dev "%15 dolabım çoktan bedava" (%0 ise "yolculuğum başladı"), sarı not kâğıdı, imza
 * - KahootShareCard (28 Kasım, yeni): holografik zemin, krom çerçeveli pembe madalyada rozet emojisi, rozet adı,
 *   puan / doğru (/ seri) kutucukları, "Dolabını benden iyi tanıyan var mı? 👀", imza
 * - MonthlyShareCard (28 Kasım, yeni): Wrapped tarzı gece zemini, dev neon giyim sayısı, numaralı ilk üç, ayın yorumu
 * Kartın genişliği dışarıdan verilir; yükseklik 16/9 oranında otomatik.
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { INFINITE_COST, formatTL } from '@/components/clothing-card';
import { ColorSwatch } from '@/components/color-picker';
import { Colors, Fonts, Gradients, Radius } from '@/constants/theme';
import type { ColorName } from '@/lib/colors';
import { COMPARISONS, findComparison } from '@/lib/comparisons';
import { isEventDay } from '@/lib/events';
import { costPerWear, isPaidOff, wearCount } from '@/lib/girl-math';
import type { MonthlySummary } from '@/lib/insights';
import { QUESTION_COUNT, quizBadge } from '@/lib/quiz';
import { photoUri } from '@/lib/photos';
import type { WardrobeStats } from '@/lib/stats';
import type { ClothingItem, QuizResult } from '@/lib/types';

const colors = Colors.light;

// ---------------------------------------------------------------------------------------------
// 28 Kasım: Story kartları 2. tasarım – her paylaşım yerine ayrı kart (Spotify Wrapped gibi tek odak).
// Ortak kurallar:
//  - Ölçüler kart genişliğine oranlı (u = genişlik / 300): ekrandaki önizleme ile kaydedilen 1080×1920
//    resim birebir aynı görünür.
//  - Instagram Story'nin üstte (profil adı) ve altta (mesaj çubuğu) kapattığı alanlarda önemli bir şey
//    yok: içerik üstten %10, alttan %13 içeride (STORY_SAFE_TOP / STORY_SAFE_BOTTOM). 28 Kasım: %12/%17 fazlaydı,
//    içerik sığmayıp üst üste biniyordu.
//  - Altta imza: "Girl Math" + merak cümlesi (simge kararı netleşince yanına simge eklenecek).
// ---------------------------------------------------------------------------------------------
const STORY_SAFE_TOP = 0.1;
const STORY_SAFE_BOTTOM = 0.13;

// Alttaki imza: dergi yazısıyla "Girl Math" + gören arkadaşı meraklandıran kısa soru
function StorySign({ u, color, hook }: { u: number; color: string; hook: string }) {
  return (
    <View style={styles.sign}>
      <Text style={[styles.signName, { color, fontSize: 20 * u, lineHeight: 24 * u }]}>Girl Math</Text>
      <Text style={[styles.signHook, { color, fontSize: 11 * u, lineHeight: 14 * u }]}>{hook}</Text>
    </View>
  );
}

// 8 köşeli sarı yıldız rozeti (üst üste döndürülmüş iki kare); içinde iki satır yazı
function StarBadge({ u, top, bottom }: { u: number; top: string; bottom: string }) {
  const size = 72 * u;
  return (
    <View style={[styles.star, { width: size, height: size }]}>
      <View style={[styles.starSquare, { width: size * 0.74, height: size * 0.74, borderRadius: 6 * u }]} />
      <View
        style={[
          styles.starSquare,
          {
            width: size * 0.74,
            height: size * 0.74,
            borderRadius: 6 * u,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
      <Text
        style={[styles.starTop, { fontSize: 19 * u, lineHeight: 21 * u }]}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {top}
      </Text>
      <Text style={[styles.starBottom, { fontSize: 9 * u, lineHeight: 11 * u }]} numberOfLines={1}>
        {bottom}
      </Text>
    </View>
  );
}

// Küçük parıltı yıldızı (✦)
function Sparkle({ u, size, color, style }: { u: number; size: number; color: string; style: object }) {
  return (
    <Text style={[styles.sparkle, { fontSize: size * u, lineHeight: size * u * 1.1, color }, style]}>✦</Text>
  );
}

// KIYAFET KARTI (detaydaki paylaş simgesi): "fiyat düştü" çıkartması.
// Parça beyaz kenarlı çıkartma gibi, köşede sarı yıldız; altta üstü çizili eski fiyat + dev yeni fiyat + kıyas hapı.
// Durumlar: hiç giyilmedi (∞, "ilk giyimde → fiyat"), amorti (RESMEN BEDAVA), etkinlik günü (0 ₺), normal.
export function ItemShareCard({ item, width }: { item: ClothingItem; width: number }) {
  const u = width / 300;
  const height = (width * 16) / 9;
  const wears = wearCount(item);
  const cost = costPerWear(item);
  const uri = photoUri(item.photoFileName);
  const eventToday = isEventDay(item);
  const paidOff = isPaidOff(item);
  const match = findComparison(cost);

  // Dev rakam, üstü çizili rakam, yıldız rozeti ve alttaki hap duruma göre
  const big = eventToday ? '0' : wears === 0 ? INFINITE_COST : cost.toLocaleString('tr-TR');
  const showCurrency = eventToday || wears > 0;
  const struck = eventToday
    ? formatTL(wears > 0 ? cost : item.price)
    : wears >= 2 && cost < item.price
      ? formatTL(item.price)
      : null;
  const badge = eventToday
    ? { top: 'BUGÜN', bottom: 'BEDAVA' }
    : paidOff
      ? { top: 'RESMEN', bottom: 'BEDAVA' }
      : wears === 0
        ? { top: 'YENİ', bottom: 'PARÇA' }
        : { top: `${wears}.`, bottom: 'GİYİM' };
  const pill = eventToday
    ? 'Zaman aşımı = bedava 🎉'
    : wears === 0
      ? `İlk giyimde → ${formatTL(item.price)}`
      : match
        ? `= bir ${match.unit} ${match.emoji}`
        : 'Resmen bedava 💅';

  return (
    <LinearGradient
      colors={Gradients.storyHot}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[
        styles.storyFrame,
        {
          width,
          paddingTop: height * STORY_SAFE_TOP,
          paddingBottom: height * STORY_SAFE_BOTTOM,
          borderRadius: 20 * u,
        },
      ]}>
      {/* Neon parıltı: yazısız sol orta köşede (neon pembe üstüne yazı konmaz) */}
      <LinearGradient
        colors={Gradients.storyGlow}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[
          styles.glow,
          {
            width: width * 0.7,
            height: width * 0.7,
            top: height * 0.28,
            left: -width * 0.3,
          },
        ]}
      />
      <Sparkle u={u} size={18} color={colors.storyButter} style={{ left: 30 * u, top: height * 0.17 }} />
      <Sparkle u={u} size={12} color={colors.onPrimary} style={{ left: 58 * u, top: height * 0.43 }} />
      <Sparkle u={u} size={14} color={colors.onPrimary} style={{ right: 26 * u, top: height * 0.47 }} />

      <Text style={[styles.itemEyebrow, { fontSize: 10 * u, letterSpacing: 2.2 * u }]}>
        GİYİM BAŞI MALİYETİM
      </Text>

      {/* Çıkartma: beyaz kenarlı fotoğraf, hafif eğik; köşede yıldız */}
      <View style={styles.stickerWrap}>
        <View
          style={[
            styles.sticker,
            {
              width: 136 * u,
              padding: 6 * u,
              borderRadius: 14 * u,
              transform: [{ rotate: '-5deg' }],
            },
          ]}>
          <View style={[styles.stickerPhoto, { borderRadius: 9 * u }]}>
            {uri ? (
              <Image source={{ uri }} style={styles.photo} contentFit="cover" />
            ) : (
              <SymbolView
                name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
                tintColor={colors.primary}
                size={40 * u}
                weight="light"
              />
            )}
          </View>
        </View>
        <View style={[styles.starPos, { right: 28 * u, top: -6 * u }]}>
          <StarBadge u={u} top={badge.top} bottom={badge.bottom} />
        </View>
      </View>

      {/* Fiyatlar */}
      <View style={styles.itemPrices}>
        {struck && (
          <Text style={[styles.itemStruck, { fontSize: 17 * u, lineHeight: 21 * u }]}>{struck}</Text>
        )}
        <Text
          style={[styles.itemBig, { fontSize: 70 * u, lineHeight: 74 * u, letterSpacing: -2 * u }]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {big}
          {showCurrency && <Text style={[styles.itemCurrency, { fontSize: 30 * u }]}> ₺</Text>}
        </Text>
        <Text style={[styles.itemPer, { fontSize: 10.5 * u, letterSpacing: 1.4 * u }]} numberOfLines={1}>
          {`“${item.name}” · GİYİM BAŞI`.toLocaleUpperCase('tr')}
        </Text>
      </View>

      <View
        style={[
          styles.itemPill,
          {
            paddingVertical: 8 * u,
            paddingHorizontal: 14 * u,
            transform: [{ rotate: '-2deg' }],
          },
        ]}>
        <Text style={[styles.itemPillText, { fontSize: 13 * u, lineHeight: 17 * u }]} numberOfLines={1}>
          {pill}
        </Text>
      </View>

      <StorySign u={u} color={colors.onPrimary} hook="Sen de dolabını hesapla 👀" />
    </LinearGradient>
  );
}

// Polaroid yerleşimleri (u biriminde): fotoğraflı parça sayısına göre; az parçada daha büyük
type PolaroidSpot = { left: number; top: number; w: number; rot: number };
const POLAROID_SPOTS: Record<number, PolaroidSpot[]> = {
  1: [{ left: 85, top: 8, w: 130, rot: -4 }],
  2: [
    { left: 28, top: 14, w: 118, rot: -6 },
    { left: 152, top: 28, w: 118, rot: 5 },
  ],
  3: [
    { left: 16, top: 12, w: 102, rot: -7 },
    { left: 108, top: 2, w: 96, rot: 4 },
    { left: 196, top: 22, w: 90, rot: -3 },
  ],
  4: [
    { left: 16, top: 10, w: 98, rot: -7 },
    { left: 110, top: 0, w: 90, rot: 5 },
    { left: 198, top: 18, w: 86, rot: -3 },
    { left: 96, top: 116, w: 92, rot: 3 },
  ],
  5: [
    { left: 14, top: 10, w: 98, rot: -7 },
    { left: 106, top: 0, w: 88, rot: 5 },
    { left: 196, top: 18, w: 88, rot: -3 },
    { left: 40, top: 112, w: 86, rot: 4 },
    { left: 166, top: 118, w: 92, rot: -6 },
  ],
};

// Kartta gösterilecek parçalar: fotoğraflılar, en çok giyilenden aza (en fazla 5)
function wardrobeHighlights(items: ClothingItem[]): ClothingItem[] {
  return items
    .filter((item) => item.photoFileName)
    .sort((a, b) => wearCount(b) - wearCount(a))
    .slice(0, 5);
}

// Pembe kareli kâğıt: yarı saydam yatay + dikey şeritler (üst üste gelince kare kare görünür)
function Gingham({ u, height }: { u: number; height: number }) {
  const step = 28 * u;
  const cols = Math.ceil((300 * u) / step);
  const rows = Math.ceil(height / step);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: rows }, (_, i) => (
        <View
          key={`r${i}`}
          style={[styles.ginghamBand, { top: i * step, height: step / 2, left: 0, right: 0 }]}
        />
      ))}
      {Array.from({ length: cols }, (_, i) => (
        <View
          key={`c${i}`}
          style={[styles.ginghamBand, { left: i * step, width: step / 2, top: 0, bottom: 0 }]}
        />
      ))}
    </View>
  );
}

function Polaroid({ item, u, spot }: { item: ClothingItem | null; u: number; spot: PolaroidSpot }) {
  const uri = item ? photoUri(item.photoFileName) : null;
  return (
    <View
      style={[
        styles.polaroid,
        {
          left: spot.left * u,
          top: spot.top * u,
          width: spot.w * u,
          padding: 5 * u,
          paddingBottom: 16 * u,
          transform: [{ rotate: `${spot.rot}deg` }],
        },
      ]}>
      <View style={styles.polaroidPhoto}>
        {uri ? (
          <Image source={{ uri }} style={styles.photo} contentFit="cover" />
        ) : (
          <SymbolView
            name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
            tintColor={colors.primary}
            size={34 * u}
            weight="light"
          />
        )}
      </View>
      {/* Bant: polaroidin tepesinde, hafif eğik */}
      <View
        style={[
          styles.tape,
          {
            width: 42 * u,
            height: 14 * u,
            top: -7 * u,
            left: (spot.w * u) / 2 - 21 * u,
            transform: [{ rotate: '-4deg' }],
          },
        ]}
      />
    </View>
  );
}

// DOLAP KARTI (Cüzdan'daki paylaş butonu): scrapbook. En çok giyilen 5 parça bantlı polaroid, pembe kareli
// kâğıt; tek rakam: dolabın yüzde kaçı "bedava" (amortizedPercent). %0 ise "yolculuğum başladı".
export function WardrobeShareCard({
  stats,
  items,
  width,
}: {
  stats: WardrobeStats;
  items: ClothingItem[];
  width: number;
}) {
  const u = width / 300;
  const height = (width * 16) / 9;
  const picks = wardrobeHighlights(items);
  // Yerleşim 0.86 ölçekle; alanın yüksekliği en alttaki polaroidin bittiği yer (taşmasın)
  const spots = POLAROID_SPOTS[Math.max(1, picks.length)].map((spot) => ({
    left: spot.left * 0.86 + 21,
    top: spot.top * 0.86,
    w: spot.w * 0.86,
    rot: spot.rot,
  }));
  const areaHeight = Math.max(...spots.map((spot) => spot.top + spot.w * (4 / 3) + 21)) + 6;
  const latte = COMPARISONS.find((comparison) => comparison.unit === 'iced latte');
  const latteCount = latte ? Math.floor(stats.totalValue / latte.price) : 0;
  const started = stats.amortizedPercent > 0;

  return (
    <View
      style={[
        styles.storyFrame,
        styles.paperFrame,
        {
          width,
          paddingTop: height * STORY_SAFE_TOP,
          paddingBottom: height * STORY_SAFE_BOTTOM,
          borderRadius: 20 * u,
        },
      ]}>
      <Gingham u={u} height={height} />

      <Text style={[styles.paperLabel, { fontSize: 10 * u, letterSpacing: 2.2 * u }]}>
        {`DOLABIM · ${stats.totalItems} PARÇA`}
      </Text>

      {/* Polaroidler */}
      <View style={{ width: '100%', height: areaHeight * u }}>
        {spots.map((spot, index) => (
          <Polaroid key={index} item={picks[index] ?? null} u={u} spot={spot} />
        ))}
      </View>

      {/* Tek rakam + not kâğıdı */}
      <View style={[styles.paperBottom, { paddingHorizontal: 18 * u, gap: 10 * u }]}>
        <View style={{ flex: 1 }}>
          {started ? (
            <>
              <Text
                style={[
                  styles.paperPct,
                  {
                    fontSize: 86 * u,
                    lineHeight: 84 * u,
                    letterSpacing: -3 * u,
                  },
                ]}>
                {`%${stats.amortizedPercent}`}
              </Text>
              <Text style={[styles.paperText, { fontSize: 21 * u, lineHeight: 25 * u }]}>
                dolabım çoktan bedava
              </Text>
            </>
          ) : (
            <Text style={[styles.paperText, { fontSize: 30 * u, lineHeight: 34 * u }]}>
              Girl Math yolculuğum başladı
            </Text>
          )}
        </View>
        {latteCount > 0 && (
          <View style={[styles.note, { padding: 8 * u, transform: [{ rotate: '3deg' }] }]}>
            <Text style={[styles.noteText, { fontSize: 12 * u, lineHeight: 16 * u }]}>
              {`${stats.totalItems} parça = ${latteCount.toLocaleString('tr-TR')} iced latte 🧋 ama giyiyorum 💅`}
            </Text>
          </View>
        )}
      </View>

      <StorySign u={u} color={colors.primaryPressed} hook="Senin dolabın kaç latte? 👀" />
    </View>
  );
}

// DOLAP QUIZ KARTI (Quiz sonuç ekranındaki "Story'de paylaş"): holografik zeminde krom çerçeveli pembe madalya.
// Renkler sadece marka ailesinden (28 Kasım): pudra → lila → pudra zemin, yazılar tek fuşya; nane çıkarıldı.
// Madalyada rozetin emojisi (🏆 💼 🌱 😤), altında rozet adı, puan / doğru kutucukları (seri varsa 🔥), meydan okuma.
export function KahootShareCard({
  result,
  streak,
  width,
}: {
  result: QuizResult;
  streak: number;
  width: number;
}) {
  const u = width / 300;
  const height = (width * 16) / 9;
  const badge = quizBadge(result.correctCount);
  const medal = 132 * u;
  const chips = [
    { value: result.score.toLocaleString('tr-TR'), label: 'PUAN' },
    { value: `${result.correctCount}/${QUESTION_COUNT}`, label: 'DOĞRU' },
    ...(streak > 1 ? [{ value: `🔥 ${streak}`, label: 'HAFTA SERİ' }] : []),
  ];

  return (
    <LinearGradient
      colors={[colors.holoBlush, colors.holoLilac, colors.holoBlush]}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.storyFrame,
        {
          width,
          paddingTop: height * STORY_SAFE_TOP,
          paddingBottom: height * STORY_SAFE_BOTTOM,
          borderRadius: 20 * u,
        },
      ]}>
      {/* Yanardöner lekeler */}
      <View
        style={[
          styles.holoBlob,
          {
            backgroundColor: colors.holoLilac,
            width: 220 * u,
            height: 220 * u,
            top: height * 0.05,
            right: -90 * u,
          },
        ]}
      />
      <View
        style={[
          styles.holoBlob,
          {
            backgroundColor: colors.holoBlush,
            width: 200 * u,
            height: 200 * u,
            top: height * 0.55,
            left: -80 * u,
          },
        ]}
      />
      <Sparkle u={u} size={18} color={colors.card} style={{ left: 40 * u, top: height * 0.2 }} />
      <Sparkle u={u} size={13} color={colors.primary} style={{ right: 36 * u, top: height * 0.42 }} />

      <Text style={[styles.quizLabel, { fontSize: 10 * u, letterSpacing: 2.2 * u }]}>
        {"BU HAFTANIN DOLAP QUIZ'İ"}
      </Text>

      {/* Madalya: kurdele kuyrukları + krom halka + pembe iç daire + rozet emojisi */}
      <View style={{ width: medal, height: medal + 22 * u, alignItems: 'center' }}>
        <View
          style={[
            styles.ribbon,
            {
              backgroundColor: colors.primary,
              width: 26 * u,
              height: 44 * u,
              top: medal - 24 * u,
              left: medal / 2 - 26 * u,
              transform: [{ rotate: '16deg' }],
            },
          ]}
        />
        <View
          style={[
            styles.ribbon,
            {
              backgroundColor: colors.primaryPressed,
              width: 26 * u,
              height: 44 * u,
              top: medal - 24 * u,
              left: medal / 2,
              transform: [{ rotate: '-16deg' }],
            },
          ]}
        />
        <LinearGradient
          colors={Gradients.chrome}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.medalRing, { width: medal, height: medal, borderRadius: medal / 2 }]}>
          <LinearGradient
            colors={[colors.holoBlush, colors.highlight, colors.primary]}
            start={{ x: 0.3, y: 0.1 }}
            end={{ x: 0.8, y: 1 }}
            style={[
              styles.medalInner,
              {
                width: medal * 0.74,
                height: medal * 0.74,
                borderRadius: medal * 0.37,
              },
            ]}>
            <Text style={{ fontSize: 50 * u, lineHeight: 60 * u }}>{badge.emoji}</Text>
          </LinearGradient>
        </LinearGradient>
      </View>

      <View style={{ alignItems: 'center', gap: 12 * u }}>
        <Text
          style={[styles.quizTitle, { fontSize: 28 * u, lineHeight: 32 * u, paddingHorizontal: 20 * u }]}
          numberOfLines={2}
          adjustsFontSizeToFit>
          {badge.title}
        </Text>

        <View style={[styles.quizChips, { gap: 10 * u }]}>
          {chips.map((chip) => (
            <View
              key={chip.label}
              style={[
                styles.quizChip,
                {
                  borderRadius: 14 * u,
                  paddingVertical: 8 * u,
                  paddingHorizontal: 14 * u,
                },
              ]}>
              <Text style={[styles.quizChipValue, { fontSize: 24 * u, lineHeight: 28 * u }]}>
                {chip.value}
              </Text>
              <Text style={[styles.quizChipLabel, { fontSize: 9 * u, letterSpacing: 1 * u }]}>
                {chip.label}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.quizDare, { fontSize: 14 * u, lineHeight: 18 * u }]}>
          Dolabını benden iyi tanıyan var mı? 👀
        </Text>
      </View>

      <StorySign u={u} color={colors.primary} hook="Haftanın dolap quiz'i Girl Math'te" />
    </LinearGradient>
  );
}

// AYLIK ÖZET KARTI (Analizlerin → Aylık özet → paylaş): Spotify Wrapped gibi gece zemini, dev neon pembe giyim
// sayısı, numaralı ilk üç (ayın yıldızı fotoğraflı, en çok giyilen renk, alışveriş), ayın yorumu.
// Harcanan TL bilerek yok (Story herkese açık), sadece parça sayısı.
export function MonthlyShareCard({
  summary,
  topColor,
  width,
}: {
  summary: MonthlySummary;
  topColor: { color: ColorName; percent: number } | null; // bu ay en çok giyilen renk; yoksa null
  width: number;
}) {
  const u = width / 300;
  const height = (width * 16) / 9;
  // "2026-10" → "EKİM 2026" (öğlen saati: gün dönümünde bir önceki aya kaymasın)
  const monthName = new Date(`${summary.month}-01T12:00:00`)
    .toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    .toLocaleUpperCase('tr');
  const diff = summary.wears - summary.previousWears;
  const starUri = summary.star ? photoUri(summary.star.item.photoFileName) : null;

  const rows: { key: string; label: string; value: string; visual: ReactNode }[] = [];
  if (summary.star) {
    rows.push({
      key: 'star',
      label: 'AYIN YILDIZI',
      value: `“${summary.star.item.name}” · ${summary.star.wears} kere`,
      visual: (
        <View style={[styles.wrapThumb, { width: 30 * u, height: 40 * u, borderRadius: 6 * u }]}>
          {starUri ? (
            <Image source={{ uri: starUri }} style={styles.photo} contentFit="cover" />
          ) : (
            <SymbolView
              name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
              tintColor={colors.primary}
              size={18 * u}
              weight="light"
            />
          )}
        </View>
      ),
    });
  }
  if (topColor) {
    rows.push({
      key: 'color',
      label: 'EN ÇOK GİYDİĞİM RENK',
      value: `${topColor.color} · %${topColor.percent}`,
      visual: (
        <View style={[styles.wrapVisual, { width: 30 * u }]}>
          <ColorSwatch color={topColor.color} size={26 * u} />
        </View>
      ),
    });
  }
  rows.push({
    key: 'shop',
    label: 'ALIŞVERİŞ',
    value: summary.newItemCount > 0 ? `${summary.newItemCount} yeni parça` : 'Hiç yok',
    visual: (
      <View style={[styles.wrapVisual, { width: 30 * u }]}>
        <SymbolView
          name={{ ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' }}
          tintColor={colors.holoBlush}
          size={22 * u}
          weight="light"
        />
      </View>
    ),
  });

  return (
    <View
      style={[
        styles.storyFrame,
        styles.nightFrame,
        {
          width,
          paddingTop: height * STORY_SAFE_TOP,
          paddingBottom: height * STORY_SAFE_BOTTOM,
          paddingHorizontal: 20 * u,
          borderRadius: 20 * u,
          alignItems: 'stretch',
        },
      ]}>
      {/* Köşelerde neon parıltı (üstüne yazı gelmeyen yerlerde) */}
      <LinearGradient
        colors={Gradients.storyGlow}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.glow, { width: width * 0.9, height: width * 0.9, top: -width * 0.45, right: -width * 0.45 }]}
      />
      <LinearGradient
        colors={Gradients.storyGlow}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={[styles.glow, { width: width * 0.8, height: width * 0.8, bottom: -width * 0.45, left: -width * 0.4, opacity: 0.35 }]}
      />

      <View>
        <Text style={[styles.wrapMonth, { fontSize: 10 * u, letterSpacing: 2.2 * u }]}>{monthName}</Text>
        <Text style={[styles.wrapTitle, { fontSize: 26 * u, lineHeight: 30 * u }]}>Aylık özetim</Text>
      </View>

      <View>
        <Text
          style={[styles.wrapHero, { fontSize: 92 * u, lineHeight: 86 * u, letterSpacing: -3.5 * u }]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {summary.wears.toLocaleString('tr-TR')}
        </Text>
        <View style={[styles.wrapHeroRow, { gap: 8 * u }]}>
          <Text style={[styles.wrapHeroText, { fontSize: 16 * u, lineHeight: 20 * u }]}>kere giydim bu ay</Text>
          {summary.previousWears > 0 && diff > 0 && (
            <View style={[styles.wrapChip, { paddingVertical: 3 * u, paddingHorizontal: 8 * u }]}>
              <Text style={[styles.wrapChipText, { fontSize: 10 * u, lineHeight: 13 * u }]}>{`geçen aydan +${diff}`}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ gap: 10 * u }}>
        {rows.map((row, index) => (
          <View key={row.key} style={[styles.wrapRow, { gap: 10 * u }]}>
            <Text style={[styles.wrapNumber, { width: 18 * u, fontSize: 19 * u, lineHeight: 22 * u }]}>{index + 1}</Text>
            {row.visual}
            <View style={styles.wrapRowText}>
              <Text style={[styles.wrapRowLabel, { fontSize: 9 * u, letterSpacing: 1.1 * u }]}>{row.label}</Text>
              <Text style={[styles.wrapRowValue, { fontSize: 15 * u, lineHeight: 19 * u }]} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={[styles.wrapVerdict, { fontSize: 16 * u, lineHeight: 21 * u }]} numberOfLines={2}>
        {`“${summary.verdict}”`}
      </Text>

      <StorySign u={u} color={colors.onPrimary} hook="Senin ayın nasıl geçti? 👀" />
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: '100%',
    height: '100%',
  },
  // ---- 28 Kasım Story kartları (ölçülerin çoğu bileşende u ile verilir) ----
  storyFrame: {
    aspectRatio: 9 / 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  glow: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.55,
  },
  sparkle: {
    position: 'absolute',
  },
  sign: {
    alignItems: 'center',
  },
  signName: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic',
    fontWeight: '800',
  },
  signHook: {
    fontWeight: '700',
    opacity: 0.9,
  },
  star: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '10deg' }],
  },
  starSquare: {
    position: 'absolute',
    backgroundColor: colors.storyButter,
  },
  starTop: {
    fontFamily: Fonts?.serif,
    fontWeight: '900',
    color: colors.primaryPressed,
  },
  starBottom: {
    fontWeight: '800',
    color: colors.primaryPressed,
  },
  starPos: {
    position: 'absolute',
  },
  itemEyebrow: {
    fontWeight: '800',
    color: colors.onPrimary,
    opacity: 0.92,
  },
  stickerWrap: {
    width: '100%',
    alignItems: 'center',
  },
  sticker: {
    backgroundColor: colors.card,
    shadowColor: colors.storyStickerShadow,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  stickerPhoto: {
    width: '100%',
    aspectRatio: 3 / 4,
    overflow: 'hidden',
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPrices: {
    alignItems: 'center',
  },
  itemStruck: {
    fontWeight: '700',
    color: colors.onPrimary,
    opacity: 0.7,
    textDecorationLine: 'line-through',
  },
  itemBig: {
    fontFamily: Fonts?.serif,
    fontWeight: '900',
    color: colors.onPrimary,
  },
  itemCurrency: {
    fontFamily: Fonts?.sans,
    fontWeight: '800',
    letterSpacing: 0,
  },
  itemPer: {
    fontWeight: '700',
    color: colors.onPrimary,
    opacity: 0.9,
  },
  itemPill: {
    backgroundColor: colors.card,
    borderRadius: Radius.pill,
    shadowColor: colors.storyStickerShadow,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  itemPillText: {
    fontWeight: '800',
    color: colors.primaryPressed,
  },
  paperFrame: {
    backgroundColor: colors.storyPaper,
  },
  ginghamBand: {
    position: 'absolute',
    backgroundColor: colors.storyGingham,
  },
  paperLabel: {
    fontWeight: '800',
    color: colors.primary,
  },
  polaroid: {
    position: 'absolute',
    backgroundColor: colors.card,
    shadowColor: colors.storyStickerShadow,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  polaroidPhoto: {
    width: '100%',
    aspectRatio: 3 / 4,
    overflow: 'hidden',
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tape: {
    position: 'absolute',
    backgroundColor: colors.storyTape,
  },
  paperBottom: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  paperPct: {
    fontFamily: Fonts?.serif,
    fontWeight: '900',
    color: colors.primary,
  },
  paperText: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic',
    fontWeight: '600',
    color: colors.text,
  },
  note: {
    width: '40%',
    backgroundColor: colors.storyButter,
    shadowColor: colors.storyStickerShadow,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  noteText: {
    fontWeight: '700',
    color: colors.text,
  },
  holoBlob: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.7,
  },
  quizLabel: {
    fontWeight: '800',
    color: colors.primary,
  },
  ribbon: {
    position: 'absolute',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  medalRing: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.storyStickerShadow,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  medalInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizTitle: {
    fontFamily: Fonts?.serif,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'center',
  },
  quizChips: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  quizChip: {
    backgroundColor: colors.glass,
    alignItems: 'center',
  },
  quizChipValue: {
    fontFamily: Fonts?.serif,
    fontWeight: '800',
    color: colors.text,
  },
  quizChipLabel: {
    fontWeight: '700',
    color: colors.textSecondary,
  },
  quizDare: {
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  nightFrame: {
    backgroundColor: colors.storyNight,
  },
  wrapMonth: {
    fontWeight: '800',
    color: colors.holoBlush,
  },
  wrapTitle: {
    fontFamily: Fonts?.serif,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  wrapHero: {
    fontFamily: Fonts?.serif,
    fontWeight: '900',
    color: colors.highlight,
  },
  wrapHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  wrapHeroText: {
    fontWeight: '800',
    color: colors.onPrimary,
  },
  wrapChip: {
    borderRadius: Radius.pill,
    backgroundColor: colors.primary,
  },
  wrapChipText: {
    fontWeight: '800',
    color: colors.onPrimary,
  },
  wrapRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wrapNumber: {
    fontFamily: Fonts?.serif,
    fontWeight: '900',
    color: colors.highlight,
  },
  wrapThumb: {
    overflow: 'hidden',
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapVisual: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapRowText: {
    flex: 1,
  },
  wrapRowLabel: {
    fontWeight: '700',
    color: colors.holoBlush,
    opacity: 0.8,
  },
  wrapRowValue: {
    fontWeight: '800',
    color: colors.onPrimary,
  },
  wrapVerdict: {
    fontFamily: Fonts?.serif,
    fontStyle: 'italic',
    fontWeight: '600',
    color: colors.holoBlush,
  },
});
