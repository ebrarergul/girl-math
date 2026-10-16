/**
 * GEÇİCİ DENEME PANELİ
 *
 * Hafıza merkezinin (AppContext) çalıştığını telefonda görmek için.
 * Gerçek Dolap ekranı yapılınca bu dosya ve explore.tsx'teki <DevTestPanel /> satırı silinecek.
 */

import { Image } from 'expo-image';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { comparisonText } from '@/lib/comparisons';
import { costPerWear, isPaidOff, wearCount } from '@/lib/girl-math';
import { outfitFor, outfitItems, outfitName, sortOutfits } from '@/lib/outfits';
import { sendTestNotification } from '@/lib/notifications';
import { photoUri, pickAndSavePhoto } from '@/lib/photos';
import { starbucksIndexMeme, starbucksIndexText } from '@/lib/starbucks-index';

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
  } = useApp();

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
  function addColoredSamples() {
    addItem({ name: 'Pembe çanta', category: 'Çanta', price: 900, photoFileName: null, color: 'Pembe' });
    addItem({ name: 'Beyaz sneaker', category: 'Ayakkabı', price: 2500, photoFileName: null, color: 'Beyaz' });
    addItem({ name: 'Siyah etek', category: 'Alt', price: 700, photoFileName: null, color: 'Siyah' });
    addItem({ name: 'Kot pantolon', category: 'Alt', price: 1100, photoFileName: null, color: 'Kot mavisi' });
    addItem({ name: 'Beyaz tişört', category: 'Üst', price: 400, photoFileName: null, color: 'Beyaz' });
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
  muted: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
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
