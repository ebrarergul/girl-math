# Girl Math – Proje Notları (Claude için)

## Ekip
- **Ebrar** – Mac (Terminal). Arayüz ve tasarım tarafı. App Store yayını onun Mac'inden yapılacak.
- **Onur** – Windows (VS Code terminali). Arka plan ve mantık tarafı (veri, hesaplamalar, bildirimler).
- İkimiz de Bilişim Sistemleri Mühendisliği öğrencisiyiz, yazılım deneyimimiz az.
- Kod GitHub'da: https://github.com/ebrarergul/girl-math (ana dal: `main`).

## Çalışma kuralları
- Her zaman Türkçe yaz.
- **Çok basit anlat:** Yazılım deneyimimiz az. Her adımda ne yaptığını ve nedenini tane tane,
  herkesin anlayacağı şekilde açıkla. Teknik bir terim kullanırsan bir cümleyle ne demek
  olduğunu söyle, mümkünse günlük hayattan bir benzetme yap. Adımları numaralı ve kısa yaz.
- Büyük değişiklikleri yapmadan önce sor. Her değişiklikten önce ne yapacağını kısaca söyle.
- **Adım adım ilerle:** Tek seferde tek küçük adım yap. Adım bitince ne değiştiğini ve nasıl
  test edileceğini söyle, sonra dur. Kullanıcı "tamam" demeden bir sonraki adıma, dosya
  değişikliğine veya komuta geçme.
- Yeni paket gerekirse her zaman `npx expo install ...` kullan (npm install <paket> değil).
- Bir iş bittiğinde nasıl test edileceğini adım adım yaz.
- Bitirmeden önce `npx tsc --noEmit` ve `npx expo lint` çalıştır.
- Terminal komutlarını **tek tek** ver (her biri ayrı kod bloğunda). Birden fazla satır birlikte
  yapıştırılınca PowerShell bunları birleştirip hata veriyor.
- **Git kuralı:** Her aşamanın sonunda GitHub'a push etmeyi hatırlat. Komutları hem Mac
  (Ebrar) hem Windows (Onur) için yaz ve diğer kişinin değişiklikleri nasıl çekeceğini
  (`git pull`, gerekirse ardından `npm install`) açıkla. Commit ve push'u kullanıcı
  istemeden kendin yapma.
- **Çalışmaya başlamadan önce mutlaka `git pull origin main`** (package.json değiştiyse ardından
  `npm install`). Böylece iki kişinin değişiklikleri çakışmaz.
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
- **İlk açılış ekranı "Girl Math Kullanım Sözleşmesi"** (`src/components/agreement-screen.tsx`).
  Onaylanınca AsyncStorage'a `girlmath.agreementAccepted = true` yazılır, bir daha gösterilmez.
  İleride gelecek Welcome/giriş adımları bu sözleşmeden *sonra* gelir.
- **Sadece açık tema** (app.json: `"userInterfaceStyle": "light"`). Karanlık mod sonra.
- **Fotoğraflar:** expo-image-picker ile seçilir, expo-file-system'in File/Paths API'siyle
  `Paths.document` altına kopyalanır. Kayıtta tam yol değil **sadece dosya adı** tutulur,
  tam yol çalışma anında üretilir (iOS'ta güncelleme sonrası klasör yolu değişebiliyor).
- **Veri:** Kıyafetler `src/context/app-context.tsx` içindeki AppContext'te tutulur ve her
  değişiklikte AsyncStorage'a (`girlmath.items` anahtarı) otomatik kaydedilir. Ekranlar
  AsyncStorage'a doğrudan yazmaz, hep `useApp()` kullanır.
- Giyilme sayısı ayrıca tutulmaz, `wearDates.length` ile hesaplanır.
- Hedef giyilme sayısı girilmezse varsayılan **30** (#30wears), `DEFAULT_TARGET_WEARS`.
- Kategoriler: Üst, Alt, Elbise, Dış giyim, Ayakkabı, Çanta, Aksesuar (`src/lib/types.ts`
  içindeki `CATEGORIES` listesi).
- **Bildirimler** (yerel, sunucusuz – `src/lib/notifications.ts`): 3 tür var.
  1) Ödül: kıyafet "Giydim" ile tam hedefe ulaştığında hemen (sadece 1 kere).
  2) Takılma: en uzun süredir giyilmeyen kıyafet için 3 gün sonra 20:00; bildirim günü en az
     14 gündür giyilmemiş olmalı. 3) Günlük hatırlatma: her akşam 20:00.
  Mesajlar Türkçe ek gerektirmeyecek şekilde yazılır (kıyafet adı "ceketi/elbiseyi" sorunu).
  İzin, kıyafet eklenince istenir (iPhone pencereyi sadece 1 kere gösterir).
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

