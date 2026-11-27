/**
 * GIRL MATH – STARBUCKS ENDEKSİ
 *
 * Bir fiyatı günlük harcamalara çevirir: "= 11 iced latte 🧋 ya da 15 filtre kahve ☕"
 * Fiyatlar comparisons.ts'teki listeden gelir; liste güncellenince bu da güncellenir.
 *
 * Ekranda kullanımı:
 *   starbucksIndexText(item.price)  // kısa parça: "= 11 iced latte 🧋 ya da …" (cümle içine gömülür)
 *   starbucksIndexMeme(item.price)  // tek başına makara cümle: "Bu parayla 11 iced latte içer, …"
 *   starbucksIndexList(item.price)  // tam liste (detay ekranı için)
 */

import { COMPARISONS, pickBySum, type Comparison } from '@/lib/comparisons';

// Endeksin ana birimi
const MAIN_UNIT = 'iced latte';

export type IndexEntry = {
  comparison: Comparison;
  count: number; // Bu parayla kaç tane alınır
};

// Fiyata yetişen her kalem için kaç tane alınabileceği. En pahalıdan en ucuza sıralı.
export function starbucksIndexList(price: number): IndexEntry[] {
  return COMPARISONS.filter((comparison) => comparison.price <= price)
    .map((comparison) => ({ comparison, count: Math.floor(price / comparison.price) }))
    .reverse();
}

// Bölünmez boşluk: "1.873 şişe su 💧" satır sonunda "şişe / su" diye kopmasın (sadece kalemler arasında bölünsün)
const NBSP = ' ';

// 28 Kasım (Ebrar, Onur'un haberiyle): sayıya binlik noktası (1873 → 1.873) + kalemin içinde bölünmez boşluk
function formatEntry(entry: IndexEntry): string {
  const unit = entry.comparison.unit.replace(/ /g, NBSP);
  return `${entry.count.toLocaleString('tr-TR')}${NBSP}${unit}${NBSP}${entry.comparison.emoji}`;
}

// "ya da" kısmındaki ikinci kalem: sadece iced latteden PAHALI kalemlerden seçilir (28 Kasım, Onur).
// Eskiden bütün listeden seçiliyordu; büyük fiyatlarda "107 iced latte ya da 1.290 şişe su" gibi saçma
// sayılar çıkıyordu. Uygun kalem yoksa null (cümle sadece iced latteyle kalır).
// Aynı fiyat hep aynı kalemi verir (ekran yenilenince cümle değişmez).
function secondEntry(list: IndexEntry[], main: IndexEntry, price: number): IndexEntry | null {
  const pricier = list.filter(
    (entry) => entry !== main && entry.comparison.price > main.comparison.price
  );
  return pricier.length > 0 ? pricier[Math.round(price) % pricier.length] : null;
}

// Kısa cümle. Örn: "= 107 iced latte 🧋 ya da 24 brunch 🥞"
export function starbucksIndexText(price: number): string {
  const list = starbucksIndexList(price);
  if (list.length === 0) {
    return 'Bir şişe su bile etmez, resmen bedava 💅';
  }

  const main = list.find((entry) => entry.comparison.unit === MAIN_UNIT);
  if (!main) {
    // Iced latte'ye yetmiyor: paranın yettiği en pahalı kalemle anlat
    return `= ${formatEntry(list[0])}`;
  }

  const second = secondEntry(list, main, price);
  if (!second) {
    return `= ${formatEntry(main)}`;
  }
  return `= ${formatEntry(main)} ya da ${formatEntry(second)}`;
}

// Tek başına kullanılan makara cümle (TikTok dili). Örn:
// "Bu parayla 11 iced latte içer, 11 gün main character takılırdın 🧋✨"
// Aynı fiyat hep aynı cümleyi verir. starbucksIndexText'ten farkı: başına "Dolabın" gibi bir şey eklenmez.
export function starbucksIndexMeme(price: number): string {
  const list = starbucksIndexList(price);
  if (list.length === 0) {
    return 'Bir şişe su bile etmez, resmen bedava 💅';
  }

  const main = list.find((entry) => entry.comparison.unit === MAIN_UNIT);
  if (!main) {
    return `${formatEntry(list[0])} eder. Iced latteye bile yetmiyor, girl math'e göre bedava 💅`;
  }

  const n = main.count;
  if (n === 67) {
    return '67 iced latte… 6-7 🤷‍♀️';
  }

  const second = secondEntry(list, main, price);

  const memes = [
    `Bu parayla ${n} iced latte içer, ${n} gün main character takılırdın 🧋✨`,
    second
      ? `${n} iced latte ya da ${second.count} ${second.comparison.unit}… ya da bu. Seçim senin kraliçe 👑`
      : `${n} iced latte… ya da bu. Seçim senin kraliçe 👑`,
    `= ${n} iced latte. Ama latte giyilmiyor, sen bilirsin 💅`,
    `Girl math der ki: ${n} iced latte = 0 TL, çünkü kartla ödendi 💳`,
  ];
  return pickBySum(price, memes);
}
