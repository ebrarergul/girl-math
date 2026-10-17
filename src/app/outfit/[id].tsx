/**
 * BUNUNLA NE GİYERİM? ✨ (kombin önerisi)
 *
 * Kıyafet detayındaki "Bununla ne giyerim?" satırıyla, kıyafetin kimliği (id) verilerek açılır.
 * Yukarıdan aşağı:
 * - Kombin kolajı: Onur'un motorunun (outfitFor) kurduğu kombin, hafif yamuk ve üst üste binen
 *   fotoğraf kartları halinde (dergi kolajı gibi). Seçilen parçada "Seçtiğin" etiketi.
 * - Kombin cümlesi ve varsa eksik kategori notu ("Dolabında uygun ayakkabı yok 👀").
 * - Başka seçenekler: her kategoriden uyan parçalar (matchesFor), altlarında uyum sebebi.
 *   Rengi girilmemiş parçada sebep yerine "Rengi girilmemiş · Ekle 🎨" hapı (düzenlemeyi açar).
 *   Seçeneğe dokununca kombine girer (aynı kategoridekinin yerine), kombindekine dokununca çıkar.
 *   Elbise seçilince üst/alt, üst ya da alt seçilince elbise çıkar. "Öneriye dön ↺" sıfırlar.
 * - Altta "Kombini kaydet 💾": isteğe bağlı ad sorar, Onur'un arşivine (saveOutfit) kaydeder.
 *   Aynı parçalardan kombin zaten kayıtlıysa buton "Arşivde ✓" olur.
 * Seçilen parçanın rengi yoksa kombin kartında renk seçmeye çağıran bir satır çıkar.
 * Dolapta kombin kuracak kadar parça yoksa ekleme butonu gösterilir.
 */

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ColorSwatch } from '@/components/color-picker';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { matchesFor, outfitFor } from '@/lib/outfits';
import { photoUri } from '@/lib/photos';
import type { Category, ClothingItem } from '@/lib/types';

const colors = Colors.light;

// Kolajdaki kartlar sırayla hafif sağa/sola yatık durur (dergi kolajı havası)
const TILTS = ['-4deg', '3deg', '-2deg', '4deg', '-3deg', '2deg'];
// Kartlar birbirinin üstüne genişliklerinin bu kadarı binerek dizilir
const OVERLAP = 0.25;

