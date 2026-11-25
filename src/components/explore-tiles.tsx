/**
 * KEŞFET (Ana sayfanın en altı)
 *
 * Ana işin (Giydim → maliyet düşer) dışındaki ekstralar, iPhone Ayarları gibi tek beyaz kartta satırlar
 * (TodayGroup / TodayRow – etkinlik satırıyla aynı görünüm):
 * - Burcun: burç sembolü + "Kova · bugünkü yorumun" (seçilmediyse "Seç" → burç seçimi) → burç sayfası
 * - Dolap Quiz: sadece hafta sonu (açıkken "Oyna", oynandıysa "Rozetin") ve geliştirirken (Expo Go,
 *   __DEV__) hafta içi "Test" olarak; dolap yetersizse hiç yok
 * 26 Kasım: "Almalı mıyım?" ve "Analiz" buradan kalktı (ikisi de Cüzdan'da var, iki yerde olmasın);
 * kalan 1-2 şey için yan yana büyük kutular yerine satırlar.
 * (25 Kasım: eski gümüş burç şeridi ve Kahoot satırı – horoscope-strip / kahoot-card – yerine gelmişti.)
 */

import { useRouter, type Href } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { StyleSheet, Text } from 'react-native';

import { IconCircle, TodayGroup, TodayRow } from '@/components/today-row';
import { zodiacGlyph } from '@/components/zodiac-grid';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { weeklyQuiz } from '@/lib/quiz';
import { zodiacSign } from '@/lib/zodiac';

const colors = Colors.light;

type Row = {
  key: string;
  title: string;
  detail: string;
  href: Href;
  icon?: SFSymbol; // SF simgesi; yoksa `glyph` (burç sembolü) yazılır
  glyph?: string;
};

// onOpen: bir satıra dokununca (Ana sayfadaki tanıtım okunu kapatmak için)
export function ExploreTiles({ onOpen }: { onOpen?: () => void }) {
  const router = useRouter();
  const { items, zodiac, quizResults } = useApp();

  const rows: Row[] = [
    zodiac
      ? {
          key: 'burc',
          title: 'Burcun',
          detail: `${zodiac} · bugünkü yorumun ve şanslı rengin`,
          href: '/horoscope',
          glyph: zodiacGlyph(zodiacSign(zodiac).emoji),
        }
      : {
          key: 'burc',
          title: 'Burcun',
          detail: 'Seç, yıldızlar dolabına baksın',
          href: '/zodiac',
          icon: 'sparkles',
        },
  ];

  // Dolap Quiz: hafta sonu açıkken ya da bu hafta oynandıysa; geliştirirken hafta içi test için
  const quiz = weeklyQuiz(items);
  const played = quizResults.some((result) => result.weekKey === quiz.weekKey);
  if (!quiz.blockedMessage && (played || quiz.isOpen || __DEV__)) {
    rows.push({
      key: 'quiz',
      title: 'Dolap Quiz',
      detail: played
        ? 'Bu haftanın rozetini gör'
        : quiz.isOpen
          ? 'Hafta sonu açık · 5 soru, oyna'
          : 'Test (sadece geliştirmede)',
      href: !played && !quiz.isOpen ? { pathname: '/kahoot', params: { test: '1' } } : '/kahoot',
      icon: played ? 'trophy' : 'gamecontroller',
    });
  }

  return (
    <TodayGroup>
      {rows.map((row) => (
        <TodayRow
          key={row.key}
          icon={
            <IconCircle>
              {row.glyph ? (
                <Text style={styles.glyph}>{row.glyph}</Text>
              ) : (
                row.icon && <SymbolView name={row.icon} tintColor={colors.primary} size={18} />
              )}
            </IconCircle>
          }
          title={row.title}
          detail={row.detail}
          onPress={() => {
            onOpen?.();
            router.push(row.href);
          }}
        />
      ))}
    </TodayGroup>
  );
}

const styles = StyleSheet.create({
  glyph: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.primary,
  },
});
