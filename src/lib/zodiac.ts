/**
 * GIRL MATH – BURÇLAR VE GÖKYÜZÜ
 *
 * 1) 12 burcun bilgileri: element, yönetici gezegen, tarih aralığı, stil kişiliği, şanslı renkler.
 * 2) Günün gökyüzü (internet gerekmez, telefonda hesaplanır):
 *    - Ay'ın hangi burçta olduğu (yaklaşık formül, birkaç saatlik sapmayla doğru)
 *    - Ay'ın evresi (yeniay / dolunay …)
 *    - Güneş'in hangi burçta olduğu
 *    - Merkür retrosu (gerçek tarihler, aşağıdaki listede)
 *
 * Ekranda kullanımı:
 *   getSky()                    // { moonSign, sunSign, moonPhase, mercury: { retrograde, ... } }
 *   moonHouse('Aslan', sky)     // Ay, Aslan'a göre kaçıncı evde (1-12)
 *   dailyHoroscope('Akrep', items)  // { title, personality, lines, luckyColor, suggestion }
 *   weeklyHoroscope('Akrep')        // { title, range, love, money, wardrobe }
 */

import type { ColorName } from '@/lib/colors';
import { daysSinceLastWear } from '@/lib/girl-math';
import { outfitFor, type Outfit } from '@/lib/outfits';
import type { ClothingItem } from '@/lib/types';

// ---------- Burçlar ----------

export type Element = 'Ateş' | 'Toprak' | 'Hava' | 'Su';

export const ZODIAC_SIGNS = [
  {
    name: 'Koç',
    emoji: '♈',
    element: 'Ateş',
    ruler: 'Mars',
    start: [3, 21],
    style: 'İlk gördüğünü alır, düşünmeye vakit yok; cesur ve sportif parçalar onun işi',
    luckyColors: ['Kırmızı', 'Turuncu'],
  },
  {
    name: 'Boğa',
    emoji: '♉',
    element: 'Toprak',
    ruler: 'Venüs',
    start: [4, 20],
    style: 'Kaliteli kumaş ve konfor sever; bir kere alır, ömür boyu giyer',
    luckyColors: ['Yeşil', 'Pembe', 'Bej'],
  },
  {
    name: 'İkizler',
    emoji: '♊',
    element: 'Hava',
    ruler: 'Merkür',
    start: [5, 21],
    style: 'Günde iki kombin değiştirir, aksesuarla oynar, aynı şeyden çabuk sıkılır',
    luckyColors: ['Sarı', 'Açık mavi'],
  },
  {
    name: 'Yengeç',
    emoji: '♋',
    element: 'Su',
    ruler: 'Ay',
    start: [6, 21],
    style: 'Anısı olan parçalara bağlanır; annesinin hırkasını hâlâ giyer',
    luckyColors: ['Beyaz', 'Gri', 'Açık mavi'],
  },
  {
    name: 'Aslan',
    emoji: '♌',
    element: 'Ateş',
    ruler: 'Güneş',
    start: [7, 23],
    style: 'Sahne onundur; parıltı ve dikkat çeken parçalar olmadan evden çıkmaz',
    luckyColors: ['Sarı', 'Turuncu', 'Kırmızı'],
  },
  {
    name: 'Başak',
    emoji: '♍',
    element: 'Toprak',
    ruler: 'Merkür',
    start: [8, 23],
    style: 'Dolabı renk sırasına göre dizer; sade, düzenli ve ütülü',
    luckyColors: ['Bej', 'Kahverengi', 'Haki'],
  },
  {
    name: 'Terazi',
    emoji: '♎',
    element: 'Hava',
    ruler: 'Venüs',
    start: [9, 23],
    style: 'Estetik takıntısı var; uyumlu kombin olmadan çıkmaz, kararsızlıktan geç kalır',
    luckyColors: ['Pembe', 'Açık mavi'],
  },
  {
    name: 'Akrep',
    emoji: '♏',
    element: 'Su',
    ruler: 'Plüton ve Mars',
    start: [10, 23],
    style: 'Siyahın kraliçesi; gizemli, iddialı ve deri parçalar',
    luckyColors: ['Siyah', 'Bordo'],
  },
  {
    name: 'Yay',
    emoji: '♐',
    element: 'Ateş',
    ruler: 'Jüpiter',
    start: [11, 22],
    style: 'Rahatına düşkün maceracı; seyahat çantası hep hazır',
    luckyColors: ['Mor', 'Turuncu'],
  },
  {
    name: 'Oğlak',
    emoji: '♑',
    element: 'Toprak',
    ruler: 'Satürn',
    start: [12, 22],
    style: 'Klasik ve güçlü; blazer ve "patron" havası',
    luckyColors: ['Lacivert', 'Siyah', 'Kahverengi'],
  },
  {
    name: 'Kova',
    emoji: '♒',
    element: 'Hava',
    ruler: 'Uranüs ve Satürn',
    start: [1, 20],
    style: 'Kimsenin giymediğini giyer; vintage avcısı, kurallara uymaz',
    luckyColors: ['Mavi', 'Desenli'],
  },
  {
    name: 'Balık',
    emoji: '♓',
    element: 'Su',
    ruler: 'Neptün ve Jüpiter',
    start: [2, 19],
    style: 'Hayalperest; uçuşan kumaşlar ve pasteller',
    luckyColors: ['Mor', 'Açık mavi', 'Pembe'],
  },
] as const satisfies readonly {
  name: string;
  emoji: string;
  element: Element;
  ruler: string;
  start: readonly [number, number]; // Burcun başladığı [ay, gün]
  style: string;
  luckyColors: readonly ColorName[];
}[];

