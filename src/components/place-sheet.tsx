/**
 * "NEREYE GİDİYORSUN?" PENCERESİ
 *
 * "Giydim"e basınca alttan açılan küçük pencere: Onur'un PLACES listesindeki yerler 3'erli
 * haplar halinde (emoji + ad), en altta soluk "Geç" (yer seçmeden giy). Seçince hafif titreşim
 * ve pencere kapanır. Arkadaki karartmaya dokununca vazgeçilir (giyilmez).
 *
 * item verilirse yer seçilince Onur'un repeatWarning'i bakılır: son 14 günde aynı parçayla aynı
 * yere gidildiyse pencerede uyarı çıkar (soft: açık pembe "💭 Hatırlatma", strong: turuncu
 * şeritli "🚨"), altında "Bunun yerine" (freshAlternatives; dokununca o parça giyilir) ve
 * [Yine de giy] / [Vazgeç]. Önerilecek parça yoksa nazik bir not + "Bununla yeni kombin kur →"
 * (tek parçası olan da olabilir, dolabını eklememiş olan da; suçlamadan yeni kombin önerilir).
 *
 * Kullanımı:
 *   <PlaceSheet visible={open} item={item} items={items}
 *     onSelect={(place) => ...}                  // null = "Geç" (yer yok)
 *     onWearInstead={(other, place) => ...}      // "Bunun yerine" parçası seçildi
 *     onNewOutfit={() => ...}                    // "Bununla yeni kombin kur →"
 *     onClose={() => setOpen(false)} />
 */

import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClothingPhoto } from '@/components/outfit-collage';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import {
  PLACES,
  freshAlternatives,
  placeLabel,
  repeatWarning,
  type PlaceName,
  type RepeatWarning,
} from '@/lib/places';
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

type Props = {
  visible: boolean;
  title?: string;
  item?: ClothingItem; // Verilirse tekrar uyarısı yapılır
  items?: ClothingItem[]; // "Bunun yerine" önerileri için dolap
  onSelect: (place: PlaceName | null) => void;
  onWearInstead?: (other: ClothingItem, place: PlaceName) => void;
  onNewOutfit?: () => void;
  onClose: () => void;
};

