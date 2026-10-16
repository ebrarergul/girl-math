/**
 * GIRL MATH – KOMBİN MOTORU
 *
 * 1) Renk uyumu: iki rengin birbirine ne kadar gittiğini (arka planda, puanla) ve
 *    kullanıcıya gösterilecek kısa sebebi bulur. Kullanıcı puanı görmez, sadece öneriyi görür.
 * 2) Öneriler: seçilen kıyafete uyan parçalar (matchesFor) ve toplu kombin (outfitFor).
 *
 * Ekranda kullanımı:
 *   matchesFor(item, items)  // [{ category: 'Alt', matches: [{ item, reason }, ...] }, ...]
 *   outfitFor(item, items)   // { items: [...], missing: ['Ayakkabı'], text: 'Bu kombinle …' }
 *   outfitItems(outfit, items) / outfitName(outfit, items) / sortOutfits(outfits)  // Arşiv için
 *
 * Kuralları değiştirmek için sadece aşağıdaki listeleri düzenlemek yeterli.
 */

import type { ColorName } from '@/lib/colors';
import { pickBySum } from '@/lib/comparisons';
import { daysSinceLastWear } from '@/lib/girl-math';
import type { Category, ClothingItem, SavedOutfit } from '@/lib/types';

// ---------- Renk grupları ----------

// Nötrler: her şeyle gider
const NEUTRALS: ColorName[] = ['Siyah', 'Beyaz', 'Gri', 'Bej', 'Lacivert', 'Kot mavisi'];

// Nötr rengin "neden her şeyle gider" cümlesi
const NEUTRAL_REASONS: Partial<Record<ColorName, string>> = {
  Siyah: 'Siyah her şeyi kurtarır 🖤',
  Beyaz: 'Beyaz her şeyle gider 🤍',
  Gri: 'Gri her şeyin yanında sakin durur 🩶',
  Bej: 'Bej her şeye yumuşak bir dokunuş katar 🤎',
  Lacivert: 'Lacivert, siyahın daha şık kuzeni 💙',
  'Kot mavisi': 'Kot her şeyle gider, kurtarıcımız 👖',
};

// Aynı aileden tonlar birbirine yakışır
const FAMILIES: ColorName[][] = [
  ['Kahverengi', 'Haki', 'Bej'], // Toprak tonları
  ['Lacivert', 'Kot mavisi', 'Mavi', 'Açık mavi'], // Mavi ailesi
  ['Kırmızı', 'Bordo', 'Pembe'], // Kırmızı-pembe ailesi
];

// Bilinen şık ikililer
const CHIC_PAIRS: [ColorName, ColorName, string][] = [
  ['Pembe', 'Kırmızı', 'Pembe + kırmızı: cesur ve çok şık 💋'],
  ['Pembe', 'Açık mavi', 'Pastel ikili, tam bahar havası 🌸'],
  ['Bordo', 'Pembe', 'Bordo + pembe, tatlı ama iddialı 🍒'],
  ['Pembe', 'Yeşil', 'Pembe + yeşil, tam bir çiçek bahçesi 🌷'],
  ['Mavi', 'Sarı', 'Mavi + sarı, yaz enerjisi ☀️'],
  ['Haki', 'Turuncu', 'Haki + turuncu, sonbahar havası 🍂'],
];

// Klasik kurala göre riskli ikililer
const CAREFUL_PAIRS: [ColorName, ColorName][] = [
  ['Siyah', 'Kahverengi'],
  ['Siyah', 'Lacivert'],
];

// Çatışanlar: hiç önerilmez
const CLASH_PAIRS: [ColorName, ColorName][] = [
  ['Kırmızı', 'Turuncu'],
  ['Kırmızı', 'Yeşil'],
  ['Mor', 'Turuncu'],
];

// Bu puanın altındaki ikililer öneri olarak gösterilmez
export const MIN_MATCH_SCORE = 40;

export type ColorMatch = {
  score: number; // 0-100, sadece sıralama için (ekranda gösterilmez)
  reason: string; // Kullanıcıya gösterilecek kısa sebep
};

function isPair(a: ColorName, b: ColorName, x: ColorName, y: ColorName): boolean {
  return (a === x && b === y) || (a === y && b === x);
}