export type ZodiacName = (typeof ZODIAC_SIGNS)[number]['name'];
export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export function zodiacSign(name: ZodiacName): ZodiacSign {
  return ZODIAC_SIGNS.find((sign) => sign.name === name)!;
}

// Burcun zodyaktaki sırası (Koç = 0 … Balık = 11)
function signIndex(name: ZodiacName): number {
  return ZODIAC_SIGNS.findIndex((sign) => sign.name === name);
}

// ---------- Gökyüzü hesapları ----------

const DEG = Math.PI / 180;
const J2000 = Date.UTC(2000, 0, 1, 12); // Gökbilimde başlangıç kabul edilen an

function normalize(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

// Ay ve Güneş'in gökteki boylamı (derece). Basitleştirilmiş gökbilim formülü.
function longitudes(date: Date) {
  const d = (date.getTime() - J2000) / 864e5; // J2000'den bu yana geçen gün
  const moonMean = 218.316 + 13.176396 * d;
  const moonAnomaly = 134.963 + 13.064993 * d;
  const elongation = 297.85 + 12.190749 * d;
  const sunAnomaly = 357.529 + 0.98560028 * d;
  const moon = normalize(
    moonMean +
      6.289 * Math.sin(moonAnomaly * DEG) +
      1.274 * Math.sin((2 * elongation - moonAnomaly) * DEG) +
      0.658 * Math.sin(2 * elongation * DEG) -
      0.186 * Math.sin(sunAnomaly * DEG) -
      0.059 * Math.sin((2 * elongation - 2 * moonAnomaly) * DEG) -
      0.057 * Math.sin((2 * elongation - moonAnomaly - sunAnomaly) * DEG) +
      0.053 * Math.sin((2 * elongation + moonAnomaly) * DEG)
  );
  const sun = normalize(280.46 + 0.9856474 * d + 1.915 * Math.sin(sunAnomaly * DEG));
  return { moon, sun };
}

export type MoonPhase = 'Yeniay' | 'Büyüyen Ay' | 'Dolunay' | 'Küçülen Ay';

// Ay ile Güneş arasındaki açı (0 = yeniay, 180 = dolunay)
function phaseAngle(date: Date): number {
  const { moon, sun } = longitudes(date);
  return normalize(moon - sun);
}

// Hedef açıya (0 ya da 180) uzaklık
function distanceTo(angle: number, target: number): number {
  const diff = Math.abs(normalize(angle - target));
  return Math.min(diff, 360 - diff);
}

// Ay evresi. Yeniay/dolunay sadece TAM gününde söylenir: o günün öğlesi, bir önceki ve bir
// sonraki günün öğlesinden hedefe daha yakınsa.
function phaseName(noon: Date): MoonPhase {
  const day = 864e5;
  const angles = [-day, 0, day].map((shift) => phaseAngle(new Date(noon.getTime() + shift)));
  const closestDay = (target: number) => {
    const [before, today, after] = angles.map((angle) => distanceTo(angle, target));
    return today < 15 && today <= before && today < after;
  };
  if (closestDay(0)) {
    return 'Yeniay';
  }
  if (closestDay(180)) {
    return 'Dolunay';
  }
  return angles[1] < 180 ? 'Büyüyen Ay' : 'Küçülen Ay';
}

// Merkür retrosu dönemleri (Türkiye saatine göre gün olarak). Kaynak: Almanac / NASA efemerisi.
// Listeye yeni yılların tarihleri eklenmeli (2027 sonrası).
const MERCURY_RETROGRADES: [string, string][] = [
  ['2026-02-26', '2026-03-20'],
  ['2026-06-29', '2026-07-23'],
  ['2026-10-24', '2026-11-13'],
  ['2027-02-09', '2027-03-03'],
  ['2027-06-10', '2027-07-04'],
  ['2027-10-07', '2027-10-28'],
];

export type MercuryStatus = {
  retrograde: boolean; // Bugün retroda mı?
  daysLeft: number | null; // Retrodaysa bitmesine kaç gün kaldı
  daysUntilNext: number | null; // Retroda değilse sıradakine kaç gün var (bilinmiyorsa null)
};

function dayString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 864e5
  );
}

