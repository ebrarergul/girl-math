/**
 * DOLAP KAHOOT'U (yarışma sayfası)
 *
 * Ana sayfadaki Kahoot kartı açar. Onur'un weeklyQuiz'inden haftanın 5 sorusu (sayfa açılınca
 * sabitlenir), her soru 15 saniye:
 * - Üstte "Soru 2/5" + kalan saniye ve 15 saniyede küçülen pembe süre çubuğu
 * - Soru kartı: soru cümlesi; 🔍 "Bu parça kim?" sorusunda fotoğraf yakından ve bulanık başlar,
 *   süre ilerledikçe netleşir; 📍 sorusunda kıyafetin küçük fotoğrafı
 * - Şıklar büyük hap butonlar (kıyafet şıklarında küçük fotoğraf; 🔍 sorusunda yok, cevabı ele
 *   verir). Dokununca: doğru = yeşil + titreşim, yanlış = sallanır + doğrusu yeşil yanar.
 *   Süre dolarsa "Süre doldu ⏰" (0 puan)
 * - Altta açıklama balonu (correctText / wrongText) + kazanılan puan, "Sıradaki →"
 * Puan: answerPoints (doğru 100 + hız bonusu). Bitince sonuç kaydedilir (saveQuizResult) ve
 * sonuç ekranı gelir: büyük rozet emojisi, rozet adı ve mesajı, doğru | puan, rekor ve seri 🔥,
 * "Story'de paylaş" (share.tsx, rozet kartı). Bu hafta oynandıysa sayfa doğrudan sonucu gösterir.
 * params.test = '1' (sadece geliştirmede): hafta içi yaklaşan Cumartesi'nin soruları.
 */

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClothingPhoto } from '@/components/outfit-collage';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { photoUri } from '@/lib/photos';
import {
  QUESTION_COUNT,
  TIME_LIMIT_SECONDS,
  answerPoints,
  bestQuizScore,
  daysUntilQuiz,
  quizBadge,
  quizStreak,
  weeklyQuiz,
  type QuizOption,
} from '@/lib/quiz';
import { todayString } from '@/lib/girl-math';
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

// Süre dolduğunda "seçilen şık"
const TIMED_OUT = -1;
// "Bu parça kim?" fotoğrafı: başta bu kadar bulanık ve yakın, süre bittikçe netleşir
const MAX_BLUR = 18;
const ZOOM = 1.8;

type OptionStatus = 'idle' | 'correct' | 'wrong' | 'dim';