## Hazır araçlar (ekranlar bunları kullanır, yeniden yazılmaz)
Kıyafet verisi ve hesaplar hazır. Ekran yaparken bunları **çağır**, aynısını yeniden yazma.

**Kıyafetler – `useApp()`** (`@/context/app-context`)
```tsx
const { items, isLoaded, addItem, wearItem, undoWear, deleteItem } = useApp();

items                 // Dolaptaki tüm kıyafetler (ClothingItem listesi, en yeni en başta)
isLoaded              // Telefondaki kayıtlar okundu mu? false iken "Yükleniyor" gösterilebilir
addItem({ name: 'Siyah deri ceket', category: 'Dış giyim', price: 3000, photoFileName: null })
                      // targetWears verilmezse 30 olur; id, wearDates, createdAt otomatik
wearItem(item.id)     // "Giydim": bugünün tarihini ekler
undoWear(item.id)     // "Geri al": son tarihi siler
deleteItem(item.id)   // Kıyafeti siler
```

**Hesaplar** (`@/lib/girl-math`)
```tsx
costPerWear(item)        // Giyilme başına maliyet, tam TL (hiç giyilmediyse fiyat)
wearCount(item)          // Kaç kere giyildi
isPaidOff(item)          // Hedefe ulaştı mı ("amorti edildi")
daysSinceLastWear(item)  // Son giyilmeden bu yana kaç gün (hiç giyilmediyse eklendiği günden)
todayString()            // Bugün, "2026-10-14" biçiminde
```

**Gerçek hayat kıyası** (`@/lib/comparisons`)
```tsx
comparisonText(costPerWear(item))  // "Maliyeti bir filtre kahveye düştü! ☕" ya da "Resmen bedava! 🎉"
findComparison(cost)               // Eşleşen kalem ({ emoji, name, phrase, price }) ya da null
COMPARISONS                        // Fiyat listesi (fiyatlar değişince sadece burası güncellenir)
```
Kıyas cümlesi sadece kıyafet **en az 1 kere giyildiyse** gösterilir (hiç giyilmemişse
"…düştü" demek anlamsız).

**Fotoğraflar** (`@/lib/photos`)
```tsx
const fileName = await pickAndSavePhoto();  // Galeriyi açar, kırptırır, kopyalar; vazgeçilirse null
addItem({ ..., photoFileName: fileName });  // Kayda sadece dosya adı gider
<Image source={{ uri: photoUri(item.photoFileName) }} />  // Gösterirken tam adres üretilir (expo-image)
deletePhoto(fileName)                       // Gerekirse; deleteItem() fotoğrafı zaten kendisi siler
```

**Dolap istatistikleri** (`@/lib/stats`) – Cüzdan ve Ana sayfa için
```tsx
const stats = getWardrobeStats(items);
stats.totalItems          // Toplam parça
stats.totalValue          // Dolap değeri (TL)
stats.totalWears          // Toplam giyilme
stats.averageCostPerWear  // Ortalama giyim başına maliyet (TL); hiç giyilme yoksa null
stats.paidOffCount        // Amorti edilen parça sayısı
stats.neverWornCount      // Hiç giyilmeyen parça sayısı
stats.mostWorn            // En çok giyilen kıyafet; yoksa null
stats.forgotten           // { item, days }: en uzun süredir giyilmeyen; dolap boşsa null
stats.wearsThisMonth      // Bu ayki giyilme sayısı
stats.girlMathSavings     // Şaka istatistik "Girl Math kazancın": Σ(fiyat − giyim başına maliyet)
```
Dolap boşken de çalışır (0 / null döner), ekran null durumlarını kontrol etmeli.

