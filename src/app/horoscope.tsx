/**
 * BURÇ YORUMU
 *
 * Ana sayfadaki burç şeridine dokununca açılır (Onur'un zodiac.ts'i: dailyHoroscope,
 * weeklyHoroscope, getSky). Yukarıdan aşağı:
 * - Gümüş (krom) kart: büyük burç sembolü, adı, tarih aralığı; Ay'ın burcu ve evresi (simgesiyle),
 *   Merkür retrosu varsa ya da yaklaşıyorsa küçük hap.
 * - "Bugün" / "Bu hafta" sekme hapları.
 * - Bugün: stil kişiliği (italik), gökyüzü cümleleri, 🍀 şanslı renk, dolaptan önerilen parça
 *   + "Kombini gör →" ("Bununla ne giyerim?" o parçayla açılır).
 * - Bu hafta: tarih aralığı, tek kartta AŞK / PARA / DOLAP bölümleri (Onur'un cümleleri zaten
 *   emojiyle başladığı için başlıklarda emoji yok, yoksa iki kere yazılıyordu).
 * Sağ üstte "Değiştir" burç seçimini açar. Burç seçilmemişse seçmeye çağıran bir mesaj çıkar.
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ColorSwatch } from '@/components/color-picker';
import { ClothingPhoto } from '@/components/outfit-collage';
import { MOON_SYMBOLS, mercuryNote, zodiacGlyph, zodiacRange } from '@/components/zodiac-grid';
import { Colors, Gradients, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { dailyHoroscope, getSky, weeklyHoroscope, zodiacSign } from '@/lib/zodiac';

const colors = Colors.light;

type Tab = 'today' | 'week';

export default function HoroscopeScreen() {
  const router = useRouter();
  const { zodiac, items } = useApp();
  const [tab, setTab] = useState<Tab>('today');

  const headerOptions = {
    title: '',
    headerBackTitle: 'Ana sayfa',
    headerTintColor: colors.primary,
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
    headerRight: () => (
      <Pressable onPress={() => router.push('/zodiac')} hitSlop={8}>
        <Text style={styles.changeText}>{zodiac ? 'Değiştir' : 'Seç'}</Text>
      </Pressable>
    ),
  };

  if (!zodiac) {
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <Stack.Screen options={headerOptions} />
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔮</Text>
          <Text style={styles.emptyTitle}>Burcunu seç, yıldızlar dolabına baksın</Text>
          <Pressable
            onPress={() => router.push('/zodiac')}
            style={({ pressed }) => [styles.chooseButton, pressed && styles.chooseButtonPressed]}>
            <Text style={styles.chooseButtonText}>Burcumu seç</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const sign = zodiacSign(zodiac);
  const sky = getSky();
  const daily = dailyHoroscope(zodiac, items);
  const weekly = weeklyHoroscope(zodiac);
  const mercury = mercuryNote(sky);

  function switchTab(next: Tab) {
    if (next !== tab) {
      Haptics.selectionAsync();
      setTab(next);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen options={headerOptions} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Gümüş kart: burç + gökyüzü */}
        <LinearGradient
          colors={Gradients.chrome}
          locations={[0, 0.35, 0.7, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.glyph}>{zodiacGlyph(sign.emoji)}</Text>
            <View style={styles.heroText}>
              <Text style={styles.signName}>{sign.name}</Text>
              <Text style={styles.signMeta}>{zodiacRange(sign.name)}</Text>
              <Text style={styles.signMeta}>{`${sign.element} · ${sign.ruler}`}</Text>
            </View>
          </View>
          <View style={styles.skyRow}>
            <SymbolView name={MOON_SYMBOLS[sky.moonPhase]} tintColor={colors.text} size={18} />
            <Text style={styles.skyText}>{`Ay ${sky.moonSign} burcunda · ${sky.moonPhase}`}</Text>
          </View>
          {mercury && (
            <View style={styles.mercuryPill}>
              <Text style={styles.mercuryText}>{mercury}</Text>
            </View>
          )}
        </LinearGradient>

        {/* Sekmeler */}
        <View style={styles.tabs}>
          {(
            [
              ['today', 'Bugün'],
              ['week', 'Bu hafta'],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => switchTab(key)}
              style={[styles.tab, tab === key && styles.tabSelected]}>
              <Text style={[styles.tabText, tab === key && styles.tabTextSelected]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'today' ? (
          <>
            <Text style={styles.personality}>{daily.personality}</Text>

            <View style={styles.card}>
              {daily.lines.map((line, index) => (
                <View key={index} style={styles.lineRow}>
                  <SymbolView name="sparkle" tintColor={colors.primary} size={12} />
                  <Text style={styles.lineText}>{line}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.card, styles.luckyRow]}>
              <Text style={styles.luckyLabel}>🍀 Bugünkü şanslı rengin</Text>
              <View style={styles.luckyColor}>
                <ColorSwatch color={daily.luckyColor} size={18} />
                <Text style={styles.luckyName}>{daily.luckyColor}</Text>
              </View>
            </View>

            {daily.suggestion && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/outfit/[id]',
                    params: { id: daily.suggestion!.item.id },
                  })
                }
                style={({ pressed }) => [
                  styles.card,
                  styles.suggestion,
                  pressed && styles.pressed,
                ]}>
                <ClothingPhoto item={daily.suggestion.item} style={styles.suggestionPhoto} />
                <View style={styles.suggestionBody}>
                  <Text style={styles.suggestionLabel}>YILDIZLARIN SEÇİMİ</Text>
                  <Text style={styles.suggestionName} numberOfLines={1}>
                    {daily.suggestion.item.name}
                  </Text>
                  <Text style={styles.suggestionText}>{daily.suggestion.text}</Text>
                  <Text style={styles.link}>Kombini gör →</Text>
                </View>
              </Pressable>
            )}
          </>
        ) : (
          <>
            <Text style={styles.range}>{weekly.range}</Text>
            <View style={styles.card}>
              {(
                [
                  ['AŞK', weekly.love],
                  ['PARA', weekly.money],
                  ['DOLAP', weekly.wardrobe],
                ] as const
              ).map(([title, text], index) => (
                <View key={title} style={[styles.weekPart, index > 0 && styles.weekDivider]}>
                  <Text style={styles.weekLabel}>{title}</Text>
                  <Text style={styles.lineText}>{text}</Text>
                </View>
              ))}
            </View>
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
  changeText: {
    ...Typography.bodyBold,
    fontSize: 16,
    color: colors.primary,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  // Gümüş kart
  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1.5,
    borderColor: colors.card,
    ...Shadows.card,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  glyph: {
    fontSize: 56,
    lineHeight: 64,
    color: colors.primary,
  },
  heroText: {
    flex: 1,
    gap: Spacing.half,
  },
  signName: {
    ...Typography.hero,
    color: colors.text,
  },
  signMeta: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  skyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  skyText: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  mercuryPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  mercuryText: {
    ...Typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  // Sekme hapları
  tabs: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tab: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  tabSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  tabTextSelected: {
    color: colors.onPrimary,
  },
  personality: {
    ...Typography.body,
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Shadows.card,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  lineText: {
    ...Typography.body,
    color: colors.text,
    flex: 1,
  },
  luckyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  luckyLabel: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  luckyColor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  luckyName: {
    ...Typography.bodyBold,
    color: colors.primary,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  suggestionPhoto: {
    width: 72,
    borderRadius: Radius.sm,
  },
  suggestionBody: {
    flex: 1,
    gap: Spacing.half,
  },
  suggestionLabel: {
    ...Typography.label,
    color: colors.primary,
  },
  suggestionName: {
    ...Typography.heading,
    color: colors.text,
  },
  suggestionText: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  link: {
    ...Typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  range: {
    ...Typography.bodyBold,
    color: colors.textSecondary,
  },
  // "Bu hafta" kartındaki her bölüm (AŞK / PARA / DOLAP), aralarında ince çizgi
  weekPart: {
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  weekDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: Spacing.three,
    marginTop: Spacing.one,
  },
  weekLabel: {
    ...Typography.label,
    color: colors.primary,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  emptyEmoji: {
    fontSize: 56,
    lineHeight: 64,
  },
  emptyTitle: {
    ...Typography.heading,
    color: colors.text,
    textAlign: 'center',
  },
  chooseButton: {
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    ...Shadows.button,
  },
  chooseButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  chooseButtonText: {
    ...Typography.button,
    color: colors.onPrimary,
  },
});
