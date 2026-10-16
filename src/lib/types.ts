/**
 * GIRL MATH – VERİ MODELİ
 *
 * Bu dosya bir "kalıp" dosyasıdır: bir kıyafetin hangi bilgilerden oluştuğunu
 * tarif eder. İçinde çalışan kod yoktur, sadece tanım vardır.
 */

import type { ColorName } from '@/lib/colors';
import type { PlaceName } from '@/lib/places';

// Dolaptaki kategoriler. Yeni kategori eklemek için bu listeye bir satır eklemek yeterli.
export const CATEGORIES = [
  'Üst',
  'Alt',
  'Elbise',
  'Dış giyim',
  'Ayakkabı',
  'Çanta',
  'Aksesuar',
] as const;

export type Category = (typeof CATEGORIES)[number];

// Bir kıyafetin tüm bilgileri
export type ClothingItem = {
  id: string; // Her kıyafete özel, değişmeyen kimlik numarası
  name: string; // Örn: "Siyah deri ceket"
  category: Category;
  price: number; // Satın alma fiyatı (TL)
  photoFileName: string | null; // Sadece dosya adı (tam yol çalışma anında üretilir), fotoğraf yoksa null
  wearDates: string[]; // "Giydim"e her basıldığında o günün tarihi eklenir, örn: "2026-10-14". Giyilme sayısı = bu listenin uzunluğu
  targetWears: number; // Hedef giyilme sayısı. Buna ulaşınca "amorti edildi" sayılır
  createdAt: string; // Dolaba eklendiği tarih, örn: "2026-10-14"
  color?: ColorName; // Kıyafetin rengi (kombin önerisi için). Eski kayıtlarda ve seçilmediyse yok
  // Her giyimin yeri, wearDates ile aynı sırada (wearPlaces[3] = wearDates[3]'teki yer).
  // Yer seçilmediyse null. Eski kayıtlarda bu alan hiç yok. Sadece AppContext değiştirir.
  wearPlaces?: (PlaceName | null)[];
};

// Kaydedilmiş bir kombin (Arşiv)
export type SavedOutfit = {
  id: string; // Her kombine özel, değişmeyen kimlik
  itemIds: string[]; // Kombindeki kıyafetlerin kimlikleri (silinen kıyafet buradan da çıkar)
  name: string | null; // Kullanıcının verdiği ad, örn: "Cuma akşamı 🍸". Verilmediyse null (otomatik ad gösterilir)
  favorite: boolean; // Yıldızlı mı? Favoriler arşivde en üstte
  wornDates: string[]; // "Bu kombini giydim"e her basıldığında o günün tarihi
  createdAt: string; // Kaydedildiği gün, örn: "2026-10-16"
};
