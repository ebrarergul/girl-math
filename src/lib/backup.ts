/**
 * GIRL MATH – VERİ YEDEĞİ
 *
 * Bütün dolabı (kıyafetler + fotoğraflar + kombinler + burç + Kahoot sonuçları) tek bir
 * dosyaya yazar ve iPhone'un paylaşım penceresini açar (Dosyalar, iCloud Drive, WhatsApp…).
 * Uygulama silinip yeniden yüklense bile kullanıcı bu dosyayla dolabını geri getirebilir.
 *
 * Ekranda kullanımı:
 *   const { items, outfits, zodiac, quizResults } = useApp();
 *   await exportBackup({ items, outfits, zodiac, quizResults });  // false: paylaşım yapılamadı
 *   const read = await readBackup();   // { ok: true, backup, summary } ya da { ok: false, reason }
 *   restoreAll(read.backup);           // (onaydan sonra) AppContext: fotoğraflar + her şey yedektekiyle değişir
 */

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { todayString } from '@/lib/girl-math';
import type { ClothingItem, QuizResult, SavedOutfit } from '@/lib/types';
import type { ZodiacName } from '@/lib/zodiac';

// Yedek dosyasının biçim sürümü. Veri kalıbı değişirse artırılır; eski yedekler okunurken
// sürüme göre dönüştürülür.
export const BACKUP_VERSION = 1;

// Dosyanın gerçekten Girl Math yedeği olduğunu anlamak için imza
const BACKUP_APP = 'girl-math';

// Yedeğe giren veriler (AppContext'teki hâliyle)
export type BackupContent = {
  items: ClothingItem[];
  outfits: SavedOutfit[];
  zodiac: ZodiacName | null;
  quizResults: QuizResult[];
};

// Yedek dosyasının içeriği
export type BackupFile = BackupContent & {
  app: typeof BACKUP_APP;
  version: number;
  createdAt: string; // Yedeğin alındığı gün, örn: "2026-10-18"
  photos: Record<string, string>; // Fotoğraf dosya adı → fotoğrafın kendisi (base64 yazı olarak)
};

// Kıyafet fotoğraflarını okuyup yedeğe koyar. Telefonda bulunamayan fotoğraf atlanır.
async function readPhotos(items: ClothingItem[]): Promise<Record<string, string>> {
  const photos: Record<string, string> = {};
  for (const item of items) {
    if (!item.photoFileName || photos[item.photoFileName]) {
      continue;
    }
    try {
      const file = new File(Paths.document, item.photoFileName);
      if (file.exists) {
        photos[item.photoFileName] = await file.base64();
      }
    } catch (error) {
      console.warn('Fotoğraf yedeğe eklenemedi:', item.photoFileName, error);
    }
  }
  return photos;
}

// Yedek dosyasının içeriğini hazırlar
export async function buildBackup(content: BackupContent): Promise<BackupFile> {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    createdAt: todayString(),
    items: content.items,
    outfits: content.outfits,
    zodiac: content.zodiac,
    quizResults: content.quizResults,
    photos: await readPhotos(content.items),
  };
}

// Yedeği dosyaya yazar ve paylaşım penceresini açar. Paylaşım yapılamazsa false döner.
export async function exportBackup(content: BackupContent): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) {
    return false;
  }
  try {
    const backup = await buildBackup(content);
    const file = new File(Paths.cache, `GirlMath-yedek-${backup.createdAt}.json`);
    if (file.exists) {
      file.delete();
    }
    file.create();
    file.write(JSON.stringify(backup));
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      UTI: 'public.json',
      dialogTitle: 'Girl Math yedeğini kaydet',
    });
    return true;
  } catch (error) {
    console.warn('Yedek hazırlanamadı:', error);
    return false;
  }
}

// ---------- Geri yükleme ----------

const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

// "2026-10-18" → "18 Ekim 2026"
function prettyDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return `${day} ${MONTHS[month - 1] ?? ''} ${year}`;
}

export type ReadBackupResult =
  | { ok: true; backup: BackupFile; summary: string }
  | { ok: false; reason: 'canceled' | 'invalid' | 'newer' };

// Okunan içerik gerçekten (bizim anladığımız sürümde) bir Girl Math yedeği mi?
function checkBackup(data: unknown): BackupFile | 'invalid' | 'newer' {
  const backup = data as Partial<BackupFile> | null;
  if (
    !backup ||
    backup.app !== BACKUP_APP ||
    typeof backup.version !== 'number' ||
    !Array.isArray(backup.items)
  ) {
    return 'invalid';
  }
  if (backup.version > BACKUP_VERSION) {
    return 'newer'; // Uygulamanın daha yeni bir sürümüyle alınmış yedek
  }
  // Eksik alanlar boş kabul edilir (eski sürüm yedekleri için)
  return {
    app: BACKUP_APP,
    version: backup.version,
    createdAt: typeof backup.createdAt === 'string' ? backup.createdAt : todayString(),
    items: backup.items,
    outfits: Array.isArray(backup.outfits) ? backup.outfits : [],
    zodiac: backup.zodiac ?? null,
    quizResults: Array.isArray(backup.quizResults) ? backup.quizResults : [],
    photos: backup.photos && typeof backup.photos === 'object' ? backup.photos : {},
  };
}

// Dosya seçme penceresini açar, seçilen dosyayı okuyup kontrol eder. Hiçbir şeyi DEĞİŞTİRMEZ;
// ekran özeti gösterip kullanıcıdan onay aldıktan sonra AppContext'in restoreAll'u çağrılır.
export async function readBackup(): Promise<ReadBackupResult> {
  const picked = await File.pickFileAsync({ mimeTypes: '*/*' });
  if (picked.canceled) {
    return { ok: false, reason: 'canceled' };
  }
  try {
    const checked = checkBackup(JSON.parse(await picked.result.text()));
    if (checked === 'invalid' || checked === 'newer') {
      return { ok: false, reason: checked };
    }
    const summary = `${checked.items.length} kıyafet, ${checked.outfits.length} kombin · ${prettyDate(checked.createdAt)}`;
    return { ok: true, backup: checked, summary };
  } catch {
    return { ok: false, reason: 'invalid' }; // JSON değil ya da okunamadı
  }
}

// Ekranda gösterilecek hata cümlesi
export function backupErrorText(reason: 'invalid' | 'newer'): string {
  return reason === 'newer'
    ? 'Bu yedek uygulamanın daha yeni bir sürümüyle alınmış. Önce uygulamayı güncelle 🔄'
    : 'Bu bir Girl Math yedeği değil 🤔 Dosyayı kontrol et.';
}

// Yedekteki fotoğrafları telefona yazar ve yüklenecek verileri döner. Bir fotoğraf yazılamazsa
// hata fırlatır; AppContext bu durumda mevcut dolaba hiç dokunmaz.
export function writeBackupPhotos(backup: BackupFile): BackupContent {
  for (const [fileName, base64] of Object.entries(backup.photos)) {
    // Güvenlik: sadece düz dosya adları ("ab12.jpg"); klasör işareti olanlar atlanır
    if (fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
      continue;
    }
    const file = new File(Paths.document, fileName);
    if (file.exists) {
      file.delete();
    }
    file.create();
    file.write(base64, { encoding: 'base64' });
  }
  return {
    items: backup.items,
    outfits: backup.outfits,
    zodiac: backup.zodiac,
    quizResults: backup.quizResults,
  };
}