**Bildirimler** (`@/lib/notifications`) – çoğu **otomatik**, ekranların bir şey yapmasına gerek yok
- AppContext kendisi hallediyor: `addItem` izin ister, `wearItem` hedefe ulaşınca ödül gönderir,
  liste değişince günlük + takılma bildirimleri yeniden kurulur.
- Ekranlar sadece gerekirse: `requestNotificationPermission()` (ör. bir "Bildirimleri aç"
  butonu), `sendTestNotification()` (5 sn sonra deneme bildirimi).
- Mesajlar ve saat (20:00) bu dosyanın en üstündeki listelerde; değiştirmek için sadece orası.

**Veri tipi** (`@/lib/types`): `ClothingItem` → `id, name, category, price, photoFileName,
wearDates, targetWears, createdAt`. Kategoriler `CATEGORIES` listesinde.

Örnek kullanım için `src/components/dev-test-panel.tsx` dosyasına bakılabilir.

## Görev dağılımı
Her iş sahibinin kendi klasörlerinde yapılır, böylece aynı dosyaya iki kişi dokunmaz.
- **Ebrar (ekranlar – `src/app/`, `src/components/`):**
  - 3. aşama: sekmeler (Ana sayfa, Dolap, Cüzdan), şablon ekranlarının temizlenmesi
  - 4. aşama: Dolap ekranı (2 sütunlu kartlar), kıyafet detay ekranı, kıyafet ekleme formu
  - Veri ve hesaplar için yukarıdaki hazır araçları kullanır.
- **Onur (mantık – `src/lib/`, `src/context/`):**
  - Gerçek hayat kıyasları (`src/lib/comparisons.ts`) ✅
  - Fotoğraf kaydetme yardımcısı (`src/lib/photos.ts`) ✅
  - İstatistik hesapları (`src/lib/stats.ts`) ✅
  - Bildirimler (`src/lib/notifications.ts`) ✅
  - Şablondan kalan lint hatasının düzeltilmesi ✅
- Bir kişi diğerinin alanındaki bir dosyaya dokunmak zorunda kalırsa önce haber verir.

## Aynı anda çalışma kuralları (çakışmayı önlemek için)
1. **Ortak dosyalar:** `CLAUDE.md`, `src/app/_layout.tsx`, `package.json`, `package-lock.json`
   ikimizi de ilgilendirir. Bunlardan birine dokunmadan (veya yeni paket kurmadan) önce diğerine
   haber verilir. Claude da bu dosyaları değiştirmeden önce kullanıcıya hatırlatır.
2. **Hazır araçlar:** `useApp()`, `girl-math.ts` fonksiyonları ve `types.ts` alanlarına yeni şey
   eklemek serbest. Var olan bir şeyin adını değiştirmek veya silmek diğerinin ekranını bozar;
   önce haber verilir.
3. **Sık sık pull/push:** Her çalışmaya başlarken `git pull origin main`, her küçük iş bitince
   push. Push "rejected" derse: önce `git pull origin main`, sonra tekrar `git push origin main`.
- Terminalde **"CONFLICT"** çıkarsa durulur ve çıktı Claude'a yapıştırılır, birlikte çözülür.
  Hiçbir şey kaybolmaz; `git reset --hard` veya `--force` gibi komutlar kullanılmaz.

## Dosya yapısı
- `src/app/` – ekranlar. `_layout.tsx`: AppProvider + sözleşme kontrolü + sekmeler.
  `index.tsx`, `explore.tsx` hâlâ Expo şablonu (Ebrar değiştirecek).
