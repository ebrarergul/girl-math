/**
 * GIRL MATH – DOLAP İSTATİSTİKLERİ
 *
 * Cüzdan ve Ana sayfa ekranlarında gösterilecek özet bilgiler.
 * Ekranda kullanımı:
 *   const { items } = useApp();
 *   const stats = getWardrobeStats(items);
 *   stats.totalValue  // 18400
 */

import { costPerWear, daysSinceLastWear, isPaidOff, todayString, wearCount } from '@/lib/girl-math';
import type { ClothingItem } from '@/lib/types';

export type WardrobeStats = {
  totalItems: number; // Dolapta kaç parça var
  totalValue: number; // Kıyafetlerin toplam fiyatı (TL)
  totalWears: number; // Bütün "Giydim"lerin sayısı
  averageCostPerWear: number | null; // Dolap değeri ÷ toplam giyilme (tam TL). Hiç giyilme yoksa null
  paidOffCount: number; // Hedefine ulaşan (amorti edilen) parça sayısı
  neverWornCount: number; // Hiç giyilmemiş parça sayısı
  mostWorn: ClothingItem | null; // En çok giyilen parça. Hiç giyilme yoksa null
  forgotten: { item: ClothingItem; days: number } | null; // En uzun süredir giyilmeyen parça. Dolap boşsa null
  wearsThisMonth: number; // Bu ay kaç kere "Giydim"e basıldı
  girlMathSavings: number; // Şaka istatistik: her parçada (fiyat − giyim başına maliyet) toplamı
  // (Ebrar ekledi, 26 Kasım; Onur çalışmıyorken) Amorti ettiğin: her parçanın fiyatının, hedefe ne kadar
  // yaklaştıysa o kadarı (giyim / hedef, en fazla %100). Ekranda "Girl Math kazancın"ın yerine bu gösterilir.
  amortizedValue: number;
  amortizedPercent: number; // amortizedValue / totalValue, 0-100 tam sayı (dolap boşsa 0)
};

export function getWardrobeStats(items: ClothingItem[]): WardrobeStats {
  const thisMonth = todayString().slice(0, 7); // Örn: "2026-10"

  let totalValue = 0;
  let totalWears = 0;
  let paidOffCount = 0;
  let neverWornCount = 0;
  let wearsThisMonth = 0;
  let girlMathSavings = 0;
  let amortizedValue = 0;
  let mostWorn: ClothingItem | null = null;
  let forgotten: { item: ClothingItem; days: number } | null = null;

  for (const item of items) {
    const wears = wearCount(item);

    totalValue += item.price;
    totalWears += wears;
    girlMathSavings += item.price - costPerWear(item);
    amortizedValue += item.price * Math.min(1, wearCount(item) / Math.max(1, item.targetWears));
    wearsThisMonth += item.wearDates.filter((date) => date.startsWith(thisMonth)).length;

    if (isPaidOff(item)) {
      paidOffCount += 1;
    }
    if (wears === 0) {
      neverWornCount += 1;
    }
    if (wears > 0 && (!mostWorn || wears > wearCount(mostWorn))) {
      mostWorn = item;
    }

    const days = daysSinceLastWear(item);
    if (!forgotten || days > forgotten.days) {
      forgotten = { item, days };
    }
  }

  return {
    totalItems: items.length,
    totalValue,
    totalWears,
    averageCostPerWear: totalWears > 0 ? Math.round(totalValue / totalWears) : null,
    paidOffCount,
    neverWornCount,
    mostWorn,
    forgotten,
    wearsThisMonth,
    girlMathSavings,
    amortizedValue: Math.round(amortizedValue),
    amortizedPercent: totalValue > 0 ? Math.round((amortizedValue / totalValue) * 100) : 0,
  };
}
