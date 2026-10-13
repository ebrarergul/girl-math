# Girl Math – Proje Notları (Claude için)

## Ekip
- **Ebrar** – Mac (Terminal). Arayüz ve tasarım tarafı. App Store yayını onun Mac'inden yapılacak.
- **Onur** – Windows (VS Code terminali). Arka plan ve mantık tarafı (veri, hesaplamalar, bildirimler).
- İkimiz de Bilişim Sistemleri Mühendisliği öğrencisiyiz, yazılım deneyimimiz az.
- Kod GitHub'da: https://github.com/ebrarergul/girl-math (ana dal: `main`).

## Çalışma kuralları
- Her zaman Türkçe yaz.
- Her adımda ne yaptığını ve nedenini basitçe açıkla.
- Büyük değişiklikleri yapmadan önce sor. Her değişiklikten önce ne yapacağını kısaca söyle.
- **Adım adım ilerle:** Tek seferde tek küçük adım yap. Adım bitince ne değiştiğini ve nasıl
  test edileceğini söyle, sonra dur. Kullanıcı "tamam" demeden bir sonraki adıma, dosya
  değişikliğine veya komuta geçme.
- Yeni paket gerekirse her zaman `npx expo install ...` kullan (npm install <paket> değil).
- Bir iş bittiğinde nasıl test edileceğini adım adım yaz.
- Bitirmeden önce `npx tsc --noEmit` ve `npx expo lint` çalıştır.
- **Git kuralı:** Her aşamanın sonunda GitHub'a push etmeyi hatırlat. Komutları hem Mac
  (Ebrar) hem Windows (Onur) için yaz ve diğer kişinin değişiklikleri nasıl çekeceğini
  (`git pull`, gerekirse ardından `npm install`) açıkla. Commit ve push'u kullanıcı
  istemeden kendin yapma.
- Kod hem Windows'ta hem Mac'te çalışmalı: sabit dosya yolu (C:\..., /Users/...) yazma,
  import'larda `@/...` kullan, platforma özel komutlardan kaçın.
- Aynı anda aynı dosyayı düzenlemekten kaçınıyoruz: ekranlar/bileşenler genelde Ebrar'da,
  `src/context`, `src/lib` gibi mantık dosyaları genelde Onur'da.

## Uygulama fikri
TikTok'taki "Girl Math" trendini dijitalleştiren, oyunlaştırma tabanlı dolap ve bütçe
asistanı. Hedef kitle Z kuşağı kadınlar. Hedef: App Store.
- Dijital dolap: kıyafet fotoğraf ve fiyatla eklenir.
- "Giydim" (check-in) butonu giyilme sayısını artırır, giyilme başına maliyet düşer.
- Maliyet gerçek hayatla kıyaslanır: "Ceketinin bugünkü maliyeti bir filtre kahveye düştü!"
- Eğlenceli bildirimler: ödül ("Tebrikler aşko! ... resmen bedava") ve takılma
  ("o 3000 liralık elbiseyi 6 aydır 1 kere giydin, acil giy ya da sat!").
- Sonraki özellikler: etiket okuyan OCR kamera, Starbucks Endeksi (fırsat maliyeti
  simülatörü), "Zaman Aşımı = Bedava" modülü, günlük kombin öneren Dolap Tarotu,
  haftalık hafıza testi Dolap Kahoot'u, paylaşılabilir istatistik kartı.
- Gelir modeli (ileride): Freemium; ilk 10-15 parça ücretsiz, sınırsız ekleme ve detaylı
  analiz için aylık ~29 TL Premium.

## Kesinleşmiş kararlar
- **Teknoloji:** Expo (React Native), SDK 57, expo-router (ekranlar `src/app` içinde),
  TypeScript, React Compiler açık. Test: iPhone'da Expo Go (`npx expo start -c`).
- **Üyelik/giriş yok.** Tüm veriler telefonda (lokalde) tutulur (AsyncStorage). Giriş
  ekranı yerine bir "Welcome" karşılama ekranı olacak. Sunucu ileride (senkron, paylaşım,
  premium) gerekirse eklenir.
