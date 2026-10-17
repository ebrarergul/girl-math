/**
 * GIRL MATH – ANALİZLER (renk analizi, aylık özet, "satmayı düşün" listesi)
 *
 * Ekranda kullanımı:
 *   colorStats(items, 'month')  // Bu ay hangi renkleri giydin (Giydim sayısına göre)
 *   colorStats(items, 'all')    // Tüm zamanlar
 *   monthlySummary(items)       // Bu ayın özeti: { title, lines: [...], verdict, … }
 *   monthlySummary(items, '2026-09')  // Geçmiş bir ay
 *   sellList(items)             // "Satmayı düşün": { candidates: [...], totalEstimate, text }
 */

import { colorEmoji, type ColorName } from '@/lib/colors';
import { costPerWear, daysSinceLastWear, isPaidOff, todayString } from '@/lib/girl-math';
import { starbucksIndexText } from '@/lib/starbucks-index';
import type { ClothingItem } from '@/lib/types';

// ---------- 🎨 Renk analizi ----------

export type ColorPeriod = 'month' | 'all';

export type ColorShare = {
  color: ColorName;
  emoji: string; // "💖"
  wears: number; // Bu renkteki kıyafetlere kaç kere "Giydim" denmiş
  percent: number; // Toplam giyimin yüzde kaçı (tam sayı)
};

export type ColorStats = {
  shares: ColorShare[]; // En çok giyilenden aza
  text: string; // "💖 En çok pembe giyiyorsun (%40)"
  uncoloredCount: number; // Rengi girilmemiş parça sayısı (analize katılmadı)
  // Sadece "Tüm zamanlar"da: giyim başına maliyeti en çok düşen renk (girl math kârı)
  mostProfitable: { color: ColorName; emoji: string; savings: number; text: string } | null;
};

// Bir giyim tarihi bu döneme giriyor mu?
function inPeriod(date: string, period: ColorPeriod, thisMonth: string): boolean {
  return period === 'all' || date.startsWith(thisMonth);
}

// Hangi renkleri giyiyorsun? Dolapta ne olduğuna değil, "Giydim" sayılarına bakar.
export function colorStats(
  items: ClothingItem[],
  period: ColorPeriod,
  today: string = todayString()
): ColorStats {
  const thisMonth = today.slice(0, 7); // "2026-10"
  const wearsByColor = new Map<ColorName, number>();
  const savingsByColor = new Map<ColorName, number>();
  let uncoloredCount = 0;

  for (const item of items) {
    if (!item.color) {
      uncoloredCount += 1;
      continue;
    }
    const wears = item.wearDates.filter((date) => inPeriod(date, period, thisMonth)).length;
    if (wears > 0) {
      wearsByColor.set(item.color, (wearsByColor.get(item.color) ?? 0) + wears);
    }
    if (item.wearDates.length > 0) {
      // "Girl Math kazancı": fiyat − giyim başına maliyet (stats.ts'teki ile aynı hesap)
      const saved = item.price - costPerWear(item);
      savingsByColor.set(item.color, (savingsByColor.get(item.color) ?? 0) + saved);
    }
  }

  const total = [...wearsByColor.values()].reduce((sum, wears) => sum + wears, 0);
  const shares: ColorShare[] = [...wearsByColor.entries()]
    .map(([color, wears]) => ({
      color,
      emoji: colorEmoji(color),
      wears,
      percent: Math.round((wears / total) * 100),
    }))
    .sort((a, b) => b.wears - a.wears);

  let text: string;
  if (shares.length === 0) {
    text =
      period === 'month'
        ? "Bu ay henüz renkli bir 'Giydim' yok 👀"
        : "Henüz renk analizi için yeterli 'Giydim' yok 👀";
  } else {
    const [top, second] = shares;
    const lower = (color: ColorName) => color.toLocaleLowerCase('tr');
    text =
      second && second.wears === top.wears
        ? `${top.emoji}${second.emoji} ${top.color} ve ${lower(second.color)} başa baş (%${top.percent})`
        : `${top.emoji} En çok ${lower(top.color)} giyiyorsun (%${top.percent})`;
  }

  let mostProfitable: ColorStats['mostProfitable'] = null;
  if (period === 'all') {
    const best = [...savingsByColor.entries()].sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] > 0) {
      const [color, savings] = best;
      mostProfitable = {
        color,
        emoji: colorEmoji(color),
        savings,
        text: `💸 En çok kâr ettiren renk: ${colorEmoji(color)} ${color}. Bu renkteki parçaların maliyeti toplam ${savings} TL düştü!`,
      };
    }
  }

  return { shares, text, uncoloredCount, mostProfitable };
}

