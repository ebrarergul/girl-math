/**
 * GIRL MATH – BİLDİRİMLER
 *
 * Telefonun kendi kendine gösterdiği "yerel" bildirimler (sunucu gerekmez):
 *   1) Ödül      – kıyafet amorti olunca hemen
 *   2) Takılma   – en uzun süredir giyilmeyen kıyafet için, 3 gün sonra 20:00'de
 *   3) Günlük    – her akşam 20:00'de "bugün ne giydin?" hatırlatması
 *   4) Etkinlik  – "Etkinlik için aldım" kıyafetleri: bir gün önce 20:00 ve o gün 10:00
 *
 * Mesajları değiştirmek için sadece aşağıdaki listeleri düzenlemek yeterli.
 * Cümleler Türkçe ek gerektirmeyecek şekilde yazıldı ("ceketi/elbiseyi" sorunu olmasın diye).
 */

import * as Notifications from 'expo-notifications';

import { eventLabel } from '@/lib/events';
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

// Kıyafet adı tırnak içinde özne olur: “Pembe elbise” (Türkçe ek sorunu olmasın diye)
const q = (name: string) => `“${name}”`;

const PAID_OFF_TITLE = 'Tebrikler aşko! 💖';
const PAID_OFF_MESSAGES = [
  (name: string) => `+1000 aura ✨ ${q(name)} kendini amorti etti, artık resmen bedava!`,
  (name: string, wears: number) =>
    `${q(name)} ${wears} kere giyildi, resmen bedava 🎉 Merkez Bankası seni danışman olarak istiyor 📞`,
  (name: string) => `${q(name)} kendini amorti etti 💅 Enflasyon kaybetti, sen kazandın!`,
  (name: string) => `${q(name)} bedavaya düştü 💖 Kızım sen bu işi biliyorsun`,
];

const FORGOTTEN_TITLE = 'Dolabın sana küs 😤';
const FORGOTTEN_MESSAGES = [
  (name: string, days: number) => `-500 aura 📉 ${q(name)} ${days} gündür dolapta çürüyor`,
  (name: string, days: number) => `${q(name)} ${days} gündür askıda 👀 Acil giy ya da sat, kızım!`,
  (name: string, days: number, price: number) =>
    `${q(name)} için ${price} TL verdin, ${days} gündür yüzüne bakmadın 🥺 Enflasyon bile bu kadar acımasız değil`,
  (name: string, days: number, price: number) =>
    `Dolabında ${price} TL'lik ${q(name)} var ve ${days} gündür kira ödemeden oturuyor 🏠 Çıkar onu artık!`,
];

// Zarar cümlesi (Utanç Duvarı ile aynı hesap: günlük zarar = fiyat ÷ 365). Günlük zarar bu
// tutar ve üstündeyse günlük tutar yazılır; değilse biriken zarar ("günlük 2 TL" anlamsız durur).
const MIN_DAILY_LOSS = 10;
function lossMessage(name: string, days: number, price: number): string {
  const daily = Math.round(price / 365);
  const loss =
    daily >= MIN_DAILY_LOSS
      ? `sana günlük ${daily} TL zarar yazıyor`
      : `sana şimdiye kadar ${Math.round((price / 365) * days)} TL zarar yazdı`;
  return `${q(name)} ${days} gündür askıda ve ${loss} 💸 Bu hafta sonu giy ya da sat!`;
}

const DAILY_TITLE = 'Girl Math 💅';
const DAILY_MESSAGES = [
  'Bugün ne giydin aşko? “Giydim”e bas, maliyetler kendiliğinden düşmüyor 💸',
  'Bugün main character mıydın? Kanıtla: “Giydim” 📸',
  'Girl dinner yedin, girl math yaptın mı? “Giydim” bekliyor 💅',
  'Enflasyon her gün artıyor, bari senin maliyetin düşsün 📉 Bugün ne giydin?',
  'Bugünkü kombin kaydedilmezse giyilmemiş sayılır kızım, kurallar böyle 📜',
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

// Takılma mesajı: dört cümle + zarar cümlesi arasından rastgele
function forgottenMessage(item: ClothingItem, days: number): string {
  const options = [
    ...FORGOTTEN_MESSAGES.map((message) => () => message(item.name, days, item.price)),
    () => lossMessage(item.name, days, item.price),
  ];
  return pickRandom(options)();
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
      body: forgottenMessage(item, daysAtDelivery),
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

// ---------- Etkinlik (Zaman Aşımı = Bedava) ----------

const EVENT_ID_PREFIX = 'girlmath-event-';
const EVENT_DAY_HOUR = 10; // Etkinlik günü sabah 10:00

// "2026-10-30" gününün verilen saatindeki an
function atTime(date: string, hour: number, minute = 0): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

// Etkinlikli kıyafetlerin bildirimlerini baştan kurar: önce eski etkinlik bildirimlerinin
// hepsi silinir (silinen kıyafet / değişen tarih kalmasın), sonra gelecektekiler kurulur.
export async function scheduleEventReminders(items: ClothingItem[]): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.identifier.startsWith(EVENT_ID_PREFIX))
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier))
  );

  if (!(await hasNotificationPermission())) {
    return;
  }
  const now = Date.now();
  for (const item of items) {
    if (!item.event) {
      continue;
    }
    const label = eventLabel(item.event);
    const name = `“${item.name}”`;

    const eve = atTime(item.event.date, REMINDER_HOUR, REMINDER_MINUTE);
    eve.setDate(eve.getDate() - 1);
    if (eve.getTime() > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${EVENT_ID_PREFIX}eve-${item.id}`,
        content: {
          title: '👗 Yarın büyük gün!',
          body: `${label} için ${name} hazır mı? Ütüle, as; parası zaten çoktan ödendi 😌`,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: eve },
      });
    }

    const day = atTime(item.event.date, EVENT_DAY_HOUR);
    if (day.getTime() > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${EVENT_ID_PREFIX}day-${item.id}`,
        content: {
          title: `🎉 Bugün büyük gün: ${label}!`,
          body: `${name} için ödenen para hesaptan çoktan çıktı. Bugünkü maliyeti 0 TL; bedavaya harika görünüyorsun!`,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: day },
      });
    }
  }
}