function mercuryStatus(today: string): MercuryStatus {
  const current = MERCURY_RETROGRADES.find(([start, end]) => start <= today && today <= end);
  if (current) {
    return { retrograde: true, daysLeft: daysBetween(today, current[1]), daysUntilNext: null };
  }
  const next = MERCURY_RETROGRADES.find(([start]) => start > today);
  return {
    retrograde: false,
    daysLeft: null,
    daysUntilNext: next ? daysBetween(today, next[0]) : null,
  };
}

export type Sky = {
  date: string; // "2026-10-16"
  moonSign: ZodiacName;
  sunSign: ZodiacName;
  moonPhase: MoonPhase;
  mercury: MercuryStatus;
};

// Verilen günün gökyüzü (öğlen saatine göre). Tarih verilmezse bugün.
export function getSky(date: Date = new Date()): Sky {
  const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const { moon, sun } = longitudes(noon);
  const today = dayString(noon);
  return {
    date: today,
    moonSign: ZODIAC_SIGNS[Math.floor(moon / 30)].name,
    sunSign: ZODIAC_SIGNS[Math.floor(sun / 30)].name,
    moonPhase: phaseName(noon),
    mercury: mercuryStatus(today),
  };
}

// Ay, bu burca göre kaçıncı evde? (Astrolojide "tam burç ev sistemi": kendi burcun 1. ev)
// 1 görünüş · 2 para · 3 iletişim · 4 ev/aile · 5 aşk/eğlence · 6 rutin · 7 ilişkiler ·
// 8 ortak para · 9 seyahat · 10 kariyer · 11 arkadaşlar · 12 dinlenme
export function moonHouse(sign: ZodiacName, sky: Sky): number {
  return ((signIndex(sky.moonSign) - signIndex(sign) + 12) % 12) + 1;
}

// İki burç aynı elementte mi?
export function sameElement(a: ZodiacName, b: ZodiacName): boolean {
  return zodiacSign(a).element === zodiacSign(b).element;
}

// ---------- Günlük yorum ----------

