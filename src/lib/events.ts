/**
 * GIRL MATH – ZAMAN AŞIMI = BEDAVA (etkinlik modu)
 *
 * Sözleşme Madde 3: "Aylar önceden ödenen her şey etkinlik günü geldiğinde 0 TL sayılır."
 * Kıyafet "etkinlik için alındı" diye işaretlenir (tür + tarih). Etkinliğe kadar geri sayım,
 * bir gün önce ve o gün bildirim; etkinlik günü maliyeti 0 TL GÖSTERİLİR (hesaplar değişmez).
 *
 * Ekranda kullanımı:
 *   eventLabel(item.event)       // "💍 Düğün"
 *   eventCountdownText(item)     // "⏳ 💍 Düğün için 12 gün kaldı. …" (gösterilecek bir şey yoksa null)
 *   eventStatus(item)            // { kind: 'upcoming', days } / 'tomorrow' / 'today' / { kind: 'past', daysAgo }
 *   eventDayCost(item)           // Etkinlik günü 0, diğer günler costPerWear
 */

import { costPerWear, todayString } from '@/lib/girl-math';
import type { ClothingItem } from '@/lib/types';

export const EVENT_TYPES = [
  { name: 'Düğün', emoji: '💍' },
  { name: 'Nişan', emoji: '💐' },
  { name: 'Kına', emoji: '🌿' },
  { name: 'Mezuniyet', emoji: '🎓' },
  { name: 'Doğum günü', emoji: '🎂' },
  { name: 'Konser', emoji: '🎤' },
  { name: 'Tatil', emoji: '✈️' },
  { name: 'Sevgililer Günü', emoji: '💘' },
  { name: 'Yılbaşı', emoji: '🎄' },
  { name: 'Diğer', emoji: '✨' },
] as const;

export type EventTypeName = (typeof EVENT_TYPES)[number]['name'];

// Kıyafetin bağlı olduğu etkinlik
export type ItemEvent = {
  type: EventTypeName;
  date: string; // Etkinlik günü, örn: "2026-12-05"
  customName?: string; // "Diğer" seçildiyse kullanıcının yazdığı ad, örn: "Ece'nin partisi"
};

// Etkinliğin görünen adı, emojisiyle: "💍 Düğün" ya da "✨ Ece'nin partisi"
export function eventLabel(event: ItemEvent): string {
  const type = EVENT_TYPES.find((current) => current.name === event.type);
  const name = event.type === 'Diğer' && event.customName?.trim() ? event.customName.trim() : event.type;
  return `${type?.emoji ?? '✨'} ${name}`;
}

// ---------- Geri sayım ve etkinlik günü ----------

// Etkinlik geçtikten sonra "ikinci giyim" cümlesi kaç gün daha gösterilir
const AFTER_EVENT_DAYS = 7;

export type EventStatus =
  | { kind: 'upcoming'; days: number } // 2 gün ve daha fazla var
  | { kind: 'tomorrow' }
  | { kind: 'today' }
  | { kind: 'past'; daysAgo: number };

function daysUntil(date: string, today: string): number {
  return Math.round(
    (new Date(`${date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 864e5
  );
}

// Kıyafetin etkinliği ne durumda? Etkinliği yoksa null.
export function eventStatus(item: ClothingItem, today: string = todayString()): EventStatus | null {
  if (!item.event) {
    return null;
  }
  const days = daysUntil(item.event.date, today);
  if (days >= 2) {
    return { kind: 'upcoming', days };
  }
  if (days === 1) {
    return { kind: 'tomorrow' };
  }
  if (days === 0) {
    return { kind: 'today' };
  }
  return { kind: 'past', daysAgo: -days };
}

// Bugün etkinlik günü mü?
export function isEventDay(item: ClothingItem, today: string = todayString()): boolean {
  return eventStatus(item, today)?.kind === 'today';
}

// Ekranda gösterilecek maliyet: etkinlik günü 0 TL (Sözleşme Madde 3), diğer günler normal.
// Sadece GÖSTERİM içindir; istatistik ve bildirim hesapları costPerWear kullanmaya devam eder.
export function eventDayCost(item: ClothingItem, today: string = todayString()): number {
  return isEventDay(item, today) ? 0 : costPerWear(item);
}

// Geri sayım cümlesi (detay sayfası / Ana sayfa kartı için). Gösterilecek bir şey yoksa null.
// Kıyafet ve etkinlik adı Türkçe ek almasın diye "… için" kalıbı kullanılır.
export function eventCountdownText(item: ClothingItem, today: string = todayString()): string | null {
  const status = eventStatus(item, today);
  if (!status || !item.event) {
    return null;
  }
  const label = eventLabel(item.event);
  const name = `“${item.name}”`;
  switch (status.kind) {
    case 'upcoming':
      return `⏳ ${label} için ${status.days} gün kaldı. ${name} hazır, parası çoktan ödendi; o gün 0 TL!`;
    case 'tomorrow':
      return `👗 Yarın büyük gün: ${label}! ${name} ütülendi mi?`;
    case 'today':
      return `🎉 Bugün büyük gün: ${label}! ${name} bugün 0 TL 🆓 Bedavaya harika görünüyorsun!`;
    case 'past':
      return status.daysAgo <= AFTER_EVENT_DAYS
        ? `💌 ${label} geride kaldı. ${name} şimdi ikinci giyimini bekliyor 😏`
        : null;
  }
}
