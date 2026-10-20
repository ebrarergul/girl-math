/**
 * DOLAP KAHOOT'U KARTI (Ana sayfa)
 *
 * Onur'un weeklyQuiz / playedThisWeek / quizStreak araçlarıyla 4 hal:
 * - Hafta sonu, henüz oynanmadı: "🎯 Hafta sonu Kahoot'u açıldı!" + pembe "Oyna →" (seri varsa
 *   "🔥 N haftalık serini bozma")
 * - Bu hafta oynandı: kazanılan rozet (emoji + ad), puan ve seri; dokununca sonuç ekranı
 * - Hafta içi: soluk kart, "Cumartesi açılıyor ⏳"
 * - Dolapta 4'ten az parça: soluk kart + Onur'un blockedMessage cümlesi
 * Geliştirirken (sadece Expo Go'da, __DEV__) hafta içi denemek için "🧪 Test: şimdi oyna"
 * bağlantısı yaklaşan Cumartesi'nin sorularını açar; App Store sürümünde görünmez.
 */

import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { QUESTION_COUNT, TIME_LIMIT_SECONDS, quizBadge, quizStreak, weeklyQuiz } from '@/lib/quiz';

const colors = Colors.light;

export function KahootCard() {
  const router = useRouter();
  const { items, quizResults } = useApp();
  const quiz = weeklyQuiz(items);
  const streak = quizStreak(quizResults);
  const result = quizResults.find((saved) => saved.weekKey === quiz.weekKey);

  function play(test = false) {
    router.push(test ? { pathname: '/kahoot', params: { test: '1' } } : '/kahoot');
  }

  // Bu hafta oynandı: rozet
  if (result) {
    const badge = quizBadge(result.correctCount);
    return (
      <Pressable
        onPress={() => play()}
        accessibilityLabel="Kahoot sonucunu gör"
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
        <View style={styles.body}>
          <Text style={styles.eyebrow}>BU HAFTANIN ROZETİ</Text>
          <Text style={styles.title} numberOfLines={2}>
            {badge.title}
          </Text>
          <Text style={styles.text}>
            {`${result.correctCount}/${QUESTION_COUNT} doğru · ${result.score} puan`}
            {streak > 1 ? ` · 🔥 ${streak} hafta` : ''}
          </Text>
          <Text style={styles.muted}>Sonucu gör · Story’de paylaş →</Text>
        </View>
      </Pressable>
    );
  }

  // Hafta sonu ve dolap yeterli: oyna
  if (quiz.isOpen && !quiz.blockedMessage) {
    return (
      <Pressable
        onPress={() => play()}
        accessibilityLabel="Dolap Kahoot'unu oyna"
        style={({ pressed }) => [styles.card, styles.cardOpen, pressed && styles.pressed]}>
        <Text style={styles.badgeEmoji}>🎯</Text>
        <View style={styles.body}>
          <Text style={styles.eyebrow}>{"DOLAP KAHOOT'U"}</Text>
          <Text style={styles.title}>{"Hafta sonu Kahoot'u açıldı!"}</Text>
          <Text style={styles.text}>
            {streak > 0
              ? `🔥 ${streak} haftalık serini bozma`
              : `${QUESTION_COUNT} soru · soru başı ${TIME_LIMIT_SECONDS} sn`}
          </Text>
          <View style={styles.playButton}>
            <Text style={styles.playText}>Oyna →</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  // Hafta içi ya da dolap yetersiz: soluk kart
  return (
    <View style={[styles.card, styles.cardSoft]}>
      <Text style={[styles.badgeEmoji, styles.faded]}>🎯</Text>
      <View style={styles.body}>
        <Text style={styles.eyebrow}>{"DOLAP KAHOOT'U"}</Text>
        <Text style={styles.titleSoft}>
          {quiz.blockedMessage ??
            `Cumartesi açılıyor ⏳ ${quiz.daysUntilOpen === 1 ? 'Yarın!' : `${quiz.daysUntilOpen} gün kaldı`}`}
        </Text>
        {!quiz.blockedMessage && (
          <Text style={styles.muted}>
            {streak > 0
              ? `🔥 ${streak} haftalık serin var, hafta sonu bozma`
              : 'Dolabını ne kadar tanıyorsun? 5 soruda görelim 👀'}
          </Text>
        )}
        {__DEV__ && !quiz.blockedMessage && (
          <Pressable onPress={() => play(true)} hitSlop={8}>
            <Text style={styles.devLink}>🧪 Test: şimdi oyna</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    ...Shadows.card,
  },
  // Açıkken pembe çerçeve: "şimdi oynanabilir" belli olsun
  cardOpen: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  // Hafta içi: gölgesiz, açık pembe zemin (bekleme hali)
  cardSoft: {
    backgroundColor: colors.primarySoft,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  badgeEmoji: {
    fontSize: 40,
    lineHeight: 48,
  },
  faded: {
    opacity: 0.5,
  },
  body: {
    flex: 1,
    gap: Spacing.half,
  },
  eyebrow: {
    ...Typography.label,
    color: colors.primary,
  },
  title: {
    ...Typography.heading,
    color: colors.text,
  },
  titleSoft: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  text: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  muted: {
    ...Typography.caption,
    color: colors.textMuted,
  },
  playButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  playText: {
    ...Typography.bodyBold,
    color: colors.onPrimary,
  },
  devLink: {
    ...Typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginTop: Spacing.one,
  },
});
