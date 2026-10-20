/**
 * "SENİN İÇİN" SATIRLARI (Ana sayfa)
 *
 * iPhone Ayarları gibi tek beyaz kart (TodayGroup) içinde alt alta satırlar (TodayRow):
 * solda simge dairesi, ortada başlık + açıklama, sağda ok (ya da verilen başka bir şey).
 * Etkinlik geri sayımı, burç ve Dolap Kahoot'u bunu kullanır; böylece üçü aynı görünür.
 * Satırlar kendiliğinden gizlenebildiği için (ör. hafta içi Kahoot yok) ince çizgi her satırın
 * üstündedir; kart ilk satırın çizgisini 1 piksel yukarı kaydırıp gizler.
 */

import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

const colors = Colors.light;

export function TodayGroup({ children }: { children: ReactNode }) {
  return (
    <View style={styles.group}>
      <View style={styles.groupInner}>{children}</View>
    </View>
  );
}

export function TodayRow({
  icon,
  title,
  detail,
  right,
  onPress,
  accessibilityLabel,
}: {
  icon: ReactNode; // Genelde <IconCircle>; burçta gümüş madalyon
  title: string;
  detail: ReactNode; // Yazı ya da (şanslı renk gibi) küçük bir satır
  right?: ReactNode; // Verilmezse ince ok
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      {icon}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {typeof detail === 'string' ? (
          <Text style={styles.detail} numberOfLines={1}>
            {detail}
          </Text>
        ) : (
          detail
        )}
      </View>
      {right ?? <SymbolView name="chevron.right" tintColor={colors.textMuted} size={13} />}
    </Pressable>
  );
}

// Açık pembe daire içinde ince pembe simge (satırların solundaki standart simge)
export function IconCircle({ children }: { children: ReactNode }) {
  return <View style={styles.iconCircle}>{children}</View>;
}

// Satırın açıklama yazı stili (detail'i kendisi çizen satırlar için)
export const todayDetailStyle = {
  ...Typography.caption,
  color: colors.textSecondary,
};

export const ICON_SIZE = 36;

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.card,
  },
  // İlk satırın üst çizgisi kartın dışına kayar, görünmez
  groupInner: {
    marginTop: -StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.backgroundElement,
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: Radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  detail: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
});
