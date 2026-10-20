/**
 * "ETKİNLİK İÇİN ALDIM" ALANI (ekleme / düzenleme formu)
 *
 * Zaman Aşımı = Bedava (Onur'un events.ts'i): anahtar açılınca etkinlik türü hapları (sadece ad,
 * emoji yok: kategori haplarıyla aynı dil; EVENT_TYPES), "Diğer"de ad kutusu ve iPhone'un tarih seçicisi (@react-native-community/
 * datetimepicker, "compact": küçük tarih hapı, dokununca takvim açılır) gelir.
 * Bilgiyi form tutar; bu bileşen sadece gösterir ve değişiklikleri bildirir.
 */

import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { EVENT_TYPES, type EventTypeName } from '@/lib/events';

const colors = Colors.light;

// "2026-12-05" ↔ Date (yerel saatle; saat dilimi yüzünden gün kaymasın)
export function dateFromString(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function stringFromDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

type Props = {
  enabled: boolean;
  type: EventTypeName | null;
  date: string;
  customName: string;
  onToggle: (enabled: boolean) => void;
  onTypeChange: (type: EventTypeName) => void;
  onDateChange: (date: string) => void;
  onCustomNameChange: (name: string) => void;
};

export function EventPicker({
  enabled,
  type,
  date,
  customName,
  onToggle,
  onTypeChange,
  onDateChange,
  onCustomNameChange,
}: Props) {
  return (
    <View style={styles.box}>
      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.title}>Etkinlik için aldım</Text>
          <Text style={styles.hint}>
            O gün maliyeti 0 TL görünür (parası çoktan ödendi!) ve bir gün önce hatırlatırım
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={(next) => {
            Haptics.selectionAsync();
            onToggle(next);
          }}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>

      {enabled && (
        <>
          <View style={styles.chips}>
            {EVENT_TYPES.map((event) => {
              const selected = event.name === type;
              return (
                // Her hap eşit genişlikte bir hücrede: haplar sütun sütun hizalı durur
                <View key={event.name} style={styles.chipCell}>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      onTypeChange(event.name);
                    }}
                    style={[styles.chip, selected && styles.chipSelected]}>
                    <Text
                      style={[styles.chipText, selected && styles.chipTextSelected]}
                      numberOfLines={1}
                      adjustsFontSizeToFit>
                      {event.name}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {type === 'Diğer' && (
            <TextInput
              value={customName}
              onChangeText={onCustomNameChange}
              placeholder="Etkinliğin adı (örn: Ece'nin partisi)"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              maxLength={30}
            />
          )}

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Tarihi</Text>
            <DateTimePicker
              value={dateFromString(date)}
              mode="date"
              display="compact"
              locale="tr-TR"
              accentColor={colors.primary}
              themeVariant="light"
              onChange={(_, selected) => {
                if (selected) {
                  onDateChange(stringFromDate(selected));
                }
              }}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  switchText: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    ...Typography.bodyBold,
    fontSize: 16,
    color: colors.text,
  },
  hint: {
    ...Typography.caption,
    color: colors.textMuted,
  },
  // 3 sütunlu ızgara: hücre %33, aradaki boşluk hücrelerin iç payından (kenarlar hizalı kalsın
  // diye ızgara o pay kadar dışarı taşırılır)
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.one,
    rowGap: Spacing.two,
  },
  chipCell: {
    width: '33.333%',
    paddingHorizontal: Spacing.one,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: Spacing.one, // Hücre eşit genişlikte, yazı ortalı: yan pay az (uzun adlar küçülmesin)
    paddingVertical: Spacing.one + Spacing.half, // Dolap'taki haplarla aynı boy
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
  input: {
    ...Typography.body,
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLabel: {
    ...Typography.bodyBold,
    color: colors.text,
  },
});
