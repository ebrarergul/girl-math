/**
 * GIRL MATH – HAFIZA MERKEZİ (AppContext)
 *
 * Dolaptaki tüm kıyafetler burada tutulur. Ekranlar kıyafet bilgisini buradan alır
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
  scheduleForgottenReminder,
  sendPaidOffNotification,
} from '@/lib/notifications';
import { deletePhoto } from '@/lib/photos';
import { getWardrobeStats } from '@/lib/stats';
import type { Category, ClothingItem } from '@/lib/types';

// Kıyafetler telefonda bu isimle saklanır
const ITEMS_KEY = 'girlmath.items';

// Kullanıcı hedef girmezse kullanılacak hedef giyilme sayısı (#30wears)
export const DEFAULT_TARGET_WEARS = 30;

// Yeni kıyafet eklerken ekrandan gelen bilgiler (kimlik, tarih vb. otomatik üretilir)
export type NewClothingItem = {
  name: string;
  category: Category;
  price: number;
  photoFileName: string | null;
  targetWears?: number;
};

type AppContextValue = {
  items: ClothingItem[];
  isLoaded: boolean; // Telefondaki kayıtlar okundu mu?
  addItem: (newItem: NewClothingItem) => void;
  wearItem: (id: string) => void;
  undoWear: (id: string) => void;
  deleteItem: (id: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

// Her kıyafete özel kimlik üretir, örn: "lx3k9a-4f7q2"
function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// Takılma ve günlük bildirimleri güncel kıyafet listesine göre yeniden kurar
async function refreshReminders(items: ClothingItem[]): Promise<void> {
  await scheduleDailyReminder();
  await scheduleForgottenReminder(getWardrobeStats(items).forgotten);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1) Uygulama açılınca telefondaki kayıtları oku
  useEffect(() => {
    AsyncStorage.getItem(ITEMS_KEY)
      .then((saved) => {
        if (saved) {
          setItems(JSON.parse(saved));
        }
      })
      .catch((error) => console.warn('Kıyafetler okunamadı:', error))
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

  // "Giydim": bugünün tarihini listeye ekler
  function wearItem(id: string) {
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
        item.id === id ? { ...item, wearDates: [...item.wearDates, todayString()] } : item
      )
    );
  }

  // "Giydim'i geri al": en son eklenen tarihi siler
  function undoWear(id: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, wearDates: item.wearDates.slice(0, -1) } : item
      )
    );
  }

  // Kıyafeti siler; fotoğrafı varsa onu da telefondan siler
  function deleteItem(id: string) {
    const item = items.find((current) => current.id === id);
    if (item) {
      deletePhoto(item.photoFileName);
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <AppContext.Provider value={{ items, isLoaded, addItem, wearItem, undoWear, deleteItem }}>
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
