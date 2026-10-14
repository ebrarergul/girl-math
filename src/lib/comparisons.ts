/**
 * GIRL MATH – GERÇEK HAYAT KIYASLARI
 *
 * Giyilme başına maliyeti günlük hayattan bir şeyle kıyaslar:
 *   "Maliyeti bir filtre kahveye düştü! ☕"
 *
 * Fiyatlar değişince SADECE aşağıdaki listeyi güncellemek yeterli.
 * Liste ucuzdan pahalıya sıralı olmalı.
 */

export type Comparison = {
  emoji: string;
  name: string; // Listede görünecek ad, örn: "Filtre kahve"
  phrase: string; // Cümle içindeki hali, örn: "bir filtre kahveye" (… düştü!)
  price: number; // Yaklaşık fiyat (TL)
};

// Fiyatlar yaklaşıktır (Ekim 2026), gerektiğinde güncellenir
export const COMPARISONS: Comparison[] = [
  { emoji: '💧', name: 'Bir şişe su', phrase: 'bir şişe suya', price: 15 },
  { emoji: '🥯', name: 'Simit', phrase: 'bir simide', price: 25 },
  { emoji: '🚇', name: 'Metro bileti', phrase: 'bir metro biletine', price: 35 },
  { emoji: '🎧', name: 'Spotify aboneliği', phrase: 'bir aylık Spotify aboneliğine', price: 100 },
  { emoji: '☕', name: 'Filtre kahve', phrase: 'bir filtre kahveye', price: 130 },
  { emoji: '🧋', name: 'Iced latte', phrase: 'bir iced latteye', price: 180 },
  { emoji: '🚕', name: 'Taksi', phrase: 'kısa bir taksi yolculuğuna', price: 200 },
  { emoji: '🌯', name: 'Döner dürüm', phrase: 'bir döner dürüme', price: 250 },
  { emoji: '🎬', name: 'Sinema bileti', phrase: 'bir sinema biletine', price: 300 },
  { emoji: '💅', name: 'Manikür', phrase: 'bir maniküre', price: 600 },
  { emoji: '🥞', name: 'Brunch', phrase: "bir brunch'a", price: 800 },
  { emoji: '🎤', name: 'Konser bileti', phrase: 'bir konser biletine', price: 1500 },
];

// Maliyete eşit ya da ondan ucuz olan EN PAHALI kalemi bulur.
// Maliyet listedeki en ucuz kalemden bile düşükse null döner (= resmen bedava).
export function findComparison(cost: number): Comparison | null {
  let match: Comparison | null = null;
  for (const item of COMPARISONS) {
    if (item.price <= cost) {
      match = item;
    }
  }
  return match;
}

// Ekranda gösterilecek hazır cümle
export function comparisonText(cost: number): string {
  const match = findComparison(cost);
  if (!match) {
    return 'Resmen bedava! 🎉';
  }
  return `Maliyeti ${match.phrase} düştü! ${match.emoji}`;
}