// İki rengin uyumu. Renklerden biri bilinmiyorsa (eski kayıt) orta puan verir.
export function colorMatch(a: ColorName | undefined, b: ColorName | undefined): ColorMatch {
  if (!a || !b) {
    return { score: 50, reason: 'Rengini bilmiyorum ama bir dene 🤷‍♀️' };
  }
  if (a === 'Desenli' && b === 'Desenli') {
    return { score: 10, reason: 'İki desen bir arada göz yorar 🙈' };
  }
  if (CAREFUL_PAIRS.some(([x, y]) => isPair(a, b, x, y))) {
    return { score: 60, reason: 'Klasik kurala göre riskli, ama cesursan dene 🤔' };
  }
  if (a === b) {
    return { score: 80, reason: `Tepeden tırnağa ${a.toLocaleLowerCase('tr')}, iddialı! ✨` };
  }

  const neutral = NEUTRALS.includes(a) ? a : NEUTRALS.includes(b) ? b : null;
  if (neutral) {
    return { score: 90, reason: NEUTRAL_REASONS[neutral] ?? 'Nötr renk her şeyle gider ✨' };
  }
  if (a === 'Desenli' || b === 'Desenli') {
    return { score: 40, reason: 'Desen + canlı renk biraz kalabalık, dikkatli ol 😵‍💫' };
  }
  const chic = CHIC_PAIRS.find(([x, y]) => isPair(a, b, x, y));
  if (chic) {
    return { score: 75, reason: chic[2] };
  }
  if (FAMILIES.some((family) => family.includes(a) && family.includes(b))) {
    return { score: 85, reason: 'Aynı rengin tonları, çok şık ✨' };
  }
  if (CLASH_PAIRS.some(([x, y]) => isPair(a, b, x, y))) {
    return { score: 25, reason: `${a} + ${b.toLocaleLowerCase('tr')}? Bence hiç 🙅‍♀️` };
  }
  return { score: 50, reason: 'Fena değil, denemeye değer 🙂' };
}

// ---------- Öneriler ----------

// Seçilen parçanın kategorisine göre hangi kategorilerden öneri yapılır (gösterim sırası)
const SUGGEST_CATEGORIES: Record<Category, Category[]> = {
  Üst: ['Alt', 'Ayakkabı', 'Dış giyim', 'Çanta', 'Aksesuar'],
  Alt: ['Üst', 'Ayakkabı', 'Dış giyim', 'Çanta', 'Aksesuar'],
  Elbise: ['Ayakkabı', 'Dış giyim', 'Çanta', 'Aksesuar'],
  'Dış giyim': ['Üst', 'Alt', 'Elbise', 'Ayakkabı', 'Çanta', 'Aksesuar'],
  Ayakkabı: ['Üst', 'Alt', 'Elbise', 'Dış giyim', 'Çanta', 'Aksesuar'],
  Çanta: ['Üst', 'Alt', 'Elbise', 'Ayakkabı', 'Dış giyim', 'Aksesuar'],
  Aksesuar: ['Üst', 'Alt', 'Elbise', 'Ayakkabı', 'Dış giyim', 'Çanta'],
};

// Kombinin iskeleti: "Üst + Alt + Ayakkabı" ya da "Elbise + Ayakkabı"
const SEPARATES: Category[] = ['Üst', 'Alt', 'Ayakkabı'];
const DRESS: Category[] = ['Elbise', 'Ayakkabı'];
// İskelete uyarsa eklenen süsler
const EXTRAS: Category[] = ['Dış giyim', 'Çanta', 'Aksesuar'];

// Bir süsün kombine eklenmesi için yeterli uyum
const EXTRA_MIN_SCORE = 75;

// Nötr olmayan en fazla kaç renk olabilir ("en fazla 3 renk" kuralı)
const MAX_VIVID_COLORS = 3;

export type Match = {
  item: ClothingItem;
  reason: string; // "Beyaz her şeyle gider 🤍"
};

export type CategoryMatches = {
  category: Category;
  matches: Match[]; // En iyi uyandan aza sıralı
};

export type Outfit = {
  items: ClothingItem[]; // İlk eleman seçilen parça
  missing: Category[]; // Dolapta uygun parça olmadığı için eksik kalan kategoriler
  text: string; // Kombin için eğlenceli cümle
};

// Sıralama: önce uyum, uyum eşitse uzun süredir giyilmeyen öne (girl math dokunuşu)
function compareCandidates(a: { score: number; item: ClothingItem }, b: { score: number; item: ClothingItem }) {
  return b.score - a.score || daysSinceLastWear(b.item) - daysSinceLastWear(a.item);
}

// 1) Parça parça öneri: seçilen kıyafete her kategoriden uyan parçalar
export function matchesFor(base: ClothingItem, items: ClothingItem[]): CategoryMatches[] {
  const result: CategoryMatches[] = [];
  for (const category of SUGGEST_CATEGORIES[base.category]) {
    const matches = items
      .filter((item) => item.id !== base.id && item.category === category)
      .map((item) => ({ item, ...colorMatch(base.color, item.color) }))
      .filter((candidate) => candidate.score >= MIN_MATCH_SCORE)
      .sort(compareCandidates)
      .map(({ item, reason }) => ({ item, reason }));
    if (matches.length > 0) {
      result.push({ category, matches });
    }
  }
  return result;
}

const NEUTRAL_SET = new Set<ColorName>(NEUTRALS);

