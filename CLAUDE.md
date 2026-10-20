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
  simülatörü), "Zaman Aşımı = Bedava" modülü, günlük kombin öneren burç yorumu (eski Dolap Tarotu),
  haftalık hafıza testi Dolap Kahoot'u, paylaşılabilir istatistik kartı (✅ Story kartı).
- Gelir modeli (ileride): Freemium; ilk 10-15 parça ücretsiz, sınırsız ekleme ve detaylı
  analiz için aylık ~29 TL Premium.

## Özellik detayları (proje fikri PDF'lerinden – bir özelliği yaparken buna uyulur)
- **Akıllı Etiket Okuyucu (OCR):** Eklerken kamera ikonuyla mağaza etiketi okutulur; Apple'ın
  metin tarama teknolojisiyle marka ("ZARA") ve fiyat ("2000 TL") forma dolar. Etiket
  görüntüsü cihaza **kaydedilmez** (gizlilik). Development build gerektirir.
- **Utanç Duvarı (zarar yazma uyarıları):** Aylardır giyilmeyen pahalı parçalar için hafif
  sataşan uyarılar, **günlük zarar** hesabıyla: "O pembe elbise 60 gündür askıda ve sana
  günlük 50 TL zarar yazıyor. Ya bu hafta sonu giy ya da satışa koy!" ✅ Ekranda var:
  Ana sayfada "Unutulan parça" kartı + `src/app/shame-wall.tsx` (Utanç Duvarı sayfası).
  Zarar = fiyat ÷ 365 × giyilmeden geçen gün (`lossAmount`/`lossText`, `clothing-card.tsx`);
  günlük tutar sadece ≥ 10 ₺ ise yazılır, asıl vurgu biriken zarar + kıyas ("≈ Brunch 🥞").
  Takılma **bildirimi** (Onur) bu hesabı henüz kullanmıyor; istenirse oradan çağrılabilir.
- **Starbucks Endeksi (fırsat maliyeti simülatörü):** Asıl amaç **satın almadan önce** karar
  desteği: kullanıcı alacağı ürünün fiyatını girer → "Bunu alırsan 25 iced latte ve
  arkadaşlarınla iki akşam yemeğinden vazgeçiyorsun; değer mi?" ✅ "Almalı mıyım?" ekranı
  (`src/app/should-i-buy.tsx`, Cüzdan'dan açılır) bunu yapıyor.
- **Zaman Aşımı = Bedava (etkinlik modu):** Kıyafet "Etkinlik için alındı" etiketi ve
  etkinlik tarihiyle kaydedilir. O gün: "Bu elbisenin parası hesaptan çoktan çıktı. Bugünkü
  maliyeti 0 TL; bedavaya harika görünüyorsun!" bildirimi. ✅ Mantık + bildirimler (Onur,
  `events.ts`), ekranlar (Ebrar, 20 Ekim): formda "🎉 Etkinlik için aldım", detayda geri sayım ve
  etkinlik günü yeşil 0 ₺, Ana sayfada 7 gün kala geri sayım kartı.
- **Dolap Tarotu → Burç yorumu (günün enerjisi):** İlk fikir Dolap Tarotu'ydu (kart çekip
  unutulmuş parça önerisi). 16 Ekim'de Onur + Ebrar kararıyla yerine **burç yorumu** geldi ✅
  (17 Ekim): gerçek gökyüzüne göre günlük/haftalık yorum, şanslı renk, dolaptan o renkte parça
  ve etrafında kombin. `tarot-card.tsx` silindi; gümüş "büyü" şeridi burç şeridine geçti.
- **Dolap Kahoot'u (haftalık hafıza testi):** Hafta sonları süreli mini yarışma: "Bu ceketi en
  son ne zaman giydin?", "En çok hangi rengi giyerek kâr ettin?". Başarıya "Tasarruf
  Kraliçesi" gibi rozetler. ✅ Mantık (Onur, `quiz.ts`) + ekranlar (Ebrar, 20 Ekim): Ana sayfa
  kartı, `kahoot.tsx` yarışma + sonuç, Story rozet kartı.
- **Kombin önerisi (Ebrar'ın fikri, makara dışı "işe yarar" özellik):** Renk ve kategoriye
  göre kombin: Üst + Alt + Ayakkabı (+ Çanta) ya da Elbise + Ayakkabı (+ Dış giyim). Renk
  uyumu basit kurallarla (nötrler her şeyle; aynı rengin tonları; tamamlayıcı renkler),
  internet/yapay zekâ gerekmez. **Girl Math dokunuşu:** unutulan ve amortiye en uzak parçalar
  öne çıkar ("Bugün bunu giyersen ceketin 500 TL'ye düşer!"). Aynı motor Ana sayfada
  "Günün kombini", burç yorumunda "Yıldızların seçimi" olarak kullanılır. Trend takibi sunucu/yapay zekâ
  gerektirdiği için sonraya; ara çözüm elle güncellenen "sezonun trend renkleri" listesi.
  Gerekenler: `ClothingItem`'a renk bilgisi + kombin motoru `src/lib/outfits.ts` (Onur),
  ekleme formunda renk seçici + Ana sayfada "Günün kombini" kartı (Ebrar).
- **Diğer mantıklı fikirler:** "Almalı mıyım?" hesaplayıcısı ✅ (Starbucks simülatörüyle
  birleştirildi: "kaç kere giyersen bir kahve fiyatına düşer?"), aylardır giyilmeyenlerden "satmayı düşün" listesi ✅,
  aylık özet ✅, renk analizi ✅ (üçü `src/app/insights.tsx`, 20 Ekim). Premium'daki "hangi rengi daha çok giyiyorum" analizi de renk
  bilgisine dayanır.

## Kesinleşmiş kararlar
- **Teknoloji:** Expo (React Native), SDK 57, expo-router (ekranlar `src/app` içinde),
  TypeScript, React Compiler açık. Test: iPhone'da Expo Go (`npx expo start -c`).
- **Üyelik/giriş yok.** Tüm veriler telefonda (lokalde) tutulur (AsyncStorage). Giriş
  ekranı yerine bir "Welcome" karşılama ekranı olacak. Sunucu ileride (senkron, paylaşım,
  premium) gerekirse eklenir.
- **İlk açılış ekranı "Girl Math Kullanım Sözleşmesi"** (`src/components/agreement-screen.tsx`).
  Onaylanınca AsyncStorage'a `girlmath.agreementAccepted = true` yazılır, bir daha gösterilmez.
  Sonra bir kez **Welcome karşılama ekranı** (`src/components/welcome-screen.tsx`) gelir;
  "Hadi başlayalım"a basılınca `girlmath.welcomeSeen = true` yazılır. Sıra: Sözleşme → Welcome
  → sekmeler. Kullanıcı adını sormak sonraya bırakıldı.
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
     14 gündür giyilmemiş olmalı. 3) Günlük hatırlatma: her akşam 20:00. 4) Etkinlik: bir gün
  önce 20:00 + o gün 10:00. 5) Kahoot: Cumartesi 11:00 "açıldı!" (dolapta ≥ 4 parça varsa), Pazar
  21:00 "bu gece kapanıyor" (o hafta oynanmadıysa; seri varsa "🔥 N haftalık serini bozma").
  Mesajlar Türkçe ek gerektirmeyecek şekilde yazılır (kıyafet adı "ceketi/elbiseyi" sorunu).
  İzin, kıyafet eklenince istenir (iPhone pencereyi sadece 1 kere gösterir).
- OCR gibi Expo Go'da olmayan yerel modüller "development build" gerektirir; bu tür
  paketleri eklemeden önce mutlaka sor.

## Tasarım (UI/UX)
- Tüm renk, yazı stili, boşluk, köşe ve gölgeler `src/constants/theme.ts` içinde.
  **Ekranlarda renk kodu elle yazılmaz**, `Colors.light.primary`, `Typography.title`,
  `Radius.lg`, `Shadows.card` gibi tema değerleri kullanılır.
