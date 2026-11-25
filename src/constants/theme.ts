/**
 * GIRL MATH – ORTAK TEMA DOSYASI
 *
 * Uygulamadaki tüm renkler, köşe yuvarlaklıkları, boşluklar, gölgeler ve yazı
 * stilleri BURADAN gelir. Ekranlarda '#D61F69' gibi renk kodlarını elle yazmayın;
 * bunun yerine şöyle kullanın:
 *
 *   import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
 *   backgroundColor: Colors.light.primary
 *
 * Bir rengi değiştirmek isterseniz sadece bu dosyayı değiştirin, tüm uygulama
 * birlikte güncellenir.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Marka paleti: sıcak krem zemin + beyaz kartlar + koyu yazı; fuşya pembe SADECE vurgu
// (butonlar, seçili durumlar, en önemli rakam). 25 Kasım 2026: eskiden zemin pembemsi beyazdı ve
// açık pembe her yerdeydi; "çok pembe, göz yoruyor" denince taslak B (krem + pembe vurgu) seçildi.
const Palette = {
  hotPink: '#D61F69', // Ana marka rengi: butonlar, seçili kategori, vurgulu fiyat (beyaz yazı okunur)
  hotPinkDark: '#B0144F', // Basılı buton, koyu vurgu
  neonPink: '#FF5C93', // Sadece süs: kalp rozeti, parıltı, geçiş. Üstüne yazı konmaz (okunmaz)
  roseMist: '#F4E8EB', // Çok soluk, tozlu gül: simge daireleri, alıntı kutuları, çubuk zemini
  dustyRose: '#E7C6D2', // Tozlu gül: ince çizgiler, zaman çizgisi, kesikli kenarlar
  cream: '#F5F1EB', // Sıcak krem zemin
  white: '#FFFFFF',
  ink: '#1C1A19', // Ana yazı (sıcak antrasit)
  taupe: '#6F6863', // İkincil yazı (krem zeminde de okunur: kontrast ~4.9)
  mist: '#A39C95', // Soluk yazı, ipuçları, üstü çizili fiyat
  sand: '#E8E1D9', // İnce kenarlıklar
  linen: '#EFEAE3', // Hafif dolgu (input, pasif buton, seçici zemini)
  green: '#10B981', // "Amorti edildi" / başarı
  amber: '#F59E0B', // "Hedefe doğru" / uyarı
  red: '#EF4444', // Silme / hata
  // Krom/gümüş (Y2K): referans taslaktaki pembe çanta + krom detay havası
  chromeLight: '#FAFAFB',
  chromeMid: '#E4E5EA',
  chromeDark: '#C3C6CE',
  // Story kartlarının pembe zemini (26 Kasım: "Story kısmı pembe olsun, girls girls")
  storyLight: '#FDEAF1',
  storyMid: '#F9CFDF',
  storyDeep: '#F3A9C4',
} as const;

const light = {
  // Expo şablonunun kullandığı anahtarlar (ThemedText, ThemedView, sekmeler)
  text: Palette.ink,
  background: Palette.cream,
  backgroundElement: Palette.linen,
  backgroundSelected: Palette.roseMist,
  textSecondary: Palette.taupe,

  // Girl Math anahtarları
  textMuted: Palette.mist,
  card: Palette.white,
  border: Palette.sand,
  primary: Palette.hotPink,
  primaryPressed: Palette.hotPinkDark,
  onPrimary: Palette.white, // Pembe zemin üstündeki yazı/ikon rengi
  primarySoft: Palette.roseMist,
  highlight: Palette.neonPink, // Süs rengi (kalp, parıltı); üstüne yazı konmaz
  accent: Palette.dustyRose,
  success: Palette.green,
  warning: Palette.amber,
  danger: Palette.red,
  overlay: 'rgba(24, 16, 20, 0.4)', // Alttan açılan pencerenin arkasındaki yarı saydam karartma
};

export const Colors = {
  light,
  // İlk sürümde sadece açık tema var (app.json: "userInterfaceStyle": "light").
  // Karanlık mod eklenince burası ayrı renklerle doldurulacak.
  dark: light,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

// Hazır yazı stilleri: style={Typography.title} gibi kullanılır, renk ayrıca verilir
export const Typography = {
  // hero ve title "editorial" tırnaklı yazı tipiyle (iPhone'da New York): moda dergisi havası
  hero: { fontFamily: Fonts?.serif, fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -0.6 }, // Büyük istatistik / karşılama
  title: { fontFamily: Fonts?.serif, fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.4 }, // Ekran başlığı
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '800', letterSpacing: -0.3 }, // Bölüm başlığı
  body: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  bodyBold: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  // Küçük etiketler. Otomatik büyük harf (textTransform) KULLANILMAZ: telefon İngilizce kuralla
  // "Kategori"yi "KATEGORI" yapıyor. Etiket metni kodda Türkçe büyük harfle yazılır: "KATEGORİ"
  label: { fontSize: 10, lineHeight: 14, fontWeight: '700', letterSpacing: 0.6 },
  price: { fontSize: 18, lineHeight: 22, fontWeight: '800' }, // Vurgulu (giyim başına) fiyat
  priceStrike: { fontSize: 12, lineHeight: 16, fontWeight: '500', textDecorationLine: 'line-through' }, // Üstü çizili satın alma fiyatı
  button: { fontSize: 14, lineHeight: 18, fontWeight: '800', letterSpacing: 0.5 },
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// Köşe yuvarlaklıkları: referanslardaki yumuşak, "yastık gibi" kartlar
export const Radius = {
  sm: 12, // Küçük butonlar, rozetler, input
  md: 16, // Kart içindeki görseller
  lg: 22, // Kartlar
  xl: 28, // Alttan açılan pencereler, büyük görsel alanları
  pill: 999, // Tam yuvarlak: hap butonlar, kalp rozeti
} as const;

// Gölgeler: style={[styles.kart, Shadows.card]} gibi eklenir
// Hazır renk geçişleri (expo-linear-gradient'e colors={Gradients.chrome} diye verilir)
export const Gradients = {
  // Metal parlaması gibi dalgalanan gümüş: Ana sayfadaki burç şeridi ve burç sayfasının kartı
  chrome: [Palette.chromeMid, Palette.chromeLight, Palette.chromeDark, Palette.chromeLight] as const,
  // Story kartları: açık şeker pembesinden gül pembesine (uygulama içi sayfalar krem kalır,
  // Story paylaşılan "girls girls" an olduğu için pembe)
  story: [Palette.storyLight, Palette.storyMid, Palette.storyDeep] as const,
};

export const Shadows = {
  card: {
    shadowColor: Palette.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  button: {
    shadowColor: Palette.hotPink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
