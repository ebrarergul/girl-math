/**
 * GIRL MATH – FOTOĞRAF YARDIMCISI
 *
 * Kıyafet fotoğraflarını galeriden seçer, uygulamanın kendi klasörüne (Paths.document)
 * kopyalar ve siler. Kayıtta tam adres değil SADECE dosya adı tutulur; tam adres her
 * seferinde photoUri() ile üretilir (iPhone güncellemeden sonra klasör adresini
 * değiştirebiliyor).
 *
 * Ekranda kullanımı:
 *   const fileName = await pickAndSavePhoto();      // vazgeçilirse null
 *   <Image source={{ uri: photoUri(item.photoFileName) }} />
 */

import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

// Galeriyi açar, seçilen fotoğrafı uygulamanın klasörüne kopyalar ve dosya adını döner.
// Kullanıcı vazgeçerse ya da bir sorun olursa null döner.
export async function pickAndSavePhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true, // Kullanıcı fotoğrafı kırpabilsin
    aspect: [3, 4], // Kıyafet kartlarına uygun dikey oran
    quality: 0.8, // Biraz sıkıştır, telefonda az yer kaplasın
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  try {
    const picked = new File(result.assets[0].uri);
    const extension = picked.extension.replace('.', '') || 'jpg';
    const fileName = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.${extension}`;
    await picked.copy(new File(Paths.document, fileName));
    return fileName;
  } catch (error) {
    console.warn('Fotoğraf kaydedilemedi:', error);
    return null;
  }
}

// Dosya adından fotoğrafın tam adresini üretir. Fotoğraf yoksa undefined döner.
export function photoUri(fileName: string | null): string | undefined {
  if (!fileName) {
    return undefined;
  }
  return new File(Paths.document, fileName).uri;
}

// Fotoğrafı telefondan siler (kıyafet silinince çağrılır). Dosya zaten yoksa bir şey yapmaz.
export function deletePhoto(fileName: string | null): void {
  if (!fileName) {
    return;
  }
  try {
    const file = new File(Paths.document, fileName);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn('Fotoğraf silinemedi:', error);
  }
}