- Dil: **"Hot Pink"** – canlı fuşya pembe (`primary` `#D61F69`) / pembemsi beyaz zemin
  (`#FFF7FA`), beyaz kartlar, bol yuvarlak köşe, yumuşak gölge. TikTok'a uygun canlı ama
  **iOS sadeliğinde**. (Eskiden bordo `#BE123C` idi; Ekim 2026'da daha canlı pembeye geçildi.)
- Neon pembe (`highlight` `#FF5C93`) sadece süs içindir (kalp, parıltı); **üstüne yazı konmaz**,
  beyaz yazı okunmuyor. Butonlarda `primary` kullanılır (beyaz yazı kontrastı 4.9).
- Büyük başlıklar (`Typography.title`, `Typography.hero`) iPhone'un **New York** tırnaklı
  yazı tipiyle (editorial/dergi havası); diğer yazılar sade sistem yazı tipi.
- **Türkçe büyük harf:** Küçük etiketlerde (`Typography.label`) otomatik büyük harf
  (`textTransform`) kullanılmaz; telefon İngilizce kuralla "Kategori"yi "KATEGORI" yapıyor.
  Etiket kodda Türkçe büyük harfle yazılır ("KATEGORİ") ya da `metin.toLocaleUpperCase('tr')`
  kullanılır. Dikkat: bu, İngilizce "Girl"ü "GİRL" yapar; marka adı hep elle "GIRL MATH" yazılır.
- Büyük rakamlarda dergi yazı tipinin ₺ işareti "Ł" gibi göründüğü için ₺ sade yazı tipinde
  (`Fonts.sans`) ve biraz küçük yazılır (detay ve Cüzdan'daki büyük rakamlar böyle).
- Mesajlarda kıyafet adı Türkçe ek almasın diye tırnak içinde **özne** yapılır:
  "“Ceket” 23 gündür askıda 👀" (❌ "Ceketi 23 gündür giymedin").
- **Gümüş (krom, Y2K)** = "ödül ve büyü" rengi: `Gradients.chrome` (theme.ts). Büyük gümüş
  tek yer burç sayfasının kartı; Ana sayfada sadece burç satırındaki küçük gümüş madalyon (20 Ekim:
  bütün şerit gri olunca pembe zeminde donuk duruyordu). Her yeri gümüş yapılmaz, yoksa özelliğini kaybeder.
- Sekmeler, Welcome ve Sözleşme'de zemin `ScreenBackground` (üstten süzülen açık pembe ışık);
  detay ve form sayfaları sade (düz zemin).
- Ana sayfada tek büyük odak noktası (pembe vitrin kartı) olur; diğerleri daha küçük kalır.
- **Sadeleştirme kuralları (20 Ekim, Ebrar'ın ekran görüntüleriyle):**
  1. Sayfa başına **tek pembe dolgulu vurgu** (Ana sayfa: vitrin kartı, Cüzdan: Girl Math kazancı);
     diğer her şey beyaz kart. Pembe çerçeveli (`accent` kenarlı) kart yapılmaz; pembe kenar sadece
     **seçili** durumlar için (seçili renk/burç/yer/hap).
  2. **Emoji başlıkta, etikette, listede yok**; sadece eğlenceli cümlelerde (kıyas, ayın yorumu, bildirim).
     Onur'un hazır cümleleri emojiyle başlıyorsa başlığa ayrıca emoji konmaz (çift emoji olur).
  3. **Aynı bilgi bir sayfada bir kere** yazılır (Cüzdan'da "parça sayısı" ve "bu ay dolaba giren" tekrarı kalktı).
  4. Bölüm başlıkları kartın **üstünde**, aynı stilde (`Typography.heading`); kartın içine küçük etiket konmaz.
  5. Küçük bilgiler (etkinlik, burç, Kahoot, Cüzdan bağlantıları) yüzen ayrı kartlar değil, iPhone
     Ayarları gibi **tek kartta satırlar** (simge dairesi + 2 satır + gri ok; `today-row.tsx`).
  6. Çerçeve içinde çerçeve yok: Dolap kartında beyaz kart kalktı, fotoğraf doğrudan zeminde
     (mağaza vitrini: Zara/Vinted gibi). Fotoğrafsız parçanın yer tutucusu beyaz zeminde pembe askı.
  7. Girl Math'in asıl anı (detaydaki kıyas cümlesi) **büyük, kalın, beyaz kartta** kalır ve Giydim'de
     animasyonla yenilenir; onu küçültme.
- Simgeler iPhone'un SF Symbols setinden (`expo-symbols`'ın `SymbolView`'u), pembe ve ince
  çizgili. Yer tutucularda emoji değil simge kullanılır; eğlenceli **mesajlarda** emoji serbest.
- Kıyafet fotoğrafları 3:4 dikey kırpılır, kart ve detaydaki fotoğraf alanları da 3:4.
- Referans tasarımlardan alınan kalıplar: "Find your Favorite Items!" tarzı büyük başlık,
  arama kutusu, seçili olanı pembe dolgulu kategori hapları, 2 sütunlu ürün kartları ve
  köşede kalp rozeti (amorti edilince), detay sayfasında pembe üst alanda solda bilgi
  satırları ve sağda büyük fotoğraf, **üstü çizili satın alma fiyatı + pembe güncel giyim
  maliyeti**, pembe hap şeklinde ana buton.

## Girl Math hesaplama mantığı
- Giyilme başına maliyet = `fiyat / giyilmeSayısı`. Hiç giyilmediyse **hesapta** maliyet =
  fiyat (`costPerWear`, istatistikler/bildirimler buna göre). Ama **ekranda** hiç giyilmemiş
  parçanın maliyeti **"∞"** (sonsuz) gösterilir (`costLabel`, `INFINITE_COST`): böylece ilk
  giyimde rakam ∞ → fiyat diye düşer. Kartta bir sonraki adımın ipucu da yazar
  ("1. giyimde → 2.500 ₺", "2. giyimde → 1.250 ₺"). Ekranda tam TL'ye yuvarlanır.
- Kıyas cümlesi (`itemComparisonText`): 0 giyimde yok, 1 giyimde "Şimdilik bir konser bileti
  değerinde 🎤 İkinci giyimde yarıya düşecek!" (maliyet düşmediği için "düştü" denmez),
  2+ giyimde "Maliyeti bir maniküre düştü! 💅".
- Yeni eklenen kıyafet `0` giyilme ile başlar.
- Her "Giydim" basışında o günün tarihi kaydedilir (`wearDates` listesi). "Uzun süredir
  giyilmedi" uyarısı ve istatistikler bu tarihlerden hesaplanır.
- Her kıyafetin bir hedef giyilme sayısı (`targetWears`) vardır. Ona ulaşınca
  "amorti edildi" sayılır.
- Gerçek hayat kıyasları (filtre kahve, iced latte, Spotify, taksi vb.) ve fiyatları
  tek bir dosyada tutulur; fiyatlar değiştikçe sadece orası güncellenir. Maliyet, kendisine
  eşit ya da altındaki en pahalı kalemle eşleştirilir.

## Hazır araçlar (ekranlar bunları kullanır, yeniden yazılmaz)
Kıyafet verisi ve hesaplar hazır. Ekran yaparken bunları **çağır**, aynısını yeniden yazma.

**Kıyafetler – `useApp()`** (`@/context/app-context`)
```tsx
const { items, isLoaded, addItem, wearItem, undoWear, deleteItem, updateItem, resetAll } = useApp();

items                 // Dolaptaki tüm kıyafetler (ClothingItem listesi, en yeni en başta)
isLoaded              // Telefondaki kayıtlar okundu mu? false iken "Yükleniyor" gösterilebilir
addItem({ name: 'Siyah deri ceket', category: 'Dış giyim', price: 3000, photoFileName: null })
                      // targetWears verilmezse 30 olur; id, wearDates, createdAt otomatik
wearItem(item.id)     // "Giydim": bugünün tarihini ekler
undoWear(item.id)     // "Geri al": son tarihi siler
deleteItem(item.id)   // Kıyafeti siler
updateItem(item.id, { price: 2500 })  // Düzenler: sadece verilen alanlar değişir
                      // (name, category, price, photoFileName, targetWears). Giyim geçmişi,
                      // id ve createdAt korunur. Fotoğraf değiştiyse eskisi silinir.
resetAll()            // Bütün dolabı + fotoğrafları siler (Ayarlar → "Bütün verileri sil").
                      // Sözleşme/Welcome bilgisine dokunmaz; liste boşalınca bildirimler de iptal olur.
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
comparisonText(costPerWear(item))  // "Maliyeti bir maniküre düştü 💅 On numara beş yıldız ⭐" (yerel espri
                                   //   sonları; bedavaysa "Resmen bedava 🎉 Hesap makinesi bile ağladı")
findComparison(cost)               // Eşleşen kalem ({ emoji, name, phrase, price }) ya da null
COMPARISONS                        // Fiyat listesi (fiyatlar değişince sadece burası güncellenir)
```
Kıyas cümlesi sadece kıyafet **en az 1 kere giyildiyse** gösterilir (hiç giyilmemişse
"…düştü" demek anlamsız).

**Starbucks Endeksi** (`@/lib/starbucks-index`) – fiyatı günlük harcamalara çevirir
```tsx
starbucksIndexText(item.price)  // "= 11 iced latte 🧋 ya da 15 filtre kahve ☕" (aynı fiyat hep aynı cümle)
starbucksIndexMeme(item.price)  // Tek başına makara cümle (Onur ekledi): "Bu parayla 11 iced latte içer,
                                //   11 gün main character takılırdın 🧋✨". Başına "Dolabın" eklenmez.
                                //   Ekranda nerede kullanılacağına Ebrar karar verir.
starbucksIndexList(item.price)  // [{ comparison, count }, ...] en pahalıdan ucuza (detay ekranı için)
```

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

**Renkler** (`@/lib/colors`) – kıyafet rengi (isteğe bağlı alan `item.color`)
```tsx
COLORS               // [{ name: 'Siyah', hex: '#111111' }, ...] 18 renk (Kot mavisi, Desenli dahil)
colorHex(item.color) // Renk yuvarlağı çizmek için kod (tema rengi değil, kıyafetin rengi)
addItem({ ..., color: 'Beyaz' }) / updateItem(id, { color: 'Pembe' })  // renk isteğe bağlı
```
Eski kayıtlarda ve renk seçilmediyse `item.color` yok (undefined); ekranlar bunu kontrol etmeli.

**Fotoğraftan renk tahmini** (`@/lib/photo-color`, Ebrar ekledi) – ekleme formunda fotoğraf seçilince
```tsx
const color = await guessPhotoColor(photoUri(fileName));  // 'Bej' | 'Desenli' | ... ya da null
```
Telefonda, internetsiz: fotoğraf 160 piksele küçültülür (`expo-image-manipulator`), pikselleri
okunur (`jpeg-js`). Önce desen kontrolü (yan yana piksellerde sert geçiş oranı > %9 → "Desenli"),
desen yoksa ortadaki pikseller renk gruplarına ayrılır (k-means), kenardaki zemin grubu elenir,
en büyük grubun ortalama rengi en yakın renge eşlenir. Renksiz tonlar (canlılık < 5) açıklığa
göre Siyah/Gri/Beyaz; krem/kot/pudra gibi tonlar `EXTRA_SHADES` listesinde. Ayarlar dosyanın
üstündeki sabitlerde. Tahmindir: formda "Fotoğraftan tahmin ettim: Bej. Doğru mu? 🎨" yazar,
kullanıcı elle seçtiyse tahmin üstüne yazılmaz. Bilinen zayıflık: beyaz zeminde beyaz kıyafet,
çok koyu kot ("Siyah" der), üstünde büyük logo olan düz tişört ("Desenli" diyebilir).

**Kombin motoru** (`@/lib/outfits`) – "Bununla ne giyerim?" (kullanıcı puan görmez, sadece öneri)
```tsx
matchesFor(item, items)  // [{ category: 'Alt', matches: [{ item, reason: 'Beyaz her şeyle gider 🤍' }] }, ...]
                         //   Kategori kategori uyan parçalar, en iyi uyan en üstte. Uyumsuzlar hiç gelmez.
outfitFor(item, items)   // { items: [seçilen, ...], missing: ['Ayakkabı'], text: 'Bu kombinle “Siyah etek”
                         //   47 gün sonra yeniden gün yüzü görür 💅' }  Üst+Alt+Ayakkabı ya da Elbise+Ayakkabı,
                         //   uyarsa Dış giyim/Çanta/Aksesuar eklenir. missing: dolapta uygun parça yok.
colorMatch(a, b)         // { score, reason } – motorun iç aracı; kurallar dosyanın üstündeki listelerde
```
Ebrar'ın motorda yaptığı küçük değişiklikler (17 Ekim, Onur çalışmıyorken, izinle; yanlarında not var):
ikisi de nötrse sebep cümlesi **önerilen** parçanın rengini anlatır (yoksa "Siyah her şeyi kurtarır"
bej tişörtün altında yazıyordu); şık ikili bir nötr içerse de kendi cümlesi çıkar; yeni şık ikili
"Kahverengi + lacivert, sessiz lüks 🤎💙"; Lacivert cümlesi "Lacivert her renkle şık durur 💙";
rengi bilinmeyen parçanın puanı 50 → `MIN_MATCH_SCORE + 1` (listede en sona düşer, kombine sadece
rengi bilinen uygun parça yoksa girer). Puan mantığı başka değişmedi.
**Kombin arşivi** (`useApp()` + `@/lib/outfits`) – kaydet, favorile ⭐, "Bu kombini giydim"
```tsx
const { outfits, saveOutfit, toggleFavoriteOutfit, renameOutfit, deleteOutfit, wearOutfit } = useApp();
saveOutfit(outfit.items.map((i) => i.id), 'Cuma akşamı 🍸')  // ad isteğe bağlı; kimliği döner.
                                    //   Aynı parçalardan kombin zaten varsa yenisini eklemez.
toggleFavoriteOutfit(id) / renameOutfit(id, 'Yeni ad' | null) / deleteOutfit(id)
wearOutfit(id)                      // Bütün parçalara Giydim (ödül bildirimi dahil) + kombin tarihi.
                                    //   Bugün zaten giyilmiş parça atlanır, kombin tarihi günde 1 kez.
undoWearOutfit(id)                  // Geri al: bugün giyilen parçaların son Giydim'i + kombinin bugünkü
                                    //   tarihi silinir (Ebrar ekledi; kombin sayfasındaki ↩)
sortOutfits(outfits)                // Arşiv sırası: favoriler üstte, sonra en yeni
outfitItems(outfit, items)          // Kombinin kıyafetleri (silinenler atlanır)
outfitName(outfit, items)           // Görünen ad: verilen ad ya da “Beyaz tişört” kombini
```
Kayıt: `SavedOutfit` (`types.ts`) → `id, itemIds, name, favorite, wornDates, createdAt`, telefonda
`girlmath.outfits`. Kıyafet silinince kombinlerden çıkar; parçasız kalan kombin silinir.
`resetAll` kombinleri de siler. Bir parçanın bugünkü tek Giydim'i `undoWear` ile geri alınınca o
parçayı içeren kombinlerin bugünkü tarihi de silinir (Ebrar ekledi; yoksa kombin sayfası parça
giyilmediği halde "Bugün giydin" diyordu).

**Giyim yerleri** (`@/lib/places`) – "Nereye giderken giydin?"
```tsx
PLACES                             // [{ name: 'Okul', emoji: '🎓' }, ...] 9 yer; placeLabel('Okul') → "🎓 Okul"
wearItem(item.id, 'Okul')          // Yer isteğe bağlı; wearItem(item.id) eskisi gibi çalışır (yer = null)
wearOutfit(outfit.id, 'Date')      // Kombindeki bütün parçalara aynı yer
lastWearText(item)                 // "En son: ☕ Kahve · 3 gün önce" (detay için); hiç giyilmediyse null
repeatWarning(item, 'Okul')        // Giydim'den ÖNCE çağır: null (sorun yok) ya da { level, message }
                                   //   'soft' = son 14 günde 1 kez gitti (hafif hatırlatma, 2. kez)
                                   //   'strong' = 2+ kez gitti ("Aynı insanlar görüyor kızım")
freshAlternatives(item, 'Okul', items)  // "Bunun yerine": aynı kategori, son 14 günde oraya gitmemiş
```
Yer verisi `item.wearPlaces` (wearDates ile aynı sırada, yer yoksa null; eski kayıtlarda alan yok).
Sadece AppContext değiştirir; `undoWear` son yeri de siler. Örnek akış: `dev-test-panel.tsx` → `wearAt`.
Ekranda: `PlaceSheet` (`src/components/place-sheet.tsx`) – detayda "Giydim" ve kayıtlı kombinde
"Bu kombini giydim" önce bunu açar. Hızlı Giydim (Ana sayfa şeridi, Dolap'ta basılı tutma) yer sormaz.

**Burç yorumu** (`@/lib/zodiac`) – Tarot'un yerine; gerçek gökyüzüne göre (internetsiz hesap)
```tsx
const { zodiac, setZodiac } = useApp();  // Kullanıcının burcu (seçilmediyse null), telefonda saklanır
ZODIAC_SIGNS                             // 12 burç: { name, emoji, element, ruler, start, style, luckyColors }
setZodiac('Akrep') / setZodiac(null)     // Welcome'da ve Ayarlar'da seçtirilir ("Şimdi değil" → null)
dailyHoroscope(zodiac, items)            // { title: '♏ Akrep · Bugün', personality, lines: [en fazla 3 cümle],
                                         //   luckyColor, suggestion: { item, text, outfit } | null }
weeklyHoroscope(zodiac)                  // { title, range: '12 – 18 Ekim', love, money, wardrobe }
getSky()                                 // { moonSign, sunSign, moonPhase, mercury } – gökyüzü bilgisi
```
Günlük yorum: Ay'ın kullanıcının burcuna göre evi (12 ev × 2 cümle), Merkür retrosu ve burç
sezonu (yaklaşınca), Ay evresi; şanslı renk + dolaptan o renkte parça ve etrafında kombin. Her gün
değişir, aynı gün aynı kalır. Haftalık yorum: haftanın dolunay/yeniay/retro/Güneş girişine göre.
Merkür retrosu tarihleri `MERCURY_RETROGRADES` listesinde (2027 sonrası eklenmeli).
Burç seçilmediyse ekranda "Burcunu seç, yıldızlar dolabına baksın 🔮" gösterilir.
Ekranlar (Ebrar): `zodiac-grid.tsx` (12 burç ızgarası; `zodiacGlyph` sembolü mor emoji kutusu
yerine pembe yazı gibi çizer, `zodiacRange` "23 Eki – 21 Kas", `MOON_SYMBOLS`, `mercuryNote`),
`horoscope-strip.tsx` (Ana sayfa gümüş şeridi), `horoscope.tsx` (burç sayfası), `zodiac.tsx`
(burç seçimi), Welcome'ın 2. sayfası, Ayarlar → Burcum. Ekranda burç adına ek gelmez:
"Ay Akrep burcunda" (❌ "Ay Akrep'te").

**Dolap Kahoot'u** (`@/lib/quiz` + `useApp()`) – sadece hafta sonu, 5 soru, soru başı 15 saniye
```tsx
const { quizResults, saveQuizResult } = useApp();
const quiz = weeklyQuiz(items)   // { weekKey, isOpen, daysUntilOpen, blockedMessage, questions: [5 soru] }
// Soru: { kind, prompt, options: [{ label, itemId? }], correctIndex, correctText, wrongText,
//          photoItemId? (🔍 "Bu parça kim?": fotoğrafı yakından + bulanık göster),
//          aboutItemId? (📍 "… ile nereye gittin?": küçük fotoğraf gösterilebilir) }
answerPoints(dogruMu, saniye)    // doğru: 100 + hız bonusu (0-50), yanlış/süre doldu: 0 → en fazla 750
quizBadge(dogruSayisi)           // { emoji, title, message } 🏆 Merkez Bankası Başkanı (4-5) · 💼 Ekonomist (3)
                                 //   · 🌱 Girl Math Stajyeri (1-2) · 😤 "Kızım sen bu dolabı tanımıyor musun?" (0)
saveQuizResult({ weekKey: quiz.weekKey, correctCount, score, badgeTitle, playedAt: todayString() })
playedThisWeek(quizResults) / quizStreak(quizResults) / bestQuizScore(quizResults)
```
Soru türleri: ⭐ dolabın yıldızı, 🕸️ unutulmuş prenses, 💸 kapışma (hangisi pahalı, 2 şık),
😬 hiç giymediğin, 🔍 bu parça kim?, 📍 nereye gittin, 💖 amorti olan + 📜 Sözleşme soruları (en az 1).
Bilgisi yetmeyen soru atlanır; aynı kıyafet iki soruda öne çıkmaz; hafta boyunca sorular aynı kalır.
Hafta içi `isOpen = false` ("Cumartesi açılıyor ⏳"), dolapta 4'ten az parça varsa `blockedMessage`.
Haftada bir kez oynanır (`saveQuizResult` ikinci sonucu kaydetmez). Süre sayacı ekranın işi;
süre dolarsa `answerPoints(false, …)`. Telefonda `girlmath.quiz`; `resetAll` siler.
Örnek akış: `dev-test-panel.tsx` → `DevQuiz` (hafta içi test için yaklaşan Cumartesi'nin soruları).

**Zaman Aşımı = Bedava / etkinlik modu** (`@/lib/events`) – Sözleşme Madde 3
```tsx
EVENT_TYPES                      // 10 tür: 💍 Düğün, 💐 Nişan, 🌿 Kına, 🎓 Mezuniyet, 🎂 Doğum günü, 🎤 Konser,
                                 //   ✈️ Tatil, 💘 Sevgililer Günü, 🎄 Yılbaşı, ✨ Diğer (kendi adını yazar)
addItem({ ..., event: { type: 'Düğün', date: '2026-10-30' } })   // "Diğer" ise customName: "Ece'nin partisi"
updateItem(id, { event: { ... } }) / updateItem(id, { event: undefined })  // değiştir / kaldır
eventLabel(item.event)           // "💍 Düğün" / "✨ Ece'nin partisi"
eventCountdownText(item)         // "⏳ 💍 Düğün için 12 gün kaldı. … o gün 0 TL!" / "👗 Yarın büyük gün…" /
                                 //   "🎉 Bugün büyük gün… bugün 0 TL 🆓" / (7 güne kadar) "💌 … ikinci giyimini bekliyor"; yoksa null
eventStatus(item)                // { kind: 'upcoming', days } | 'tomorrow' | 'today' | { kind: 'past', daysAgo } | null
eventDayCost(item)               // Etkinlik günü 0, diğer günler costPerWear (SADECE gösterim; hesaplar değişmez)
```
Bildirimler otomatik (AppContext): etkinlikten bir gün önce 20:00 "👗 Yarın büyük gün!", o gün 10:00
"🎉 … bedavaya harika görünüyorsun!". Kıyafet silinince / tarih değişince kendiliğinden güncellenir.

**Veri yedeği** (`@/lib/backup` + `useApp()`) – uygulama silinse bile dolap geri gelsin
```tsx
const { items, outfits, zodiac, quizResults, restoreAll } = useApp();
await exportBackup({ items, outfits, zodiac, quizResults })  // Tek dosya (fotoğraflar dahil) + paylaşım
                                   //   penceresi ("Dosyalar'a Kaydet", iCloud, WhatsApp…); false: olmadı
const read = await readBackup()    // Dosya seçtirir + kontrol eder, HİÇBİR ŞEYİ DEĞİŞTİRMEZ:
                                   //   { ok: true, backup, summary: '24 kıyafet, 6 kombin · 18 Ekim 2026' }
                                   //   { ok: false, reason: 'canceled' | 'invalid' | 'newer' } → backupErrorText(reason)
restoreAll(read.backup)            // Onaydan sonra: her şey yedektekiyle değişir (true/false). Hata olursa
                                   //   mevcut dolaba dokunulmaz. Sözleşme/Welcome bilgisine dokunmaz.
```
Yedek dosyası `GirlMath-yedek-2026-10-18.json` (imza `app: 'girl-math'`, `version: 1`). Veri kalıbı
değişirse `BACKUP_VERSION` artırılır ve `checkBackup` eski sürümü dönüştürür.

**Analizler** (`@/lib/insights`) – Cüzdan'da ya da ayrı bir "Analiz" sayfasında
```tsx
colorStats(items, 'month' | 'all')  // Giydim sayısına göre renkler: { text: '💖 En çok pembe giyiyorsun (%40)'
                                    //   (eşitse '💖🖤 Pembe ve siyah başa baş'), shares: [{ color, emoji, wears,
                                    //   percent }], uncoloredCount, mostProfitable (sadece 'all': en çok kâr
                                    //   ettiren renk { color, emoji, savings, text }) }
monthlySummary(items)               // Bu ay (ya da monthlySummary(items, '2026-09')): { title: 'Ekim 2026 özetin 💅',
                                    //   lines: [hazır satırlar], verdict: 'Merkez Bankası bu ay seni örnek gösterdi 🏦',
                                    //   newItemCount, spent, wears, previousWears, star, paidOffCount, unwornCount }
sellList(items)                     // "Satmayı düşün": 90+ gündür giyilmeyen (hiç giyilmediyse 90+ gündür dolapta),
                                    //   amorti olmamış parçalar (etkinliği henüz gelmemiş olan hariç), pahalıdan ucuza:
                                    //   { candidates: [{ item, days, estimate, text }], totalEstimate, text }
```
İkinci el değeri **tahmin** (alış fiyatının ~%40'ı, `RESALE_RATE`); ekranda "tahmini" diye yazılır.
`colorEmoji('Pembe')` → "💖" (renk listesine emoji eklendi).

Uyum eşitse uzun süredir giyilmeyen parça öne çıkar (girl math). Rengi olmayan parça da önerilir
(en sonda; ekranda "Rengi girilmemiş · Ekle 🎨" hapı olarak, dokununca düzenleme formu açılır).

**Veri tipi** (`@/lib/types`): `ClothingItem` → `id, name, category, price, photoFileName,
wearDates, targetWears, createdAt, color?`. Kategoriler `CATEGORIES` listesinde.

Örnek kullanım için `src/components/dev-test-panel.tsx` dosyasına bakılabilir.

## Görev dağılımı
Her iş sahibinin kendi klasörlerinde yapılır, böylece aynı dosyaya iki kişi dokunmaz.
- **Ebrar (ekranlar – `src/app/`, `src/components/`):**
  - 3. aşama: sekmeler (Ana sayfa, Dolap, Cüzdan), şablon ekranlarının temizlenmesi
  - 4. aşama: Dolap ekranı (2 sütunlu kartlar), kıyafet detay ekranı, kıyafet ekleme formu ✅
  - Ana sayfa ve Cüzdan ✅
  - Kıyafet düzenleme ✅ (`updateItem`'ı da Ebrar ekledi, Onur'un haberi var), Dolap sıralama
    butonu ✅, "Almalı mıyım?" ekranı ✅, Story paylaşım kartı ✅, Utanç Duvarı ✅, burç yorumu ✅, Dolap Kahoot'u ✅, hızlı Giydim (Ana sayfa şeridi + Dolap'ta basılı tutma) ✅, Ayarlar ekranı ✅
  - Sonra: uygulama simgesi (taslaklar beğenilmedi, ertelendi)
  - Renk seçici ✅ (+ fotoğraftan renk tahmini ✅), detayda RENK satırı ✅, **"Bununla ne
    giyerim? ✨"** ekranı ✅ (kolaj, seçenekle değiştirme, "Kombini kaydet 💾")
  - Kombin arşivi ✅ (Dolap'ta "Kombinlerim" → arşiv → kayıtlı kombin sayfası), Ana sayfada
    "Günün kombini" ✅, "Nereye giderken giydin?" + tekrar uyarısı ✅
  - 16 Ekim'de kararlaştırılan 4 özelliğin ekranları bitti ✅ (17 Ekim).
  - Etkinlik modu / Zaman Aşımı ekranları ✅ (20 Ekim)
  - Analiz ekranları ✅ (20 Ekim): renk analizi, aylık özet (+ Story kartı), satmayı düşün
  - **Sırada (Onur'un mantığı hazır):** veri yedeği (Ayarlar); sonra uygulama simgesi.
  - Veri ve hesaplar için yukarıdaki hazır araçları kullanır.
- **Onur (mantık – `src/lib/`, `src/context/`):**
  - Gerçek hayat kıyasları (`src/lib/comparisons.ts`) ✅
  - Fotoğraf kaydetme yardımcısı (`src/lib/photos.ts`) ✅
  - İstatistik hesapları (`src/lib/stats.ts`) ✅
  - Bildirimler (`src/lib/notifications.ts`) ✅
  - Şablondan kalan lint hatasının düzeltilmesi ✅
  - 6. aşama mantıkları: Starbucks Endeksi ✅ (+ makara `starbucksIndexMeme` ✅), Dolap Kahoot'u ✅
    (`src/lib/quiz.ts`, `quizResults`/`saveQuizResult`), Zaman Aşımı / etkinlik modu ✅ (`src/lib/events.ts`)
  - Kahoot bildirimleri ✅, veri yedeği ✅ (`src/lib/backup.ts`, `restoreAll`)
  - Analizler ✅ (`src/lib/insights.ts`: renk analizi, aylık özet, "satmayı düşün")
  - Renk alanı (`src/lib/colors.ts`, `item.color`) ve kombin motoru (`src/lib/outfits.ts`) ✅
  - Makara/yerel metinler: kıyas cümleleri ✅, bildirim mesajları ✅ (yerel üslup; takılmada
    Utanç Duvarı'yla aynı zarar hesabı: günlük ≥ 10 TL ise günlük, değilse biriken zarar)
  - `updateItem` – Onur bugün çalışmadığı için Ebrar ekledi (`app-context.tsx`, kural 2: yeni
    şey eklemek serbest). Onur kontrol eder; adını değiştirmek/silmek düzenleme ekranını bozar.
  - `resetAll` – aynı şekilde Ebrar ekledi (Ayarlar'daki "Bütün verileri sil" kullanır).
  - **Yeni kararlaştırılan özellikler (16 Ekim, Onur + Ebrar), bu sırayla:**
    1. Renk + kombin motoru ✅
    2. **Favori kombin arşivi:** mantık ✅ (Onur), ekranlar ✅ (Ebrar): "Kombini kaydet 💾",
       Kombinlerim (arşiv), kayıtlı kombin sayfası (yıldız, ad değiştirme, sil, "Bu kombini
       giydim" + ↩).
    3. **"Nereye giderken giydin?":** mantık ✅ (Onur, `src/lib/places.ts`), ekranlar ✅ (Ebrar):
       `PlaceSheet` (yer hapları + "Geç"), `repeatWarning` uyarısı (soft/strong) + "Bunun yerine"
       (dokununca o parça giyilir) + [Yine de giy] [Vazgeç]; öneri yoksa nazik not + "Bununla
       yeni kombin kur →"; detayda SON YER satırı; kayıtlı kombinde "Bu kombinle nereye?"
       (kombinde tekrar uyarısı yok).
    4. **Tarot yerine burç yorumu:** mantık ✅ (Onur, `src/lib/zodiac.ts`, `zodiac`/`setZodiac`),
       ekranlar ✅ (Ebrar): Welcome'da burç seçimi, Ana sayfada gümüş burç şeridi, burç sayfası
       (Bugün / Bu hafta, şanslı renk, Yıldızların seçimi + "Kombini gör →"), Ayarlar → Burcum.
       `tarot-card.tsx` silindi.
- Bir kişi diğerinin alanındaki bir dosyaya dokunmak zorunda kalırsa önce haber verir.

## Yeni ekranlar için tasarım önerileri (Onur'dan – öneri, son karar Ebrar'ın)
Hepsi mevcut tema kurallarıyla: renkler `Colors.light`, gümüş sadece `Gradients.chrome`, simgeler
SF Symbols, ekranda elle renk kodu yok (tek istisna: kıyafet renk yuvarlakları `colorHex`).
- **Renk seçici (ekleme/düzenleme formu):** 18 renk, yatay kayan küçük yuvarlaklar (~32 px).
  Seçili olanın etrafında `primary` renkli ince halka + hafif titreşim (expo-haptics). Beyaz
  yuvarlağa ince `border` kenarlığı (beyaz zeminde kaybolmasın). "Desenli" için çapraz çizgili
  ya da çok renkli özel yuvarlak. Altında seçilen rengin adı `Typography.caption` ile.
- **"Bununla ne giyerim? ✨" ekranı:** Üstte seçilen parçanın büyük fotoğrafı, altında
  `outfitFor` kombini: parça fotoğrafları hafif üst üste binen bir "kolaj" (3:4 küçük kartlar,
  `Shadows.card`), altında kombin cümlesi. Ardından `matchesFor` kategorileri yatay kayan
  satırlar halinde; her kartın altında sebep cümlesi `primarySoft` zeminli küçük hap içinde.
  `missing` varsa nazik bir satır: "Dolabında ayakkabı yok 👀". En altta "Kaydet 💾" ana buton.
- **Kombin arşivi:** 2 sütunlu kartlar, her kartta parçaların 2×2 küçük fotoğraf ızgarası,
  sağ üstte yıldız (favoride `highlight` dolgulu ★ – süs rengi, üstüne yazı yok). Favoriler
  üstte ayrı başlık ("⭐ Favoriler"). Uzun basınca ad değiştir / sil menüsü.
- **Giydim'de "Nereye?" seçimi:** alttan açılan küçük pencere, `PLACES` hapları 3'erli satırda,
  emoji + ad; en altta soluk "Geç" bağlantısı. Seçince pencere kapanır, hafif titreşim.
- **Tekrar uyarısı:** soft → `primarySoft` zeminli yumuşak balon, tek hafif titreşim.
  strong → beyaz kart, üstte `warning` renkli ince şerit, iki kısa titreşim; "Bunun yerine"
  parçaları küçük fotoğraflı hap butonlar (dokununca onu giy). Butonlar: [Yine de giy] soluk,
  [Vazgeç] / önerilen parça vurgulu.
- **Detayda "En son" satırı:** bilgi satırlarının arasına SF Symbol `mappin.and.ellipse` + `lastWearText`.
- **Burç kartı (Tarot şeridinin yerine):** Tarot'taki gümüş krom (`Gradients.chrome`) burada
  kalsın – "büyü" anı burası. Kartın üstünde burç emojisi büyük (`Typography.hero`), yanında
  Ay evresi simgesi (SF Symbols `moonphase.*`). İki sekme hap: "Bugün" / "Bu hafta".
  Bugün: `personality` italik küçük, `lines` madde madde, 🍀 şanslı renk = renk yuvarlağı +
  adı, öneri parçasının küçük fotoğrafı + "Kombini gör →" (öneri ekranına gider).
  Bu hafta: 💘 / 💸 / 👗 üç satır, her biri ayrı küçük kart. Burç seçilmediyse kart soluk +
  "Burcunu seç, yıldızlar dolabına baksın 🔮" butonu.
- **Dolap Kahoot'u ekranları (Ebrar) ✅ (20 Ekim; Ana sayfa kartı sonra sade satıra döndü, bkz. `kahoot-card.tsx`):** Ana sayfada hafta sonu küçük kart "🎯 Hafta sonu
  Kahoot'u açıldı!" (hafta içi soluk: "Cumartesi açılıyor ⏳", oynandıysa rozet + seri 🔥).
  Yarışma: tam ekran, üstte 15 sn'lik küçülen `primary` süre çubuğu + "Soru 2/5", şıklar büyük
  hap butonlar (kıyafet şıklarında küçük fotoğraf), dokununca doğru = `success` yeşil + titreşim,
  yanlış = sallanma + doğrusu yeşil yanar, altta `correctText`/`wrongText` balonu, "Sıradaki →".
  🔍 sorusunda fotoğraf büyük ve bulanık, süre ilerledikçe netleşebilir. Sonuç: büyük rozet emojisi
  (`Typography.hero`), rozet adı, puan, "🔥 3 haftalık seri", Story'de paylaş (share-card'a rozet kartı).
  Uygulamada fark: 🔍 sorusunda şıklarda fotoğraf **yok** (küçük fotoğraf cevabı ele veriyordu).
- **Etkinlik modu ekranları (Ebrar) ✅ (20 Ekim):** ekleme/düzenleme formunda "🎉 Etkinlik için aldım"
  anahtarı → açılınca `EVENT_TYPES` hapları (emoji + ad; "Diğer"de ad kutusu) + tarih seçici.
  Detayda geri sayım kartı (`eventCountdownText`); etkinlik günü maliyet yerine büyük "0 ₺ 🆓"
  (`eventDayCost`) + gümüş krom değil, `success` yeşil "Bugün bedava" rozeti ve öne çıkan "Giydim".
  Ana sayfada en yakın etkinlik için küçük geri sayım kartı (7 gün kala).
  Uygulamada: tarih seçici iPhone'un kendi takvimi (`@react-native-community/datetimepicker`,
  "compact"); etkinlik günü buton "Bugün bedavaya giy ✨".
- **Veri yedeği (Ebrar, sırada):** Ayarlar → VERİLER grubuna iki satır: "📤 Yedeği dışa aktar"
  (basınca kısa "Hazırlanıyor…" göstergesi; büyük dolapta birkaç saniye sürebilir) ve "📥 Yedeği yükle"
  (`readBackup` → onay penceresi: `summary` + "Şu anki dolabın silinip yedektekiyle değiştirilecek",
  [Vazgeç] [Yükle] kırmızı; sonra "✅ Dolabın geri geldi!"). Altına küçük not: "Uygulamayı silmeden
  önce yedek al 💾". Örnek akış: `dev-test-panel.tsx` → `testExport` / `testImport`.
- **Analizler (Ebrar) ✅ (20 Ekim, ayrı "Analizlerin 📊" sayfası, Cüzdan'dan):** renk analizi için
  "Bu ay / Tüm zamanlar" hap seçici + yatay yüzde çubuğu (her renk `colorHex` ile kendi renginde
  dilim, altında emoji + %); "Ekim 2026 özetin 💅" kartı (`lines` alt alta, en altta `verdict`
  pembe balonda; Story'de paylaşılabilir); "🏷️ Satmayı düşün" listesi küçük fotoğraflı satırlar +
  altta "💰 tahminen ~2.600 TL" (tahmin olduğu belli olsun). Liste boşsa 👑 cümlesi.
  Uygulamada: renk çubuğunun altında renk yuvarlağı + "12 giyim · %40" listesi; satmayı düşün
  satırında sağda "~1.200 ₺ / tahmini"; aylık Story kartında harcanan TL **bilerek yok** (gizlilik).
- **Welcome'da burç seçimi:** 12 burç 3×4 ızgara, her kutuda büyük emoji + ad; seçilende
  `primary` dolgu + beyaz yazı. Altta soluk "Şimdi değil".

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
- `src/app/` – ekranlar. `_layout.tsx`: AppProvider + sözleşme ve Welcome kontrolü + **Stack**
  (sayfa destesi: en altta sekmeler, diğer sayfalar bunun üstüne açılır, sola kaydırınca kapanır).
  - `(tabs)/` – sekme ekranları. Parantezli klasör adresi etkilemez (Dolap yine `/wardrobe`).
    `(tabs)/_layout.tsx` bu ekranları `AppTabs` ile alt sekmelerde gösterir.
    - `index.tsx` – Ana sayfa ("bugün" ekranı), yukarıdan aşağı: tarih + saate göre selamlama
      ("Günaydın / Merhaba / İyi akşamlar aşko"); pembe **vitrin kartı** (her gün farklı bir
      Girl Math gerçeği, dokununca sıradakine geçer – `buildFacts`; altta sayfa noktaları);
      **"Bugün ne giydin?"** şeridi (dokun ✓ Giydim, tekrar dokun geri al; en fazla 8 parça
      `quickWearItems` + "Tümü →", bkz. Bilinen durumlar); **"Günün kombini"**; **"Senin için"**
      (tek kartta satırlar: etkinlik geri sayımı 7 gün kala, burç, Kahoot sadece hafta sonu);
      **"Unutulan parça"** (başlığın sağında "Utanç Duvarı →"). "Dolabının yıldızı" 20 Ekim'de
      kaldırıldı (Aylık özette "Ayın yıldızı" var). Sağ üstte ⚙️ Ayarlar. Dolap boşsa ekleme butonu.
    - `wardrobe.tsx` – Dolap: büyük başlık + beyaz yuvarlak ⊞ "Kombinlerim" + pembe "+" butonu (alt yazı
      başlık satırının altında, tam genişlikte), arama + sıralama butonu
      (En yeni / En pahalı / En az giyilen / Amortiye en yakın; varsayılan dışındaysa buton
      pembe), kategori hapları, 2 sütunlu `ClothingCard`'lar (mağaza vitrini), boş dolap mesajı.
      Alt yazı sadece "11 parça" ("Basılı tut" ipucu kalktı; ileride ilk açılışta bir kez ipucu
      balonu düşünülebilir). Karta kısa
      dokunuş detayı açar, **basılı tutmak hızlı Giydim** (`wearOnce`: sadece ekler; bugün zaten
      giyildiyse "bugün zaten giyildi ✓" balonu, geri almak balondaki "Geri al" ile).
    - `wallet.tsx` – Cüzdan ("para" ekranı): dolap değeri + Starbucks Endeksi cümlesi,
      pembe "GIRL MATH kazancın" kutusu (sayfanın tek pembe vurgusu), 2×2 kutu (ortalama maliyet,
      toplam giyim, amorti edilen, hiç giyilmeyen), en altta tek kartta iki satır: "Analizlerin"
      (dolap boşken yok) + "Almalı mıyım?"; başlığın yanında beyaz yuvarlak Story paylaş butonu.
      ("Bu ay dolaba giren" 20 Ekim'de kalktı → Analizlerin → Aylık özet.)
      Dolap boşsa ekleme butonu.
    - `explore.tsx` – "Test" sekmesi, sadece `<DevTestPanel />` gösterir (sadece geliştirmede)
  - `add-item.tsx` – kıyafet ekleme **ve düzenleme** formu (fotoğraf, ad, kategori, renk, fiyat,
    hedef). Fotoğraf seçilince renk `guessPhotoColor` ile tahmin edilip seçili gelir.
    Parametresiz: yeni parça (`addItem`). `params: { id }`: düzenleme, form dolu gelir
    (`updateItem`; detaydaki "Düzenle" açar). `params: { price }`: fiyat dolu gelir ("Almalı
    mıyım?" → "Aldım!"). Kaydetmeden çıkılırsa bu formda yeni seçilen fotoğrafı siler.
    En altta "🎉 Etkinlik için aldım" (`EventPicker`): tür + tarih → `item.event`; anahtar kapalı
    kaydedilirse etkinlik silinir.
  - `should-i-buy.tsx` – "Almalı mıyım?": fiyat + ayda kaç kere giyileceği → karar cümlesi
    (iced latteye düşme süresine göre), "Bunu alırsan şunlardan vazgeçiyorsun" (Starbucks
    Endeksi), "Girl Math'e göre" (Brunch/Manikür/Iced latte/Filtre kahve fiyatına düşmesi için
    kaç giyim ve ne kadar süre). Kalemler `TARGET_NAMES` listesinde; fiyatlar comparisons.ts'ten.
  - `item/[id].tsx` – kıyafet detay sayfası (sağ üstte "Düzenle"): bilgi satırları (KATEGORİ,
    renk varsa RENK + renk yuvarlağı, GİYİM, SON GİYİM – yer seçildiyse yanında "Bugün · 🌙 Gece",
    ETKİNLİK) + büyük fotoğraf, maliyet, **kıyas cümlesi** (beyaz kart, büyük kalın; giyim sayısı
    değişince `compareEntering` animasyonuyla yeniden belirir), **"Bununla ne giyerim?"** satırı,
    hedef çubuğu, Starbucks Endeksi, en altta "… tarihinde eklendi" + silme; altta "Giydim ✨" ve
    ↩ geri al. "Giydim"de maliyet rakamı zıplar (reanimated) ve kutlama balonu çıkar (`handleWear`).
    Etkinlik varsa ETKİNLİK satırı + kıyas kartının altında küçük geri sayım satırı (`eventCountdownText`); etkinlik günü maliyet
    yeşil "0 ₺" (normal maliyet üstü çizili, sadece gösterim), fotoğrafta "🆓 Bugün bedava", buton
    "Bugün bedavaya giy ✨".
  - `share.tsx` – Story paylaşımı: kartın önizlemesi + "Story'de paylaş" (fotoğrafını çeker,
    paylaşım penceresini açar). `params: { id }` → kıyafet kartı (detaydaki paylaş simgesi),
    parametresiz → dolap kartı (Cüzdan'daki paylaş butonu), `params: { kahoot: '1' }` → bu haftanın
    Kahoot rozet kartı (Kahoot sonuç ekranından), `params: { month: '1' }` → bu ayın özeti
    (Analizlerin'deki aylık özetin paylaş simgesi).
  - `kahoot.tsx` – Dolap Kahoot'u (Ana sayfadaki Kahoot kartından): haftanın 5 sorusu sayfa açılınca
    sabitlenir; süre çubuğu + "Soru 2/5" + kalan saniye, soru kartı (🔍'de fotoğraf yakın ve bulanık,
    süreyle netleşir; 🔍'de şıklarda fotoğraf yok), hap şıklar (doğru yeşil, yanlış sallanır), açıklama
    balonu + puan, "Sıradaki →". Bitince `saveQuizResult` + sonuç ekranı (rozet emojisi zıplar, rozet
    adı/mesajı, doğru | puan, rekor, seri, "Story'de paylaş"). Bu hafta oynandıysa doğrudan sonuç.
    `params: { test: '1' }` (sadece `__DEV__`): hafta içi yaklaşan Cumartesi'nin soruları. Dikkat:
    test oyunu da o haftanın gerçek sonucu olarak kaydedilir (Expo Go'daki deneme verisi).
  - `outfit/[id].tsx` – "Bununla ne giyerim? ✨" (detaydan açılır): `outfitFor` kombini yamuk,
    üst üste binen fotoğraf **kolajı** ("Seçtiğin" etiketi), kombin cümlesi, eksik kategori notu,
    seçilen parçanın rengi yoksa "renk seçersen…" satırı; **"Başka seçenekler"** (`matchesFor`,
    her kartta renk + sebep hapı). Seçeneğe dokununca kombine girer/çıkar (elbise ↔ üst/alt
    birbirini çıkarır), "Öneriye dön ↺". Altta "Kombini kaydet 💾" (`saveOutfit`, iPhone'da
    isteğe bağlı ad sorar; kayıtlıysa "Arşivde ✓ · Kombine git →" kayıtlı kombini açar).
  - `outfits.tsx` – Kombinlerim (arşiv, Dolap'tan açılır): üstte "2 kombin · 1 favori", "⭐ Favoriler" + "Tüm kombinler", en altta yeni kombin ipucu,
    2 sütunlu kartlar (2×2 fotoğraf ızgarası, 4'ten fazla parçada "+N", ad, giyim sayısı), köşede
    favori yıldızı (favoride `highlight` ★). Karta dokununca kayıtlı kombin sayfası.
  - `saved-outfit/[id].tsx` – kayıtlı kombin: kolaj, ad (✏️ ile değiştirilir, iPhone'da), "3 parça
    · 2 kere giydin · en son dün", parça listesi (dokununca kıyafet detayı), "Bu kombini sil",
    sağ üstte yıldız. Altta "Bu kombini giydim ✨" (`wearOutfit`, kutlama balonu); bugün
    giyildiyse "Bugün giydin ✓" + ↩ (`undoWearOutfit`). Giymeden önce "Bu kombinle nereye?".
  - `shame-wall.tsx` – Utanç Duvarı: toplam boşa giden + unutulan bütün parçalar (en çok
    zarar yazandan aza).
  - `insights.tsx` – Analizlerin (Cüzdan'daki satırdan), sırayla: aylık özet ("EKİM 2026 / Aylık
    özetin", etiket–değer satırları, ayın yorumu açık pembe italik alıntı, sağ üstte Story paylaş),
    renkler ("En çok siyah giyiyorsun %65", iki parçalı "Bu ay / Tüm zamanlar" seçici, renk çubuğu,
    iki sütun renk listesi, "en çok kâr ettiren" satırı), satmayı düşün (fotoğraflı satırlar,
    dokununca detay, tahmini toplam). Emoji yok: Onur'un `lines`/`text` cümleleri yerine sayılar
    ekranda diziliyor (sadece `verdict` cümlesi aynen). Hesaplar `insights.ts`.
  - `settings.tsx` – Ayarlar (iPhone ayarları tarzı gruplar): BİLDİRİMLER (izin durumu + "Aç";
    izin daha önce reddedildiyse iPhone Ayarları'nı açar, deneme bildirimi), GIRL MATH
    (Burcum, Kullanım Sözleşmesi, sürüm), VERİLER ("Bütün verileri sil", iki kez sorar, `resetAll`),
    Gizlilik notu ve imza.
  - `horoscope.tsx` – Burç sayfası (Ana sayfa şeridinden): gümüş kart (sembol, tarih, element,
    gezegen, Ay'ın burcu ve evresi, Merkür hapı), "Bugün" (kişilik, gökyüzü cümleleri, şanslı
    renk, Yıldızların seçimi → "Kombini gör") / "Bu hafta" (💘 / 💸 / 👗); sağ üstte "Değiştir".
  - `zodiac.tsx` – Burç seçimi (Ayarlar → Burcum, burç şeridi): ızgara + "Şimdi değil"/"Burcumu kaldır".
  - `agreement.tsx` – Sözleşmeyi Ayarlar'dan tekrar okuma sayfası (`AgreementScreen`'i gösterir,
    butona basınca geri döner).
  - Sayfa başlığı/geri butonu her sayfanın kendi içinde `<Stack.Screen options={...} />` ile
    ayarlanır; bu yüzden yeni sayfa eklemek için ortak `_layout.tsx`'e dokunmak gerekmez.
- `src/components/` – tekrar kullanılan bileşenler (şablondan gelenler de burada)
  - `agreement-screen.tsx` – Girl Math Kullanım Sözleşmesi ekranı
  - `welcome-screen.tsx` – Welcome karşılama ekranı (sözleşmeden sonra bir kez): 1) 3 kart +
    "Hadi başlayalım", 2) "Son bir şey: burcun ne?" (ZodiacGrid, "Dolabıma git 💖", "Şimdi değil")
  - `app-tabs.tsx` – alt sekmeler: Ana sayfa, Dolap, Cüzdan, Test (pembe, SF Symbols simgeleri).
    `app-tabs.web.tsx` aynı sekmelerin web sürümü.
  - `quick-wear.tsx` – ortak hızlı Giydim: `useQuickWear()` → `{ toggleWear, wearOnce, toastView }`.
    `toggleWear` ışık düğmesi (giyilmediyse Giydim + titreşim + "Geri al"lı balon, bugün
    giyildiyse geri al) – Ana sayfa şeridi. `wearOnce` sadece ekler (bugün giyildiyse "zaten
    giyildi ✓" balonu) – Dolap'ta basılı tutma.
  - `place-sheet.tsx` – "Nereye gidiyorsun?" alttan açılan pencere (`PLACES` hapları, "Geç",
    karartmaya dokununca vazgeç). `item` verilirse tekrar uyarısı + "Bunun yerine" + nazik not.
    Karartma rengi temada `overlay`.
  - `daily-outfit-card.tsx` – Ana sayfada "Günün kombini" (başlık kartın üstünde): en unutulan 3
    parçadan güne göre biri, etrafında `outfitFor` kombini; kolaj + cümle + "Kombini gör →".
  - `today-row.tsx` – Ana sayfadaki "Senin için" kartı: `TodayGroup` (tek beyaz kart, satırlar arası
    ince çizgi) + `TodayRow` (simge dairesi, başlık + açıklama, sağda ok) + `IconCircle`. Etkinlik,
    burç ve Kahoot satırları bunu kullanır; yeni küçük Ana sayfa bilgisi de buraya satır olarak eklenir.
  - `outfit-collage.tsx` – kombin kolajı `OutfitCollage` (yamuk, üst üste binen 3:4 kartlar +
    parça adları, isteğe bağlı ilk parça etiketi) ve `ClothingPhoto` (3:4 fotoğraf, yoksa askı).
    "Bununla ne giyerim?" ve kayıtlı kombin sayfası kullanır.
  - `color-picker.tsx` – renk seçici (`ColorPicker`: yatay kayan renk yuvarlakları, tekrar
    dokununca seçim kalkar, `note` ile alt yazı) ve tek renk yuvarlağı `ColorSwatch` (beyazın
    kenarı var, "Desenli" çok renkli). Form, detay ve kombin ekranı kullanır.
  - `horoscope-strip.tsx` – "Senin için" kartındaki burç satırı (küçük gümüş madalyonda pembe burç
    sembolü, şanslı renk, Ay evresi; dokununca burç sayfası, burç yoksa burç seçimi)
  - `zodiac-grid.tsx` – 12 burç ızgarası + burç yardımcıları (`zodiacGlyph`, `zodiacRange`,
    `MOON_SYMBOLS`, `mercuryNote`). Burç seçimi ve Welcome kullanır.
  - `share-card.tsx` – Story kartları (`ItemShareCard`, `WardrobeShareCard`, `KahootShareCard`,
    `MonthlyShareCard`, pembe geçişli 9:16). Büyük rakam `BigAmount`; para olmayan sayıda
    `currency={false}` (yoksa "750 ₺ puan" yazar).
  - `kahoot-card.tsx` – "Senin için" kartındaki Kahoot satırı: hafta sonu "Dolap Kahoot'u açıldı" +
    pembe "Oyna" hapı, oynandıysa kupa simgesi + rozet adı + puan/seri (dokununca sonuç). Hafta içi
    ve dolap yetersizken **görünmez**; `__DEV__`'de soluk "Kahoot test" satırı.
  - `event-picker.tsx` – formdaki "🎉 Etkinlik için aldım" kutusu (anahtar, `EVENT_TYPES` hapları,
    "Diğer"de ad, iPhone tarih seçicisi). `dateFromString` / `stringFromDate` ("2026-12-05" ↔ Date).
  - `event-countdown-card.tsx` – "Senin için" kartındaki etkinlik satırı (7 gün kala; "Düğün" +
    "3 gün kaldı · “Elbise”", etkinlik günü 🎁 ve yeşil "Bugün · … bedava"); dokununca detay.
  - `screen-background.tsx` – sekmeler, Welcome ve Sözleşme'nin "üstten pembe ışık" zemini
  - `stat-tile.tsx` – küçük istatistik kutusu (etiket, büyük değer, açıklama; `tone="primary"`
    pembe dolgulu). Ana sayfa ve Cüzdan kullanır. Etiketi Türkçe kuralla büyük harfe çevirir.
  - `clothing-card.tsx` – Dolap'taki kıyafet kartı, mağaza vitrini (beyaz kart yok): 3:4 fotoğraf
    (yoksa beyaz zeminde askı) + "3/30" rozeti + amorti ♥; altında ad ve koyu "/giyim" maliyet,
    düştüyse yanında (sığmazsa altında) üstü çizili fiyat. "1. giyimde →" ipucu sadece detayda. Ayrıca `formatTL(3000)` →
    "3.000 ₺" yardımcısı burada; fiyat gösteren her ekran bunu kullanır. Diğer ortak ekran
    yardımcıları da burada: `costLabel`/`INFINITE_COST` (∞ gösterimi), `itemComparisonText`,
    `FORGOTTEN_DAYS`, `lossAmount`, `lossText`, `shameWallItems`. Bugün giyilen kartta rozet
    pembe "✓ 4/30" olur.
  - `dev-test-panel.tsx` – Onur'un deneme paneli (Test sekmesinde). Ekip kararıyla (seçenek C)
    silinmedi: Test sekmesi `__DEV__ &&` ile sarılı, Expo Go'da görünür, App Store sürümünde
    otomatik gizlenir. Onur yeni özellikleri ve "🔔 Test bildirimi"ni burada dener.
- `src/constants/theme.ts` – ortak tema
- `src/context/app-context.tsx` – hafıza merkezi (kıyafetler + AsyncStorage)
- `src/lib/types.ts` – veri tipleri; `src/lib/girl-math.ts` – hesaplamalar;
  `src/lib/comparisons.ts` – gerçek hayat kıyasları ve fiyat listesi;
  `src/lib/photos.ts` – fotoğraf seçme, kaydetme, silme;
  `src/lib/stats.ts` – dolap istatistikleri;
  `src/lib/notifications.ts` – bildirim mesajları, izin ve kurma araçları;
  `src/lib/starbucks-index.ts` – Starbucks Endeksi (fiyat = kaç iced latte);
  `src/lib/colors.ts` – kıyafet renkleri; `src/lib/outfits.ts` – kombin motoru (renk uyumu + öneri)
  ve kombin arşivi yardımcıları; `src/lib/places.ts` – giyim yerleri, tekrar uyarısı, "en son" satırı;
  `src/lib/zodiac.ts` – burçlar, gökyüzü hesabı (Ay, Güneş, evre, Merkür retrosu), günlük/haftalık yorum;
  `src/lib/quiz.ts` – Dolap Kahoot'u (sorular, puan, rozet, seri);
  `src/lib/events.ts` – Zaman Aşımı = Bedava / etkinlik modu (türler, geri sayım, etkinlik günü 0 TL);
  `src/lib/backup.ts` – veri yedeği (dışa aktar, kontrol et, geri yükle);
  `src/lib/insights.ts` – analizler (renk analizi, aylık özet, "satmayı düşün" listesi);
  `src/lib/photo-color.ts` – fotoğraftan renk tahmini (Ebrar)
- `src/hooks/` – yardımcı hook'lar

## Bilinen durumlar
- `src/hooks/use-color-scheme.web.ts` şimdilik her zaman `'light'` döner (sadece açık tema).
  Karanlık mod eklenince yeniden düzenlenecek. `npx expo lint` şu an 0 hata veriyor.
- `npm install` sonrası "29 vulnerabilities" ve "npm warn" yazıları normal.
  **`npm audit fix --force` çalıştırılmaz** (paket sürümlerini bozar).
- **Expo hesabı:** Bilgisayardaki Expo CLI bir hesaba girişliyse, sadece aynı hesaptaki Expo Go
  projeyi açabilir. Bu yüzden herkes kendi bilgisayarından kendi telefonuyla test eder
  (gerekirse `npx expo logout`). İleride expo.dev'de ortak Organization kurulacak.
- **app.json (App Store için, Ekim 2026):** uygulama adı "Girl Math"; fotoğraf izin metni
  (expo-image-picker eklentisinde `photosPermission`, kamera/mikrofon izni kapalı); sadece
  iPhone (`supportsTablet: false`); `ITSAppUsesNonExemptEncryption: false` (şifreleme sorusu
  için). iOS simgesi `assets/expo.icon` klasöründen okunur (hâlâ Expo'nun varsayılanı).
- **Bundle ID** (App Store'daki kalıcı kimlik, örn. `com.xxx.girlmath`) henüz yok. Bir kez
  seçilince değiştirilemediği için Ebrar ve Onur birlikte karar verecek.
- Expo Go'da bildirim izni penceresinde "Girl Math" değil "Expo Go" yazar; normal. Gerçek
  uygulamada (App Store) kendi adımız çıkar. Takılma bildirimi 14+ gün gerektirdiği için hızlı
  test edilemez; deneme panelindeki "🔔 Test bildirimi" butonu kullanılır.
- Sözleşme ve Welcome ekranı birer kez görülünce bir daha çıkmaz. Tekrar görmek için Expo Go
  silinip yüklenir.
- "Could not resolve host: github.com" hatası internet takılmasıdır; tekrar push denenir.
- Yeni bir sayfa dosyası eklenince `npx tsc --noEmit` "... is not assignable to type ..." gibi
  bir sayfa adresi hatası verebilir. Kod yanlış değildir: Expo'nun sayfa listesi
  (`.expo/types`) eskidir. Bir kez `npx expo start` çalıştırınca kendiliğinden düzelir.
- Ebrar'ın eklediği paketler (Ekim 2026): `react-native-view-shot`, `expo-sharing` (Story
  paylaşımı), `expo-haptics` (titreşim), `expo-linear-gradient` (renk geçişleri). Hepsi Expo
  Go'da çalışır. `expo-sharing` app.json'a kendi satırını ekledi. Pull sonrası `npm install`.
  17 Ekim: `expo-image-manipulator` ve `jpeg-js` (fotoğraftan renk tahmini; ikisi de Expo Go'da
  çalışır, app.json değişmedi). Pull sonrası `npm install`.
  20 Ekim: `@react-native-community/datetimepicker` (etkinlik tarihi; Expo Go'da çalışır, app.json'a
  kendi satırını ekledi). Pull sonrası `npm install`.
- **Yeniden düşünülecek (20 Ekim, Ebrar):** Ana sayfadaki "Bugün ne giydin?" şeridi. Eskiden
  bütün dolap vardı (50+ parçada kaydır kaydır işaretle, kimse uğraşmaz). **Geçici çözüm:** en
  fazla 8 parça (`quickWearItems`, `index.tsx`): son 30 günde en sık giyilenler (bugünkü giyim
  sayılmaz ki dokununca parça kaymasın), bugün Dolap'tan giyilen ✓ başa eklenir, 8'den fazla parça
  varsa sonda "Tümü →" (Dolap). Ebrar'a bu da tam mantıklı gelmedi, "uğraştırıcı"; sonra birlikte
  düşünülecek. Akla gelen fikirler: favori kombinleri şeride koymak (tek dokunuşla 3 parça),
  "dünkü kombinin aynısı mı?" gibi tek soru, şeridi tamamen kaldırıp Dolap'taki basılı tutmaya
  bırakmak.
- **İleride düşünülebilir (Ebrar'ın fikri):** renk adı yerine fotoğraftaki gerçek tonlara göre kombin
  önerisi. Şimdilik yapılmadı çünkü motorun kuralları ve kullanıcıya gösterilen sebepler renk
  adlarına dayanıyor; tonlara geçmek motoru baştan yazmak demek.
- Açılış ekranı (splash) rengi `app.json`'da `#FFF7FA`; Expo Go'da görünmez, gerçek uygulamada görünür.

## Eski proje
Onur'un bilgisayarında Masaüstündeki `girl-math-app` klasörü önceki deneme. Orada çalışan
parçalar (AsyncStorage ile kalıcı kayıt, fotoğraf ekleme, dolap/cüzdan ekranları) gerektiğinde
buraya temiz şekilde taşınabilir. Doğrudan kopyalanmaz, bu projenin kurallarına göre uyarlanır.

## Sıradaki işler
1. Ortak tema dosyası ✅
2. Veri modeli ve AppContext (kıyafetler, giyilme tarihleri, AsyncStorage) – Onur ✅
   (+ Kullanım Sözleşmesi açılış ekranı ✅)
3. Welcome ekranı ve sekme yapısı (Ana sayfa, Dolap, Cüzdan) – Ebrar ✅
4. Dolap ekranı ve kıyafet ekleme (fotoğraflı) – ekranlar Ebrar, fotoğraf kaydetme Onur ✅
   (+ detay sayfası, Hot Pink tema, editorial başlıklar ✅)
   - Kıyafet düzenleme ✅, Dolap sıralama ✅, "Almalı mıyım?" ✅
   - Ana sayfa ve Cüzdan `getWardrobeStats` ile dolduruldu ✅
   - Story paylaşım kartı, titreşim, pembe geçişli zemin, Utanç Duvarı, Dolap Tarotu (sonra burç yorumuyla değişti),
     hızlı Giydim, ∞ maliyet gösterimi, "Bu ay dolaba giren", Ana sayfa yenilemesi ✅
   - Ayarlar ekranı ✅, app.json izin metinleri ✅
   - Sırada: **uygulama simgesi ve açılış logosu** (hâlâ Expo'nun varsayılanı; pembe zemin +
     ince askı + "Girl Math" yazılı taslaklar denendi, beğenilmedi, sonraya kaldı), karanlık mod,
     Bundle ID (Onur'la birlikte). Premium/ücretsiz sınır ekranı **en sona** (önce uygulamayı
     yaymak ve sevdirmek hedef).
   - Renk + kombin, kombin arşivi, Günün kombini, "Nereye?", burç yorumu ✅ (17 Ekim)
5. Gerçek hayat kıyasları ve yerel bildirimler (expo-notifications) – Onur ✅
6. Ekstra özellikler – Starbucks simülatörü ✅, Utanç Duvarı ✅, burç yorumu ✅, kombin önerisi ✅,
   Kahoot ✅, Zaman Aşımı ✅, OCR – ayrıntılar "Özellik
   detayları" bölümünde
7. App Store hazırlığı (Apple Developer hesabı, EAS Build/Xcode, TestFlight, gizlilik
   politikası, izin metinleri)
