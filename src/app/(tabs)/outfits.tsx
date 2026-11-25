/**
 * KOMBİNLERİM (kombin arşivi) – alttaki "Kombinler" SEKMESİ
 *
 * 26 Kasım: ayrı sekme oldu (eskiden Dolap'taki ⊞ butonunun arkasındaydı; adres yine /outfits).
 * Üstte Dolap'la aynı başlık: küçük "GIRL MATH", büyük "Kombinlerim", altında "3 kombin · 1 favori",
 * sağda pembe "+" (ilk açılışta tanıtım oku 'outfits-add').
 * Kaydedilen kombinler (Onur'un arşivi: outfits, sortOutfits).
 * - Üstte "Favoriler", altında "Tüm kombinler"; 2 sütun.
 * - Beyaz kart yok (Dolap gibi mağaza vitrini): parçaların 2×2 fotoğraf mozaiği tek blok
 *   (4'ten fazlaysa son kutuda "+2"), altında zeminde kombinin adı ve kaç kere giyildiği.
 * - Sağ üstteki yıldız favorilere ekler/çıkarır (favoride neon pembe dolgulu ★).
 * Karta dokununca kombinin sayfası (saved-outfit/[id]) açılır.
 * Sağ üstteki "+" iki yol sunar (26 Kasım):
 * - "Fotoğraftan ekle": galeriden ayna/OOTD fotoğrafı (3:4) → "Bu kombinde neler var?" (PieceTagSheet, çoklu
 *   seçim, isteğe bağlı) → parça seçildiyse "Bugün mü giydin?" → saveOutfit(parçalar, null, fotoğraf, bugün?) →
 *   kombinin sayfası. Karartmaya dokunup
 *   vazgeçerse fotoğraf silinir.
 * - "Parçalardan kur": "Hangi parçayla başlayalım?" (PiecePickerSheet) → "Bununla ne giyerim?".
 * Arşiv boşken aynı iki yol iki buton olarak. Fotoğraflı kombinin kartında mozaik yerine kendi fotoğrafı.
 * Dolap boşsa "Parçalardan kur" ekleme formunu açar; fotoğraftan ekleme dolap boşken de çalışır.
 */

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoachMark, useCoachMarks } from '@/components/coach-mark';
import { PiecePickerSheet, PieceTagSheet } from '@/components/piece-picker-sheet';
import { ScreenBackground } from '@/components/screen-background';
import { BottomTabInset, Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { outfitItems, outfitName, sortOutfits } from '@/lib/outfits';
import { deletePhoto, pickAndSavePhoto, photoUri } from '@/lib/photos';
import type { ClothingItem, SavedOutfit } from '@/lib/types';

const colors = Colors.light;

const COLUMN_GAP = Spacing.three;
// 2×2 mozaikte kutular arası ince çizgi
const CELL_GAP = 2;

export default function OutfitsScreen() {
  const router = useRouter();
  const { items, outfits, toggleFavoriteOutfit, saveOutfit } = useApp();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - Spacing.four * 2 - COLUMN_GAP) / 2;
  const [pickerOpen, setPickerOpen] = useState(false);
  // Tanıtım oku: "+" ile fotoğraftan ya da parçalardan yeni kombin
  const coach = useCoachMarks(['outfits-add']);
  // Fotoğraftan eklerken seçilen (henüz kaydedilmemiş) fotoğraf; parça işaretleme penceresi açıkken dolu
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);

  // "+": iki yol sor (iPhone'un kendi seçim menüsü)
  function chooseNewOutfit() {
    const options = ['Fotoğraftan ekle', 'Parçalardan kur', 'Vazgeç'];
    const handle = (index: number) => {
      if (index === 0) startPhotoOutfit();
      if (index === 1) startNewOutfit();
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: 'Yeni kombin', options, cancelButtonIndex: 2 },
        handle,
      );
    } else {
      Alert.alert('Yeni kombin', undefined, [
        { text: options[0], onPress: () => handle(0) },
        { text: options[1], onPress: () => handle(1) },
        { text: options[2], style: 'cancel' },
      ]);
    }
  }

  // Parçalardan: önce parça seçtir; dolap boşsa seçilecek parça yok, ekleme formuna git
  function startNewOutfit() {
    if (items.length === 0) {
      router.push('/add-item');
      return;
    }
    setPickerOpen(true);
  }

  // Fotoğraftan: fotoğraf seç (3:4 kırp) → parçaları işaretlet (dolap boşsa doğrudan kaydet)
  async function startPhotoOutfit() {
    const fileName = await pickAndSavePhoto();
    if (!fileName) {
      return;
    }
    if (items.length === 0) {
      finishPhotoOutfit(fileName, []);
      return;
    }
    setPendingPhoto(fileName);
  }

  // Parçalar işaretlendiyse "bugün mü giydin?" diye sorar: evet → kaydet + bugün giyildi say (maliyetler düşer).
  // (26 Kasım: Ana sayfadaki "Fotoğrafla" kutusu kalkınca bu iş buraya geldi)
  function finishPhotoOutfit(fileName: string, itemIds: string[]) {
    setPendingPhoto(null);
    const save = (wearToday: boolean) => {
      const id = saveOutfit(itemIds, null, fileName, wearToday);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({ pathname: '/saved-outfit/[id]', params: { id } });
    };
    if (itemIds.length === 0) {
      save(false);
      return;
    }
    Alert.alert('Bu kombini bugün mü giydin?', 'Evet dersen parçaların maliyeti hemen düşer 💸', [
      { text: 'Sadece kaydet', onPress: () => save(false) },
      { text: 'Evet, bugün giydim', style: 'default', onPress: () => save(true) },
    ]);
  }

  // Parça penceresi karartmaya dokunularak kapandı: vazgeçti, fotoğrafı sil
  function cancelPhotoOutfit() {
    deletePhoto(pendingPhoto);
    setPendingPhoto(null);
  }

  function handlePickPiece(item: ClothingItem) {
    setPickerOpen(false);
    router.push({ pathname: '/outfit/[id]', params: { id: item.id } });
  }

  const sorted = sortOutfits(outfits);
  const favorites = sorted.filter((outfit) => outfit.favorite);
  const others = sorted.filter((outfit) => !outfit.favorite);

  function handleFavorite(outfit: SavedOutfit) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavoriteOutfit(outfit.id);
  }

  // Bir grup kombini 2 sütunlu ızgara olarak çizer
  function renderGrid(list: SavedOutfit[]) {
    return (
      <View style={styles.grid}>
        {list.map((outfit) => (
          <OutfitCard
            key={outfit.id}
            outfit={outfit}
            pieces={outfitItems(outfit, items)}
            name={outfitName(outfit, items)}
            width={cardWidth}
            onFavorite={() => handleFavorite(outfit)}
            onPress={() =>
              router.push({ pathname: '/saved-outfit/[id]', params: { id: outfit.id } })
            }
          />
        ))}
      </View>
    );
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Başlık: Dolap sekmesiyle aynı düzen */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.label}>GIRL MATH</Text>
              <Text style={styles.title}>Kombinlerim</Text>
              {outfits.length > 0 && (
                <Text style={styles.summary}>
                  {[
                    `${outfits.length} kombin`,
                    favorites.length > 0 ? `${favorites.length} favori` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              )}
            </View>
            <CoachMark
              visible={coach.active === 'outfits-add'}
              text="Günün kombinini fotoğrafla ekle ya da parçalardan kur"
              placement="below"
              align="right"
              arrowOffset={22}
              onDismiss={() => coach.done('outfits-add')}>
              <Pressable
                onPress={() => {
                  coach.done('outfits-add');
                  chooseNewOutfit();
                }}
                accessibilityLabel="Yeni kombin"
                style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
                <SymbolView name="plus" tintColor={colors.onPrimary} size={22} weight="bold" />
              </Pressable>
            </CoachMark>
          </View>

          {outfits.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <SymbolView
                  name={{ ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' }}
                  tintColor={colors.primary}
                  size={32}
                  weight="light"
                />
              </View>
              <Text style={styles.emptyTitle}>Henüz kaydettiğin kombin yok</Text>
              <Text style={styles.emptyText}>
                Günün kombininin fotoğrafını ekle ya da bir parça seç, etrafında kombin kuralım.
              </Text>
              <Pressable
                onPress={startPhotoOutfit}
                style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}>
                <Text style={styles.emptyButtonText}>Fotoğraftan ekle</Text>
              </Pressable>
              <Pressable onPress={startNewOutfit} hitSlop={8} style={styles.secondaryLink}>
                <Text style={styles.secondaryLinkText}>Parçalardan kur</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {favorites.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Favoriler</Text>
                  {renderGrid(favorites)}
                </View>
              )}
              {others.length > 0 && (
                <View style={styles.section}>
                  {favorites.length > 0 && <Text style={styles.sectionTitle}>Tüm kombinler</Text>}
                  {renderGrid(others)}
                </View>
              )}
            </>
          )}
        </ScrollView>

        <PiecePickerSheet
          visible={pickerOpen}
          items={items}
          onSelect={handlePickPiece}
          onClose={() => setPickerOpen(false)}
        />
        <PieceTagSheet
          visible={pendingPhoto !== null}
          items={items}
          onDone={(itemIds) => pendingPhoto && finishPhotoOutfit(pendingPhoto, itemIds)}
          onClose={cancelPhotoOutfit}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

// Arşivdeki tek kombin kartı: 2×2 fotoğraf ızgarası, ad, giyim sayısı, köşede yıldız
function OutfitCard({
  outfit,
  pieces,
  name,
  width,
  onFavorite,
  onPress,
}: {
  outfit: SavedOutfit;
  pieces: ClothingItem[];
  name: string;
  width: number;
  onFavorite: () => void;
  onPress: () => void;
}) {
  // İlk 4 kutu; 4'ten fazla parça varsa son kutuda kalan sayı yazar ('extra')
  const extra = pieces.length > 4 ? pieces.length - 3 : 0;
  const shown: (ClothingItem | 'extra')[] =
    extra > 0 ? [...pieces.slice(0, 3), 'extra'] : pieces.slice(0, 4);
  // Boş kutu kalmasın diye parça sayısına göre sütunlar (26 Kasım: 3 parçada beyaz boş kare vardı):
  // 1 → tek büyük, 2 → yan yana iki uzun, 3 → solda uzun + sağda iki küçük, 4 → 2×2
  const columns =
    shown.length <= 1
      ? [shown]
      : shown.length === 2
        ? [[shown[0]], [shown[1]]]
        : shown.length === 3
          ? [[shown[0]], [shown[1], shown[2]]]
          : [
              [shown[0], shown[2]],
              [shown[1], shown[3]],
            ];
  const worn = outfit.wornDates.length;
  // Mozaikte kutular arası ince çizgi (CELL_GAP) kadar pay bırakılır; mozaik hep 2×2'lik 3:4 boyunda
  const cellWidth = (width - CELL_GAP) / 2;
  const mosaicHeight = ((cellWidth * 4) / 3) * 2 + CELL_GAP;
  const outfitPhoto = photoUri(outfit.photoFileName ?? null);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.cardPressed]}>
      {/* Gölge dışta, köşe kırpma içte (ikisi aynı kutuda olunca gölge kayboluyor) */}
      <View style={styles.mosaicShadow}>
        {outfitPhoto ? (
          // Fotoğraflı kombin: mozaik yerine kendi fotoğrafı (aynı boyda)
          <View style={[styles.cellGrid, { height: mosaicHeight }]}>
            <Image source={{ uri: outfitPhoto }} style={styles.cellImage} contentFit="cover" />
          </View>
        ) : (
          <View style={[styles.cellGrid, { height: mosaicHeight }]}>
            {columns.map((column, columnIndex) => (
              <View
                key={columnIndex}
                style={[styles.column, { width: columns.length === 1 ? width : cellWidth }]}>
                {column.map((piece, index) => {
                  const uri = piece !== 'extra' ? photoUri(piece.photoFileName) : undefined;
                  return (
                    <View key={index} style={styles.cell}>
                      {piece === 'extra' ? (
                        <Text style={styles.extraText}>+{extra}</Text>
                      ) : uri ? (
                        <Image source={{ uri }} style={styles.cellImage} contentFit="cover" />
                      ) : (
                        <SymbolView
                          name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
                          tintColor={colors.primary}
                          size={18}
                          weight="light"
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.cardNote}>
          {pieces.length === 0
            ? 'Parçalar işaretlenmedi'
            : `${pieces.length} parça · ${worn > 0 ? `${worn} kere giydin` : 'henüz giyilmedi'}`}
        </Text>
      </View>

      <Pressable
        onPress={onFavorite}
        hitSlop={8}
        accessibilityLabel={outfit.favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        style={({ pressed }) => [styles.star, pressed && styles.starPressed]}>
        <SymbolView
          name={outfit.favorite ? 'star.fill' : 'star'}
          tintColor={outfit.favorite ? colors.highlight : colors.textMuted}
          size={15}
          weight="semibold"
        />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  // Başlık (Dolap'la aynı)
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: Spacing.four,
    zIndex: 20, // "+" ok balonu aşağıdaki kartların üstünde kalsın
  },
  headerText: {
    flex: 1,
    gap: Spacing.one,
  },
  label: {
    ...Typography.label,
    color: colors.primary,
  },
  title: {
    ...Typography.title,
    color: colors.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  addButtonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.95 }],
  },
  section: {
    gap: Spacing.three,
  },
  summary: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COLUMN_GAP,
  },
  card: {
    gap: Spacing.two,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  mosaicShadow: {
    borderRadius: Radius.md,
    backgroundColor: colors.card,
    ...Shadows.card,
  },
  // 2×2 fotoğraf mozaiği (her kutu 3:4); aradaki ince çizgiler zemin rengi
  cellGrid: {
    flexDirection: 'row',
    gap: CELL_GAP,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  // Fotoğrafsız/boş kutu: beyaz zeminde pembe askı (Dolap'la aynı)
  column: {
    gap: CELL_GAP,
  },
  cell: {
    flex: 1,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cellImage: {
    width: '100%',
    height: '100%',
  },
  extraText: {
    ...Typography.heading,
    color: colors.primary,
  },
  cardBody: {
    paddingHorizontal: Spacing.half,
    gap: Spacing.half,
  },
  cardName: {
    ...Typography.body,
    color: colors.text,
  },
  cardNote: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  // Sağ üstte beyaz daire içinde yıldız
  star: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  starPressed: {
    transform: [{ scale: 0.9 }],
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.six,
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
  emptyButton: {
    marginTop: Spacing.three,
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    ...Shadows.button,
  },
  emptyButtonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.95 }],
  },
  emptyButtonText: {
    ...Typography.button,
    color: colors.onPrimary,
  },
  secondaryLink: {
    paddingTop: Spacing.three,
  },
  secondaryLinkText: {
    ...Typography.bodyBold,
    color: colors.primary,
  },
});