- `src/components/` – tekrar kullanılan bileşenler (şablondan gelenler de burada)
  - `agreement-screen.tsx` – Girl Math Kullanım Sözleşmesi ekranı
  - `app-tabs.tsx` – alt sekmeler (bordo renkli)
  - `dev-test-panel.tsx` – **GEÇİCİ** deneme paneli (Explore'da). Gerçek Dolap ekranı yapılınca
    bu dosya ve `explore.tsx`'teki `<DevTestPanel />` satırı silinecek.
- `src/constants/theme.ts` – ortak tema
- `src/context/app-context.tsx` – hafıza merkezi (kıyafetler + AsyncStorage)
- `src/lib/types.ts` – veri tipleri; `src/lib/girl-math.ts` – hesaplamalar;
  `src/lib/comparisons.ts` – gerçek hayat kıyasları ve fiyat listesi;
  `src/lib/photos.ts` – fotoğraf seçme, kaydetme, silme;
  `src/lib/stats.ts` – dolap istatistikleri;
  `src/lib/notifications.ts` – bildirim mesajları, izin ve kurma araçları
- `src/hooks/` – yardımcı hook'lar

## Bilinen durumlar
- `src/hooks/use-color-scheme.web.ts` şimdilik her zaman `'light'` döner (sadece açık tema).
  Karanlık mod eklenince yeniden düzenlenecek. `npx expo lint` şu an 0 hata veriyor.
- `npm install` sonrası "29 vulnerabilities" ve "npm warn" yazıları normal.
  **`npm audit fix --force` çalıştırılmaz** (paket sürümlerini bozar).
- **Expo hesabı:** Bilgisayardaki Expo CLI bir hesaba girişliyse, sadece aynı hesaptaki Expo Go
  projeyi açabilir. Bu yüzden herkes kendi bilgisayarından kendi telefonuyla test eder
  (gerekirse `npx expo logout`). İleride expo.dev'de ortak Organization kurulacak.
- Fotoğraf izin açıklaması (iOS "fotoğraflarınıza erişmek istiyor" metni) henüz `app.json`'a
  eklenmedi. Expo Go'da gerekmiyor; 7. aşamada (App Store) eklenecek.
- Expo Go'da bildirim izni penceresinde "Girl Math" değil "Expo Go" yazar; normal. Gerçek
  uygulamada (App Store) kendi adımız çıkar. Takılma bildirimi 14+ gün gerektirdiği için hızlı
  test edilemez; deneme panelindeki "🔔 Test bildirimi" butonu kullanılır.
- Sözleşme bir kez onaylanınca bir daha çıkmaz. Tekrar görmek için Expo Go silinip yüklenir.
- "Could not resolve host: github.com" hatası internet takılmasıdır; tekrar push denenir.

## Eski proje
Onur'un bilgisayarında Masaüstündeki `girl-math-app` klasörü önceki deneme. Orada çalışan
parçalar (AsyncStorage ile kalıcı kayıt, fotoğraf ekleme, dolap/cüzdan ekranları) gerektiğinde
buraya temiz şekilde taşınabilir. Doğrudan kopyalanmaz, bu projenin kurallarına göre uyarlanır.

## Sıradaki işler
1. Ortak tema dosyası ✅
2. Veri modeli ve AppContext (kıyafetler, giyilme tarihleri, AsyncStorage) – Onur ✅
   (+ Kullanım Sözleşmesi açılış ekranı ✅)
3. Welcome ekranı ve sekme yapısı (Ana sayfa, Dolap, Cüzdan) – Ebrar
4. Dolap ekranı ve kıyafet ekleme (fotoğraflı) – ekranlar Ebrar, fotoğraf kaydetme Onur
5. Gerçek hayat kıyasları ve yerel bildirimler (expo-notifications) – Onur ✅
6. Ekstra özellikler (Starbucks Endeksi, Dolap Tarotu, Kahoot, OCR)
7. App Store hazırlığı (Apple Developer hesabı, EAS Build/Xcode, TestFlight, gizlilik
   politikası, izin metinleri)