export default function OutfitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, outfits, saveOutfit } = useApp();
  const { width: screenWidth } = useWindowDimensions();
  // Kullanıcının değiştirdikleri: kategori → parça kimliği (null = o kategoriyi çıkar).
  // Boşsa motorun önerisi aynen gösterilir.
  const [changes, setChanges] = useState<Partial<Record<Category, string | null>>>({});

  const base = items.find((item) => item.id === id);

  const headerOptions = {
    title: 'Bununla ne giyerim?',
    headerBackTitle: 'Geri',
    headerTintColor: colors.primary,
    headerTitleStyle: { color: colors.text },
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
  };

  if (!base) {
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <Stack.Screen options={headerOptions} />
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Bu parça bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  const outfit = outfitFor(base, items);
  const options = matchesFor(base, items);
  const hasOptions = options.length > 0;

  // Gösterilen kombin = motorun önerisi + kullanıcının değişiklikleri (kategori başına bir parça)
  const byCategory = new Map<Category, ClothingItem>();
  for (const item of outfit.items.slice(1)) {
    byCategory.set(item.category, item);
  }
  for (const [category, itemId] of Object.entries(changes) as [Category, string | null][]) {
    const picked = itemId ? items.find((item) => item.id === itemId) : undefined;
    if (picked) {
      byCategory.set(category, picked);
    } else {
      byCategory.delete(category);
    }
  }
  const pieces = [base, ...byCategory.values()];
  const changed = Object.keys(changes).length > 0;
  const missing = outfit.missing.filter((category) => !byCategory.has(category));

  // Bu parçalardan oluşan kombin arşivde var mı? (sıra önemli değil)
  const piecesKey = pieces
    .map((item) => item.id)
    .sort()
    .join(',');
  const isSaved = outfits.some((saved) => [...saved.itemIds].sort().join(',') === piecesKey);

  function save(name: string | null) {
    saveOutfit(
      pieces.map((item) => item.id),
      name,
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // iPhone'da ad sorar (isteğe bağlı); diğer platformlarda adsız kaydeder
  function handleSave() {
    if (Platform.OS !== 'ios') {
      save(null);
      return;
    }
    Alert.prompt(
      'Kombine bir ad ver',
      'Örn: Cuma akşamı 🍸 (istersen boş bırak)',
      [
        { text: 'Adsız kaydet', onPress: () => save(null) },
        { text: 'Kaydet', style: 'default', onPress: (text?: string) => save(text?.trim() || null) },
      ],
      'plain-text',
    );
  }

  // Seçeneğe dokununca: kombindeyse çıkar, değilse aynı kategoridekinin yerine geçer
  function togglePiece(item: ClothingItem) {
    Haptics.selectionAsync();
    const inOutfit = byCategory.get(item.category)?.id === item.id;
    const next: Partial<Record<Category, string | null>> = {
      ...changes,
      [item.category]: inOutfit ? null : item.id,
    };
    // Elbise ile üst/alt birlikte olmaz
    if (!inOutfit && item.category === 'Elbise') {
      next['Üst'] = null;
      next['Alt'] = null;
    }
    if (!inOutfit && (item.category === 'Üst' || item.category === 'Alt')) {
      next['Elbise'] = null;
    }
    setChanges(next);
  }

  // Rengi girilmemiş parçanın düzenleme formunu açar (renk oradan seçilir)
  function editColor(item: ClothingItem) {
    router.push({ pathname: '/add-item', params: { id: item.id } });
  }

  // Kolaj kartlarının genişliği: hepsi (üst üste binerek) ekrana sığacak kadar, en fazla 130
  const available = screenWidth - Spacing.four * 2;
  const count = pieces.length;
  const cardWidth = Math.min(130, available / (1 + (1 - OVERLAP) * (count - 1)));

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen options={headerOptions} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!hasOptions ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <SymbolView
                name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
                tintColor={colors.primary}
                size={34}
                weight="light"
              />
            </View>
            <Text style={styles.emptyTitle}>Kombin için parça lazım</Text>
            <Text style={styles.emptyText}>
              {`“${base.name}” ile eşleştirecek bir şey bulamadım. Dolabına birkaç parça daha ekle, gerisini bana bırak 💅`}
            </Text>
            <Pressable
              onPress={() => router.push('/add-item')}
              style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
              <Text style={styles.addButtonText}>Parça ekle</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Kombin kolajı */}
            <View style={styles.collage}>
              {pieces.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeIn.duration(250)}
                  style={[
                    styles.collageItem,
                    {
                      width: cardWidth,
                      marginLeft: index === 0 ? 0 : -cardWidth * OVERLAP,
                      transform: [{ rotate: TILTS[index % TILTS.length] }],
                      zIndex: count - index,
                    },
                  ]}>
                  <Photo item={item} style={styles.collagePhoto} />
                  {index === 0 && (
                    <View style={styles.baseTag}>
                      <Text style={styles.baseTagText}>Seçtiğin</Text>
                    </View>
                  )}
                </Animated.View>
              ))}
            </View>
            <Text style={styles.collageNames} numberOfLines={2}>
              {pieces.map((item) => item.name).join(' + ')}
            </Text>

            <View style={styles.textCard}>
              {/* Motorun cümlesi önerdiği kombine göre; kullanıcı değiştirdiyse ona övgü */}
              <Text style={styles.outfitText}>
                {changed ? 'Kendi kombinini kurdun, stil sahibi kadın 💅' : outfit.text}
              </Text>
              {missing.length > 0 && (
                <Text style={styles.missingText}>
                  {`Dolabında uygun ${missing
                    .map((category) => category.toLocaleLowerCase('tr'))
                    .join(' ve ')} yok 👀`}
                </Text>
              )}
              {!base.color && (
                <Pressable onPress={() => editColor(base)} hitSlop={8}>
                  <Text style={styles.colorPrompt}>
                    {`🎨 “${base.name}” için renk seçersen öneriler çok daha isabetli olur →`}
                  </Text>
                </Pressable>
              )}
            </View>
          </>
        )}

        {/* Başka seçenekler: kategori kategori uyan parçalar */}
        {options.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Başka seçenekler</Text>
              {changed && (
                <Pressable onPress={() => setChanges({})} hitSlop={8}>
                  <Text style={styles.resetText}>Öneriye dön ↺</Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.sectionHint}>Dokun, kombine ekle ya da çıkar</Text>
            {options.map((group) => (
              <View key={group.category} style={styles.group}>
                <Text style={styles.groupLabel}>{group.category.toLocaleUpperCase('tr')}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.optionScroll}
                  contentContainerStyle={styles.optionRow}>
                  {group.matches.map((match) => {
                    const inOutfit = byCategory.get(match.item.category)?.id === match.item.id;
                    return (
                      <View key={match.item.id} style={styles.option}>
                        <Pressable
                          onPress={() => togglePiece(match.item)}
                          accessibilityLabel={`${match.item.name}: ${inOutfit ? 'kombinden çıkar' : 'kombine ekle'}`}
                          style={({ pressed }) => pressed && styles.optionPressed}>
                          <Photo
                            item={match.item}
                            style={[styles.optionPhoto, inOutfit && styles.optionPhotoSelected]}
                          />
                          {inOutfit && (
                            <View style={styles.optionCheck}>
                              <SymbolView
                                name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                                tintColor={colors.onPrimary}
                                size={11}
                                weight="bold"
                              />
                            </View>
                          )}
                        </Pressable>
                        <Text style={styles.optionName} numberOfLines={1}>
                          {match.item.name}
                        </Text>
                        {!match.item.color ? (
                          // Bu parçanın rengi yok: sebep yerine renk eklemeye çağır
                          <Pressable
                            onPress={() => editColor(match.item)}
                            style={({ pressed }) => [
                              styles.reasonPill,
                              styles.addColorPill,
                              pressed && styles.pillPressed,
                            ]}>
                            <Text style={styles.reasonText}>Rengi girilmemiş · Ekle 🎨</Text>
                          </Pressable>
                        ) : (
                          // Önce bu parçanın kendi rengi (cümle kimin rengini anlatıyor karışmasın),
                          // sonra uyum sebebi. Seçilen parçanın rengi yoksa sebep anlamsız, yazılmaz.
                          <View style={styles.reasonPill}>
                            <View style={styles.colorRow}>
                              <ColorSwatch color={match.item.color} size={12} />
                              <Text style={styles.colorName}>{match.item.color}</Text>
                            </View>
                            {base.color && <Text style={styles.reasonText}>{match.reason}</Text>}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Kombin varsa (seçilen parça + en az bir parça) kaydetme butonu */}
      {pieces.length > 1 && (
        <View style={styles.footer}>
          <Pressable
            onPress={handleSave}
            disabled={isSaved}
            style={({ pressed }) => [
              styles.saveButton,
              isSaved && styles.saveButtonDone,
              pressed && styles.saveButtonPressed,
            ]}>
            <Text style={[styles.saveText, isSaved && styles.saveTextDone]}>
              {isSaved ? 'Arşivde ✓' : 'Kombini kaydet 💾'}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

// 3:4 kıyafet fotoğrafı; fotoğraf yoksa pembe zeminde askı simgesi
function Photo({ item, style }: { item: ClothingItem; style: StyleProp<ViewStyle> }) {
  const uri = photoUri(item.photoFileName);
  return (
    <View style={[styles.photo, style]}>
      {uri ? (
        <Image source={{ uri }} style={styles.photoImage} contentFit="cover" />
      ) : (
        <SymbolView
          name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
          tintColor={colors.primary}
          size={24}
          weight="light"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  photo: {
    aspectRatio: 3 / 4,
    borderRadius: Radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  // Kolaj: kartlar ortada, üst üste binerek
  collage: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  collageItem: {
    backgroundColor: colors.card,
    borderRadius: Radius.md + 4,
    padding: 4,
    ...Shadows.card,
  },
  collagePhoto: {
    width: '100%',
  },
  // Kartın içinde, sol üstte (dışarı taşınca yatık kartta kesiliyordu)
  baseTag: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  baseTagText: {
    ...Typography.caption,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  collageNames: {
    ...Typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: -Spacing.two,
  },
  textCard: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Shadows.card,
  },
  outfitText: {
    ...Typography.heading,
    color: colors.text,
  },
  missingText: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHint: {
    ...Typography.caption,
    color: colors.textMuted,
    marginTop: -Spacing.two,
  },
  resetText: {
    ...Typography.bodyBold,
    color: colors.primary,
  },
  optionPressed: {
    transform: [{ scale: 0.95 }],
  },
  sectionTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  group: {
    gap: Spacing.two,
  },
  groupLabel: {
    ...Typography.label,
    color: colors.textSecondary,
  },
  // Sıra ekranın iki kenarına kadar uzansın; ilk kart yine başlıkla aynı hizada başlar
  optionScroll: {
    marginHorizontal: -Spacing.four,
  },
  optionRow: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  option: {
    width: 136,
    gap: Spacing.one,
  },
  optionPhoto: {
    width: '100%',
    borderWidth: 2,
    borderColor: colors.card,
    ...Shadows.card,
  },
  optionPhotoSelected: {
    borderColor: colors.accent,
  },
  optionCheck: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    width: 20,
    height: 20,
    borderRadius: Radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionName: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  reasonPill: {
    gap: Spacing.half,
    backgroundColor: colors.primarySoft,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  addColorPill: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  colorName: {
    ...Typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  pillPressed: {
    opacity: 0.6,
  },
  colorPrompt: {
    ...Typography.bodyBold,
    color: colors.primary,
  },
  reasonText: {
    ...Typography.caption,
    color: colors.primary,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  saveButton: {
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  // Kaydedildiyse: beyaz zemin, pembe yazı (artık basılmaz)
  saveButtonDone: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.accent,
    shadowOpacity: 0,
  },
  saveButtonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  saveText: {
    ...Typography.heading,
    color: colors.onPrimary,
  },
  saveTextDone: {
    color: colors.primary,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.five,
    gap: Spacing.two,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    ...Typography.heading,
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  addButton: {
    marginTop: Spacing.three,
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    ...Shadows.button,
  },
  addButtonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.95 }],
  },
  addButtonText: {
    ...Typography.button,
    color: colors.onPrimary,
  },
});
