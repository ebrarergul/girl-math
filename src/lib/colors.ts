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
  { name: 'Siyah', hex: '#111111' },
  { name: 'Beyaz', hex: '#FFFFFF' },
  { name: 'Gri', hex: '#9CA3AF' },
  { name: 'Bej', hex: '#D9C4A3' },
  { name: 'Kahverengi', hex: '#7B4B2A' },
  { name: 'Lacivert', hex: '#1E2A4A' },
  { name: 'Kot mavisi', hex: '#4A6FA5' },
  { name: 'Mavi', hex: '#3B82F6' },
  { name: 'Açık mavi', hex: '#A5C8F5' },
  { name: 'Yeşil', hex: '#2E9E5B' },
  { name: 'Haki', hex: '#6B705C' },
  { name: 'Sarı', hex: '#F5C518' },
  { name: 'Turuncu', hex: '#F28C28' },
  { name: 'Kırmızı', hex: '#D62828' },
  { name: 'Bordo', hex: '#7F1D2D' },
  { name: 'Pembe', hex: '#F48FB1' },
  { name: 'Mor', hex: '#8E5BD6' },
  { name: 'Desenli', hex: '#C9C9C9' }, // Çok renkli/desenli parçalar (ekranda özel çizilebilir)
] as const;

export type ColorName = (typeof COLORS)[number]['name'];

// Renk adından renk kodunu bulur (renk yuvarlağı çizmek için)
export function colorHex(name: ColorName): string {
  return COLORS.find((color) => color.name === name)?.hex ?? '#C9C9C9';
}