// Ay'ın evine göre cümleler (her evde 2 tane; Ay aynı evde kaldığı günlerde sırayla değişir)
const HOUSE_LINES: Record<number, [string, string]> = {
  1: [
    "Ay senin burcunda 🌙 Bugün aynaya her baktığında 'ben bu kadar güzel miydim' diyeceksin. En sevdiğin parçayı çıkar.",
    "Ay senin burcunda 🌙 Enerjin yüksek, görünüşün ön planda. Bugün 'sade' kelimesini unut.",
  ],
  2: [
    'Ay para evinde 💸 Kartını cüzdanın en derin köşesine sakla. Sepettekiler sabaha kadar bekleyebilir.',
    "Ay para evinde 💸 'İndirimde' yazısı bugün sana çok göz kırpacak. Sözleşmenin 4. maddesine sığınma, sepeti onaylama 📜",
  ],
  3: [
    "Ay iletişim evinde 💬 Kombinine iltifat eden çok olacak. Cevabın hazır olsun: 'Girl math ile aldım.'",
    'Ay iletişim evinde 💬 Mesajlaşma günü. Gruba kombin fotoğrafı atmadan önce ışığı ayarla 📸',
  ],
  4: [
    "Ay aile evinde 🏠 Annenin 'yine mi yeni kıyafet' bakışına hazırlıklı ol. Dolaptan bir şey giy, delil bırakma.",
    'Ay aile evinde 🏠 Evde rahat bir gün. Dolabın arka sırasındaki unutulmuş parçalara bir göz at 🔦',
  ],
  5: [
    'Ay aşk ve eğlence evinde 💘 Flörtöz bir gün. En iddialı parçan bugün dolapta kalmasın.',
    'Ay aşk ve eğlence evinde 💘 Date varsa aynı kıyafeti üst üste giyme, yıldızlar da fark ediyor 👀',
  ],
  6: [
    'Ay rutin evinde 📋 Konforlu ama düzgün bir kombin günü. Dolabı düzenlemek için de yıldızlar seninle.',
    'Ay rutin evinde 📋 Okul, iş, spor… Bugün işe yarar parçaların günü. Rahat ayakkabıyı unutma 👟',
  ],
  7: [
    'Ay karşı burcunda 🤝 Başkalarının fikri bugün fazla önemli gelebilir. Kombinini kimseye sorma, kendine güven.',
    'Ay karşı burcunda 🤝 İlişkiler gündemde. Sevgilinle uyumlu kombin fikri bugün çok tatlı durur 💞',
  ],
  8: [
    'Ay dönüşüm evinde 🦋 Uzun süredir giymediğin bir parçaya yeni bir hayat ver ya da satışa koy.',
    'Ay dönüşüm evinde 🦋 Kredi kartı ekstresi bugün kötü haber gibi görünebilir. Açma, moralini bozma 🙈',
  ],
  9: [
    'Ay keşif evinde ✈️ Hiç denemediğin bir renk ikilisini dene, yıldızlar arkanda.',
    'Ay keşif evinde ✈️ Bir yerlere kaçmak istiyorsun. Seyahat kombinini kafanda hazırla 🧳',
  ],
  10: [
    "Ay kariyer evinde 💼 Bugün herkes sana bakıyor. 'Patron' kombinini çıkar.",
    'Ay kariyer evinde 💼 İmajın ön planda. Ütülü bir gömlek bugün sana terfi getirebilir 😌',
  ],
  11: [
    'Ay arkadaşlar evinde 👯‍♀️ Kızlar buluşması kokuyor. Grup fotoğrafında aynı kıyafeti 3. kez giyme 📸',
    'Ay arkadaşlar evinde 👯‍♀️ Kızlarla kıyafet takası için harika bir gün. Bedava kıyafet = girl math 💖',
  ],
  12: [
    "Ay dinlenme evinde 🛌 Bugün eşofman serbest. Ama kural kuraldır: eşofmana da 'Giydim' bas.",
    'Ay dinlenme evinde 🛌 İçine kapanık bir gün. Dolabın en yumuşak parçası seni çağırıyor ☁️',
  ],
};

const PHASE_LINES: Record<MoonPhase, string> = {
  Yeniay:
    "🌑 Yeniay: yeni başlangıçlar için harika, yeni kıyafet almak için değil 😌 Dolabından 'yeni gibi' bir kombin çıkar.",
  'Büyüyen Ay': "🌒 Ay büyüyor: giydikçe maliyetin küçülsün. 'Giydim' sayını artırma vakti.",
  Dolunay: '🌕 Dolunay: bırakma zamanı. Aylardır giymediğin parçaları ayır, satışa koy.',
  'Küçülen Ay': '🌘 Ay küçülüyor: harcamaları da küçültmek için en doğru zaman.',
};

