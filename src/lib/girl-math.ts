/**
 * GIRL MATH – HESAPLAMALAR
 *
 * Kıyafetlerle ilgili tüm hesaplar burada. Ekranlar hesap yapmaz, buradaki
 * fonksiyonları çağırır. Böylece bir hesap değişirse sadece bu dosya değişir.
 */

import type { ClothingItem } from '@/lib/types';

// Bugünün tarihi, "2026-10-14" biçiminde (telefonun kendi saatine göre)
export function todayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Kaç kere giyildi? (Tarih listesindeki tarihlerin sayısı)
export function wearCount(item: ClothingItem): number {
  return item.wearDates.length;
}

// Giyilme başına maliyet (tam TL'ye yuvarlanmış). Hiç giyilmediyse fiyatın kendisi.
export function costPerWear(item: ClothingItem): number {
  const wears = wearCount(item);
  if (wears === 0) {
    return Math.round(item.price);
  }
  return Math.round(item.price / wears);
}

// Hedef giyilme sayısına ulaştı mı? ("Amorti edildi" mi?)
export function isPaidOff(item: ClothingItem): boolean {
  return wearCount(item) >= item.targetWears;
}

// Son giyilmeden bu yana kaç gün geçti? Hiç giyilmediyse dolaba eklendiği günden sayılır.
export function daysSinceLastWear(item: ClothingItem): number {
  const lastDate =
    item.wearDates.length > 0 ? item.wearDates[item.wearDates.length - 1] : item.createdAt;
  const last = new Date(`${lastDate}T00:00:00`);
  const today = new Date(`${todayString()}T00:00:00`);
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((today.getTime() - last.getTime()) / oneDay);
}
