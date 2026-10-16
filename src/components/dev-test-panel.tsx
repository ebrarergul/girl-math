/**
 * GEÇİCİ DENEME PANELİ
 *
 * Hafıza merkezinin (AppContext) çalıştığını telefonda görmek için.
 * Gerçek Dolap ekranı yapılınca bu dosya ve explore.tsx'teki <DevTestPanel /> satırı silinecek.
 */

import { Image } from 'expo-image';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp, type NewClothingItem } from '@/context/app-context';
import { comparisonText } from '@/lib/comparisons';
import { costPerWear, isPaidOff, wearCount } from '@/lib/girl-math';
import { outfitFor, outfitItems, outfitName, sortOutfits } from '@/lib/outfits';
import { sendTestNotification } from '@/lib/notifications';
import { photoUri, pickAndSavePhoto } from '@/lib/photos';
import { freshAlternatives, lastWearText, repeatWarning, type PlaceName } from '@/lib/places';
import { starbucksIndexMeme, starbucksIndexText } from '@/lib/starbucks-index';
import type { ClothingItem } from '@/lib/types';
import { ZODIAC_SIGNS, dailyHoroscope, weeklyHoroscope } from '@/lib/zodiac';

const colors = Colors.light;

export function DevTestPanel() {
  const {
    items,
    isLoaded,
    addItem,
    wearItem,
    undoWear,
    deleteItem,
    outfits,
    saveOutfit,
    toggleFavoriteOutfit,
    deleteOutfit,
    wearOutfit,
    zodiac,
    setZodiac,
  } = useApp();
  const daily = zodiac ? dailyHoroscope(zodiac, items) : null;
  const weekly = zodiac ? weeklyHoroscope(zodiac) : null;

  function addSample() {
    addItem({ name: 'Siyah deri ceket', category: 'Dış giyim', price: 3000, photoFileName: null });
  }

  async function addSampleWithPhoto() {
    const fileName = await pickAndSavePhoto();
    if (!fileName) {
      return; // Kullanıcı vazgeçti
    }
    addItem({ name: 'Pembe elbise', category: 'Elbise', price: 1200, photoFileName: fileName });
  }

  // Renkli örnek dolap: kombin motorunu denemek için
  // Dolapta aynı adlı parça varsa tekrar eklemez; sonunda kaç parça eklendiğini söyler
  function addColoredSamples() {
    const samples: NewClothingItem[] = [
      { name: 'Pembe çanta', category: 'Çanta', price: 900, photoFileName: null, color: 'Pembe' },
      { name: 'Beyaz sneaker', category: 'Ayakkabı', price: 2500, photoFileName: null, color: 'Beyaz' },
      { name: 'Siyah etek', category: 'Alt', price: 700, photoFileName: null, color: 'Siyah' },
      { name: 'Kot pantolon', category: 'Alt', price: 1100, photoFileName: null, color: 'Kot mavisi' },
      { name: 'Beyaz tişört', category: 'Üst', price: 400, photoFileName: null, color: 'Beyaz' },
    ];
    const missing = samples.filter((sample) => !items.some((item) => item.name === sample.name));
    missing.forEach((sample) => addItem(sample));
    Alert.alert(
      missing.length > 0 ? `✅ ${missing.length} parça eklendi` : 'Örnek dolap zaten ekli',
      'Aşağıdaki "Kıyafetler" listesinde görebilirsin.'
    );
  }

  // Listedeki ilk kıyafete kombin önerir ve arşive kaydeder
  function suggestAndSaveOutfit() {
    if (items.length === 0) {
      Alert.alert('Dolap boş', 'Önce "🎨 Renkli örnek dolap" ekle.');
      return;
    }
    const outfit = outfitFor(items[0], items);
    saveOutfit(outfit.items.map((item) => item.id));
    const names = outfit.items.map((item) => item.name).join(' + ');
    const missing = outfit.missing.length > 0 ? `\n\nEksik: ${outfit.missing.join(', ')}` : '';
    Alert.alert('✨ Kombin kaydedildi', `${names}\n\n${outfit.text}${missing}`);
  }

  // "Nereye giderken giydin?" denemesi: önce tekrar uyarısına bakar
  function wearAt(item: ClothingItem, place: PlaceName) {
    const warning = repeatWarning(item, place);
    if (!warning) {
      wearItem(item.id, place);
      return;
    }
    const alternatives = freshAlternatives(item, place, items).map((other) => other.name);
    const suggestion =
      alternatives.length > 0 ? `\n\nBunun yerine: ${alternatives.join(' · ')}` : '';
    Alert.alert(warning.level === 'strong' ? '🚨 Dur kızım!' : '💭 Hatırlatma', warning.message + suggestion, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Yine de giy', onPress: () => wearItem(item.id, place) },
    ]);
  }

  async function testNotification() {
    const sent = await sendTestNotification();
    if (!sent) {
      Alert.alert('Bildirim izni yok', 'Ayarlar > Expo Go > Bildirimler kısmından izin verebilirsin.');
    }
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>🧪 Deneme paneli (geçici)</Text>

      {!isLoaded && <Text style={styles.muted}>Yükleniyor...</Text>}
      {isLoaded && items.length === 0 && <Text style={styles.muted}>Dolap boş.</Text>}

      <View style={styles.row}>
        <Pressable style={styles.primaryButton} onPress={addSample}>
          <Text style={styles.primaryButtonText}>+ Örnek kıyafet ekle</Text>
        </Pressable>
        <Pressable style={styles.softButton} onPress={addSampleWithPhoto}>
          <Text style={styles.softButtonText}>📷 Fotoğraflı ekle</Text>
        </Pressable>
      </View>
      <Pressable style={styles.softButton} onPress={testNotification}>
        <Text style={styles.softButtonText}>🔔 Test bildirimi (5 sn)</Text>
      </Pressable>

      <Text style={styles.title}>🔮 Burç</Text>
      <View style={styles.row}>
        {ZODIAC_SIGNS.map((sign) => (
          <Pressable
            key={sign.name}
            style={zodiac === sign.name ? styles.primaryButton : styles.softButton}
            onPress={() => setZodiac(sign.name)}>
            <Text style={zodiac === sign.name ? styles.primaryButtonText : styles.softButtonText}>
              {sign.emoji} {sign.name}
            </Text>
          </Pressable>
        ))}
      </View>
      {!zodiac && <Text style={styles.muted}>Burcunu seç, yıldızlar dolabına baksın 🔮</Text>}
      {daily && (
        <View style={styles.card}>
          <Text style={styles.name}>{daily.title}</Text>
          <Text style={styles.muted}>{daily.personality}</Text>
          {daily.lines.map((line) => (
            <Text key={line} style={styles.horoscopeLine}>
              {line}
            </Text>
          ))}
          <Text style={styles.comparison}>🍀 Şanslı rengin: {daily.luckyColor}</Text>
          {daily.suggestion && (
            <>
              <Text style={styles.horoscopeLine}>{daily.suggestion.text}</Text>
              <Text style={styles.muted}>
                → {daily.suggestion.outfit.items.map((item) => item.name).join(' + ')}
              </Text>
            </>
          )}
        </View>
      )}
      {weekly && (
        <View style={styles.card}>
          <Text style={styles.name}>
            {weekly.title} ({weekly.range})
          </Text>
          <Text style={styles.horoscopeLine}>{weekly.love}</Text>
          <Text style={styles.horoscopeLine}>{weekly.money}</Text>
          <Text style={styles.horoscopeLine}>{weekly.wardrobe}</Text>
        </View>
      )}

      <Text style={styles.title}>👗 Kombin arşivi</Text>
      <View style={styles.row}>
        <Pressable style={styles.softButton} onPress={addColoredSamples}>
          <Text style={styles.softButtonText}>🎨 Renkli örnek dolap</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={suggestAndSaveOutfit}>
          <Text style={styles.primaryButtonText}>✨ Kombin öner + kaydet</Text>
        </Pressable>
      </View>
      {outfits.length === 0 && <Text style={styles.muted}>Arşiv boş.</Text>}
      {sortOutfits(outfits).map((outfit) => (
        <View key={outfit.id} style={styles.card}>
          <Text style={styles.name}>
            {outfit.favorite ? '⭐ ' : ''}
            {outfitName(outfit, items)}
          </Text>
          <Text style={styles.muted}>
            {outfitItems(outfit, items)
              .map((item) => item.name)
              .join(' + ')}
          </Text>
          <Text style={styles.muted}>Kombin olarak giyilme: {outfit.wornDates.length}</Text>
          <View style={styles.row}>
            <Pressable style={styles.primaryButton} onPress={() => wearOutfit(outfit.id)}>
              <Text style={styles.primaryButtonText}>👗 Bu kombini giydim</Text>
            </Pressable>
            <Pressable style={styles.softButton} onPress={() => toggleFavoriteOutfit(outfit.id)}>
              <Text style={styles.softButtonText}>{outfit.favorite ? '☆' : '⭐'}</Text>
            </Pressable>
            <Pressable style={styles.softButton} onPress={() => deleteOutfit(outfit.id)}>
              <Text style={styles.softButtonText}>Sil</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Text style={styles.title}>👚 Kıyafetler</Text>

      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          {item.photoFileName && (
            <Image source={{ uri: photoUri(item.photoFileName) }} style={styles.photo} />
          )}
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.priceStrike}>{item.price} TL</Text>
          <Text style={styles.muted}>{starbucksIndexText(item.price)}</Text>
          <Text style={styles.muted}>{starbucksIndexMeme(item.price)}</Text>
          <Text style={styles.price}>Giyim başına: {costPerWear(item)} TL</Text>
          {lastWearText(item) && <Text style={styles.muted}>📍 {lastWearText(item)}</Text>}
          <Text style={styles.muted}>
            Giyilme: {wearCount(item)} / {item.targetWears}
            {isPaidOff(item) ? ' · Amorti edildi 🎉' : ''}
          </Text>
          {wearCount(item) > 0 && (
            <Text style={styles.comparison}>{comparisonText(costPerWear(item))}</Text>
          )}

          <View style={styles.row}>
            <Pressable style={styles.primaryButton} onPress={() => wearItem(item.id)}>
              <Text style={styles.primaryButtonText}>Giydim</Text>
            </Pressable>
            <Pressable style={styles.softButton} onPress={() => wearAt(item, 'Okul')}>
              <Text style={styles.softButtonText}>🎓 Okul</Text>
            </Pressable>
            <Pressable style={styles.softButton} onPress={() => undoWear(item.id)}>
              <Text style={styles.softButtonText}>Geri al</Text>
            </Pressable>
            <Pressable style={styles.softButton} onPress={() => deleteItem(item.id)}>
              <Text style={styles.softButtonText}>Sil</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
  },
  title: {
    ...Typography.heading,
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
    ...Shadows.card,
  },
  photo: {
    width: 120,
    aspectRatio: 3 / 4,
    borderRadius: Radius.md,
    marginBottom: Spacing.two,
  },
  name: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  priceStrike: {
    ...Typography.priceStrike,
    color: colors.textMuted,
  },
  price: {
    ...Typography.price,
    color: colors.primary,
  },
  comparison: {
    ...Typography.bodyBold,
    color: colors.primary,
  },
  horoscopeLine: {
    ...Typography.body,
    color: colors.text,
  },
  muted: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
    marginTop: Spacing.two,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    alignSelf: 'flex-start',
  },
  primaryButtonText: {
    ...Typography.button,
    color: colors.onPrimary,
  },
  softButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  softButtonText: {
    ...Typography.button,
    color: colors.primary,
  },
});
