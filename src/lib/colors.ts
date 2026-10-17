/**
 * GIRL MATH – KIYAFET RENKLERİ
 *
 * Kıyafet eklerken seçilebilecek renkler. Kombin motoru (renk uyumu) ve ekleme formundaki
 * renk seçici bu listeyi kullanır. Yeni renk eklemek için bu listeye bir satır eklemek yeterli.
 *
 * Not: Buradaki renk kodları (hex) tema rengi değil, kıyafetin kendi rengini gösteren
 * "renk yuvarlağı" içindir. Ekranda renk yuvarlağı çizerken `hex` kullanılır.
 */

export const COLORS = [
  { name: 'Siyah', emoji: '🖤', hex: '#111111' },
  { name: 'Beyaz', emoji: '🤍', hex: '#FFFFFF' },
  { name: 'Gri', emoji: '🩶', hex: '#9CA3AF' },
  { name: 'Bej', emoji: '🤎', hex: '#D9C4A3' },
  { name: 'Kahverengi', emoji: '🤎', hex: '#7B4B2A' },
  { name: 'Lacivert', emoji: '💙', hex: '#1E2A4A' },
  { name: 'Kot mavisi', emoji: '👖', hex: '#4A6FA5' },
  { name: 'Mavi', emoji: '💙', hex: '#3B82F6' },
  { name: 'Açık mavi', emoji: '🩵', hex: '#A5C8F5' },
  { name: 'Yeşil', emoji: '💚', hex: '#2E9E5B' },
  { name: 'Haki', emoji: '🫒', hex: '#6B705C' },
  { name: 'Sarı', emoji: '💛', hex: '#F5C518' },
  { name: 'Turuncu', emoji: '🧡', hex: '#F28C28' },
  { name: 'Kırmızı', emoji: '❤️', hex: '#D62828' },
  { name: 'Bordo', emoji: '🍷', hex: '#7F1D2D' },
  { name: 'Pembe', emoji: '💖', hex: '#F48FB1' },
  { name: 'Mor', emoji: '💜', hex: '#8E5BD6' },
  { name: 'Desenli', emoji: '🎨', hex: '#C9C9C9' }, // Çok renkli/desenli parçalar (ekranda özel çizilebilir)
] as const;

export type ColorName = (typeof COLORS)[number]['name'];

// Renk adından emojisi (raporlarda: "💖 Pembe")
export function colorEmoji(name: ColorName): string {
  return COLORS.find((color) => color.name === name)?.emoji ?? '🎨';
}

// Renk adından renk kodunu bulur (renk yuvarlağı çizmek için)
export function colorHex(name: ColorName): string {
  return COLORS.find((color) => color.name === name)?.hex ?? '#C9C9C9';
}
