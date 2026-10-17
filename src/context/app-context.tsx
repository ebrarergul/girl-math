/**
 * GIRL MATH – HAFIZA MERKEZİ (AppContext)
 *
 * Dolaptaki tüm kıyafetler ve kaydedilen kombinler burada tutulur. Ekranlar kıyafet bilgisini buradan alır
 * ve değişiklikleri buradaki fonksiyonlarla yapar. Her değişiklik telefona
 * (AsyncStorage) otomatik kaydedilir, uygulama kapanıp açılsa da kaybolmaz.
 *
 * Ekranda kullanımı:
 *   const { items, addItem, wearItem } = useApp();
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { todayString, wearCount } from '@/lib/girl-math';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  scheduleEventReminders,
  scheduleForgottenReminder,
  sendPaidOffNotification,
} from '@/lib/notifications';
import { deletePhoto } from '@/lib/photos';
import { getWardrobeStats } from '@/lib/stats';
import type { ColorName } from '@/lib/colors';
import type { ItemEvent } from '@/lib/events';
import type { PlaceName } from '@/lib/places';
import type { ZodiacName } from '@/lib/zodiac';
import type { Category, ClothingItem, QuizResult, SavedOutfit } from '@/lib/types';

// Kıyafetler ve kombinler telefonda bu isimlerle saklanır
const ITEMS_KEY = 'girlmath.items';
const OUTFITS_KEY = 'girlmath.outfits';
const ZODIAC_KEY = 'girlmath.zodiac';
const QUIZ_KEY = 'girlmath.quiz';

// Kullanıcı hedef girmezse kullanılacak hedef giyilme sayısı (#30wears)
export const DEFAULT_TARGET_WEARS = 30;

// Yeni kıyafet eklerken ekrandan gelen bilgiler (kimlik, tarih vb. otomatik üretilir)
export type NewClothingItem = {
  name: string;
  category: Category;
  price: number;
  photoFileName: string | null;
  targetWears?: number;
  color?: ColorName; // İsteğe bağlı: kıyafetin rengi (kombin önerisi için)
  event?: ItemEvent; // İsteğe bağlı: "Etkinlik için aldım" (kaldırmak için updateItem(id, { event: undefined }))
};

// Kıyafet düzenlerken değişebilecek bilgiler. Sadece verilen alanlar değişir;
// giyim geçmişi (wearDates), kimlik ve eklenme tarihi hiç değişmez.
export type ClothingItemChanges = Partial<NewClothingItem>;

type AppContextValue = {
  items: ClothingItem[];
  isLoaded: boolean; // Telefondaki kayıtlar okundu mu?
  addItem: (newItem: NewClothingItem) => void;
  wearItem: (id: string, place?: PlaceName | null) => void; // Yer isteğe bağlı
  undoWear: (id: string) => void;
  deleteItem: (id: string) => void;
  updateItem: (id: string, changes: ClothingItemChanges) => void;
  resetAll: () => void;

  // Kombin arşivi
  outfits: SavedOutfit[]; // Kaydedilen kombinler (en yeni en başta)
  saveOutfit: (itemIds: string[], name?: string | null) => string; // Kombinin kimliğini döner
  toggleFavoriteOutfit: (id: string) => void;
  renameOutfit: (id: string, name: string | null) => void;
  deleteOutfit: (id: string) => void;
  wearOutfit: (id: string, place?: PlaceName | null) => void;
  undoWearOutfit: (id: string) => void; // Kombinin bugünkü giyimini ve parçaların bugünkü Giydim'ini geri alır

  // Burç (Welcome'da / Ayarlar'da seçilir). Seçilmediyse null.
  zodiac: ZodiacName | null;
  setZodiac: (sign: ZodiacName | null) => void;

  // Dolap Kahoot'u sonuçları (haftada bir kez)
  quizResults: QuizResult[];
  saveQuizResult: (result: QuizResult) => void; // Bu hafta zaten kayıt varsa bir şey yapmaz // "Bu kombini giydim": bütün parçalara Giydim
};

const AppContext = createContext<AppContextValue | null>(null);

// Her kıyafete özel kimlik üretir, örn: "lx3k9a-4f7q2"
function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// Giyim yeri listesinin sonuna yer ekler. Eski kayıtta liste yoksa önceki giyimler "yer yok" (null) sayılır.
function withPlace(item: ClothingItem, place: PlaceName | null): (PlaceName | null)[] {
  const places = item.wearPlaces ?? item.wearDates.map(() => null);
  return [...places, place];
}

// Takılma, günlük ve etkinlik bildirimlerini güncel kıyafet listesine göre yeniden kurar
async function refreshReminders(items: ClothingItem[]): Promise<void> {
  await scheduleDailyReminder();
  await scheduleForgottenReminder(getWardrobeStats(items).forgotten);
  await scheduleEventReminders(items);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [zodiac, setZodiacState] = useState<ZodiacName | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1) Uygulama açılınca telefondaki kayıtları (kıyafetler + kombinler) oku
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(ITEMS_KEY),
      AsyncStorage.getItem(OUTFITS_KEY),
      AsyncStorage.getItem(ZODIAC_KEY),
      AsyncStorage.getItem(QUIZ_KEY),
    ])
      .then(([savedItems, savedOutfits, savedZodiac, savedQuiz]) => {
        if (savedItems) {
          setItems(JSON.parse(savedItems));
        }
        if (savedOutfits) {
          setOutfits(JSON.parse(savedOutfits));
        }
        if (savedZodiac) {
          setZodiacState(savedZodiac as ZodiacName);
        }
        if (savedQuiz) {
          setQuizResults(JSON.parse(savedQuiz));
        }
      })
      .catch((error) => console.warn('Kayıtlar okunamadı:', error))
      .finally(() => setIsLoaded(true));
  }, []);

  // 2) Liste her değiştiğinde telefona kaydet (okuma bitmeden kaydetme, yoksa eski kayıtlar silinir)
  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items)).catch((error) =>
      console.warn('Kıyafetler kaydedilemedi:', error)
    );
  }, [items, isLoaded]);

  // 2c) Kahoot sonuçları her değiştiğinde telefona kaydet
  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    AsyncStorage.setItem(QUIZ_KEY, JSON.stringify(quizResults)).catch((error) =>
      console.warn('Kahoot sonuçları kaydedilemedi:', error)
    );
  }, [quizResults, isLoaded]);

  // 2b) Kombinler her değiştiğinde telefona kaydet
  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    AsyncStorage.setItem(OUTFITS_KEY, JSON.stringify(outfits)).catch((error) =>
      console.warn('Kombinler kaydedilemedi:', error)
    );
  }, [outfits, isLoaded]);

  // 3) Liste her değiştiğinde bildirimleri yeniden kur (izin yoksa hiçbir şey yapmaz)
  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    refreshReminders(items).catch((error) => console.warn('Bildirimler kurulamadı:', error));
  }, [items, isLoaded]);

  function addItem(newItem: NewClothingItem) {
    const item: ClothingItem = {
      id: createId(),
      name: newItem.name,
      category: newItem.category,
      price: newItem.price,
      photoFileName: newItem.photoFileName,
      ...(newItem.color ? { color: newItem.color } : {}),
      ...(newItem.event ? { event: newItem.event } : {}),
      wearDates: [],
      targetWears: newItem.targetWears ?? DEFAULT_TARGET_WEARS,
      createdAt: todayString(),
    };
    setItems((current) => [item, ...current]);

    // Bildirim izni istenir. iPhone pencereyi sadece ilk seferde gösterir, sonra tekrar sormaz.
    // İzin verilirse bildirimler hemen kurulur.
    const nextItems = [item, ...items];
    requestNotificationPermission()
      .then((granted) => (granted ? refreshReminders(nextItems) : undefined))
      .catch((error) => console.warn('Bildirim izni istenemedi:', error));
  }

  // "Giydim": bugünün tarihini (ve seçildiyse yeri) listeye ekler
  function wearItem(id: string, place: PlaceName | null = null) {
    // Bu "Giydim" ile hedefe ulaşıyorsa ödül bildirimi gönder
    const item = items.find((current) => current.id === id);
    if (item && wearCount(item) + 1 === item.targetWears) {
      const wornItem = { ...item, wearDates: [...item.wearDates, todayString()] };
      sendPaidOffNotification(wornItem).catch((error) =>
        console.warn('Ödül bildirimi gönderilemedi:', error)
      );
    }

    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              wearDates: [...item.wearDates, todayString()],
              wearPlaces: withPlace(item, place),
            }
          : item
      )
    );
  }

  // "Giydim'i geri al": en son eklenen tarihi siler
  function undoWear(id: string) {
    // Bugünkü tek giyim geri alınıyorsa, bu parçayı içeren kombinlerin "bugün giyildi" kaydı da
    // silinir; yoksa kombin sayfası parça giyilmediği halde "Bugün giydin" der (Ebrar ekledi)
    const today = todayString();
    const item = items.find((current) => current.id === id);
    if (
      item &&
      item.wearDates[item.wearDates.length - 1] === today &&
      item.wearDates.filter((date) => date === today).length === 1
    ) {
      setOutfits((current) =>
        current.map((outfit) =>
          outfit.itemIds.includes(id) && outfit.wornDates.includes(today)
            ? { ...outfit, wornDates: outfit.wornDates.filter((date) => date !== today) }
            : outfit
        )
      );
    }
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              wearDates: item.wearDates.slice(0, -1),
              ...(item.wearPlaces ? { wearPlaces: item.wearPlaces.slice(0, -1) } : {}),
            }
          : item
      )
    );
  }

  // Kıyafeti siler; fotoğrafı varsa onu da telefondan siler.
  // Kıyafet kombinlerden de çıkar; içinde hiç parça kalmayan kombin silinir.
  function deleteItem(id: string) {
    const item = items.find((current) => current.id === id);
    if (item) {
      deletePhoto(item.photoFileName);
    }
    setItems((current) => current.filter((item) => item.id !== id));
    setOutfits((current) =>
      current
        .map((outfit) => ({ ...outfit, itemIds: outfit.itemIds.filter((itemId) => itemId !== id) }))
        .filter((outfit) => outfit.itemIds.length > 0)
    );
  }

  // Kıyafeti düzenler (ad, kategori, fiyat, hedef, fotoğraf). Giyim geçmişi korunur.
  // Fotoğraf değiştiyse eski fotoğraf telefondan silinir.
  // (Ebrar ekledi – düzenleme ekranı için; CLAUDE.md kuralı 2: yeni şey eklemek serbest)
  function updateItem(id: string, changes: ClothingItemChanges) {
    const item = items.find((current) => current.id === id);
    if (
      item &&
      changes.photoFileName !== undefined &&
      changes.photoFileName !== item.photoFileName
    ) {
      deletePhoto(item.photoFileName);
    }
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item))
    );
  }

  // Bütün dolabı siler: önce fotoğrafları telefondan, sonra listeyi, kombinleri ve burç seçimini. Boş liste de otomatik
  // kaydedilir; bildirimler liste değişince kendiliğinden yeniden kurulur.
  // Sözleşme/Welcome bilgisine dokunmaz. (Ebrar ekledi – Ayarlar'daki "Bütün verileri sil" için)
  function resetAll() {
    for (const item of items) {
      deletePhoto(item.photoFileName);
    }
    setItems([]);
    setOutfits([]); // (Onur ekledi – kombin arşivi de silinsin)
    setZodiac(null); // (Onur ekledi – burç seçimi de silinsin)
    setQuizResults([]); // (Onur ekledi – Kahoot sonuçları da silinsin)
  }

  // ---------- Dolap Kahoot'u ----------

  // Haftanın sonucunu kaydeder. Bu hafta zaten oynandıysa ikinci sonuç kaydedilmez.
  function saveQuizResult(result: QuizResult) {
    setQuizResults((current) =>
      current.some((saved) => saved.weekKey === result.weekKey) ? current : [...current, result]
    );
  }

  // ---------- Burç ----------

  // Burcu seçer ve telefona kaydeder; null verilirse seçim silinir
  function setZodiac(sign: ZodiacName | null) {
    setZodiacState(sign);
    const saving = sign ? AsyncStorage.setItem(ZODIAC_KEY, sign) : AsyncStorage.removeItem(ZODIAC_KEY);
    saving.catch((error) => console.warn('Burç kaydedilemedi:', error));
  }

  // ---------- Kombin arşivi ----------

  // Kombini arşive kaydeder ve kimliğini döner. Aynı parçalardan oluşan kombin zaten
  // kayıtlıysa yenisini eklemez, var olanın kimliğini döner.
  function saveOutfit(itemIds: string[], name: string | null = null): string {
    const key = [...itemIds].sort().join(',');
    const existing = outfits.find((outfit) => [...outfit.itemIds].sort().join(',') === key);
    if (existing) {
      return existing.id;
    }
    const outfit: SavedOutfit = {
      id: createId(),
      itemIds,
      name: name?.trim() || null,
      favorite: false,
      wornDates: [],
      createdAt: todayString(),
    };
    setOutfits((current) => [outfit, ...current]);
    return outfit.id;
  }

  function toggleFavoriteOutfit(id: string) {
    setOutfits((current) =>
      current.map((outfit) => (outfit.id === id ? { ...outfit, favorite: !outfit.favorite } : outfit))
    );
  }

  // Boş ad verilirse otomatik ada döner
  function renameOutfit(id: string, name: string | null) {
    setOutfits((current) =>
      current.map((outfit) => (outfit.id === id ? { ...outfit, name: name?.trim() || null } : outfit))
    );
  }

  function deleteOutfit(id: string) {
    setOutfits((current) => current.filter((outfit) => outfit.id !== id));
  }

  // "Bu kombini giydim": kombindeki bütün parçalara Giydim basılır, kombinin tarihi kaydedilir
  function wearOutfit(id: string, place: PlaceName | null = null) {
    const outfit = outfits.find((current) => current.id === id);
    if (!outfit) {
      return;
    }
    // Bugün zaten giyilmiş parça (ör. ayrıca "Giydim" denmiş) ikinci kez sayılmaz; kombinin
    // bugünkü tarihi de bir kez eklenir (Ebrar düzeltti – eskiden aynı gün iki kez sayılıyordu)
    const today = todayString();
    for (const itemId of outfit.itemIds) {
      const item = items.find((current) => current.id === itemId);
      if (item && !item.wearDates.includes(today)) {
        wearItem(itemId, place);
      }
    }
    setOutfits((current) =>
      current.map((outfit) =>
        outfit.id === id && !outfit.wornDates.includes(today)
          ? { ...outfit, wornDates: [...outfit.wornDates, today] }
          : outfit
      )
    );
  }

  // "Bu kombini giydim"i geri al: bugün giyilmiş parçaların son Giydim'i ve kombinin bugünkü
  // tarihi silinir (Ebrar ekledi – kombin sayfasındaki ↩ butonu)
  function undoWearOutfit(id: string) {
    const outfit = outfits.find((current) => current.id === id);
    if (!outfit) {
      return;
    }
    const today = todayString();
    for (const itemId of outfit.itemIds) {
      const item = items.find((current) => current.id === itemId);
      if (item && item.wearDates[item.wearDates.length - 1] === today) {
        undoWear(itemId);
      }
    }
    setOutfits((current) =>
      current.map((outfit) =>
        outfit.id === id
          ? { ...outfit, wornDates: outfit.wornDates.filter((date) => date !== today) }
          : outfit
      )
    );
  }

  return (
    <AppContext.Provider
      value={{
        items,
        isLoaded,
        addItem,
        wearItem,
        undoWear,
        deleteItem,
        updateItem,
        resetAll,
        outfits,
        saveOutfit,
        toggleFavoriteOutfit,
        renameOutfit,
        deleteOutfit,
        wearOutfit,
        undoWearOutfit,
        zodiac,
        setZodiac,
        quizResults,
        saveQuizResult,
      }}>
      {children}
    </AppContext.Provider>
  );
}

// Ekranların hafıza merkezine ulaşmak için kullandığı kısayol
export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useApp, AppProvider içinde kullanılmalı (src/app/_layout.tsx).');
  }
  return value;
}
