/**
 * GIRL MATH – DOLAP KAHOOT'U (haftalık hafıza testi)
 *
 * Hafta sonları açılan, kullanıcının kendi dolabından sorular soran süreli mini yarışma.
 * 5 soru, her soru 15 saniye. Sorular hafta boyunca aynı kalır (haftanın "zarı" ile seçilir),
 * gelecek hafta yenileri gelir.
 *
 * Kısımlar: soru kalıbı, hafta sonu kontrolü, Girl Math Sözleşmesi soruları, dolap soruları,
 * haftanın yarışması, puan ve rozet.
 *
 * Ekranda kullanımı:
 *   const quiz = weeklyQuiz(items)          // { isOpen, daysUntilOpen, blockedMessage, questions }
 *   answerPoints(dogruMu, kacSaniyedeCevap) // 0 ya da 100-150
 *   quizBadge(dogruSayisi)                  // { emoji, title, message }
 *   quizStreak(quizResults) / bestQuizScore(quizResults) / playedThisWeek(quizResults)
 */

import { daysSinceLastWear, isPaidOff, wearCount } from '@/lib/girl-math';
import { PLACES, placeLabel, type PlaceName } from '@/lib/places';
import type { ClothingItem, QuizResult } from '@/lib/types';

// ---------- Ayarlar ----------

export const QUESTION_COUNT = 5;
export const TIME_LIMIT_SECONDS = 15;

// ---------- Soru kalıbı ----------

export type QuestionKind =
  | 'star' // Dolabının yıldızı (en çok giyilen)
  | 'forgotten' // Unutulmuş prenses (en uzun süredir giyilmeyen)
  | 'pricier' // Hangisine daha çok para verdin? (2 kıyafet)
  | 'neverWorn' // Hangisini hiç giymedin?
  | 'whoIsThis' // Bu parça kim? (yakın çekim, bulanık fotoğraf)
  | 'place' // Bununla en çok nereye gittin?
  | 'paidOff' // Hangisi kendini amorti etti?
  | 'contract'; // Girl Math Sözleşmesi soruları (sabit)

export type QuizOption = {
  label: string; // Şıkta yazan metin (kıyafet adı, yer, "0 TL, bedava"…)
  itemId?: string; // Şık bir kıyafetse kimliği (ekran fotoğrafını gösterir)
};

export type QuizQuestion = {
  id: string; // Haftalık soruyu tanımak için (örn. "star", "contract-1")
  kind: QuestionKind;
  prompt: string; // Soru cümlesi
  photoItemId?: string; // "Bu parça kim?" sorusunda yakından gösterilecek kıyafet
  aboutItemId?: string; // Soru bir kıyafet hakkındaysa (ör. "… ile nereye gittin?"); küçük fotoğrafı gösterilebilir
  options: QuizOption[]; // 2 ya da 4 şık
  correctIndex: number; // Doğru şıkkın sırası
  correctText: string; // Doğru cevaptan sonra gösterilecek makara açıklama
  wrongText: string; // Yanlış cevaptan sonra gösterilecek açıklama (doğrusunu da söyler)
};

// ---------- Hafta sonu ----------

// Kahoot sadece Cumartesi ve Pazar açık
export function isQuizOpen(date: Date = new Date()): boolean {
  const day = date.getDay(); // 0 = Pazar, 6 = Cumartesi
  return day === 0 || day === 6;
}

// Cumartesi'ye kaç gün var (hafta sonuysa 0)
export function daysUntilQuiz(date: Date = new Date()): number {
  return isQuizOpen(date) ? 0 : 6 - date.getDay();
}

// Haftanın kimliği: o haftanın Pazartesi günü, örn. "2026-10-12". Sonuç kaydı ve
// "bu hafta aynı sorular" için kullanılır.
export function quizWeekKey(date: Date = new Date()): string {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');
  return `${monday.getFullYear()}-${month}-${day}`;
}

// ---------- Haftanın "zarı" ----------

