/**
 * KOMBİNLERİM (kombin arşivi)
 *
 * "Bununla ne giyerim?" ekranında kaydedilen kombinler (Onur'un arşivi: outfits, sortOutfits).
 * Dolap'taki "Kombinlerim" butonuyla açılır.
 * - Üstte "Favoriler", altında "Tüm kombinler"; 2 sütun.
 * - Beyaz kart yok (Dolap gibi mağaza vitrini): parçaların 2×2 fotoğraf mozaiği tek blok
 *   (4'ten fazlaysa son kutuda "+2"), altında zeminde kombinin adı ve kaç kere giyildiği.
 * - Sağ üstteki yıldız favorilere ekler/çıkarır (favoride neon pembe dolgulu ★).
 * Karta dokununca kombinin sayfası (saved-outfit/[id]) açılır.
 * Arşiv boşsa nasıl kombin kaydedileceği anlatılır.
 */

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { outfitItems, outfitName, sortOutfits } from '@/lib/outfits';
import { photoUri } from '@/lib/photos';
import type { ClothingItem, SavedOutfit } from '@/lib/types';

const colors = Colors.light;

const COLUMN_GAP = Spacing.three;
// 2×2 mozaikte kutular arası ince çizgi
const CELL_GAP = 2;

export default function OutfitsScreen() {
  const router = useRouter();
  const { items, outfits, toggleFavoriteOutfit } = useApp();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - Spacing.four * 2 - COLUMN_GAP) / 2;

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
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Kombinlerim',
          headerBackTitle: 'Dolap',
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
              {
                'Bir parçanın detayından "Bununla ne giyerim? ✨"e bas, beğendiğin kombini "Kombini kaydet 💾" ile buraya ekle.'
              }
            </Text>
          </View>
        ) : (
          <>
            {/* Kısa özet */}
            <Text style={styles.summary}>
              {[
                `${outfits.length} kombin`,
                favorites.length > 0 ? `${favorites.length} favori` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>

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

            {/* Yeni kombin nasıl eklenir */}
            <Text style={styles.tipText}>
              {
                'Yeni kombin için bir parçanın detayında "Bununla ne giyerim?"e bas, beğendiğini kaydet.'
              }
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
  // İlk 4 kutu; 4'ten fazla parça varsa son kutuda kalan sayı yazar
  const extra = pieces.length > 4 ? pieces.length - 3 : 0;
  const shown = extra > 0 ? pieces.slice(0, 3) : pieces.slice(0, 4);
  const cells: (ClothingItem | null)[] = [...shown];
  while (cells.length < 4) {
    cells.push(null);
  }
  const worn = outfit.wornDates.length;
  // Mozaikte kutular arası ince çizgi (CELL_GAP) kadar pay bırakılır
  const cellWidth = (width - CELL_GAP) / 2;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.cardPressed]}>
      {/* Gölge dışta, köşe kırpma içte (ikisi aynı kutuda olunca gölge kayboluyor) */}
      <View style={styles.mosaicShadow}>
        <View style={styles.cellGrid}>
          {cells.map((piece, index) => {
            const isExtra = extra > 0 && index === 3;
            const uri = piece ? photoUri(piece.photoFileName) : undefined;
            return (
              <View key={index} style={[styles.cell, { width: cellWidth }]}>
                {isExtra ? (
                  <Text style={styles.extraText}>+{extra}</Text>
                ) : uri ? (
                  <Image source={{ uri }} style={styles.cellImage} contentFit="cover" />
                ) : piece ? (
                  <SymbolView
                    name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
                    tintColor={colors.primary}
                    size={18}
                    weight="light"
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.cardNote}>
          {`${pieces.length} parça · ${worn > 0 ? `${worn} kere giydin` : 'henüz giyilmedi'}`}
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
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.three,
  },
  summary: {
    ...Typography.body,
    color: colors.textSecondary,
    marginBottom: -Spacing.two,
  },
  // En alttaki ipucu: kutu yok, soluk ortalı yazı
  tipText: {
    ...Typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
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
    flexWrap: 'wrap',
    gap: CELL_GAP,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  // Fotoğrafsız/boş kutu: beyaz zeminde pembe askı (Dolap'la aynı)
  cell: {
    aspectRatio: 3 / 4,
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
});
