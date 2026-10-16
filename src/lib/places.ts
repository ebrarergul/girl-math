/**
 * GIRL MATH – GİYİM YERLERİ ("Nereye giderken giydin?")
 *
 * "Giydim"e basınca isteğe bağlı seçilen yerler. Yeni yer eklemek için bu listeye bir satır
 * eklemek yeterli. Mesajlarda yer adı Türkçe ek almasın diye "🎓 Okul ortamında" gibi yazılır.
 *
 * Ekranda kullanımı:
 *   lastWearText(item)                     // "En son: ☕ Kahve · 3 gün önce" (detay sayfası)
 *   repeatWarning(item, 'Okul')            // Giydim'den önce: null ya da { level, message }
 *   freshAlternatives(item, 'Okul', items) // "Bunun yerine" önerileri
 */

import { daysSinceLastWear, todayString } from '@/lib/girl-math';
import type { ClothingItem } from '@/lib/types';

export const PLACES = [
  { name: 'Okul', emoji: '🎓' },
  { name: 'İş', emoji: '💼' },
  { name: 'Kahve', emoji: '☕' },
  { name: 'Date', emoji: '💘' },
  { name: 'Aile', emoji: '👨‍👩‍👧' },
  { name: 'Gece', emoji: '🌙' },
  { name: 'Spor', emoji: '🏋️‍♀️' },
  { name: 'Alışveriş', emoji: '🛍️' },
  { name: 'Seyahat', emoji: '✈️' },
] as const;

export type PlaceName = (typeof PLACES)[number]['name'];

// Yer adından emojili hali: "🎓 Okul"
export function placeLabel(name: PlaceName): string {
  const place = PLACES.find((current) => current.name === name);
  return place ? `${place.emoji} ${place.name}` : name;
}

// ---------- Hatırlatmalar ve öneriler ----------

// "Aynı insanlar görüyor" kontrolünde geriye bakılan gün sayısı
const REPEAT_WINDOW_DAYS = 14;

// Bir tarihin bugünden kaç gün önce olduğu ("2026-10-11" → 5)
function daysAgo(date: string): number {
  const then = new Date(`${date}T00:00:00`);
  const today = new Date(`${todayString()}T00:00:00`);
  return Math.round((today.getTime() - then.getTime()) / (24 * 60 * 60 * 1000));
}

// "bugün" / "dün" / "5 gün önce"
function whenText(days: number): string {
  if (days <= 0) {
    return 'bugün';
  }
  return days === 1 ? 'dün' : `${days} gün önce`;
}

// Kıyafetin bu yerdeki son 14 gündeki giyimlerinin kaç gün önce olduğu (yeniden eskiye)
function recentWearsAt(item: ClothingItem, place: PlaceName): number[] {
  const places = item.wearPlaces ?? [];
  return item.wearDates
    .map((date, index) => ({ date, place: places[index] ?? null }))
    .filter((wear) => wear.place === place)
    .map((wear) => daysAgo(wear.date))
    .filter((days) => days <= REPEAT_WINDOW_DAYS)
    .sort((a, b) => a - b);
}

// Detay sayfası için: "En son: ☕ Kahve · 3 gün önce". Hiç giyilmediyse null.
export function lastWearText(item: ClothingItem): string | null {
  const last = item.wearDates.length - 1;
  if (last < 0) {
    return null;
  }
  const when = whenText(daysAgo(item.wearDates[last]));
  const place = item.wearPlaces?.[last] ?? null;
  return place ? `En son: ${placeLabel(place)} · ${when}` : `En son: ${when}`;
}

export type RepeatWarning = {
  level: 'soft' | 'strong'; // soft: 2. kez (hafif hatırlatma), strong: 3. ve sonrası (güçlü uyarı)
  message: string;
};

// Bu kıyafeti bu yere giymeden ÖNCE çağrılır. Son 14 günde aynı yere giyildiyse uyarı döner,
// giyilmediyse null (sorun yok).
export function repeatWarning(item: ClothingItem, place: PlaceName): RepeatWarning | null {
  const recent = recentWearsAt(item, place);
  if (recent.length === 0) {
    return null;
  }
  const label = placeLabel(place);
  if (recent.length === 1) {
    return {
      level: 'soft',
      message: `Bunu ${whenText(recent[0])} de ${label} ortamında giymiştin. Aynı kişiler hatırlayabilir 👀`,
    };
  }
  return {
    level: 'strong',
    message: `“${item.name}” son ${REPEAT_WINDOW_DAYS} günde ${recent.length} kez ${label} ortamını gördü. Aynı insanlar görüyor kızım, bugün başka bir şey dene!`,
  };
}

// "Bunun yerine": aynı kategoriden, son 14 günde bu yere gitmemiş parçalar.
// Uzun süredir giyilmeyenler önce (girl math dokunuşu). Seçilen kıyafetle aynı adı taşıyanlar
// önerilmez ("Beyaz tişört yerine Beyaz tişört" olmasın), aynı adlı parçalar bir kez gösterilir.
export function freshAlternatives(
  item: ClothingItem,
  place: PlaceName,
  items: ClothingItem[],
  limit = 3
): ClothingItem[] {
  const sameName = (a: ClothingItem, b: ClothingItem) =>
    a.name.trim().toLocaleLowerCase('tr') === b.name.trim().toLocaleLowerCase('tr');
  return items
    .filter((other) => other.category === item.category && !sameName(other, item))
    .filter((other) => recentWearsAt(other, place).length === 0)
    .sort((a, b) => daysSinceLastWear(b) - daysSinceLastWear(a))
    .filter((other, index, list) => list.findIndex((first) => sameName(first, other)) === index)
    .slice(0, limit);
}
