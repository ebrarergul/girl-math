/**
 * KIYAFET EKLEME / DÜZENLEME FORMU
 *
 * İki modu var:
 * - Ekleme: Dolap'taki "+" ile boş açılır. "Dolabıma ekle" → addItem().
 * - Düzenleme: detay sayfasındaki "Düzenle" ile kıyafetin kimliği (id) verilerek açılır,
 *   form o kıyafetin bilgileriyle dolu gelir. "Kaydet" → updateItem(); giyim geçmişi korunur.
 * "Almalı mıyım?" ekranından fiyat (price) verilerek de açılabilir: fiyat dolu gelir.
 * Fotoğraf, ad, kategori, isteğe bağlı renk (kombin önerileri için), fiyat ve isteğe bağlı hedef
 * giyilme sayısı girilir. Fotoğraf seçilince rengi fotoğraftan tahmin edilip seçili gelir
 * ("Fotoğraftan tahmin ettim … doğru mu?"); kullanıcı elle seçtiyse tahmin üstüne yazılmaz.
 */

import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ColorPicker } from '@/components/color-picker';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { DEFAULT_TARGET_WEARS, useApp } from '@/context/app-context';
import type { ColorName } from '@/lib/colors';
import { guessPhotoColor } from '@/lib/photo-color';
import { deletePhoto, pickAndSavePhoto, photoUri } from '@/lib/photos';
import { CATEGORIES, type Category } from '@/lib/types';

const colors = Colors.light;

// "1.500" ya da "1500,50" gibi yazılan fiyatı sayıya çevirir. Geçersizse NaN döner.
function parseAmount(text: string): number {
  return Number(text.replace(/\./g, '').replace(',', '.').trim());
}