// Bir gün yorumunda en fazla kaç gökyüzü cümlesi olur
const MAX_SKY_LINES = 3;

// Retro / sezon "yaklaşıyor" cümlesi kaç gün kala çıkar
const SOON_DAYS = 7;

// Günün numarası (cümle ve renk seçimini günden güne değiştirmek için)
function dayNumber(date: string): number {
  return Math.round(new Date(`${date}T00:00:00`).getTime() / 864e5);
}

// Burç sezonunun başlamasına kaç gün var (bu yıl ya da gelecek yıl)
function daysUntilSeason(sign: ZodiacSign, today: string): number {
  const [month, day] = sign.start;
  const year = Number(today.slice(0, 4));
  const thisYear = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const next = thisYear >= today ? thisYear : `${year + 1}${thisYear.slice(4)}`;
  return daysBetween(today, next);
}

// Retro ya da burç sezonu cümleleri (sadece o günlerde çıkar)
function specialLines(sign: ZodiacSign, sky: Sky): string[] {
  const lines: string[] = [];
  const { mercury } = sky;
  if (mercury.retrograde) {
    lines.push(
      `☿ Merkür retroda (${mercury.daysLeft} gün kaldı): eski kıyafetler ve eski sevgililer geri döner 👀 Yeni alışveriş yapma, iade için mükemmel zaman.`
    );
  } else if (mercury.daysUntilNext !== null && mercury.daysUntilNext <= SOON_DAYS) {
    lines.push(
      `☿ ${mercury.daysUntilNext} gün sonra Merkür retrosu başlıyor. Kargodaki siparişlerini şimdiden takip et 📦`
    );
  }
  const untilSeason = daysUntilSeason(sign, sky.date);
  if (sky.sunSign === sign.name) {
    lines.push('☀️ Burç sezonun! Doğum günü kombinini planla 🎂');
  } else if (untilSeason > 0 && untilSeason <= SOON_DAYS) {
    lines.push(`☀️ ${untilSeason} gün sonra sezonun başlıyor, doğum günü listeni şimdiden yap 🎁`);
  }
  return lines;
}

export type DailyHoroscope = {
  title: string; // "♏ Akrep · Bugün"
  personality: string; // Burcun stil kişiliği
  lines: string[]; // En fazla 3 gökyüzü cümlesi (Ay'ın evi, retro/sezon, Ay evresi)
  luckyColor: ColorName;
  suggestion: { item: ClothingItem; text: string; outfit: Outfit } | null; // Dolap boşsa null
};

// Dolaptan günün parçası: şanslı renkte olan (yoksa en uzun süredir giyilmeyen)
function pickSuggestion(luckyColor: ColorName, items: ClothingItem[]) {
  if (items.length === 0) {
    return null;
  }
  const byForgotten = [...items].sort((a, b) => daysSinceLastWear(b) - daysSinceLastWear(a));
  const lucky = byForgotten.find((item) => item.color === luckyColor);
  const item = lucky ?? byForgotten[0];
  const days = daysSinceLastWear(item);
  let text: string;
  if (lucky && days >= 14) {
    text = `👗 Şanslı renginde: “${item.name}”, ${days} gündür askıda. Bugün onun günü!`;
  } else if (lucky) {
    text = `👗 Şanslı renginde: “${item.name}” tam bugünlük!`;
  } else {
    text = `👗 Dolabında bu renk yok ama yıldızlar “${item.name}” diyor (${days} gündür askıda).`;
  }
  return { item, text, outfit: outfitFor(item, items) };
}