export default function KahootScreen() {
  const router = useRouter();
  const { test } = useLocalSearchParams<{ test?: string }>();
  const { items, quizResults, saveQuizResult } = useApp();
  const isTest = __DEV__ && test === '1';

  // Haftanın soruları sayfa açılınca sabitlenir (yarışma sırasında değişmesin)
  const [quiz] = useState(() => {
    const date = new Date();
    if (isTest) {
      date.setDate(date.getDate() + daysUntilQuiz(date)); // Yaklaşan Cumartesi
    }
    return weeklyQuiz(items, date);
  });

  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null); // null = henüz cevaplanmadı
  const [secondsLeft, setSecondsLeft] = useState(TIME_LIMIT_SECONDS);
  const [lastPoints, setLastPoints] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [newRecord, setNewRecord] = useState(false);

  const progress = useSharedValue(1); // Süre çubuğu: 1 = dolu, 0 = bitti
  const question = quiz.questions[index];
  const answered = chosen !== null;

  // Her soruda sayaç: çubuk 15 saniyede küçülür, saniye yazısı azalır, süre dolunca cevap kapanır
  useEffect(() => {
    if (!question || answered || finished) {
      return;
    }
    progress.set(1);
    progress.set(withTiming(0, { duration: TIME_LIMIT_SECONDS * 1000, easing: Easing.linear }));
    const tick = setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    const timeout = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setLastPoints(0);
      setChosen(TIMED_OUT);
    }, TIME_LIMIT_SECONDS * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(timeout);
    };
  }, [question, answered, finished, progress]);

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));

  function answer(optionIndex: number) {
    if (answered) {
      return;
    }
    cancelAnimation(progress);
    const seconds = TIME_LIMIT_SECONDS - secondsLeft; // Kaç saniyede cevapladı
    const correct = optionIndex === question.correctIndex;
    const points = answerPoints(correct, seconds);
    setChosen(optionIndex);
    setLastPoints(points);
    if (correct) {
      setCorrectCount((current) => current + 1);
      setScore((current) => current + points);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function next() {
    Haptics.selectionAsync();
    if (index + 1 >= quiz.questions.length) {
      // Sonuç kaydedilir (haftada bir; bu hafta zaten varsa Onur'un saveQuizResult'ı bir şey yapmaz)
      setNewRecord(quizResults.length > 0 && score > bestQuizScore(quizResults));
      saveQuizResult({
        weekKey: quiz.weekKey,
        correctCount,
        score,
        badgeTitle: quizBadge(correctCount).title,
        playedAt: todayString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setChosen(null);
    setSecondsLeft(TIME_LIMIT_SECONDS);
  }

  function findItem(id?: string): ClothingItem | undefined {
    return id ? items.find((item) => item.id === id) : undefined;
  }

  function statusOf(optionIndex: number): OptionStatus {
    if (!answered) return 'idle';
    if (optionIndex === question.correctIndex) return 'correct';
    if (optionIndex === chosen) return 'wrong';
    return 'dim';
  }

  const header = (
    <Stack.Screen
      options={{
        title: "Dolap Kahoot'u",
        headerBackTitle: 'Geri',
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    />
  );

  // Sonuç: yarışma bittiyse ya da bu hafta zaten oynandıysa (test modunda tekrar oynanabilir)
  const saved = quizResults.find((result) => result.weekKey === quiz.weekKey);
  if (finished || (saved && !isTest)) {
    const result = finished ? { correctCount, score } : saved!;
    const badge = quizBadge(result.correctCount);
    const streak = quizStreak(quizResults);
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        {header}
        <ScrollView
          contentContainerStyle={styles.resultContent}
          showsVerticalScrollIndicator={false}>
          <Animated.Text entering={ZoomIn.springify().damping(12)} style={styles.badgeEmoji}>
            {badge.emoji}
          </Animated.Text>
          <Text style={styles.resultLabel}>BU HAFTANIN ROZETİ</Text>
          <Text style={styles.badgeTitle}>{badge.title}</Text>
          <Text style={styles.badgeMessage}>{badge.message}</Text>

          <View style={styles.scoreCard}>
            <View style={styles.scoreCell}>
              <Text style={styles.scoreValue}>{`${result.correctCount}/${QUESTION_COUNT}`}</Text>
              <Text style={styles.scoreLabel}>doğru</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreCell}>
              <Text style={styles.scoreValue}>{result.score}</Text>
              <Text style={styles.scoreLabel}>puan</Text>
            </View>
          </View>

          {newRecord && finished && <Text style={styles.resultNote}>🎉 Yeni rekor!</Text>}
          {streak > 1 && <Text style={styles.resultNote}>{`🔥 ${streak} haftalık seri`}</Text>}
          <Text style={styles.resultMuted}>Gelecek hafta sonu yeni sorular 💌</Text>
        </ScrollView>

        <View style={styles.footerStack}>
          <Pressable
            onPress={() => router.push({ pathname: '/share', params: { kahoot: '1' } })}
            style={({ pressed }) => [styles.nextButton, pressed && styles.nextPressed]}>
            <Text style={styles.nextText}>Story’de paylaş 💖</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.homeLink}>
            <Text style={styles.homeLinkText}>Ana sayfaya dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Soru yok: hafta içi ya da dolap yetersiz
  if (!question) {
    return (
      <View style={styles.center}>
        {header}
        <Text style={styles.bigEmoji}>⏳</Text>
        <Text style={styles.centerTitle}>
          {quiz.blockedMessage ?? 'Kahoot Cumartesi açılıyor, sabırsızlanma aşko 💅'}
        </Text>
      </View>
    );
  }

  const photoItem = findItem(question.photoItemId);
  const photo = photoItem ? photoUri(photoItem.photoFileName) : null;
  const aboutItem = findItem(question.aboutItemId);
  const correctAnswer = answered && chosen === question.correctIndex;
  const feedback =
    chosen === TIMED_OUT
      ? `Süre doldu ⏰ ${question.wrongText}`
      : correctAnswer
        ? question.correctText
        : question.wrongText;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      {header}

      {/* Soru sayısı, kalan saniye ve süre çubuğu */}
      <View style={styles.top}>
        <View style={styles.topRow}>
          <Text style={styles.counter}>{`Soru ${index + 1}/${quiz.questions.length}`}</Text>
          <Text style={[styles.seconds, secondsLeft <= 5 && !answered && styles.secondsLow]}>
            {answered ? `${score} puan` : `⏱ ${secondsLeft} sn`}
          </Text>
        </View>
        <View style={styles.track}>
          <Animated.View style={[styles.bar, barStyle]} />
        </View>
      </View>

      <ScrollView
        key={question.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Soru kartı */}
        <Animated.View entering={FadeIn.duration(250)} style={styles.questionCard}>
          {photo && (
            <View style={styles.zoomFrame}>
              <Image
                source={{ uri: photo }}
                style={[styles.zoomImage, !answered && styles.zoomed]}
                contentFit="cover"
                blurRadius={
                  answered ? 0 : Math.round((MAX_BLUR * secondsLeft) / TIME_LIMIT_SECONDS)
                }
              />
            </View>
          )}
          <View style={styles.promptRow}>
            {aboutItem && <ClothingPhoto item={aboutItem} style={styles.aboutPhoto} />}
            <Text style={styles.prompt}>{question.prompt}</Text>
          </View>
        </Animated.View>

        {/* Şıklar */}
        <View style={styles.options}>
          {question.options.map((option, optionIndex) => (
            <OptionButton
              key={`${question.id}-${optionIndex}`}
              option={option}
              // "Bu parça kim?"de şık fotoğrafı cevabı ele verir: orada sadece adlar
              item={photoItem ? undefined : findItem(option.itemId)}
              status={statusOf(optionIndex)}
              onPress={() => answer(optionIndex)}
            />
          ))}
        </View>

        {/* Açıklama balonu */}
        {answered && (
          <Animated.View
            entering={FadeIn.duration(250)}
            style={[styles.feedback, correctAnswer && styles.feedbackCorrect]}>
            {correctAnswer && <Text style={styles.points}>{`+${lastPoints} puan`}</Text>}
            <Text style={styles.feedbackText}>{feedback}</Text>
          </Animated.View>
        )}
      </ScrollView>

      {answered && (
        <View style={styles.footer}>
          <Pressable
            onPress={next}
            style={({ pressed }) => [styles.nextButton, pressed && styles.nextPressed]}>
            <Text style={styles.nextText}>
              {index + 1 >= quiz.questions.length ? 'Sonucu gör →' : 'Sıradaki →'}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

// Büyük hap şık. Yanlışsa sallanır, doğrusu yeşil yanar, diğerleri soluklaşır
function OptionButton({
  option,
  item,
  status,
  onPress,
}: {
  option: QuizOption;
  item?: ClothingItem;
  status: OptionStatus;
  onPress: () => void;
}) {
  const shake = useSharedValue(0);

  useEffect(() => {
    if (status === 'wrong') {
      shake.set(
        withSequence(
          withTiming(-10, { duration: 50 }),
          withRepeat(withTiming(10, { duration: 80 }), 4, true),
          withTiming(0, { duration: 50 }),
        ),
      );
    }
  }, [status, shake]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));

  return (
    <Animated.View style={shakeStyle}>
      <Pressable
        onPress={onPress}
        disabled={status !== 'idle'}
        accessibilityLabel={option.label}
        style={({ pressed }) => [
          styles.option,
          status === 'correct' && styles.optionCorrect,
          status === 'wrong' && styles.optionWrong,
          status === 'dim' && styles.optionDim,
          pressed && styles.optionPressed,
        ]}>
        {item && <ClothingPhoto item={item} style={styles.optionPhoto} />}
        <Text
          style={[
            styles.optionText,
            (status === 'correct' || status === 'wrong') && styles.optionTextOn,
          ]}
          numberOfLines={2}>
          {option.label}
        </Text>
        {status === 'correct' && <Text style={styles.optionMark}>✓</Text>}
        {status === 'wrong' && <Text style={styles.optionMark}>✕</Text>}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  bigEmoji: {
    fontSize: 56,
    lineHeight: 64,
  },
  centerTitle: {
    ...Typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  top: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counter: {
    ...Typography.label,
    fontSize: 12,
    color: colors.primary,
  },
  seconds: {
    ...Typography.bodyBold,
    color: colors.textSecondary,
  },
  secondsLow: {
    color: colors.primary,
  },
  track: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: colors.primary,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  questionCard: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
    alignItems: 'center',
    ...Shadows.card,
  },
  // "Bu parça kim?" fotoğrafı: çerçeve sabit, içindeki fotoğraf yakınlaştırılmış
  zoomFrame: {
    width: 160,
    aspectRatio: 3 / 4,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
  },
  zoomImage: {
    width: '100%',
    height: '100%',
  },
  zoomed: {
    transform: [{ scale: ZOOM }],
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    alignSelf: 'stretch',
  },
  aboutPhoto: {
    width: 48,
    borderRadius: Radius.sm,
  },
  prompt: {
    ...Typography.title,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  options: {
    gap: Spacing.two,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 56,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  optionPressed: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    transform: [{ scale: 0.98 }],
  },
  optionCorrect: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  optionWrong: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionDim: {
    opacity: 0.45,
  },
  optionPhoto: {
    width: 36,
    borderRadius: Radius.sm - 4,
    marginLeft: -Spacing.two,
  },
  optionText: {
    ...Typography.bodyBold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    flex: 1,
  },
  optionTextOn: {
    color: colors.onPrimary,
  },
  optionMark: {
    ...Typography.heading,
    color: colors.onPrimary,
  },
  // Açıklama balonu: yanlışta açık pembe, doğruda beyaz + yeşil çerçeve
  feedback: {
    backgroundColor: colors.primarySoft,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  feedbackCorrect: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.success,
  },
  points: {
    ...Typography.heading,
    color: colors.success,
  },
  feedbackText: {
    ...Typography.body,
    color: colors.text,
  },
  resultContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  badgeEmoji: {
    fontSize: 88,
    lineHeight: 104,
  },
  resultLabel: {
    ...Typography.label,
    color: colors.primary,
  },
  badgeTitle: {
    ...Typography.hero,
    color: colors.text,
    textAlign: 'center',
  },
  badgeMessage: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  // Doğru sayısı | puan
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.three,
    ...Shadows.card,
  },
  scoreCell: {
    flex: 1,
    alignItems: 'center',
  },
  scoreDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  scoreValue: {
    ...Typography.title,
    color: colors.primary,
  },
  scoreLabel: {
    ...Typography.caption,
    color: colors.textMuted,
  },
  resultNote: {
    ...Typography.heading,
    color: colors.text,
    marginTop: Spacing.one,
  },
  resultMuted: {
    ...Typography.caption,
    color: colors.textMuted,
    marginTop: Spacing.two,
  },
  footerStack: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    gap: Spacing.three,
  },
  homeLink: {
    alignSelf: 'center',
  },
  homeLinkText: {
    ...Typography.bodyBold,
    color: colors.textMuted,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  nextButton: {
    height: 56,
    paddingHorizontal: Spacing.five,
    borderRadius: Radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  nextPressed: {
    backgroundColor: colors.primaryPressed,
  },
  nextText: {
    ...Typography.button,
    fontSize: 16,
    color: colors.onPrimary,
  },
});