export default function AddItemScreen() {
  const router = useRouter();
  const { id, price: priceParam } = useLocalSearchParams<{ id?: string; price?: string }>();
  const { items, addItem, updateItem } = useApp();

  // Kimlik verildiyse düzenleme modu: form bu kıyafetin bilgileriyle başlar
  const editing = id ? items.find((item) => item.id === id) : undefined;

  const [photoFileName, setPhotoFileName] = useState<string | null>(
    editing?.photoFileName ?? null,
  );
  const [name, setName] = useState(editing?.name ?? '');
  const [category, setCategory] = useState<Category | null>(editing?.category ?? null);
  const [color, setColor] = useState<ColorName | undefined>(editing?.color);
  // Fotoğraftan tahmin edilen renk (kullanıcı seçiciye dokununca silinir)
  const [guessedColor, setGuessedColor] = useState<ColorName | null>(null);
  const [priceText, setPriceText] = useState(
    editing ? String(editing.price) : (priceParam ?? ''),
  );
  const [targetText, setTargetText] = useState(editing ? String(editing.targetWears) : '');

  // Kaydetmeden çıkılırsa bu formda YENİ seçilen fotoğraf telefonda boşuna yer kaplamasın diye
  // silinir. Düzenlemede kıyafetin eski fotoğrafına dokunulmaz (o, kaydedince updateItem'da silinir).
  const photoRef = useRef<string | null>(null);
  const savedRef = useRef(false);
  useEffect(() => {
    return () => {
      if (!savedRef.current) {
        deletePhoto(photoRef.current);
      }
    };
  }, []);

  const price = parseAmount(priceText);
  const target = targetText.trim() === '' ? DEFAULT_TARGET_WEARS : parseAmount(targetText);
  const isValid =
    name.trim() !== '' &&
    category !== null &&
    price > 0 &&
    Number.isInteger(target) &&
    target > 0;

  async function handlePickPhoto() {
    const fileName = await pickAndSavePhoto();
    if (!fileName) {
      return;
    }
    // Yeni fotoğraf seçildiyse eskisi silinir
    deletePhoto(photoRef.current);
    photoRef.current = fileName;
    setPhotoFileName(fileName);

    // Rengi fotoğraftan tahmin et; ama kullanıcı rengi kendisi seçtiyse ona dokunma
    const guess = await guessPhotoColor(photoUri(fileName));
    if (guess && (color === undefined || color === guessedColor)) {
      setColor(guess);
      setGuessedColor(guess);
    }
  }

  function handleColorChange(next: ColorName | undefined) {
    setColor(next);
    setGuessedColor(null);
  }

  function handleSave() {
    if (!isValid || category === null) {
      return;
    }
    const values = {
      name: name.trim(),
      category,
      color, // Seçilmediyse undefined: düzenlemede rengi kaldırmak da böyle olur
      price: Math.round(price),
      photoFileName,
      targetWears: target,
    };
    if (editing) {
      updateItem(editing.id, values);
    } else {
      addItem(values);
    }
    savedRef.current = true;
    if (priceParam && !editing) {
      // "Almalı mıyım?" → "Aldım!" ile geldiyse: açık sayfaları kapat, yeni parçayı Dolap'ta göster
      router.dismissAll();
      router.navigate('/wardrobe');
    } else {
      router.back();
    }
  }

  const uri = photoUri(photoFileName);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: editing ? 'Parçayı düzenle' : 'Yeni parça',
          headerBackTitle: editing ? 'Geri' : 'Dolap',
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={handlePickPhoto}
          style={({ pressed }) => [styles.photoBox, pressed && styles.pressed]}>
          {uri ? (
            <Image source={{ uri }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={styles.photoEmpty}>
              <SymbolView
                name={{ ios: 'camera', android: 'photo_camera', web: 'photo_camera' }}
                tintColor={colors.primary}
                size={36}
                weight="light"
              />
              <Text style={styles.photoText}>Fotoğraf ekle</Text>
            </View>
          )}
        </Pressable>
        {uri && (
          <Pressable onPress={handlePickPhoto}>
            <Text style={styles.changePhoto}>Fotoğrafı değiştir</Text>
          </Pressable>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>ADI</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Örn: Siyah deri ceket"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            maxLength={40}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>KATEGORİ</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((name) => {
              const selected = name === category;
              return (
                <Pressable
                  key={name}
                  onPress={() => setCategory(name)}
                  style={[styles.chip, selected && styles.chipSelected]}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>RENGİ</Text>
          <ColorPicker
            value={color}
            onChange={handleColorChange}
            note={
              guessedColor && color === guessedColor
                ? `Fotoğraftan tahmin ettim: ${guessedColor}. Doğru mu? 🎨`
                : null
            }
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>FİYATI (₺)</Text>
          <TextInput
            value={priceText}
            onChangeText={setPriceText}
            placeholder="Örn: 1500"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>HEDEF GİYİLME SAYISI</Text>
          <TextInput
            value={targetText}
            onChangeText={setTargetText}
            placeholder={`${DEFAULT_TARGET_WEARS} (#30wears)`}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            keyboardType="number-pad"
          />
          <Text style={styles.hint}>
            Bu kadar giyince parça kendini amorti etmiş sayılır. Boş bırakırsan 30.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSave}
          disabled={!isValid}
          style={({ pressed }) => [
            styles.button,
            !isValid && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}>
          <Text style={styles.buttonText}>{editing ? 'Kaydet 💖' : 'Dolabıma ekle 💖'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
  },
  pressed: {
    opacity: 0.8,
  },
  photoBox: {
    alignSelf: 'center',
    width: 180,
    aspectRatio: 3 / 4,
    borderRadius: Radius.xl,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  photoText: {
    ...Typography.bodyBold,
    color: colors.primary,
  },
  changePhoto: {
    ...Typography.bodyBold,
    color: colors.primary,
    textAlign: 'center',
    marginTop: -Spacing.two,
  },
  field: {
    gap: Spacing.two,
  },
  label: {
    ...Typography.label,
    color: colors.textSecondary,
  },
  input: {
    ...Typography.body,
    color: colors.text,
    backgroundColor: colors.card,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  hint: {
    ...Typography.caption,
    color: colors.textMuted,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    backgroundColor: colors.card,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...Typography.bodyBold,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.onPrimary,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.three,
    ...Shadows.button,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    ...Typography.heading,
    color: colors.onPrimary,
    textAlign: 'center',
  },
});
