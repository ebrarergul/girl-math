/**
 * "HANGİ PARÇAYLA BAŞLAYALIM?" PENCERESİ
 *
 * Kombinlerim'deki "+" ile alttan açılır: dolabın 4 sütunlu küçük fotoğraf ızgarası (3:4,
 * `ClothingPhoto`) ve altında adları. Bir parçaya dokununca `onSelect` çağrılır (Kombinlerim onu
 * "Bununla ne giyerim?" sayfasında açar). Karartmaya dokununca kapanır.
 * Aynı kalıp: `place-sheet.tsx`, `color-picker.tsx` içindeki `PaletteSheet`.
 *
 * PieceTagSheet (26 Kasım): "Bu kombinde neler var?" – fotoğraflı kombinin parçalarını işaretlemek için
 * ÇOKLU seçim. Seçilen parçada pembe çerçeve + ✓; altta "Şimdilik geç" (parçasız kaydet) ve
 * "Kaydet · 3 parça". selectedIds ile önceden işaretli açılabilir (sonradan düzenleme).
 */

import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
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

type TagProps = {
  visible: boolean;
  items: ClothingItem[];
  selectedIds?: string[]; // Önceden işaretli parçalar (düzenlerken)
  skipLabel?: string; // Sol buton yazısı; varsayılan "Şimdilik geç"
  onDone: (itemIds: string[]) => void; // Seçilenler (boş olabilir: "Şimdilik geç")
  onClose: () => void; // Karartmaya dokununca: vazgeç
};

export function PieceTagSheet({
  visible,
  items,
  selectedIds = [],
  skipLabel = 'Şimdilik geç',
  onDone,
  onClose,
}: TagProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>(selectedIds);

  // Pencere her açılışta verilen seçimle başlar (React'in önerdiği "render sırasında ayarla" kalıbı)
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setSelected(selectedIds);
    }
  }

  function toggle(id: string) {
    Haptics.selectionAsync();
    setSelected((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id],
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Kapat" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.three }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Bu kombinde neler var?</Text>
        <Text style={styles.hint}>Fotoğraftaki parçalara dokun, giydiğinde maliyetleri düşsün</Text>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {items.map((item) => {
              const isOn = selected.includes(item.id);
              return (
                <View key={item.id} style={styles.cell}>
                  <Pressable
                    onPress={() => toggle(item.id)}
                    accessibilityLabel={`${item.name}${isOn ? ', seçili' : ''}`}
                    style={({ pressed }) => [styles.piece, pressed && styles.piecePressed]}>
                    <View style={[styles.tagFrame, isOn && styles.tagFrameOn]}>
                      <ClothingPhoto item={item} style={styles.photo} />
                      {isOn && (
                        <View style={styles.tagCheck}>
                          <SymbolView
                            name="checkmark"
                            tintColor={colors.onPrimary}
                            size={11}
                            weight="bold"
                          />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.name, isOn && styles.nameOn]} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Pressable onPress={() => onDone([])} hitSlop={8} style={styles.skip}>
            <Text style={styles.skipText}>{skipLabel}</Text>
          </Pressable>
          <Pressable
            onPress={() => onDone(selected)}
            disabled={selected.length === 0}
            style={({ pressed }) => [
              styles.doneButton,
              selected.length === 0 && styles.doneDisabled,
              pressed && styles.donePressed,
            ]}>
            <Text style={styles.doneText}>
              {selected.length === 0 ? 'Parça seç' : `Kaydet · ${selected.length} parça`}
            </Text>
          </Pressable>
        </View>
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
  // PieceTagSheet: seçili parçada pembe çerçeve + köşede ✓
  tagFrame: {
    borderRadius: Radius.sm + 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tagFrameOn: {
    borderColor: colors.primary,
  },
  tagCheck: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    width: 20,
    height: 20,
    borderRadius: Radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameOn: {
    color: colors.primary,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.three,
  },
  skip: {
    paddingHorizontal: Spacing.two,
  },
  skipText: {
    ...Typography.bodyBold,
    color: colors.textMuted,
  },
  doneButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  doneDisabled: {
    opacity: 0.4,
  },
  donePressed: {
    backgroundColor: colors.primaryPressed,
  },
  doneText: {
    ...Typography.button,
    color: colors.onPrimary,
  },
});
