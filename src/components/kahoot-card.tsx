/**
 * DOLAP KAHOOT'U (Ana sayfa, "Senin için" kartında bir satır)
 *
 * Etkinlik ve burç satırlarıyla aynı kalıp (TodayRow). Onur'un weeklyQuiz / quizStreak araçlarıyla:
 * - Bu hafta oynandı: rozet adı + "Bu haftanın rozeti · 550 puan" (seri varsa "· 3 hafta seri");
 *   dokununca sonuç ekranı (Story paylaşımı orada)
 * - Hafta sonu, henüz oynanmadı: "Dolap Kahoot'u açıldı" + sağda pembe "Oyna" hapı
 * - Hafta içi ya da dolapta 4'ten az parça: satır hiç görünmez (Ana sayfa sade kalsın)
 * Geliştirirken (sadece Expo Go'da, __DEV__) hafta içi denemek için soluk "🧪 Kahoot test"
 * satırı yaklaşan Cumartesi'nin sorularını açar; App Store sürümünde görünmez.
 */

import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { IconCircle, TodayRow } from '@/components/today-row';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
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
    return (
      <TodayRow
        icon={
          <IconCircle>
            <SymbolView name="trophy" tintColor={colors.primary} size={18} />
          </IconCircle>
        }
        title={quizBadge(result.correctCount).title}
        detail={`Bu haftanın rozeti · ${result.score} puan${streak > 1 ? ` · ${streak} hafta seri` : ''}`}
        accessibilityLabel="Kahoot sonucunu gör"
        onPress={() => play()}
      />
    );
  }

  // Hafta sonu ve dolap yeterli: oyna
  if (quiz.isOpen && !quiz.blockedMessage) {
    return (
      <TodayRow
        icon={
          <IconCircle>
            <SymbolView name="gamecontroller" tintColor={colors.primary} size={18} />
          </IconCircle>
        }
        title="Dolap Kahoot'u açıldı"
        detail={
          streak > 0
            ? `${streak} haftalık serini bozma`
            : `${QUESTION_COUNT} soru · soru başı ${TIME_LIMIT_SECONDS} sn`
        }
        right={
          <View style={styles.playButton}>
            <Text style={styles.playText}>Oyna</Text>
          </View>
        }
        accessibilityLabel="Dolap Kahoot'unu oyna"
        onPress={() => play()}
      />
    );
  }

  // Hafta içi ya da dolap yetersiz: Ana sayfa sade kalsın diye satır hiç görünmez.
  // Sadece geliştirirken (Expo Go) hafta içi denemek için soluk test satırı
  if (__DEV__ && !quiz.blockedMessage) {
    return (
      <TodayRow
        icon={
          <IconCircle>
            <SymbolView name="hammer" tintColor={colors.textMuted} size={16} />
          </IconCircle>
        }
        title="Kahoot test"
        detail="Şimdi oyna · sadece Expo Go'da görünür"
        onPress={() => play(true)}
      />
    );
  }
  return null;
}

const styles = StyleSheet.create({
  playButton: {
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + Spacing.half,
  },
  playText: {
    ...Typography.caption,
    fontWeight: '800',
    color: colors.onPrimary,
  },
});
