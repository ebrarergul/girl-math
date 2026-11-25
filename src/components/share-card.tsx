/**
 * PAYLAŞILABİLİR KARTLAR (Instagram Story / TikTok)
 *
 * Story boyutunda (dikey 9:16) pembe geçişli kartlar (Gradients.story; yazılar koyu gül, rakamlar pembe).
 * share.tsx bunların fotoğrafını çekip iPhone'un paylaşım penceresini açar.
 * Hepsi aynı düzende (StoryLayout): etiket + başlık, beyaz kartta büyük pembe rakam + satırlar, italik alıntı.
 * - ItemShareCard: "GİYİM BAŞI MALİYETİM / “Ceket”", küçük fotoğraf + 67 ₺ /giyim, alış fiyatı, giyim, kıyas
 * - WardrobeShareCard: "DOLABIM / 9 parça", amorti ettiğim (%), dolap değeri, toplam giyim, "Dolabım = 51 iced latte"
 * - KahootShareCard: Dolap Quiz rozeti (🏆 Merkez Bankası Başkanı), puan, doğru, seri
 * - MonthlyShareCard: "AYLIK ÖZETİM / Kasım 2026", kaç kere giydim, ayın yıldızı, renk, alışveriş, ayın yorumu
 * Kartın genişliği dışarıdan verilir; yükseklik 16/9 oranında otomatik.
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { INFINITE_COST, formatTL, itemComparisonText } from '@/components/clothing-card';
import { Colors, Fonts, Gradients, Radius, Spacing, Typography } from '@/constants/theme';
import { costPerWear, isPaidOff, wearCount } from '@/lib/girl-math';
import type { MonthlySummary } from '@/lib/insights';
import { QUESTION_COUNT, quizBadge } from '@/lib/quiz';
import { photoUri } from '@/lib/photos';
import { starbucksIndexText } from '@/lib/starbucks-index';
import type { WardrobeStats } from '@/lib/stats';
import type { ClothingItem, QuizResult } from '@/lib/types';

const colors = Colors.light;

// Ortak çerçeve: şeker pembesi → gül pembesi geçişli zemin (Gradients.story), üstte ve altta
// marka imzası. Yazılar siyah değil koyu gül (primaryPressed), büyük rakamlar pembe:
// 26 Kasım'da "siyah çok ön planda, Story pembe olsun, girls girls" denince böyle oldu.
function CardFrame({ width, children }: { width: number; children: ReactNode }) {
  return (
    <LinearGradient
      colors={Gradients.story}
      locations={[0, 0.5, 1]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[styles.frame, { width }]}>
      <Text style={styles.brandTop}>GIRL MATH</Text>
      <View style={styles.body}>{children}</View>
      <Text style={styles.brandBottom}>girl math’e göre her şey mantıklı 💅</Text>
    </LinearGradient>
  );
}

// Büyük rakam: rakam dergi yazı tipinde, ₺ sade yazı tipinde (dergi yazı tipinde "Ł" gibi görünüyor)
// value null ise ∞ (sonsuz) yazılır: hiç giyilmemiş parçanın giyim başına maliyeti
// currency={false}: para olmayan sayılar için (giyim sayısı gibi), ₺ yazılmaz
function BigAmount({
  value,
  suffix,
  currency = true,
}: {
  value: number | null;
  suffix?: string;
  currency?: boolean;
}) {
  return (
    <Text style={styles.bigAmount} numberOfLines={1} adjustsFontSizeToFit>
      {value === null ? INFINITE_COST : value.toLocaleString('tr-TR')}
      {value !== null && currency && <Text style={styles.bigCurrency}> ₺</Text>}
      {suffix && <Text style={styles.bigSuffix}> {suffix}</Text>}
    </Text>
  );
}

type SummaryRow = { label: string; value: string };

// Bütün Story kartlarının ortak düzeni (26 Kasım, Ebrar: "aylık özet kartı güzel oldu, hepsi öyle olsun"):
// üstte küçük etiket + başlık, ortada beyaz kartta büyük pembe rakam (+ isteğe bağlı fotoğraf/alt yazı)
// ve ince çizgili etiket–değer satırları, en altta dergi yazısıyla italik alıntı.
function StoryLayout({
  label,
  title,
  emoji,
  top,
  photo,
  caption,
  rows,
  quote,
}: {
  label: string;
  title: string;
  emoji?: string; // Başlığın üstünde büyük emoji (Quiz rozeti)
  top: ReactNode; // Genelde <BigAmount>
  photo?: ReactNode; // Rakamın solunda küçük fotoğraf (kıyafet kartı)
  caption?: string; // Rakamın altında küçük yazı
  rows: SummaryRow[];
  quote: string;
}) {
  return (
    <>
      <View style={styles.textBlock}>
        {emoji && <Text style={styles.headerEmoji}>{emoji}</Text>}
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.badgeTitle} numberOfLines={2}>
          {title}
        </Text>
      </View>

      <View style={styles.summaryBox}>
        <View style={[styles.summaryTop, photo ? styles.summaryTopWithPhoto : null]}>
          {photo}
          <View style={photo ? styles.summaryTopText : styles.summaryTopCenter}>
            {top}
            {caption && <Text style={styles.summaryCaption}>{caption}</Text>}
          </View>
        </View>
        {rows.map((row) => (
          <View key={row.label} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{row.label}</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.quote}>{quote}</Text>
    </>
  );
}

// Satır listesinden boş (false/null) olanları atar
function compact(rows: (SummaryRow | false | null | undefined)[]): SummaryRow[] {
  return rows.filter((row): row is SummaryRow => Boolean(row));
}

export function ItemShareCard({ item, width }: { item: ClothingItem; width: number }) {
  const wears = wearCount(item);
  const cost = costPerWear(item);
  const uri = photoUri(item.photoFileName);

  return (
    <CardFrame width={width}>
      <StoryLayout
        label="GİYİM BAŞI MALİYETİM"
        title={`“${item.name}”`}
        photo={
          <View style={styles.photoBox}>
            {uri ? (
              <Image source={{ uri }} style={styles.photo} contentFit="cover" />
            ) : (
              <SymbolView
                name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
                tintColor={colors.primary}
                size={28}
                weight="light"
              />
            )}
          </View>
        }
        top={<BigAmount value={wears > 0 ? cost : null} />}
        caption="/giyim"
        rows={compact([
          { label: 'Alış fiyatı', value: formatTL(item.price) },
          { label: 'Giydim', value: wears > 0 ? `${wears} kere` : 'Henüz değil' },
          isPaidOff(item) && { label: 'Durum', value: 'Amorti edildi ♥' },
        ])}
        quote={itemComparisonText(item) ?? 'Daha yeni aldım, takipte kalın 👀'}
      />
    </CardFrame>
  );
}

export function WardrobeShareCard({ stats, width }: { stats: WardrobeStats; width: number }) {
  return (
    <CardFrame width={width}>
      <StoryLayout
        label="DOLABIM"
        title={`${stats.totalItems} parça`}
        top={<BigAmount value={stats.amortizedValue} />}
        caption={`amorti ettiğim · %${stats.amortizedPercent}`}
        rows={compact([
          { label: 'Dolap değeri', value: formatTL(stats.totalValue) },
          { label: 'Toplam giyim', value: `${stats.totalWears} kere` },
          stats.paidOffCount > 0 && { label: 'Resmen bedava', value: `${stats.paidOffCount} parça` },
        ])}
        quote={`Dolabım ${starbucksIndexText(stats.totalValue)}`}
      />
    </CardFrame>
  );
}

export function KahootShareCard({
  result,
  streak,
  width,
}: {
  result: QuizResult;
  streak: number;
  width: number;
}) {
  const badge = quizBadge(result.correctCount);
  return (
    <CardFrame width={width}>
      <StoryLayout
        label="BU HAFTANIN DOLAP QUIZ'İ"
        title={badge.title}
        emoji={badge.emoji}
        top={<BigAmount value={result.score} currency={false} suffix="puan" />}
        rows={compact([
          { label: 'Doğru', value: `${result.correctCount}/${QUESTION_COUNT}` },
          streak > 1 && { label: 'Seri', value: `🔥 ${streak} hafta` },
        ])}
        quote="Dolabını benden iyi tanıyan var mı? 👀"
      />
    </CardFrame>
  );
}

// Aylık özet kartı. Harcanan TL bilerek yazılmaz (Story herkese açık), sadece parça sayısı.
export function MonthlyShareCard({
  summary,
  topColor,
  width,
}: {
  summary: MonthlySummary;
  topColor: { color: string; percent: number } | null; // bu ay en çok giyilen renk; yoksa null
  width: number;
}) {
  // "2026-10" → "Ekim 2026" (öğlen saati: gün dönümünde bir önceki aya kaymasın)
  const monthName = new Date(`${summary.month}-01T12:00:00`).toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <CardFrame width={width}>
      <StoryLayout
        label="AYLIK ÖZETİM"
        title={monthName}
        top={<BigAmount value={summary.wears} currency={false} suffix="kere giydim" />}
        rows={compact([
          summary.star && { label: 'Ayın yıldızı', value: `“${summary.star.item.name}”` },
          topColor && {
            label: 'En çok giydiğim renk',
            value: `${topColor.color} · %${topColor.percent}`,
          },
          {
            label: 'Alışveriş',
            value: summary.newItemCount > 0 ? `${summary.newItemCount} yeni parça` : 'Hiç yok',
          },
          summary.paidOffCount > 0 && { label: 'Amorti olan', value: `${summary.paidOffCount} parça` },
        ])}
        quote={summary.verdict}
      />
    </CardFrame>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 9 / 16,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  brandTop: {
    ...Typography.label,
    fontSize: 12,
    color: colors.primary,
    textAlign: 'center',
  },
  brandBottom: {
    ...Typography.caption,
    color: colors.primaryPressed,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.four,
    paddingVertical: Spacing.three,
  },
  // Kıyafet kartında rakamın solundaki küçük fotoğraf (3:4)
  photoBox: {
    width: 72,
    aspectRatio: 3 / 4,
    borderRadius: Radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  textBlock: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  headerEmoji: {
    fontSize: 48,
    lineHeight: 58,
  },
  bigAmount: {
    ...Typography.hero,
    fontSize: 48,
    lineHeight: 56,
    color: colors.primary,
  },
  bigCurrency: {
    fontFamily: Fonts?.sans,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0,
  },
  bigSuffix: {
    fontFamily: Fonts?.sans,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
    color: colors.primaryPressed,
  },
  badgeTitle: {
    ...Typography.title,
    color: colors.primaryPressed,
    textAlign: 'center',
  },
  statLabel: {
    ...Typography.label,
    color: colors.primary,
  },
  // Ortak beyaz kart: üstte büyük sayı (+ fotoğraf / alt yazı), altında ince çizgili satırlar
  summaryBox: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one,
  },
  summaryTop: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  summaryTopWithPhoto: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  summaryTopCenter: {
    alignItems: 'center',
  },
  summaryTopText: {
    flex: 1,
  },
  summaryCaption: {
    ...Typography.caption,
    fontWeight: '600',
    color: colors.primaryPressed,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.two + Spacing.half,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.accent,
  },
  summaryLabel: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...Typography.caption,
    fontWeight: '700',
    color: colors.primaryPressed,
    flexShrink: 1,
    textAlign: 'right',
  },
  // Alttaki alıntı (ayın yorumu, kıyas cümlesi…): dergi yazısıyla italik
  quote: {
    ...Typography.title,
    fontSize: 20,
    lineHeight: 27,
    fontStyle: 'italic',
    color: colors.primaryPressed,
    textAlign: 'center',
    paddingHorizontal: Spacing.two,
  },
});