// Aynı hafta hep aynı sayıları veren basit rastgele sayı üretici (aynı hafta = aynı sorular)
export function weeklyRandom(weekKey: string): () => number {
  let seed = 0;
  for (const char of weekKey) {
    seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  }
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Listeyi haftanın zarıyla karıştırır (orijinal listeye dokunmaz)
export function shuffle<T>(list: T[], random: () => number): T[] {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Doğru şıkkı ve yanlışları karıştırıp soruya çevirir
export function withShuffledOptions(
  base: Omit<QuizQuestion, 'options' | 'correctIndex'>,
  correct: QuizOption,
  wrong: QuizOption[],
  random: () => number
): QuizQuestion {
  const options = shuffle([correct, ...wrong], random);
  return { ...base, options, correctIndex: options.indexOf(correct) };
}

// ---------- Girl Math Sözleşmesi soruları (her zaman sorulabilir) ----------

const CONTRACT_QUESTIONS: {
  prompt: string;
  correct: string;
  wrong: [string, string, string];
  correctText: string;
}[] = [
  {
    prompt: 'Nakit parayla aldığın bir şey sana kaça mal olur?',
    correct: '0 TL, bedava',
    wrong: ['1000 TL', 'Bilmiyorum', 'Annem ödedi'],
    correctText: 'Sözleşme Madde 1: nakit parayla alınan her şey bedavadır 💵',
  },
  {
    prompt: "İndirimden 3000 TL'lik bir şey aldın. Ne oldu?",
    correct: 'Para kazandım',
    wrong: ['Para harcadım', 'Merkez Bankası aradı', 'Kartım ağladı'],
    correctText: 'Sözleşme Madde 4: indirimden almak para harcatmaz, para kazandırır 🏷️',
  },
  {
    prompt: 'İade ettiğin üründen gelen para nedir?',
    correct: 'Havadan gelen ekstra kazanç',
    wrong: ['Kendi param', 'Borç', 'Vergi iadesi'],
    correctText: 'Sözleşme Madde 2: iade parası havadan kazanılmış ekstra kazançtır 💸',
  },
  {
    prompt: '3 ay önce ödediğin konser bileti bugün kaç TL?',
    correct: '0 TL',
    wrong: ['Bilet fiyatı kadar', 'Enflasyonla iki katı', 'Hâlâ ödüyorum'],
    correctText: 'Sözleşme Madde 3: aylar önce ödenen her şey o gün 0 TL sayılır 🎤',
  },
];

// Sözleşme sorularının hepsi (şıkları haftaya göre karışık)
export function contractQuestions(random: () => number): QuizQuestion[] {
  return CONTRACT_QUESTIONS.map((question, index) =>
    withShuffledOptions(
      {
        id: `contract-${index + 1}`,
        kind: 'contract',
        prompt: question.prompt,
        correctText: `Doğru! ${question.correctText}`,
        wrongText: `Olmadı kızım 😤 Doğrusu: “${question.correct}”. ${question.correctText}`,
      },
      { label: question.correct },
      question.wrong.map((label) => ({ label })),
      random
    )
  );
}

// ---------- Dolap soruları ----------
// Her üretici yeterli bilgi yoksa null döner (o hafta o soru sorulmaz). Her soruda tek doğru
// cevap olur: eşitlik varsa eşit olanlar yanlış şık olarak gösterilmez.

const q = (name: string) => `“${name}”`;
const itemOption = (item: ClothingItem): QuizOption => ({ label: item.name, itemId: item.id });

// Listeden haftanın zarıyla bir eleman seçer
function pickOne<T>(list: T[], random: () => number): T {
  return list[Math.floor(random() * list.length)];
}

// Yanlış şıklar: listeyi karıştırıp en fazla 3 tane alır
function wrongOptions(items: ClothingItem[], random: () => number): QuizOption[] {
  return shuffle(items, random).slice(0, 3).map(itemOption);
}

// Aynı adı taşıyan kıyafetlerden birini bırakır (şıklarda aynı ad iki kez görünmesin)
function uniqueNames(items: ClothingItem[]): ClothingItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.name.trim().toLocaleLowerCase('tr');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// ⭐ Dolabının yıldızı: en çok giyilen
function starQuestion(items: ClothingItem[], random: () => number): QuizQuestion | null {
  const worn = items.filter((item) => wearCount(item) > 0);
  if (worn.length === 0) {
    return null;
  }
  const star = worn.reduce((best, item) => (wearCount(item) > wearCount(best) ? item : best));
  const wrong = uniqueNames(items.filter((item) => wearCount(item) < wearCount(star) && item.name !== star.name));
  if (wrong.length < 1) {
    return null;
  }
  const times = wearCount(star);
  return withShuffledOptions(
    {
      id: 'star',
      kind: 'star',
      prompt: '⭐ Dolabının yıldızı hangisi? (En çok giydiğin)',
      correctText: `Doğru! ${q(star.name)} ${times} kere giyildi, dolabın yıldızı ⭐`,
      wrongText: `Yıldız aslında ${q(star.name)} ⭐ Tam ${times} kere giydin!`,
    },
    itemOption(star),
    wrongOptions(wrong, random),
    random
  );
}

// 🕸️ Unutulmuş prenses: en az bir kere giyilmişler arasında en uzun süredir giyilmeyen
// (hiç giyilmeyenler 😬 sorusunda; yanlış şıklar en az 3 gün daha yakın zamanda giyilmiş olmalı)
function forgottenQuestion(items: ClothingItem[], random: () => number): QuizQuestion | null {
  const worn = items.filter((item) => wearCount(item) > 0);
  if (worn.length < 2) {
    return null;
  }
  const princess = worn.reduce((oldest, item) =>
    daysSinceLastWear(item) > daysSinceLastWear(oldest) ? item : oldest
  );
  const days = daysSinceLastWear(princess);
  if (days < 7) {
    return null; // Herkes yakında giyilmişse "unutulmuş" demek anlamsız
  }
  const wrong = uniqueNames(
    worn.filter((item) => days - daysSinceLastWear(item) >= 3 && item.name !== princess.name)
  );
  if (wrong.length < 1) {
    return null;
  }
  return withShuffledOptions(
    {
      id: 'forgotten',
      kind: 'forgotten',
      prompt: '🕸️ Dolabın unutulmuş prensesi kim? (En uzun süredir giymediğin)',
      correctText: `Evet 🥺 ${q(princess.name)} ${days} gündür askıda. Bu hafta onun haftası!`,
      wrongText: `Unutulmuş prenses aslında ${q(princess.name)}, ${days} gündür askıda 👀 Bu hafta giy!`,
    },
    itemOption(princess),
    wrongOptions(wrong, random),
    random
  );
}

// 💸 Kapışma: hangisine daha çok para verdin? (fiyat farkı en az %20 olan iki kıyafet)
function pricierQuestion(items: ClothingItem[], random: () => number): QuizQuestion | null {
  const pairs: [ClothingItem, ClothingItem][] = [];
  for (const a of items) {
    for (const b of items) {
      if (a.price > b.price * 1.2 && a.name !== b.name) {
        pairs.push([a, b]);
      }
    }
  }
  if (pairs.length === 0) {
    return null;
  }
  const [expensive, cheap] = pickOne(pairs, random);
  return withShuffledOptions(
    {
      id: 'pricier',
      kind: 'pricier',
      prompt: '💸 Kapışma! Hangisine daha çok para verdin?',
      correctText: `Doğru! ${q(expensive.name)} için ${expensive.price} TL vermiştin 💸`,
      wrongText: `${q(expensive.name)} daha pahalıydı: ${expensive.price} TL 💸 Girl math'e göre önemi yok ama 😌`,
    },
    itemOption(expensive),
    [itemOption(cheap)],
    random
  );
}

// 😬 Hiç giymediğin hangisi?
function neverWornQuestion(items: ClothingItem[], random: () => number): QuizQuestion | null {
  const never = items.filter((item) => wearCount(item) === 0);
  const wrong = uniqueNames(items.filter((item) => wearCount(item) > 0));
  if (never.length === 0 || wrong.length < 1) {
    return null;
  }
  const answer = pickOne(never, random);
  return withShuffledOptions(
    {
      id: 'neverWorn',
      kind: 'neverWorn',
      prompt: '😬 Hangisini HİÇ giymedin? Utanmadan söyle',
      correctText: `Dürüstlüğün için teşekkürler 😬 ${q(answer.name)} hâlâ etiketiyle bekliyor. Bu hafta giy!`,
      wrongText: `Aslında ${q(answer.name)} hiç giyilmedi 😬 Maliyeti hâlâ ∞, bu hafta kurtar onu!`,
    },
    itemOption(answer),
    wrongOptions(wrong.filter((item) => item.name !== answer.name), random),
    random
  );
}

// 🔍 Bu parça kim? (fotoğrafı yakından ve bulanık gösterilir)
function whoIsThisQuestion(items: ClothingItem[], random: () => number): QuizQuestion | null {
  const withPhoto = items.filter((item) => item.photoFileName);
  if (withPhoto.length === 0) {
    return null;
  }
  const answer = pickOne(withPhoto, random);
  const wrong = uniqueNames(items.filter((item) => item.name !== answer.name));
  if (wrong.length < 1) {
    return null;
  }
  return withShuffledOptions(
    {
      id: 'whoIsThis',
      kind: 'whoIsThis',
      prompt: '🔍 Bu parça kim?',
      photoItemId: answer.id,
      correctText: `Gözünden hiçbir şey kaçmıyor kraliçe 👑 Bu ${q(answer.name)}!`,
      wrongText: `Bu ${q(answer.name)} idi 🙈 Kendi dolabını tanımıyor musun kızım?`,
    },
    itemOption(answer),
    wrongOptions(wrong, random),
    random
  );
}

// 📍 Bununla en çok nereye gittin? (en az 2 yerli giyimi olan, tek bir "en çok" yeri olan kıyafet)
function placeQuestion(items: ClothingItem[], random: () => number): QuizQuestion | null {
  const candidates = items
    .map((item) => {
      const counts = new Map<PlaceName, number>();
      for (const place of item.wearPlaces ?? []) {
        if (place) {
          counts.set(place, (counts.get(place) ?? 0) + 1);
        }
      }
      const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
      return { item, top: sorted[0], second: sorted[1] };
    })
    .filter(({ top, second }) => top && top[1] >= 2 && (!second || top[1] > second[1]));
  if (candidates.length === 0) {
    return null;
  }
  const { item, top } = pickOne(candidates, random);
  const [place, count] = top!;
  const label = placeLabel(place);
  const others = shuffle(
    PLACES.filter((other) => other.name !== place),
    random
  )
    .slice(0, 3)
    .map((other) => ({ label: placeLabel(other.name) }));
  return withShuffledOptions(
    {
      id: 'place',
      kind: 'place',
      prompt: `📍 ${q(item.name)} ile en çok nereye gittin?`,
      aboutItemId: item.id,
      correctText: `Doğru! ${q(item.name)} ${count} kez ${label} ortamını gördü 📍`,
      wrongText: `${q(item.name)} en çok ${label} ortamında giyildi (${count} kez) 📍`,
    },
    { label },
    others,
    random
  );
}

// 💖 Hangisi kendini amorti etti?
function paidOffQuestion(items: ClothingItem[], random: () => number): QuizQuestion | null {
  const paid = items.filter((item) => isPaidOff(item));
  const wrong = uniqueNames(items.filter((item) => !isPaidOff(item)));
  if (paid.length === 0 || wrong.length < 1) {
    return null;
  }
  const answer = pickOne(paid, random);
  return withShuffledOptions(
    {
      id: 'paidOff',
      kind: 'paidOff',
      prompt: '💖 Hangisi kendini amorti etti? (Kalbi olan)',
      correctText: `Doğru! ${q(answer.name)} kendini amorti etti, resmen bedava 💖`,
      wrongText: `${q(answer.name)} amorti olmuştu, kalp ondaydı 💖`,
    },
    itemOption(answer),
    wrongOptions(wrong.filter((item) => item.name !== answer.name), random),
    random
  );
}

// Dolaptan sorulabilecek bütün sorular (bilgisi yetmeyenler atlanır)
export function wardrobeQuestions(items: ClothingItem[], random: () => number): QuizQuestion[] {
  return [
    starQuestion,
    forgottenQuestion,
    pricierQuestion,
    neverWornQuestion,
    whoIsThisQuestion,
    placeQuestion,
    paidOffQuestion,
  ]
    .map((make) => make(items, random))
    .filter((question): question is QuizQuestion => question !== null);
}

// ---------- Haftanın yarışması ----------

// Yarışmaya girmek için dolapta en az bu kadar parça olmalı
export const MIN_ITEMS_FOR_QUIZ = 4;

// Haftada en az bu kadar Sözleşme sorusu olur (makara garantisi); gerisi dolaptan
const MIN_CONTRACT_QUESTIONS = 1;

export type WeeklyQuiz = {
  weekKey: string; // "2026-10-12" – sonuç kaydında kullanılır
  isOpen: boolean; // Bugün hafta sonu mu?
  daysUntilOpen: number; // Hafta içiyse Cumartesi'ye kaç gün
  blockedMessage: string | null; // Dolap yetersizse ekranda gösterilecek cümle
  questions: QuizQuestion[]; // 5 soru (açık değilse ya da dolap yetersizse boş)
};

// Bir sorunun "cevap kıyafeti": aynı kıyafet iki soruda doğru cevap olmasın diye
function answerItemId(question: QuizQuestion): string | undefined {
  return (
    question.photoItemId ?? question.aboutItemId ?? question.options[question.correctIndex].itemId
  );
}

// Haftanın 5 sorusu: dolap soruları öncelikli (aynı kıyafet iki kez cevap olmaz), en az 1
// Sözleşme sorusu, eksik kalırsa Sözleşme soruları tamamlar. Hafta boyunca hep aynı sorular.
export function weeklyQuiz(items: ClothingItem[], date: Date = new Date()): WeeklyQuiz {
  const weekKey = quizWeekKey(date);
  const base = { weekKey, isOpen: isQuizOpen(date), daysUntilOpen: daysUntilQuiz(date) };
  if (items.length < MIN_ITEMS_FOR_QUIZ) {
    return {
      ...base,
      blockedMessage: 'Dolabın daha bebek, birkaç parça ekle de sınava girelim 🍼',
      questions: [],
    };
  }
  if (!base.isOpen) {
    return { ...base, blockedMessage: null, questions: [] };
  }

  const random = weeklyRandom(weekKey);
  const usedItems = new Set<string>();
  const fromWardrobe: QuizQuestion[] = [];
  for (const question of shuffle(wardrobeQuestions(items, random), random)) {
    const itemId = answerItemId(question);
    if (fromWardrobe.length >= QUESTION_COUNT - MIN_CONTRACT_QUESTIONS) {
      break;
    }
    if (itemId && usedItems.has(itemId)) {
      continue;
    }
    if (itemId) {
      usedItems.add(itemId);
    }
    fromWardrobe.push(question);
  }
  const fromContract = shuffle(contractQuestions(random), random).slice(
    0,
    QUESTION_COUNT - fromWardrobe.length
  );
  return {
    ...base,
    blockedMessage: null,
    questions: shuffle([...fromWardrobe, ...fromContract], random),
  };
}

// ---------- Puan ve rozet ----------

const CORRECT_POINTS = 100;
const MAX_SPEED_BONUS = 50;

// Bir cevabın puanı: doğruysa 100 + hız bonusu (hemen cevap +50, son saniye +0).
// Süre dolduysa ekran bunu yanlış cevap sayar (correct = false).
export function answerPoints(correct: boolean, secondsTaken: number): number {
  if (!correct) {
    return 0;
  }
  const remaining = Math.max(0, TIME_LIMIT_SECONDS - secondsTaken) / TIME_LIMIT_SECONDS;
  return CORRECT_POINTS + Math.round(MAX_SPEED_BONUS * remaining);
}

export type QuizBadge = {
  emoji: string;
  title: string;
  message: string;
};

// Doğru sayısına göre rozet
export function quizBadge(correctCount: number): QuizBadge {
  if (correctCount >= 4) {
    return {
      emoji: '🏆',
      title: 'Merkez Bankası Başkanı',
      message: 'Dolabını avucunun içi gibi biliyorsun. Faiz kararlarını artık sen ver 👑',
    };
  }
  if (correctCount === 3) {
    return {
      emoji: '💼',
      title: 'Ekonomist',
      message: 'Fena değil! Biraz daha "Giydim" basarsan başkanlık koltuğu senin 📈',
    };
  }
  if (correctCount >= 1) {
    return {
      emoji: '🌱',
      title: 'Girl Math Stajyeri',
      message: 'Staj dönemi herkes için zor. Bu hafta unutulmuş parçalarını giy, gelecek hafta görüşürüz 💅',
    };
  }
  return {
    emoji: '😤',
    title: 'Kızım sen bu dolabı tanımıyor musun?',
    message: 'Dolabın sana küs. Bu hafta dolabını aç, kıyafetlerinle tanış, sonra tekrar gel 🫣',
  };
}

// ---------- Geçmiş sonuçlar ----------

// Bu hafta oynandı mı? (haftada bir kez oynanır)
export function playedThisWeek(results: QuizResult[], date: Date = new Date()): boolean {
  const weekKey = quizWeekKey(date);
  return results.some((result) => result.weekKey === weekKey);
}

// Kaç haftadır üst üste oynuyor? Bu hafta henüz oynanmadıysa geçen haftadan geriye sayılır
// (hafta sonu gelmeden seri bozulmuş sayılmaz).
export function quizStreak(results: QuizResult[], date: Date = new Date()): number {
  const played = new Set(results.map((result) => result.weekKey));
  const cursor = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  if (!played.has(quizWeekKey(cursor))) {
    cursor.setDate(cursor.getDate() - 7);
  }
  let streak = 0;
  while (played.has(quizWeekKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

// En yüksek puan (hiç oynanmadıysa 0)
export function bestQuizScore(results: QuizResult[]): number {
  return results.reduce((best, result) => Math.max(best, result.score), 0);
}