// Günlük burç yorumu. Aynı gün aynı burca hep aynı yorum; ertesi gün değişir.
export function dailyHoroscope(
  signName: ZodiacName,
  items: ClothingItem[],
  date: Date = new Date()
): DailyHoroscope {
  const sign = zodiacSign(signName);
  const sky = getSky(date);
  const day = dayNumber(sky.date);

  const houseLine = HOUSE_LINES[moonHouse(signName, sky)][day % 2];
  const lines = [houseLine, ...specialLines(sign, sky), PHASE_LINES[sky.moonPhase]].slice(
    0,
    MAX_SKY_LINES
  );

  const luckyColor = sign.luckyColors[(day + signIndex(signName)) % sign.luckyColors.length];

  return {
    title: `${sign.emoji} ${sign.name} · Bugün`,
    personality: sign.style,
    lines,
    luckyColor,
    suggestion: pickSuggestion(luckyColor, items),
  };
}

// ---------- Haftalık yorum ----------

const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
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

// Element başına ikişer cümle (hafta numarasına göre sırayla değişir)
const LOVE_LINES: Record<Element, [string, string]> = {
  Ateş: [
    '💘 Ateş gibi bir hafta: ilk adımı sen at, kombinin de cesur olsun 🔥',
    '💘 Flört enerjin yüksek ama sabrın düşük. Mesajlara hemen cevap verme, havanı koru 😌',
  ],
  Toprak: [
    "💘 Sağlam ve yavaş bir hafta: kahve date'i, sade ama kaliteli bir kombin ister ☕",
    '💘 Güven veren insanları çekiyorsun. Klasik parçaların bu hafta çok iş görür 🤎',
  ],
  Hava: [
    '💘 Muhabbet haftası: kombinden çok sohbetin konuşulacak, ama kombin yine de önemli 💬',
    '💘 Kararsızlık modu: iki kişi, iki kombin arasında kalabilirsin. Yazı tura at 🪙',
  ],
  Su: [
    '💘 Duygusal bir hafta: romantik film + rahat kombin = mükemmel akşam 🎬',
    "💘 Sezgilerin çok güçlü. 'Bu kişi bana göre değil' diyorsan haklısın 🔮",
  ],
};

const MONEY_LINES: Record<Element, [string, string]> = {
  Ateş: [
    '💸 Anlık alışveriş riski yüksek. Sepete at, 24 saat bekle; hâlâ istiyorsan… yine bekle 🛒',
    '💸 Cömert bir hafta: arkadaşlarına ısmarlarken kendi bütçeni unutma ☕',
  ],
  Toprak: [
    '💸 Biriktirme haftası. Alışveriş yapmadığın her gün bir iced latte kazandın say 🧋',
    '💸 Kaliteli tek parça, ucuz on parçadan iyidir. Bu hafta bunu kendine hatırlat 💎',
  ],
  Hava: [
    "💸 Arkadaşlar 'hadi alışverişe gidelim' diyecek. Bütçeni telefonuna not al 📱",
    "💸 Sosyal harcamalar artabilir. Brunch'lar planlı olsun 🥞",
  ],
  Su: [
    '💸 Duygusal alışverişe dikkat: moralin bozuksa sepeti kapat 🫶',
    "💸 Sezgin 'bu indirim sahte' diyorsa haklısın 🔍",
  ],
};

const WARDROBE_LINES: Record<Element, [string, string]> = {
  Ateş: [
    '👗 Bu hafta en renkli parçan dolapta kalmasın 🔥',
    "👗 'Özel gün' diye sakladığın parçayı sıradan bir günde giy. Her gün özel ✨",
  ],
  Toprak: [
    '👗 Dolap düzenleme haftası: renk sırasına diz, kayıp parçaları bul 🧺',
    '👗 Bej, kahverengi, haki… toprak tonların bu hafta seni çok iyi taşır 🤎',
  ],
  Hava: [
    '👗 Aksesuar haftası: aynı kombine farklı bir takı, yepyeni bir görünüm 💍',
    '👗 Hiç denemediğin bir renk ikilisini dene, kombin önerileri sana yardım eder 🎨',
  ],
  Su: [
    '👗 Yumuşak kumaşlar ve anısı olan parçalar bu hafta sana iyi gelir ☁️',
    '👗 Dolabın arka sırasında unuttuğun bir parça seni bekliyor, bul onu 🔦',
  ],
};

export type WeeklyHoroscope = {
  title: string; // "♏ Akrep · Bu hafta"
  range: string; // "12 – 18 Ekim"
  love: string; // 💘 Aşk
  money: string; // 💸 Para
  wardrobe: string; // 👗 Dolap
};