- **Sadece açık tema** (app.json: `"userInterfaceStyle": "light"`). Karanlık mod sonra.
- **Fotoğraflar:** expo-image-picker ile seçilir, expo-file-system'in File/Paths API'siyle
  `Paths.document` altına kopyalanır. Kayıtta tam yol değil **sadece dosya adı** tutulur,
  tam yol çalışma anında üretilir (iOS'ta güncelleme sonrası klasör yolu değişebiliyor).
- OCR gibi Expo Go'da olmayan yerel modüller "development build" gerektirir; bu tür
  paketleri eklemeden önce mutlaka sor.

## Tasarım (UI/UX)
- Tüm renk, yazı stili, boşluk, köşe ve gölgeler `src/constants/theme.ts` içinde.
  **Ekranlarda renk kodu elle yazılmaz**, `Colors.light.primary`, `Typography.title`,
  `Radius.lg`, `Shadows.card` gibi tema değerleri kullanılır.
- Dil: pembe / koyu kırmızı (bordo `#BE123C`) / fildişi zemin (`#FAF7F5`), beyaz kartlar,
  bol yuvarlak köşe, yumuşak gölge, minimalist ve "lüks editorial" his.
- Referans tasarımlardan alınan kalıplar: "Find your Favorite Items!" tarzı büyük başlık,
  arama + filtre butonu, seçili olanı bordo dolgulu kategori hapları/kutuları, 2 sütunlu
  ürün kartları ve köşede kalp rozeti, detay sayfasında solda bilgi rozetleri ve sağda
  büyük fotoğraf, **üstü çizili satın alma fiyatı + bordo renkli güncel giyim maliyeti**,
  bordo hap şeklinde ana buton.

## Girl Math hesaplama mantığı
- Giyilme başına maliyet = `fiyat / giyilmeSayısı`. Hiç giyilmediyse maliyet = fiyat.
  Ekranda tam TL'ye yuvarlanır.
- Yeni eklenen kıyafet `0` giyilme ile başlar.
- Her "Giydim" basışında o günün tarihi kaydedilir (`wearDates` listesi). "Uzun süredir
  giyilmedi" uyarısı ve istatistikler bu tarihlerden hesaplanır.
- Her kıyafetin bir hedef giyilme sayısı (`targetWears`) vardır. Ona ulaşınca
  "amorti edildi" sayılır.
- Gerçek hayat kıyasları (filtre kahve, iced latte, simit, metro bileti vb.) ve fiyatları
  tek bir dosyada tutulur; fiyatlar değiştikçe sadece orası güncellenir. Maliyet, kendisine
  eşit ya da altındaki en pahalı kalemle eşleştirilir.

## Dosya yapısı
- `src/app/` – ekranlar (şu an Expo şablonu: index, explore)
- `src/components/` – tekrar kullanılan bileşenler (şablondan gelenler de burada)
- `src/constants/theme.ts` – ortak tema
- `src/hooks/` – yardımcı hook'lar

## Eski proje
Onur'un bilgisayarında Masaüstündeki `girl-math-app` klasörü önceki deneme. Orada çalışan
parçalar (AsyncStorage ile kalıcı kayıt, fotoğraf ekleme, dolap/cüzdan ekranları) gerektiğinde
buraya temiz şekilde taşınabilir. Doğrudan kopyalanmaz, bu projenin kurallarına göre uyarlanır.

## Sıradaki işler
1. Ortak tema dosyası ✅
2. Veri modeli ve AppContext (kıyafetler, giyilme tarihleri, AsyncStorage) – Onur
3. Welcome ekranı ve sekme yapısı (Ana sayfa, Dolap, Cüzdan) – Ebrar
4. Dolap ekranı ve kıyafet ekleme (fotoğraflı)
5. Gerçek hayat kıyasları ve yerel bildirimler (expo-notifications)
6. Ekstra özellikler (Starbucks Endeksi, Dolap Tarotu, Kahoot, OCR)
7. App Store hazırlığı (Apple Developer hesabı, EAS Build/Xcode, TestFlight, gizlilik
   politikası, izin metinleri)
