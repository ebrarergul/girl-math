/**
 * GIRL MATH – BİLDİRİMLER
 *
 * Telefonun kendi kendine gösterdiği "yerel" bildirimler (sunucu gerekmez):
 *   1) Ödül      – kıyafet amorti olunca hemen
 *   2) Takılma   – en uzun süredir giyilmeyen kıyafet için, 3 gün sonra 20:00'de
 *   3) Günlük    – her akşam 20:00'de "bugün ne giydin?" hatırlatması
 *
 * Mesajları değiştirmek için sadece aşağıdaki listeleri düzenlemek yeterli.
 * Cümleler Türkçe ek gerektirmeyecek şekilde yazıldı ("ceketi/elbiseyi" sorunu olmasın diye).
 */

import * as Notifications from 'expo-notifications';

import { wearCount } from '@/lib/girl-math';
import type { ClothingItem } from '@/lib/types';

// Bildirim saati (20:00)
const REMINDER_HOUR = 20;
const REMINDER_MINUTE = 0;

// Takılma bildirimi kaç gün sonraya kurulur
const FORGOTTEN_DELAY_DAYS = 3;

// Bildirim gittiği gün kıyafet en az bu kadar gündür giyilmemiş olmalı (yoksa takılmaya değmez)
const FORGOTTEN_MIN_DAYS = 14;

// Bildirimlerin sabit kimlikleri: aynı kimlikle yeniden kurunca eskisi silinir, üst üste binmez
const DAILY_ID = 'girlmath-daily';
const FORGOTTEN_ID = 'girlmath-forgotten';

// ---------- Mesajlar ----------

const PAID_OFF_TITLE = 'Tebrikler aşko! 💖';
const PAID_OFF_MESSAGES = [
  (name: string, wears: number) => `${name} ${wears} kere giyildi, resmen bedava!`,
  (name: string) => `${name} kendini amorti etti! 🎉 Artık her giyişin kâr, girl math böyle çalışır.`,
  (name: string) => `Bu bir başarı hikâyesi 👑 ${name} hedefe ulaştı. Para harcamadın, yatırım yaptın!`,
  (name: string) => `${name} artık bedava 💅 Bunu kutlamak için yeni bir şey almak şart değil… ama olabilir 👀`,
];

const FORGOTTEN_TITLE = 'Dolabın sana küs 😤';
const FORGOTTEN_MESSAGES = [
  (name: string, days: number) => `${days} gündür giymediğin şey: ${name}. Acil giy ya da sat! 😤`,
  (name: string, days: number) =>
    `${name} dolabın karanlık köşesinden sesleniyor: "Beni hatırlıyor musun?" 🥺 (${days} gün oldu)`,
  (name: string, days: number) =>
    `${name} ${days} gündür gün yüzü görmedi. Maliyeti kendiliğinden düşmüyor tatlım 💸`,
  (name: string, _days: number, price: number) => `${name} için ${price} TL verdin. Yarın giysen? 👗`,
];

const DAILY_TITLE = 'Girl Math 💅';
const DAILY_MESSAGES = [
  'Bugün ne giydin? "Giydim"e basmayı unutma, maliyetler kendiliğinden düşmüyor 💸',
  'Günün kombinini kaydet aşko ✨ Her "Giydim" bir indirim!',
  'Dolabın seni bekliyor 👀 Bugün giydiklerini işaretledin mi?',
  'Girl math hatırlatması: giymediğin kıyafet pahalı, giydiğin bedava 💖',
];

// Listeden rastgele bir eleman seçer
function pickRandom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

// ---------- Ayarlar ve izin ----------

// Uygulama açıkken gelen bildirimler de ekranın üstünde görünsün
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Bildirim izni var mı? (Kullanıcıya bir şey sormaz)
export async function hasNotificationPermission(): Promise<boolean> {
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

// İzin ister. iPhone bu pencereyi SADECE 1 kere gösterir; sonra cevap neyse o geçerli olur.
// İzin verildiyse true döner.
export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || !current.canAskAgain) {
    return current.granted;
  }
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

// ---------- Bildirimler ----------

// 1) Ödül: kıyafet amorti olunca hemen gösterilir
export async function sendPaidOffNotification(item: ClothingItem): Promise<void> {
  if (!(await hasNotificationPermission())) {
    return;
  }
  await Notifications.scheduleNotificationAsync({
    content: { title: PAID_OFF_TITLE, body: pickRandom(PAID_OFF_MESSAGES)(item.name, wearCount(item)) },
    trigger: null, // null = hemen göster
  });
}

// 2) Takılma: en uzun süredir giyilmeyen kıyafet için 3 gün sonra 20:00'ye kurulur.
// Her çağrıldığında eskisini siler, yenisini kurar. Kıyafet yoksa sadece eskisini siler.
export async function scheduleForgottenReminder(
  forgotten: { item: ClothingItem; days: number } | null
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(FORGOTTEN_ID);

  if (!forgotten || !(await hasNotificationPermission())) {
    return;
  }

  const daysAtDelivery = forgotten.days + FORGOTTEN_DELAY_DAYS;
  if (daysAtDelivery < FORGOTTEN_MIN_DAYS) {
    return;
  }

  const date = new Date();
  date.setDate(date.getDate() + FORGOTTEN_DELAY_DAYS);
  date.setHours(REMINDER_HOUR, REMINDER_MINUTE, 0, 0);

  const { item } = forgotten;
  await Notifications.scheduleNotificationAsync({
    identifier: FORGOTTEN_ID,
    content: {
      title: FORGOTTEN_TITLE,
      body: pickRandom(FORGOTTEN_MESSAGES)(item.name, daysAtDelivery, item.price),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

// 3) Günlük hatırlatma: her akşam 20:00. Her çağrıldığında yeniden kurulur (mesaj değişsin diye).
export async function scheduleDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID);

  if (!(await hasNotificationPermission())) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: { title: DAILY_TITLE, body: pickRandom(DAILY_MESSAGES) },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: REMINDER_HOUR,
      minute: REMINDER_MINUTE,
    },
  });
}

// Deneme için: 5 saniye sonra bir bildirim gösterir (izin yoksa önce ister)
export async function sendTestNotification(): Promise<boolean> {
  if (!(await requestNotificationPermission())) {
    return false;
  }
  await Notifications.scheduleNotificationAsync({
    content: { title: DAILY_TITLE, body: pickRandom(DAILY_MESSAGES) },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
  });
  return true;
}