export function PlaceSheet({
  visible,
  title = 'Nereye gidiyorsun?',
  item,
  items = [],
  onSelect,
  onWearInstead,
  onNewOutfit,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  // Uyarı gösteriliyorsa hangi yer ve uyarı; null = yer seçme görünümü
  const [pending, setPending] = useState<{ place: PlaceName; warning: RepeatWarning } | null>(null);

  function close() {
    setPending(null);
    onClose();
  }

  function finish(place: PlaceName | null) {
    setPending(null);
    onSelect(place);
  }

  function choose(place: PlaceName | null) {
    Haptics.selectionAsync();
    const warning = item && place ? repeatWarning(item, place) : null;
    if (!warning || !place) {
      finish(place);
      return;
    }
    // Uyarı: soft'ta tek hafif, strong'da iki kısa titreşim
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (warning.level === 'strong') {
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 150);
    }
    setPending({ place, warning });
  }

  function wearInstead(other: ClothingItem) {
    if (!pending) {
      return;
    }
    const place = pending.place;
    setPending(null);
    onWearInstead?.(other, place);
  }

  const alternatives = item && pending ? freshAlternatives(item, pending.place, items) : [];
  const strong = pending?.warning.level === 'strong';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        {/* Karartmaya dokununca vazgeç */}
        <Pressable style={styles.dismissArea} onPress={close} accessibilityLabel="Vazgeç" />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.three }]}>
          <View style={styles.handle} />
          {pending ? (
            <>
              {/* Tekrar uyarısı */}
              <View style={[styles.warning, strong && styles.warningStrong]}>
                {strong && <View style={styles.warningStripe} />}
                <Text style={styles.warningTitle}>
                  {strong ? '🚨 Aynı insanlar görüyor' : '💭 Hatırlatma'}
                </Text>
                <Text style={styles.warningText}>{pending.warning.message}</Text>
              </View>

              {/* Önerilecek parça yoksa: suçlamadan, yeni kombin öner */}
              {item && alternatives.length === 0 && (
                <View style={styles.noAlternative}>
                  <Text style={styles.noAlternativeText}>
                    {`${placeLabel(pending.place)} için taze bir ${item.category.toLocaleLowerCase('tr')} bulamadım. Dolabını ekledikçe öneri getiririm 💕 Şimdilik aynı parçayı yeni bir kombinle giymek de çok şık ✨`}
                  </Text>
                  {onNewOutfit && (
                    <Pressable
                      onPress={() => {
                        setPending(null);
                        onNewOutfit();
                      }}
                      hitSlop={8}>
                      <Text style={styles.noAlternativeLink}>Bununla yeni kombin kur →</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {alternatives.length > 0 && (
                <View style={styles.instead}>
                  <Text style={styles.insteadTitle}>
                    {`Bunun yerine (${placeLabel(pending.place)} için taze)`}
                  </Text>
                  <View style={styles.insteadRow}>
                    {alternatives.map((other) => (
                      <Pressable
                        key={other.id}
                        onPress={() => wearInstead(other)}
                        style={({ pressed }) => [
                          styles.insteadChip,
                          pressed && styles.chipPressed,
                        ]}>
                        <ClothingPhoto item={other} style={styles.insteadPhoto} />
                        <Text style={styles.insteadName} numberOfLines={1}>
                          {other.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.actions}>
                <Pressable
                  onPress={() => finish(pending.place)}
                  style={({ pressed }) => [styles.anywayButton, pressed && styles.anywayPressed]}>
                  <Text style={styles.anywayText}>Yine de giy</Text>
                </Pressable>
                <Pressable
                  onPress={close}
                  style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelPressed]}>
                  <Text style={styles.cancelText}>Vazgeç</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>
                Seçersen aynı yerde tekrar giymeden önce hatırlatırım 👀
              </Text>

              <View style={styles.grid}>
                {PLACES.map((place) => (
                  <Pressable
                    key={place.name}
                    onPress={() => choose(place.name)}
                    style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
                    <Text style={styles.chipEmoji}>{place.emoji}</Text>
                    <Text style={styles.chipText}>{place.name}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable onPress={() => choose(null)} hitSlop={8} style={styles.skip}>
                <Text style={styles.skipText}>Geç, sadece giydim</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  // Üstteki küçük tutma çizgisi (iPhone pencerelerindeki gibi)
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: Radius.pill,
    backgroundColor: colors.border,
  },
  title: {
    ...Typography.title,
    color: colors.text,
  },
  subtitle: {
    ...Typography.body,
    color: colors.textSecondary,
    marginTop: -Spacing.two,
  },
  // 3'erli satırlar
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    width: '31.6%',
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.three,
    borderRadius: Radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  chipPressed: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    transform: [{ scale: 0.96 }],
  },
  chipEmoji: {
    fontSize: 24,
    lineHeight: 30,
  },
  chipText: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  // Uyarı balonu: soft = açık pembe, strong = beyaz kart + üstte turuncu şerit
  warning: {
    backgroundColor: colors.primarySoft,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
    overflow: 'hidden',
  },
  warningStrong: {
    backgroundColor: colors.card,
    paddingTop: Spacing.three + 4,
    ...Shadows.card,
  },
  warningStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.warning,
  },
  warningTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  warningText: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  noAlternative: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  noAlternativeText: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  noAlternativeLink: {
    ...Typography.bodyBold,
    color: colors.primary,
  },
  instead: {
    gap: Spacing.two,
  },
  insteadTitle: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  insteadRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  // Küçük fotoğraflı hap: dokununca o parça giyilir
  insteadChip: {
    flex: 1,
    maxWidth: '32%',
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.two,
    borderRadius: Radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  insteadPhoto: {
    width: 56,
    borderRadius: Radius.sm,
  },
  insteadName: {
    ...Typography.caption,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  anywayButton: {
    flex: 1,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anywayPressed: {
    backgroundColor: colors.primarySoft,
  },
  anywayText: {
    ...Typography.bodyBold,
    color: colors.textSecondary,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  cancelPressed: {
    backgroundColor: colors.primaryPressed,
  },
  cancelText: {
    ...Typography.button,
    color: colors.onPrimary,
  },
  skip: {
    alignSelf: 'center',
    paddingVertical: Spacing.one,
  },
  skipText: {
    ...Typography.bodyBold,
    color: colors.textMuted,
  },
});
