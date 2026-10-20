/**
 * ALMALI MIYIM? (Starbucks Endeksi simülatörü)
 *
 * Satın almadan önce karar desteği. Kullanıcı fiyatı ve ayda kaç kere giyeceğini girer:
 * - "Bunu alırsan…": paranın kaç iced latte vb. ettiği (Starbucks Endeksi)
 * - "Girl Math'e göre": maliyetin bir brunch'a, kahveye… düşmesi için kaç kere giyilmesi
 *   gerektiği ve bunun ne kadar süreceği
 * "Aldım! Dolabıma ekle" ekleme formunu fiyatı dolu açar.
 * Sayfa açılınca fiyat kutusu seçili gelir, klavye açılır (hesap makinesi gibi); boş durum yok.
 * (Soluk örnek kartlar ve "dene" hapları denendi; biri "bozuk" gibi durdu, öteki kutuyu tekrarladı.)
 * Sonuç: pembe ana kart (iced latte fiyatına ne zaman iner + karar cümlesi), "Bu parayla" 3 küçük
 * kutu, "Yol haritası" (solda zaman çizgisi, her durak tek satır, sağda giyim başı maliyet).
 * Cüzdan ekranındaki "Almalı mıyım?" kartıyla açılır.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatTL } from '@/components/clothing-card';
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

// Ay sayısını kısa yazar (zaman çizelgesinin sol sütunu): "Bu ay", "~7 ay", "~1,5 yıl"
function durationText(months: number): string {
  if (months <= 1) return 'Bu ay';
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
            autoFocus
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
            {/* Sayfanın tek pembe vurgusu: cevap tek bakışta (ne zaman iced latte fiyatına iner) */}
            <LinearGradient
              colors={[colors.primaryPressed, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}>
              {verdict ? (
                <>
                  <Text style={styles.heroLabel}>{`AYDA ${perMonth} GİYİMLE`}</Text>
                  <Text style={styles.heroValue}>{durationText(verdict.months)}</Text>
                  <Text style={styles.heroText}>giyim başı iced latte fiyatına iner</Text>
                  <View style={styles.heroDivider} />
                  <Text style={styles.heroVerdict}>{verdictText(verdict.months)}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.heroLabel}>GIRL MATH KARARI</Text>
                  <Text style={styles.heroValue}>Zaten ucuz</Text>
                  <Text style={styles.heroText}>Bir iced latteden bile ucuz, düşünme bile 💅</Text>
                </>
              )}
            </LinearGradient>

            {/* Bu parayla neler yapılırdı: yan yana küçük kutular */}
            {spend.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bu parayla</Text>
                <View style={styles.tiles}>
                  {spend.map((entry) => (
                    <View key={entry.comparison.name} style={styles.tile}>
                      <Text style={styles.tileValue}>{entry.count}</Text>
                      <Text style={styles.tileLabel} numberOfLines={2}>
                        {entry.comparison.unit}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Yol haritası: seçili sıklıkla ne zaman hangi fiyata iner (sağda giyim başı maliyet) */}
            {targets.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Yol haritası</Text>
                <View style={styles.card}>
                  {targets.map((target, index) => (
                    <View key={target.comparison.name} style={styles.stop}>
                      {/* Sol çizgi: noktalar arası ince hat, ilk ve son durakta yarım */}
                      <View style={styles.rail}>
                        <View style={[styles.railLine, index === 0 && styles.railHidden]} />
                        <View style={styles.railDot} />
                        <View
                          style={[
                            styles.railLine,
                            index === targets.length - 1 && styles.railHidden,
                          ]}
                        />
                      </View>
                      <Text style={styles.stopWhen}>{durationText(target.months)}</Text>
                      <Text style={styles.stopName} numberOfLines={1}>
                        {target.comparison.name}
                      </Text>
                      <Text style={styles.stopCost}>
                        {formatTL(Math.round(price / target.wears))}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.note}>Sağdaki rakam o noktada giyim başı maliyet.</Text>
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
    paddingVertical: Spacing.one + Spacing.half, // Diğer formlardaki haplarla aynı boy
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...Typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.onPrimary,
  },
  // Pembe ana kart (Ana sayfadaki vitrin kartıyla aynı dil)
  hero: {
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three + Spacing.one,
    gap: Spacing.one,
    ...Shadows.button,
  },
  heroLabel: {
    ...Typography.label,
    color: colors.primarySoft,
  },
  heroValue: {
    ...Typography.hero,
    color: colors.onPrimary,
  },
  heroText: {
    ...Typography.body,
    color: colors.onPrimary,
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.primarySoft,
    opacity: 0.5,
    marginVertical: Spacing.two,
  },
  heroVerdict: {
    ...Typography.bodyBold,
    color: colors.onPrimary,
  },
  // Başlık kartın üstünde (Ana sayfadaki bölümler gibi)
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  tiles: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    gap: Spacing.half,
    ...Shadows.card,
  },
  tileValue: {
    ...Typography.title,
    color: colors.text,
  },
  tileLabel: {
    ...Typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    ...Shadows.card,
  },
  // Yol haritasında tek durak: çizgi · süre · ad · giyim başı maliyet
  stop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 44,
  },
  rail: {
    width: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  railLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.accent, // primarySoft beyaz kartta neredeyse görünmüyordu
  },
  railHidden: {
    backgroundColor: 'transparent',
  },
  railDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
    backgroundColor: colors.primary,
  },
  stopWhen: {
    ...Typography.bodyBold,
    color: colors.primary,
    width: 52,
  },
  stopName: {
    ...Typography.body,
    color: colors.text,
    flex: 1,
  },
  stopCost: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  note: {
    ...Typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
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
