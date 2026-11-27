/**
 * BURÇ YORUMU
 *
 * Ana sayfadaki Keşfet → "Burcun" kutusuna dokununca açılır (Onur'un zodiac.ts'i: dailyHoroscope,
 * weeklyHoroscope, getSky). Yukarıdan aşağı:
 * - Gümüş (krom) kart, ortalı: burç sembolü, adı, "tarih · element · gezegen", stil kişiliği
 *   (italik), Ay'ın burcu ve evresi; Merkür retrosu varsa ya da yaklaşıyorsa küçük hap.
 * - "Bugün" / "Bu hafta" iPhone tarzı iki parçalı seçici (Analizler'deki gibi).
 * - Bugün: gökyüzü cümleleri tek kartta (aralarında ince çizgi); "Yıldızların seçimi" başlığı
 *   altında tek kart: şanslı renk satırı + dolaptan önerilen parça ("Kombini gör →").
 * - Bu hafta: tarih aralığı başlık, tek kartta Aşk / Para / Dolap (Onur'un cümleleri zaten
 *   emojiyle başladığı için başlıklarda emoji yok, yoksa iki kere yazılıyordu).
 * (26 Kasım: "karışık" denince sadeleştirildi; pembe sekme hapları, ✦ işaretleri, 🍀 kalktı.)
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
        {/* Gümüş kart: burç, kişilik, gökyüzü (ortalı, sade) */}
        <LinearGradient
          colors={Gradients.chrome}
          locations={[0, 0.35, 0.7, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          <Text style={styles.glyph}>{zodiacGlyph(sign.emoji)}</Text>
          <Text style={styles.signName}>{sign.name}</Text>
          <Text style={styles.signMeta}>
            {`${zodiacRange(sign.name)} · ${sign.element} · ${sign.ruler}`}
          </Text>
          <Text style={styles.personality}>{daily.personality}</Text>
          <View style={styles.skyRow}>
            <SymbolView
              name={MOON_SYMBOLS[sky.moonPhase]}
              tintColor={colors.textSecondary}
              size={14}
            />
            <Text style={styles.skyText}>{`Ay ${sky.moonSign} burcunda · ${sky.moonPhase}`}</Text>
          </View>
          {mercury && (
            <View style={styles.mercuryPill}>
              <Text style={styles.mercuryText}>{mercury}</Text>
            </View>
          )}
        </LinearGradient>

        {/* iPhone tarzı iki parçalı seçici (Analizler'deki gibi) */}
        <View style={styles.segment}>
          {(
            [
              ['today', 'Bugün'],
              ['week', 'Bu hafta'],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => switchTab(key)}
              style={[styles.segmentItem, tab === key && styles.segmentItemSelected]}>
              <Text style={[styles.segmentText, tab === key && styles.segmentTextSelected]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'today' ? (
          <>
            {/* Gökyüzü cümleleri: tek kartta, aralarında ince çizgi */}
            <View style={styles.card}>
              {daily.lines.map((line, index) => (
                <Text key={index} style={[styles.lineText, index > 0 && styles.divider]}>
                  {line}
                </Text>
              ))}
            </View>

            {/* Şanslı renk + önerilen parça: tek kart, başlık üstünde */}
            <Text style={styles.sectionTitle}>Yıldızların seçimi</Text>
            <View style={styles.card}>
              <View style={styles.luckyRow}>
                {/* "Desenli" bir renk değil (Kova'nın şanslılarından): "Bugün şansın · Desenlerde" (28 Kasım) */}
                <Text style={styles.luckyLabel}>
                  {daily.luckyColor === 'Desenli' ? 'Bugün şansın' : 'Bugünkü şanslı rengin'}
                </Text>
                <View style={styles.luckyColor}>
                  <ColorSwatch color={daily.luckyColor} size={16} />
                  <Text style={styles.luckyName}>
                    {daily.luckyColor === 'Desenli' ? 'Desenlerde' : daily.luckyColor}
                  </Text>
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
                    styles.suggestion,
                    styles.divider,
                    pressed && styles.rowPressed,
                  ]}>
                  <ClothingPhoto item={daily.suggestion.item} style={styles.suggestionPhoto} />
                  <View style={styles.suggestionBody}>
                    <Text style={styles.suggestionName} numberOfLines={1}>
                      {daily.suggestion.item.name}
                    </Text>
                    <Text style={styles.suggestionText}>{daily.suggestion.text}</Text>
                    <Text style={styles.link}>Kombini gör →</Text>
                  </View>
                </Pressable>
              )}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>{weekly.range}</Text>
            <View style={styles.card}>
              {(
                [
                  ['Aşk', weekly.love],
                  ['Para', weekly.money],
                  ['Dolap', weekly.wardrobe],
                ] as const
              ).map(([title, text], index) => (
                <View key={title} style={[styles.weekPart, index > 0 && styles.divider]}>
                  <Text style={styles.weekTitle}>{title}</Text>
                  <Text style={styles.weekText}>{text}</Text>
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
  rowPressed: {
    opacity: 0.6,
  },
  // Gümüş kart
  hero: {
    alignItems: 'center',
    borderRadius: Radius.xl,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    gap: Spacing.one,
    borderWidth: 1.5,
    borderColor: colors.card,
    ...Shadows.card,
  },
  glyph: {
    fontSize: 40,
    lineHeight: 48,
    color: colors.primary,
  },
  signName: {
    ...Typography.hero,
    color: colors.text,
  },
  signMeta: {
    ...Typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  personality: {
    ...Typography.body,
    fontStyle: 'italic',
    color: colors.text,
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  skyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  skyText: {
    ...Typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  mercuryPill: {
    backgroundColor: colors.card,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    marginTop: Spacing.one,
  },
  mercuryText: {
    ...Typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  // İki parçalı seçici
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundElement,
    borderRadius: Radius.pill,
    padding: Spacing.half,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  segmentItemSelected: {
    backgroundColor: colors.card,
    ...Shadows.card,
  },
  segmentText: {
    ...Typography.bodyBold,
    color: colors.textSecondary,
  },
  segmentTextSelected: {
    color: colors.text,
  },
  sectionTitle: {
    ...Typography.heading,
    color: colors.text,
    marginTop: Spacing.two,
    marginBottom: -Spacing.one,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.one,
    ...Shadows.card,
  },
  // Kart içindeki satırlar arası ince çizgi
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  lineText: {
    ...Typography.body,
    color: colors.text,
    paddingVertical: Spacing.three,
  },
  luckyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  luckyLabel: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  luckyColor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  luckyName: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  suggestionPhoto: {
    width: 64,
    borderRadius: Radius.sm,
  },
  suggestionBody: {
    flex: 1,
    gap: Spacing.half,
  },
  suggestionName: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  suggestionText: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  link: {
    ...Typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginTop: Spacing.half,
  },
  // "Bu hafta" kartındaki her bölüm (Aşk / Para / Dolap)
  weekPart: {
    paddingTop: Spacing.three,
  },
  weekTitle: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  weekText: {
    ...Typography.body,
    color: colors.text,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.three,
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
