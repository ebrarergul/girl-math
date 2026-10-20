/**
 * PAYLAŞ (önizleme + paylaşım)
 *
 * Paylaşılabilir kartın önizlemesini gösterir. "Story'de paylaş" butonu kartın fotoğrafını
 * çeker (react-native-view-shot) ve iPhone'un paylaşım penceresini açar (expo-sharing).
 * Açılış:
 *   router.push({ pathname: '/share', params: { id: item.id } })  // kıyafet kartı
 *   router.push('/share')                                         // dolap kartı
 *   router.push({ pathname: '/share', params: { kahoot: '1' } })  // bu haftanın Kahoot rozeti
 *   router.push({ pathname: '/share', params: { month: '1' } })   // bu ayın özeti (Analizlerin)
 */

import * as Sharing from 'expo-sharing';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import {
  ItemShareCard,
  KahootShareCard,
  MonthlyShareCard,
  WardrobeShareCard,
} from '@/components/share-card';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { colorStats, monthlySummary } from '@/lib/insights';
import { quizStreak, quizWeekKey } from '@/lib/quiz';
import { getWardrobeStats } from '@/lib/stats';

const colors = Colors.light;

export default function ShareScreen() {
  const { id, kahoot, month } = useLocalSearchParams<{
    id?: string;
    kahoot?: string;
    month?: string;
  }>();
  const { items, quizResults } = useApp();
  const item = id ? items.find((current) => current.id === id) : undefined;
  const quizResult =
    kahoot === '1' ? quizResults.find((result) => result.weekKey === quizWeekKey()) : undefined;
  const monthColors = colorStats(items, 'month');
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Önizleme ekrana sığsın: hem genişliğe hem yüksekliğe göre sınırla
  const cardWidth = Math.min(screenWidth - Spacing.five * 2, (screenHeight * 0.62 * 9) / 16);

  const cardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);

  async function handleShare() {
    if (isSharing) return;
    setIsSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Paylaşım bu cihazda kullanılamıyor');
        return;
      }
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        UTI: 'public.png',
        dialogTitle: 'Girl Math kartını paylaş',
      });
    } catch (error) {
      console.warn('Kart paylaşılamadı:', error);
      Alert.alert('Kart paylaşılamadı', 'Bir sorun oldu, tekrar dener misin?');
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Paylaş',
          headerBackTitle: 'Geri',
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />

      <View style={styles.preview}>
        {/* collapsable={false}: Android'de kutu "görünmez" sayılıp fotoğrafı çekilemez olmasın */}
        <View ref={cardRef} collapsable={false} style={styles.cardShadow}>
          {month === '1' ? (
            <MonthlyShareCard
              summary={monthlySummary(items)}
              colorText={monthColors.shares.length > 0 ? monthColors.text : null}
              width={cardWidth}
            />
          ) : quizResult ? (
            <KahootShareCard
              result={quizResult}
              streak={quizStreak(quizResults)}
              width={cardWidth}
            />
          ) : item ? (
            <ItemShareCard item={item} width={cardWidth} />
          ) : (
            <WardrobeShareCard stats={getWardrobeStats(items)} width={cardWidth} />
          )}
        </View>
        <Text style={styles.hint}>Instagram Story, TikTok ya da WhatsApp için hazır ✨</Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={handleShare}
          disabled={isSharing}
          style={({ pressed }) => [
            styles.button,
            isSharing && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}>
          <Text style={styles.buttonText}>
            {isSharing ? 'Hazırlanıyor…' : 'Story’de paylaş 💖'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  preview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  cardShadow: {
    borderRadius: Radius.xl,
    ...Shadows.button,
  },
  hint: {
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
  buttonDisabled: {
    opacity: 0.6,
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
