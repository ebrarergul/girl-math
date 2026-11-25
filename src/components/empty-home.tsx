/**
 * BOŞ ANA SAYFA (dolapta hiç parça yokken; yeni kullanıcının ilk gördüğü ekran)
 *
 * 26 Kasım, Ebrar: "ilk ekran bu, daha canlı ve animasyonlu olsun, pembe bir ok 'buna bas' desin".
 * - "Girl Math nasıl çalışır?" kartı: pembe geçişli canlı örnek. 3.000 ₺'lik ceketin giyim başı
 *   maliyeti kendiliğinden erir (1. → 4. → 10. → 23. giyim), rakam her adımda aşağıdan kayarak
 *   değişir, pembe çubuk dolar, altında gerçek hayat kıyası (comparisons.ts'ten: konser bileti →
 *   … → filtre kahve). Sonra baştan başlar.
 * - Butonun üstünde zıplayan pembe "Buradan başla" balonu (aşağı oklu).
 * - "İlk adımların" kontrol listesi: 1 pembe (şu anki adım), 2-3 gri.
 * Kartlar sayfa açılınca sırayla aşağıdan kayarak belirir.
 */

import { SymbolView } from 'expo-symbols';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { formatTL } from '@/components/clothing-card';
import { Colors, Fonts, Gradients, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { findComparison } from '@/lib/comparisons';

const colors = Colors.light;

// Örnek ceket ve maliyetin eridiği duraklar (fiyat ÷ giyim)
const EXAMPLE_PRICE = 3000;
const EXAMPLE_WEARS = [1, 4, 10, 23];
const STEP_MS = 1800; // Her durakta bekleme süresi

const FIRST_STEPS = [
  { title: 'İlk parçanı ekle', text: 'Fotoğrafı ve fiyatıyla, 30 saniye sürer.' },
  { title: 'Giydiğinde dokun', text: '"Bugün ne giydin?"de tek dokunuş.' },
  { title: 'Maliyetin erisin', text: 'Giydikçe her parça ucuzlar, sonunda resmen bedava.' },
];

export function EmptyHome({ onAdd }: { onAdd: () => void }) {
  return (
    <>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.card}>
        <Text style={styles.label}>Girl Math nasıl çalışır?</Text>
        <Text style={styles.title}>Giydikçe maliyeti erir</Text>

        <MeltingDemo />

        <CoachBubble text="Buradan başla" />
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>İlk parçanı ekle</Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.section}>
        <Text style={styles.sectionTitle}>İlk adımların</Text>
        <View style={styles.stepsCard}>
          {FIRST_STEPS.map((step, index) => (
            <View key={step.title} style={styles.stepRow}>
              <View style={[styles.stepNumber, index === 0 && styles.stepNumberActive]}>
                <Text style={[styles.stepNumberText, index === 0 && styles.stepNumberTextActive]}>
                  {index + 1}
                </Text>
              </View>
              <View style={[styles.stepBody, index > 0 && styles.stepDivider]}>
                <Text style={[styles.stepTitle, index > 0 && styles.stepTitleLater]}>
                  {step.title}
                </Text>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>
    </>
  );
}

// Canlı örnek: "Ceket · 3.000 ₺" → büyük pembe giyim başı maliyet kendiliğinden erir
function MeltingDemo() {
  const [step, setStep] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    const timer = setInterval(
      () => setStep((current) => (current + 1) % EXAMPLE_WEARS.length),
      STEP_MS,
    );
    return () => clearInterval(timer);
  }, []);

  const wears = EXAMPLE_WEARS[step];
  const cost = Math.round(EXAMPLE_PRICE / wears);
  const comparison = findComparison(cost);

  // Çubuk: son durakta dolu; başa dönerken hızlıca boşalır
  useEffect(() => {
    const target = (step + 1) / EXAMPLE_WEARS.length;
    progress.set(withTiming(target, { duration: step === 0 ? 300 : 900, easing: Easing.out(Easing.cubic) }));
  }, [step, progress]);
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));

  return (
    <LinearGradient
      colors={Gradients.story}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.demo}>
      <View style={styles.demoTop}>
        <View style={styles.demoIcon}>
          <SymbolView
            name={{ ios: 'hanger', android: 'checkroom', web: 'checkroom' }}
            tintColor={colors.primary}
            size={18}
          />
        </View>
        <Text style={styles.demoItem}>Ceket · {formatTL(EXAMPLE_PRICE)}</Text>
      </View>

      {/* key değişince rakam aşağıdan kayarak yeniden girer */}
      <View style={styles.demoNumberRow}>
        <Animated.Text key={`c-${step}`} entering={FadeInDown.duration(350)} style={styles.demoCost}>
          {cost.toLocaleString('tr-TR')}
          <Text style={styles.demoCurrency}> ₺</Text>
          <Text style={styles.demoSuffix}> /giyim</Text>
        </Animated.Text>
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.bar, barStyle]} />
      </View>

      <View style={styles.demoBottom}>
        <Text style={styles.demoWears}>{wears}. giyim</Text>
        {comparison && (
          <Animated.Text key={`k-${step}`} entering={FadeInDown.duration(350)} style={styles.demoCompare}>
            {`= ${comparison.emoji} ${comparison.name}`}
          </Animated.Text>
        )}
      </View>
    </LinearGradient>
  );
}

