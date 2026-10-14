/**
 * ALMALI MIYIM? (Starbucks Endeksi simülatörü)
 *
 * Satın almadan önce karar desteği. Kullanıcı fiyatı ve ayda kaç kere giyeceğini girer:
 * - "Bunu alırsan…": paranın kaç iced latte vb. ettiği (Starbucks Endeksi)
 * - "Girl Math'e göre": maliyetin bir brunch'a, kahveye… düşmesi için kaç kere giyilmesi
 *   gerektiği ve bunun ne kadar süreceği
 * "Aldım! Dolabıma ekle" ekleme formunu fiyatı dolu açar.
 * Cüzdan ekranındaki "Almalı mıyım?" kartıyla açılır.
 */

import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { COMPARISONS } from '@/lib/comparisons';
import { starbucksIndexList } from '@/lib/starbucks-index';

const colors = Colors.light;

// "Ayda kaç kere giyersin?" seçenekleri
const FREQUENCIES = [1, 2, 4, 8];

// "Girl Math'e göre" bölümünde gösterilecek kalemler (adları comparisons.ts'teki "name")
const TARGET_NAMES = ['Brunch', 'Manikür', 'Iced latte', 'Filtre kahve'];

// Karar cümlesi bu kaleme göre verilir: maliyet kaç ayda bir iced latteye düşer?
const VERDICT_TARGET = 'Iced latte';

// "1.500" ya da "1500,50" gibi yazılan fiyatı sayıya çevirir. Geçersizse NaN döner.
function parseAmount(text: string): number {
  return Number(text.replace(/\./g, '').replace(',', '.').trim());
}

// Ay sayısını insan diliyle yazar: "bu ay", "~7 ay", "~1,5 yıl"
function durationText(months: number): string {
  if (months <= 1) return 'bu ay içinde';
  if (months < 12) return `~${Math.ceil(months)} ay`;
  const years = Math.round((months / 12) * 10) / 10;
  return `~${years.toLocaleString('tr-TR')} yıl`;
}

function verdictText(months: number): string {
  if (months <= 6) return 'Girl Math onaylıyor, al gitsin 💅';
  if (months <= 12) return 'Düşünülebilir, ama sık giyeceğine emin ol 🤔';
  return 'Bence biraz bekle, bu iş uzun sürer 😅';
}

export default function ShouldIBuyScreen() {
  const router = useRouter();
  const [priceText, setPriceText] = useState('');
  const [perMonth, setPerMonth] = useState(4);

  const price = parseAmount(priceText);
  const hasPrice = price > 0;

  // "Bunu alırsan…": iced latte + paranın yettiği en pahalı iki kalem
  const index = hasPrice ? starbucksIndexList(price) : [];
  const latte = index.find((entry) => entry.comparison.name === 'Iced latte');
  const spend = [
    ...(latte ? [latte] : []),
    ...index.filter((entry) => entry !== latte).slice(0, 2),
  ];

  // "Girl Math'e göre": fiyattan ucuz kalemler için gereken giyim sayısı ve süre
  const targets = COMPARISONS.filter(
    (comparison) => TARGET_NAMES.includes(comparison.name) && comparison.price < price,
  )
    .reverse()
    .map((comparison) => {
      const wears = Math.ceil(price / comparison.price);
      return { comparison, wears, months: wears / perMonth };
    });
  const verdict = targets.find((target) => target.comparison.name === VERDICT_TARGET);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Almalı mıyım?',
          headerBackTitle: 'Cüzdan',
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>{"Almadan önce Girl Math'e sor 🤔"}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>FİYATI NE KADAR? (₺)</Text>
          <TextInput
            value={priceText}
            onChangeText={setPriceText}
            placeholder="Örn: 4000"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>AYDA KAÇ KERE GİYERSİN?</Text>
          <View style={styles.chips}>
            {FREQUENCIES.map((value) => {
              const selected = value === perMonth;
              return (
                <Pressable
                  key={value}
                  onPress={() => setPerMonth(value)}
                  style={[styles.chip, selected && styles.chipSelected]}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {value} kere
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {hasPrice && (
          <>
            {verdict && (
              <View style={styles.verdict}>
                <Text style={styles.verdictText}>{verdictText(verdict.months)}</Text>
              </View>
            )}

            {spend.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Bunu alırsan şunlardan vazgeçiyorsun:</Text>
                {spend.map((entry) => (
                  <View key={entry.comparison.name} style={styles.cardRow}>
                    <Text style={styles.emoji}>{entry.comparison.emoji}</Text>
                    <Text style={styles.rowText}>
                      <Text style={styles.rowStrong}>{entry.count}</Text> {entry.comparison.unit}
                    </Text>
                  </View>
                ))}
                <Text style={styles.cardNote}>Değer mi? 🤔</Text>
              </View>
            )}

            {targets.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{"Girl Math'e göre"}</Text>
                {targets.map((target) => (
                  <View key={target.comparison.name} style={styles.cardRow}>
                    <Text style={styles.emoji}>{target.comparison.emoji}</Text>
                    <View style={styles.rowBody}>
                      <Text style={styles.rowText}>
                        {target.comparison.name} fiyatına düşmesi için{' '}
                        <Text style={styles.rowStrong}>{target.wears} kere</Text> giymelisin
                      </Text>
                      <Text style={styles.rowNote}>
                        Ayda {perMonth} kere giyersen: {durationText(target.months)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {hasPrice && (
        <View style={styles.footer}>
          <Pressable
            onPress={() =>
              router.push({ pathname: '/add-item', params: { price: String(Math.round(price)) } })
            }
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            <Text style={styles.buttonText}>Aldım! Dolabıma ekle 💖</Text>
          </Pressable>
        </View>
      )}
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
    paddingBottom: Spacing.four,
    gap: Spacing.four,
  },
  intro: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  field: {
    gap: Spacing.two,
  },
  label: {
    ...Typography.label,
    color: colors.textSecondary,
  },
  input: {
    ...Typography.heading,
    color: colors.text,
    backgroundColor: colors.card,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  chips: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: Spacing.two,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...Typography.bodyBold,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.onPrimary,
  },
  verdict: {
    backgroundColor: colors.primarySoft,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  verdictText: {
    ...Typography.heading,
    color: colors.primary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Shadows.card,
  },
  cardTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  emoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  rowBody: {
    flex: 1,
    gap: Spacing.half,
  },
  rowText: {
    ...Typography.body,
    color: colors.text,
    flexShrink: 1,
  },
  rowStrong: {
    ...Typography.bodyBold,
    color: colors.primary,
  },
  rowNote: {
    ...Typography.caption,
    color: colors.textMuted,
  },
  cardNote: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.three,
    ...Shadows.button,
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    ...Typography.heading,
    color: colors.onPrimary,
    textAlign: 'center',
  },
});