// ---------- 📅 Aylık özet ----------

const MONTH_NAMES = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

// 4200 → "4.200"
function thousands(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// "2026-10" → "2026-09"
function previousMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  return m === 1 ? `${year - 1}-12` : `${year}-${String(m - 1).padStart(2, '0')}`;
}

export type MonthlySummary = {
  month: string; // "2026-10"
  title: string; // "Ekim 2026 özetin 💅"
  newItemCount: number; // Bu ay dolaba giren parça sayısı
  spent: number; // Bu ay eklenen parçaların fiyat toplamı (TL)
  wears: number; // Bu ay kaç kere "Giydim" denmiş
  previousWears: number; // Geçen ay kaç kere
  star: { item: ClothingItem; wears: number } | null; // Ayın yıldızı
  paidOffCount: number; // Bu ay kendini amorti eden parça sayısı
  unwornCount: number; // Bu ay hiç giyilmeyen parça sayısı (ay sonunda dolapta olanlar)
  lines: string[]; // Ekranda alt alta gösterilecek hazır satırlar
  verdict: string; // Ayın makara yorumu
};

// Bir ayın özeti. Ay verilmezse bu ay.
export function monthlySummary(
  items: ClothingItem[],
  month: string = todayString().slice(0, 7)
): MonthlySummary {
  const [year, monthNumber] = month.split('-').map(Number);
  const previous = previousMonth(month);
  const inMonth = (date: string) => date.startsWith(month);

  const newItems = items.filter((item) => inMonth(item.createdAt));
  const spent = newItems.reduce((sum, item) => sum + item.price, 0);
  const wears = items.reduce((sum, item) => sum + item.wearDates.filter(inMonth).length, 0);
  const previousWears = items.reduce(
    (sum, item) => sum + item.wearDates.filter((date) => date.startsWith(previous)).length,
    0
  );

  // Ayın yıldızı: bu ay en çok giyilen (eşitlikte ilk bulunan)
  let star: MonthlySummary['star'] = null;
  for (const item of items) {
    const count = item.wearDates.filter(inMonth).length;
    if (count > 0 && (!star || count > star.wears)) {
      star = { item, wears: count };
    }
  }

  // Bu ay amorti olan: hedefe ulaştığı giyim bu ay yapılmış
  const paidOffCount = items.filter((item) => {
    const reachedOn = [...item.wearDates].sort()[item.targetWears - 1];
    return reachedOn !== undefined && inMonth(reachedOn);
  }).length;

  // Bu ay hiç giyilmeyen: ay bitmeden dolaba girmiş, ama bu ay hiç "Giydim" yok
  const unwornCount = items.filter(
    (item) => item.createdAt.slice(0, 7) <= month && !item.wearDates.some(inMonth)
  ).length;

  const lines: string[] = [];
  lines.push(
    newItems.length > 0
      ? `🛍️ Dolabına ${newItems.length} parça girdi, ${thousands(spent)} TL (${starbucksIndexText(spent)})`
      : '🛍️ Bu ay dolabına yeni parça girmedi 🙌'
  );
  let wearLine = wears > 0 ? `👗 ${wears} kere "Giydim" dedin` : `👗 Bu ay hiç "Giydim" yok 👀`;
  if (previousWears > 0) {
    const change = Math.round(((wears - previousWears) / previousWears) * 100);
    if (change > 0) {
      wearLine += ` (geçen aydan %${change} fazla 📈)`;
    } else if (change < 0) {
      wearLine += ` (geçen aydan %${-change} az 📉)`;
    }
  }
  lines.push(wearLine);
  if (star) {
    lines.push(`⭐ Ayın yıldızı: “${star.item.name}” (${star.wears} kere)`);
  }
  if (paidOffCount > 0) {
    lines.push(`💖 Bu ay ${paidOffCount} parça kendini amorti etti`);
  }
  if (unwornCount > 0) {
    lines.push(`🕸️ Bu ay hiç giyilmeyen: ${unwornCount} parça`);
  }

  // Ayın yorumu: ilk uyan kural seçilir
  let verdict: string;
  if (wears === 0 && newItems.length === 0) {
    verdict = 'Sessiz bir ay… Dolabın seni özledi 🥺';
  } else if (newItems.length > 0 && wears < newItems.length * 3) {
    verdict = 'Bu ay dolap büyüdü ama giyen yok kızım 😤';
  } else if (paidOffCount > 0) {
    verdict = 'Amorti kutlaması var 🎉 Merkez Bankası bu ay seni örnek gösterdi 🏦';
  } else if (previousWears > 0 && wears >= previousWears * 1.2) {
    verdict = 'Giydim sayın tavan yaptı 📈 Enflasyona karşı tek başına savaşıyorsun 💪';
  } else if (newItems.length === 0) {
    verdict = 'Hiç alışveriş yok, sadece giyim var. Ekonomist kadın 💼';
  } else {
    verdict = 'Dengeli bir ay, aynen devam aşko 💅';
  }

  return {
    month,
    title: `${MONTH_NAMES[monthNumber - 1]} ${year} özetin 💅`,
    newItemCount: newItems.length,
    spent,
    wears,
    previousWears,
    star,
    paidOffCount,
    unwornCount,
    lines,
    verdict,
  };
}