// Haftanın Pazartesi'si
function weekStart(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const fromMonday = (start.getDay() + 6) % 7; // Pazartesi = 0
  start.setDate(start.getDate() - fromMonday);
  return start;
}

function rangeText(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const startMonth = MONTH_NAMES[start.getMonth()];
  const endMonth = MONTH_NAMES[end.getMonth()];
  return startMonth === endMonth
    ? `${start.getDate()} – ${end.getDate()} ${endMonth}`
    : `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth}`;
}

// Haftalık burç yorumu: haftanın gerçek gök olaylarına (dolunay, yeniay, Merkür retrosu,
// Güneş'in burca girişi) göre; olay yoksa elemente göre cümle. Bütün hafta aynı kalır.
export function weeklyHoroscope(signName: ZodiacName, date: Date = new Date()): WeeklyHoroscope {
  const sign = zodiacSign(signName);
  const start = weekStart(date);
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(day.getDate() + index);
    return { day, sky: getSky(day) };
  });
  const before = new Date(start);
  before.setDate(before.getDate() - 1);
  const skyBefore = getSky(before);
  // Bir önceki günün gökyüzü (haftanın ilk günü için haftadan önceki gün)
  const previousSky = (index: number) => (index === 0 ? skyBefore : days[index - 1].sky);
  const dayName = (day: Date) => DAY_NAMES[day.getDay()];

  // Haftanın olayları
  const fullMoon = days.find(({ sky }) => sky.moonPhase === 'Dolunay');
  const newMoon = days.find(({ sky }) => sky.moonPhase === 'Yeniay');
  const retroThisWeek = days.some(({ sky }) => sky.mercury.retrograde);
  const retroStart = days.find(
    ({ sky }, index) => sky.mercury.retrograde && !previousSky(index).mercury.retrograde
  );
  const sunIntoSign = days.find(
    ({ sky }, index) => sky.sunSign === signName && previousSky(index).sunSign !== signName
  );
  const pick = Math.floor(dayNumber(days[0].sky.date) / 7) % 2;

  // 💘 Aşk
  let love = LOVE_LINES[sign.element][pick];
  if (sunIntoSign) {
    love = `💘 Güneş ${dayName(sunIntoSign.day)} burcuna giriyor: çekim gücün en yüksek seviyede ✨`;
  } else if (fullMoon && [5, 7].includes(moonHouse(signName, fullMoon.sky))) {
    love = `💘 ${dayName(fullMoon.day)} dolunay aşk ve ilişkiler alanında: duygular tavan. En iddialı kombinini o güne sakla 💋`;
  } else if (retroThisWeek) {
    love = "💘 Merkür retrosu bu hafta: eski sevgili 'naber' yazabilir. Cevap verme, onun yerine en güzel kombinini giy 👀";
  }

  // 💸 Para
  let money = MONEY_LINES[sign.element][pick];
  if (retroStart) {
    money = `💸 Merkür ${dayName(retroStart.day)} retroya giriyor: yeni alışveriş yok, iadeler ve kargo takibi var 📦`;
  } else if (newMoon) {
    money = `💸 ${dayName(newMoon.day)} yeniay: yeni bütçe kurmak için en doğru gün. Girl math kurallarını yeniden oku 📜`;
  } else if (retroThisWeek) {
    money = '💸 Retro haftası: yeni alışveriş yok, iadeler ve kargo takibi var 📦';
  }

  // 👗 Dolap
  let wardrobe = WARDROBE_LINES[sign.element][pick];
  if (sunIntoSign) {
    wardrobe = `👗 ${dayName(sunIntoSign.day)} sezonun başlıyor: doğum günü kombinini şimdiden seç 🎂`;
  } else if (fullMoon) {
    wardrobe = `👗 ${dayName(fullMoon.day)} dolunay: dolap boşaltma günü. Aylardır giymediğin parçaları ayır 🌕`;
  }

  return {
    title: `${sign.emoji} ${sign.name} · Bu hafta`,
    range: rangeText(start),
    love,
    money,
    wardrobe,
  };
}
