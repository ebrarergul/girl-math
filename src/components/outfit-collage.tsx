/**
 * KOMBİN KOLAJI
 *
 * Kombinin parçalarını dergi kolajı gibi gösterir: beyaz çerçeveli 3:4 fotoğraf kartları, hafif
 * sağa/sola yatık ve birbirinin üstüne binerek; altında parçaların adları ("Bluz + Pantolon").
 * Kart genişliği, hepsi ekrana sığacak şekilde parça sayısına göre ayarlanır (en fazla 130).
 * "Bununla ne giyerim?" ve kayıtlı kombin sayfası kullanır.
 *
 * Ayrıca ClothingPhoto: 3:4 kıyafet fotoğrafı (fotoğraf yoksa pembe zeminde askı simgesi).
 */

import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import {
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { photoUri } from '@/lib/photos';
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

// Kolajdaki kartlar sırayla hafif sağa/sola yatık durur (dergi kolajı havası)
const TILTS = ['-4deg', '3deg', '-2deg', '4deg', '-3deg', '2deg'];
// Kartlar birbirinin üstüne genişliklerinin bu kadarı binerek dizilir
const OVERLAP = 0.25;
const MAX_CARD_WIDTH = 130;

type Props = {
  pieces: ClothingItem[];
  firstTag?: string; // İlk parçanın üstündeki pembe etiket (ör. "Seçtiğin")
};

export function OutfitCollage({ pieces, firstTag }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const available = screenWidth - Spacing.four * 2;
  const count = pieces.length;
  const cardWidth = Math.min(MAX_CARD_WIDTH, available / (1 + (1 - OVERLAP) * (count - 1)));

  return (
    <View style={styles.container}>
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
            <ClothingPhoto item={item} style={styles.collagePhoto} />
            {index === 0 && firstTag && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{firstTag}</Text>
              </View>
            )}
          </Animated.View>
        ))}
      </View>
      <Text style={styles.names} numberOfLines={2}>
        {pieces.map((item) => item.name).join(' + ')}
      </Text>
    </View>
  );
}

// 3:4 kıyafet fotoğrafı; fotoğraf yoksa pembe zeminde askı simgesi
export function ClothingPhoto({
  item,
  style,
}: {
  item: ClothingItem;
  style?: StyleProp<ViewStyle>;
}) {
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
  container: {
    gap: Spacing.two,
  },
  // Kartlar ortada, üst üste binerek
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
  tag: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  tagText: {
    ...Typography.caption,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  names: {
    ...Typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  photo: {
    aspectRatio: 3 / 4,
    borderRadius: Radius.md,
    backgroundColor: colors.card, // Fotoğrafsız parça: beyaz zeminde pembe askı (Dolap'la aynı)
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
});