function vividColorCount(pieces: ClothingItem[]): number {
  const vivid = new Set(
    pieces.map((piece) => piece.color).filter((color) => color && !NEUTRAL_SET.has(color))
  );
  return vivid.size;
}

// Adayın kombindeki bütün parçalarla uyumu: en kötü ikili ve ortalama
function fitWith(candidate: ClothingItem, pieces: ClothingItem[]) {
  const scores = pieces.map((piece) => colorMatch(piece.color, candidate.color).score);
  return {
    min: Math.min(...scores),
    average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
  };
}

// Kategoriden kombine en iyi uyan parçayı seçer (yoksa null)
function bestFor(category: Category, pieces: ClothingItem[], items: ClothingItem[], minScore: number) {
  const used = new Set(pieces.map((piece) => piece.id));
  const candidates = items
    .filter((item) => item.category === category && !used.has(item.id))
    .filter((item) => vividColorCount([...pieces, item]) <= MAX_VIVID_COLORS)
    .map((item) => ({ item, ...fitWith(item, pieces) }))
    .filter((candidate) => candidate.min >= MIN_MATCH_SCORE && candidate.average >= minScore)
    .map((candidate) => ({ item: candidate.item, score: candidate.average }))
    .sort(compareCandidates);
  return candidates[0]?.item ?? null;
}

// Verilen iskeletle kombin kurar
function buildOutfit(base: ClothingItem, skeleton: Category[], items: ClothingItem[]) {
  const pieces = [base];
  const missing: Category[] = [];
  for (const category of skeleton) {
    if (category === base.category) {
      continue;
    }
    const best = bestFor(category, pieces, items, MIN_MATCH_SCORE);
    if (best) {
      pieces.push(best);
    } else {
      missing.push(category);
    }
  }
  for (const category of EXTRAS) {
    if (category === base.category) {
      continue;
    }
    const best = bestFor(category, pieces, items, EXTRA_MIN_SCORE);
    if (best) {
      pieces.push(best);
    }
  }
  return { pieces, missing };
}

// Kombin cümlesi: içinde uzun süredir giyilmeyen parça varsa ona takılır
function outfitText(pieces: ClothingItem[]): string {
  const forgotten = pieces
    .slice(1)
    .map((item) => ({ item, days: daysSinceLastWear(item) }))
    .sort((a, b) => b.days - a.days)[0];
  if (forgotten && forgotten.days >= 14) {
    return `Bu kombinle “${forgotten.item.name}” ${forgotten.days} gün sonra yeniden gün yüzü görür 💅`;
  }
  const total = pieces.reduce((sum, item) => sum + item.price, 0);
  return pickBySum(total, [
    'Bugün sokaklar senin kraliçe 👑',
    'Bu kombinle Merkez Bankası bile sana faiz verir 💸',
    'Dolabındakini giyen kadın, en tasarruflu kadındır 💖',
    'Kombin hazır, sana sadece poz vermek kalıyor 📸',
  ]);
}

// 2) Toplu kombin: seçilen parçanın etrafında "Üst + Alt + Ayakkabı" ya da "Elbise + Ayakkabı"
// kurar, uyarsa dış giyim / çanta / aksesuar ekler.
export function outfitFor(base: ClothingItem, items: ClothingItem[]): Outfit {
  let result;
  if (base.category === 'Elbise') {
    result = buildOutfit(base, DRESS, items);
  } else if (base.category === 'Üst' || base.category === 'Alt') {
    result = buildOutfit(base, SEPARATES, items);
  } else {
    // Ayakkabı, çanta, aksesuar, dış giyim: iki iskeleti de dene, daha az eksiği olanı seç
    const separates = buildOutfit(base, SEPARATES, items);
    const dress = buildOutfit(base, DRESS, items);
    result = dress.missing.length < separates.missing.length ? dress : separates;
  }
  return { items: result.pieces, missing: result.missing, text: outfitText(result.pieces) };
}

// ---------- Kayıtlı kombinler (Arşiv) ----------

// Kayıtlı kombinin kıyafetleri (dolaptan silinmiş olanlar atlanır)
export function outfitItems(outfit: SavedOutfit, items: ClothingItem[]): ClothingItem[] {
  return outfit.itemIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is ClothingItem => item !== undefined);
}

// Kombinin ekranda görünecek adı: kullanıcının verdiği ad ya da otomatik ad
export function outfitName(outfit: SavedOutfit, items: ClothingItem[]): string {
  if (outfit.name) {
    return outfit.name;
  }
  const first = outfitItems(outfit, items)[0];
  return first ? `“${first.name}” kombini` : 'Kombin';
}

// Arşiv sırası: önce favoriler, sonra en yeni kaydedilen
export function sortOutfits(outfits: SavedOutfit[]): SavedOutfit[] {
  return [...outfits].sort(
    (a, b) => Number(b.favorite) - Number(a.favorite) || b.createdAt.localeCompare(a.createdAt)
  );
}