// Zıplayan pembe ipucu balonu (altındaki butonu gösterir)
function CoachBubble({ text }: { text: string }) {
  const bounce = useSharedValue(0);
  useEffect(() => {
    bounce.set(
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 450, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 450, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
      ),
    );
  }, [bounce]);
  const bounceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.get() }] }));

  return (
    <Animated.View style={[styles.coach, bounceStyle]} pointerEvents="none">
      <View style={styles.coachPill}>
        <Text style={styles.coachText}>{text}</Text>
      </View>
      <SymbolView
        name={{ ios: 'arrowtriangle.down.fill', android: 'arrow_drop_down', web: 'arrow_drop_down' }}
        tintColor={colors.primary}
        size={12}
        style={styles.coachArrow}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    ...Shadows.card,
  },
  label: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  title: {
    ...Typography.title,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text,
    marginTop: Spacing.one,
  },
  // Canlı örnek kutusu (Story kartlarıyla aynı pembe geçiş)
  demo: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  demoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  demoIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoItem: {
    ...Typography.bodyBold,
    color: colors.primaryPressed,
  },
  demoNumberRow: {
    height: 52,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  demoCost: {
    ...Typography.hero,
    fontSize: 40,
    lineHeight: 48,
    color: colors.primary,
  },
  demoCurrency: {
    fontFamily: Fonts?.sans,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0,
  },
  demoSuffix: {
    fontFamily: Fonts?.sans,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0,
    color: colors.primaryPressed,
  },
  track: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: colors.progress,
  },
  demoBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  demoWears: {
    ...Typography.caption,
    fontWeight: '700',
    color: colors.primaryPressed,
  },
  demoCompare: {
    ...Typography.caption,
    fontWeight: '700',
    color: colors.primaryPressed,
  },
  // Zıplayan "Buradan başla" balonu
  coach: {
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  coachPill: {
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  coachText: {
    ...Typography.caption,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  coachArrow: {
    marginTop: -3,
    width: 12,
    height: 12,
  },
  button: {
    marginTop: Spacing.one,
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    ...Shadows.button,
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    ...Typography.button,
    color: colors.onPrimary,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    ...Typography.heading,
    color: colors.text,
  },
  stepsCard: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    paddingLeft: Spacing.three,
    ...Shadows.card,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    backgroundColor: colors.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberActive: {
    backgroundColor: colors.primary,
  },
  stepNumberText: {
    ...Typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  stepNumberTextActive: {
    color: colors.onPrimary,
  },
  stepBody: {
    flex: 1,
    gap: Spacing.half,
    paddingVertical: Spacing.three,
    paddingRight: Spacing.three,
  },
  stepDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  stepTitle: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  stepTitleLater: {
    color: colors.textSecondary,
  },
  stepText: {
    ...Typography.caption,
    color: colors.textMuted,
  },
});
