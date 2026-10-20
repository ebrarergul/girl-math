/**
 * UTANÇ DUVARI 👀
 *
 * Unutulan bütün parçalar: hiç giyilmeyenler ve FORGOTTEN_DAYS+ gündür giyilmeyenler,
 * en çok zarar yazandan aza doğru. En üstte toplam boşa giden para ve Girl Math kıyası.
 * Ana sayfadaki "Utanç Duvarı →" bağlantısıyla ve Cüzdan'daki "Utanç Duvarı" satırıyla açılır. Bir parçaya dokununca detayı açılır.
 */

import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatTL, lossText, shameWallItems } from '@/components/clothing-card';
import { Colors, Fonts, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { findComparison } from '@/lib/comparisons';
import { wearCount } from '@/lib/girl-math';
import { photoUri } from '@/lib/photos';

const colors = Colors.light;

export default function ShameWallScreen() {
  const router = useRouter();
  const { items } = useApp();
  const wall = shameWallItems(items);
  const totalLoss = wall.reduce((sum, entry) => sum + entry.loss, 0);
  const totalMatch = findComparison(totalLoss);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Utanç Duvarı',
          headerBackTitle: 'Geri',
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {wall.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💅</Text>
            <Text style={styles.emptyTitle}>Duvar bomboş!</Text>
            <Text style={styles.emptyText}>
              Dolabındaki her parça düzenli giyiliyor. Girl Math seninle gurur duyuyor.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>TOPLAM BOŞA GİDEN</Text>
              <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
                {totalLoss.toLocaleString('tr-TR')}
                <Text style={styles.summaryCurrency}> ₺</Text>
              </Text>
              <Text style={styles.summaryText}>
                {wall.length} parça askıda bekliyor
                {totalMatch ? ` · ≈ ${totalMatch.name} ${totalMatch.emoji}` : ''}
              </Text>
              <Text style={styles.summaryNote}>
                Ya bu hafta giy ya da satışa koy. Girl Math affetmez 👀
              </Text>
            </View>

            {wall.map(({ item, days }) => {
              const uri = photoUri(item.photoFileName);
              const neverWorn = wearCount(item) === 0;
              const loss = lossText(item.price, days);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                  <View style={styles.thumb}>
                    {uri ? (
                      <Image source={{ uri }} style={styles.thumbImage} contentFit="cover" />
                    ) : (
                      <SymbolView
                        name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
                        tintColor={colors.primary}
                        size={22}
                        weight="light"
                      />
                    )}
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {neverWorn ? 'Daha hiç giyilmedi' : `${days} gündür askıda`} ·{' '}
                      {formatTL(item.price)}
                    </Text>
                    {loss && <Text style={styles.rowLoss}>{loss}</Text>}
                  </View>
                  <SymbolView
                    name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                    tintColor={colors.textMuted}
                    size={14}
                  />
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>
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
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  summary: {
    backgroundColor: colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: colors.accent,
    padding: Spacing.four,
    gap: Spacing.one,
    marginBottom: Spacing.two,
    ...Shadows.card,
  },
  summaryLabel: {
    ...Typography.label,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...Typography.hero,
    fontSize: 44,
    lineHeight: 52,
    color: colors.primary,
  },
  summaryCurrency: {
    fontFamily: Fonts?.sans,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0,
  },
  summaryText: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  summaryNote: {
    ...Typography.body,
    color: colors.textSecondary,
    marginTop: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    ...Shadows.card,
  },
  rowPressed: {
    transform: [{ scale: 0.98 }],
  },
  thumb: {
    width: 56,
    aspectRatio: 3 / 4,
    borderRadius: Radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  rowBody: {
    flex: 1,
    gap: Spacing.half,
  },
  rowName: {
    ...Typography.heading,
    color: colors.text,
  },
  rowMeta: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  rowLoss: {
    ...Typography.caption,
    color: colors.primary,
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.six,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  emptyEmoji: {
    fontSize: 48,
    lineHeight: 56,
  },
  emptyTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  emptyText: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