// ---------- 🏷️ "Satmayı düşün" listesi ----------

// Bu kadar gündür giyilmeyen (hiç giyilmediyse bu kadar gündür dolapta olan) parça listeye girer
const SELL_AFTER_DAYS = 90;

// İkinci el tahmini: alış fiyatının yaklaşık bu oranı (TAHMİN, ekranda öyle yazılır)
const RESALE_RATE = 0.4;

export type SellCandidate = {
  item: ClothingItem;
  days: number; // Kaç gündür giyilmiyor (hiç giyilmediyse dolaptaki gün sayısı)
  estimate: number; // Tahmini ikinci el değeri (TL, 50'ye yuvarlanmış)
  text: string; // "“Pembe elbise” · 120 gündür askıda · 1.200 TL"
};

export type SellList = {
  candidates: SellCandidate[]; // En pahalıdan ucuza
  totalEstimate: number; // Hepsinin tahmini ikinci el değeri
  text: string; // Özet cümle
};

// Etkinliği henüz gelmemiş parça satılmaz (düğün elbisesi düğünden önce listeye girmesin)
function hasUpcomingEvent(item: ClothingItem, today: string): boolean {
  return item.event !== undefined && item.event.date >= today;
}

// Uzun süredir giyilmeyen ve kendini amorti etmemiş parçalar: "artık bırak, sat"
export function sellList(items: ClothingItem[], today: string = todayString()): SellList {
  const candidates = items
    .filter((item) => !isPaidOff(item) && !hasUpcomingEvent(item, today))
    .map((item) => ({ item, days: daysSinceLastWear(item) }))
    .filter(({ days }) => days >= SELL_AFTER_DAYS)
    .sort((a, b) => b.item.price - a.item.price)
    .map(({ item, days }) => ({
      item,
      days,
      estimate: Math.round((item.price * RESALE_RATE) / 50) * 50,
      text: `“${item.name}” · ${days} gündür askıda · ${thousands(item.price)} TL`,
    }));

  const totalEstimate = candidates.reduce((sum, candidate) => sum + candidate.estimate, 0);
  const text =
    candidates.length === 0
      ? 'Satılacak bir şey yok, dolabın tam bir başarı hikâyesi 👑'
      : `💰 Bunları ikinci elde satsan tahminen ~${thousands(totalEstimate)} TL geri gelir (alış fiyatının yaklaşık %${Math.round(RESALE_RATE * 100)}'ı)`;

  return { candidates, totalEstimate, text };
}
