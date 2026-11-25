/**
 * KEŞFET KUTULARI (Ana sayfanın en altı)
 *
 * Ana işin (Giydim → maliyet düşer) dışındaki ekstralar yeni kullanıcıyı boğmasın diye burada,
 * yan yana küçük beyaz kutular: simge dairesi + ad + kısa alt yazı.
 * - Burcun: burç sembolü + burç adı (seçilmediyse "Seç" → burç seçimi), dokununca burç sayfası
 * - Analiz: bu ayın adı → Analizlerin
 * - Alayım mı?: "Hesapla" → Almalı mıyım? (uzun ad kutuda 2 satıra taşıyordu)
 * - Kahoot: sadece hafta sonu (oyun açıkken "Oyna", oynandıysa "Rozetin") ve geliştirirken
 *   (Expo Go, __DEV__) hafta içi "Test" olarak; dolap yetersizse hiç yok
 * (25 Kasım 2026: eski gümüş burç şeridi ve Kahoot satırı – horoscope-strip / kahoot-card – yerine.)
 */

import { useRouter, type Href } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { zodiacGlyph } from '@/components/zodiac-grid';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { weeklyQuiz } from '@/lib/quiz';
import { zodiacSign } from '@/lib/zodiac';

const colors = Colors.light;

type Tile = {
  key: string;
  title: string;
  detail: string;
  href: Href;
  icon?: SFSymbol; // SF simgesi; yoksa `glyph` (burç sembolü) yazılır
  glyph?: string;
};

export function ExploreTiles() {
  const router = useRouter();
  const { items, zodiac, quizResults } = useApp();

  const month = new Date().toLocaleDateString('tr-TR', { month: 'long' });
  const tiles: Tile[] = [
    zodiac
      ? {
          key: 'burc',
          title: 'Burcun',
          detail: zodiac,
          href: '/horoscope',
          glyph: zodiacGlyph(zodiacSign(zodiac).emoji),
        }
      : { key: 'burc', title: 'Burcun', detail: 'Seç', href: '/zodiac', icon: 'sparkles' },
    {
      key: 'analiz',
      title: 'Analiz',
      detail: month.charAt(0).toLocaleUpperCase('tr') + month.slice(1),
      href: '/insights',
      icon: 'chart.bar',
    },
    {
      key: 'almali',
      title: 'Alayım mı?',
      detail: 'Hesapla',
      href: '/should-i-buy',
      icon: 'bag.badge.questionmark',
    },
  ];

  // Kahoot: hafta sonu açıkken ya da bu hafta oynandıysa; geliştirirken hafta içi test için
  const quiz = weeklyQuiz(items);
  const played = quizResults.some((result) => result.weekKey === quiz.weekKey);
  if (!quiz.blockedMessage && (played || quiz.isOpen || __DEV__)) {
    tiles.push({
      key: 'kahoot',
      title: 'Quiz',
      detail: played ? 'Rozetin' : quiz.isOpen ? 'Oyna' : 'Test',
      href: !played && !quiz.isOpen ? { pathname: '/kahoot', params: { test: '1' } } : '/kahoot',
      icon: played ? 'trophy' : 'gamecontroller',
    });
  }

  return (
    <View style={styles.row}>
      {tiles.map((tile) => (
        <Pressable
          key={tile.key}
          onPress={() => router.push(tile.href)}
          accessibilityLabel={`${tile.title}: ${tile.detail}`}
          style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}>
          <View style={styles.icon}>
            {tile.glyph ? (
              <Text style={styles.glyph}>{tile.glyph}</Text>
            ) : (
              tile.icon && <SymbolView name={tile.icon} tintColor={colors.primary} size={17} />
            )}
          </View>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {tile.title}
          </Text>
          <Text style={styles.detail} numberOfLines={1}>
            {tile.detail}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.one,
    ...Shadows.card,
  },
  tilePressed: {
    opacity: 0.7,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.half,
  },
  glyph: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.primary,
  },
  title: {
    ...Typography.caption,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  detail: {
    ...Typography.caption,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
