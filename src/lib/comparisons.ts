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
  unit: string; // Sayıyla birlikte kullanılan hali, örn: "filtre kahve" (15 filtre kahve)
  price: number; // Yaklaşık fiyat (TL)
};

// Fiyatlar yaklaşıktır (Ekim 2026), gerektiğinde güncellenir
export const COMPARISONS: Comparison[] = [
  { emoji: '💧', name: 'Bir şişe su', phrase: 'bir şişe suya', unit: 'şişe su', price: 15 },
  { emoji: '🎧', name: 'Spotify aboneliği', phrase: 'bir aylık Spotify aboneliğine', unit: 'ay Spotify', price: 100 },
  { emoji: '☕', name: 'Filtre kahve', phrase: 'bir filtre kahveye', unit: 'filtre kahve', price: 130 },
  { emoji: '🧋', name: 'Iced latte', phrase: 'bir iced latteye', unit: 'iced latte', price: 180 },
  { emoji: '🚕', name: 'Taksi', phrase: 'kısa bir taksi yolculuğuna', unit: 'taksi yolculuğu', price: 200 },
  { emoji: '🍵', name: 'Matcha latte', phrase: 'bir matcha latteye', unit: 'matcha latte', price: 220 },
  { emoji: '🌯', name: 'Döner dürüm', phrase: 'bir döner dürüme', unit: 'döner dürüm', price: 250 },
  { emoji: '🎬', name: 'Sinema bileti', phrase: 'bir sinema biletine', unit: 'sinema bileti', price: 300 },
  { emoji: '🍟', name: "Gece 2 McDonald's siparişi", phrase: "gece 2'deki McDonald's siparişine", unit: "McDonald's menü", price: 350 },
  { emoji: '🍫', name: 'Dubai çikolatası', phrase: 'bir Dubai çikolatasına', unit: 'Dubai çikolatası', price: 400 },
  { emoji: '💅', name: 'Manikür', phrase: 'bir maniküre', unit: 'manikür', price: 600 },
  { emoji: '🥞', name: 'Brunch', phrase: "bir brunch'a", unit: 'brunch', price: 800 },
  { emoji: '🧘‍♀️', name: 'Reformer pilates dersi', phrase: 'bir reformer pilates dersine', unit: 'reformer pilates dersi', price: 1200 },
  { emoji: '🎤', name: 'Konser bileti', phrase: 'bir konser biletine', unit: 'konser bileti', price: 1500 },
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
