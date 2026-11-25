/**
 * "HANGİ PARÇAYLA BAŞLAYALIM?" PENCERESİ
 *
 * Kombinlerim'deki "+" ile alttan açılır: dolabın 4 sütunlu küçük fotoğraf ızgarası (3:4,
 * `ClothingPhoto`) ve altında adları. Bir parçaya dokununca `onSelect` çağrılır (Kombinlerim onu
 * "Bununla ne giyerim?" sayfasında açar). Karartmaya dokununca kapanır.
 * Aynı kalıp: `place-sheet.tsx`, `color-picker.tsx` içindeki `PaletteSheet`.
 */

import * as Haptics from 'expo-haptics';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClothingPhoto } from '@/components/outfit-collage';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

type Props = {
  visible: boolean;
  items: ClothingItem[];
  onSelect: (item: ClothingItem) => void;
  onClose: () => void;
};

export function PiecePickerSheet({ visible, items, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Kapat" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.three }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Hangi parçayla başlayalım?</Text>
        <Text style={styles.hint}>Seçtiğin parçanın etrafında kombin kuralım</Text>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {items.map((item) => (
              <View key={item.id} style={styles.cell}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    onSelect(item);
                  }}
                  accessibilityLabel={item.name}
                  style={({ pressed }) => [styles.piece, pressed && styles.piecePressed]}>
                  <ClothingPhoto item={item} style={styles.photo} />
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.one,
    maxHeight: '80%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: Radius.pill,
    backgroundColor: colors.border,
    marginBottom: Spacing.two,
  },
  title: {
    ...Typography.heading,
    color: colors.text,
  },
  hint: {
    ...Typography.caption,
    color: colors.textMuted,
    marginBottom: Spacing.two,
  },
  scroll: {
    flexGrow: 0,
  },
  // 4 eşit sütun: hücre %25, aradaki boşluk hücrelerin iç payından (kenarlar hizalı kalsın diye
  // ızgara o pay kadar dışarı taşırılır)
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.one,
    rowGap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  cell: {
    width: '25%',
    paddingHorizontal: Spacing.one,
  },
  piece: {
    gap: Spacing.one,
  },
  piecePressed: {
    opacity: 0.6,
  },
  photo: {
    width: '100%',
    borderRadius: Radius.sm,
  },
  name: {
    ...Typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
