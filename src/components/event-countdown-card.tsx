/**
 * ETKİNLİK GERİ SAYIMI (Ana sayfa, "Senin için" kartında bir satır)
 *
 * Zaman Aşımı = Bedava: etkinliğine 7 gün ya da daha az kalmış parçalardan en yakını.
 * Solda takvim simgesi, ortada etkinlik adı ("Düğün") ve altında
 * "3 gün kaldı · “Elbise”" / "Yarın · “Elbise”" / "Bugün · “Elbise” bedava", sağda ok.
 * Etkinlik günü simge ve yazı yeşil (bedava). Dokununca kıyafetin detayı açılır.
 * Yakında etkinlik yoksa hiçbir şey göstermez.
 */

import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text } from 'react-native';

import { IconCircle, TodayRow, todayDetailStyle } from '@/components/today-row';
import { Colors } from '@/constants/theme';
import { eventStatus } from '@/lib/events';
import type { ClothingItem } from '@/lib/types';

const colors = Colors.light;

// Ana sayfada kaç gün kala görünmeye başlar
const SHOW_DAYS_BEFORE = 7;

// Kalan gün: bugün 0, yarın 1, ileride gün sayısı; geçtiyse ya da etkinlik yoksa null
function daysLeft(item: ClothingItem): number | null {
  const status = eventStatus(item);
  if (!status) return null;
  if (status.kind === 'today') return 0;
  if (status.kind === 'tomorrow') return 1;
  if (status.kind === 'upcoming') return status.days;
  return null;
}

export function EventCountdownCard({ items }: { items: ClothingItem[] }) {
  const router = useRouter();

  const next = items
    .map((item) => ({ item, days: daysLeft(item) }))
    .filter(
      (entry): entry is { item: ClothingItem; days: number } =>
        entry.days !== null && entry.days <= SHOW_DAYS_BEFORE,
    )
    .sort((a, b) => a.days - b.days)[0];
  const event = next?.item.event;
  if (!next || !event) {
    return null;
  }

  const today = next.days === 0;
  // Emoji yok: "Diğer"de kullanıcının yazdığı ad, yoksa tür adı
  const title =
    event.type === 'Diğer' && event.customName?.trim() ? event.customName.trim() : event.type;
  const name = `“${next.item.name}”`;
  const detail = today
    ? `Bugün · ${name} bedava`
    : next.days === 1
      ? `Yarın · ${name}`
      : `${next.days} gün kaldı · ${name}`;

  return (
    <TodayRow
      icon={
        <IconCircle>
          <SymbolView
            name={today ? 'gift' : 'calendar'}
            tintColor={today ? colors.success : colors.primary}
            size={18}
          />
        </IconCircle>
      }
      title={title}
      detail={
        <Text style={[todayDetailStyle, today && styles.today]} numberOfLines={1}>
          {detail}
        </Text>
      }
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: next.item.id } })}
    />
  );
}

const styles = StyleSheet.create({
  // Etkinlik günü: yeşil yazı ("bugün bedava")
  today: {
    color: colors.success,
  },
});
