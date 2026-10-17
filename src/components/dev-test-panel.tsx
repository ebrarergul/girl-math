/**
 * GEÇİCİ DENEME PANELİ
 *
 * Hafıza merkezinin (AppContext) çalıştığını telefonda görmek için.
 * Gerçek Dolap ekranı yapılınca bu dosya ve explore.tsx'teki <DevTestPanel /> satırı silinecek.
 */

import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp, type NewClothingItem } from '@/context/app-context';
import { comparisonText } from '@/lib/comparisons';
import { backupErrorText, exportBackup, readBackup } from '@/lib/backup';
import { eventCountdownText, eventDayCost } from '@/lib/events';
import { costPerWear, isPaidOff, todayString, wearCount } from '@/lib/girl-math';
import { outfitFor, outfitItems, outfitName, sortOutfits } from '@/lib/outfits';
import { sendTestNotification } from '@/lib/notifications';
import { photoUri, pickAndSavePhoto } from '@/lib/photos';
import { freshAlternatives, lastWearText, repeatWarning, type PlaceName } from '@/lib/places';
import { starbucksIndexMeme, starbucksIndexText } from '@/lib/starbucks-index';
import {
  answerPoints,
  bestQuizScore,
  daysUntilQuiz,
  playedThisWeek,
  quizBadge,
  quizStreak,
  weeklyQuiz,
} from '@/lib/quiz';
import type { ClothingItem } from '@/lib/types';
import { ZODIAC_SIGNS, dailyHoroscope, weeklyHoroscope } from '@/lib/zodiac';

const colors = Colors.light;

export function DevTestPanel() {
  const {
    items,
    isLoaded,
    addItem,
    wearItem,
    undoWear,
    deleteItem,
    outfits,
    saveOutfit,
    toggleFavoriteOutfit,
    deleteOutfit,
    wearOutfit,
    zodiac,
    setZodiac,
    quizResults,
    restoreAll,
  } = useApp();
  const daily = zodiac ? dailyHoroscope(zodiac, items) : null;
  const weekly = zodiac ? weeklyHoroscope(zodiac) : null;

  function addSample() {
    addItem({ name: 'Siyah deri ceket', category: 'Dış giyim', price: 3000, photoFileName: null });
  }

  async function addSampleWithPhoto() {
    const fileName = await pickAndSavePhoto();
    if (!fileName) {
      return; // Kullanıcı vazgeçti
    }
    addItem({ name: 'Pembe elbise', category: 'Elbise', price: 1200, photoFileName: fileName });
  }

  // Renkli örnek dolap: kombin motorunu denemek için
  // Dolapta aynı adlı parça varsa tekrar eklemez; sonunda kaç parça eklendiğini söyler
  function addColoredSamples() {
    const samples: NewClothingItem[] = [
      { name: 'Pembe çanta', category: 'Çanta', price: 900, photoFileName: null, color: 'Pembe' },
      { name: 'Beyaz sneaker', category: 'Ayakkabı', price: 2500, photoFileName: null, color: 'Beyaz' },
      { name: 'Siyah etek', category: 'Alt', price: 700, photoFileName: null, color: 'Siyah' },
      { name: 'Kot pantolon', category: 'Alt', price: 1100, photoFileName: null, color: 'Kot mavisi' },
      { name: 'Beyaz tişört', category: 'Üst', price: 400, photoFileName: null, color: 'Beyaz' },
    ];
    const missing = samples.filter((sample) => !items.some((item) => item.name === sample.name));
    missing.forEach((sample) => addItem(sample));
    Alert.alert(
      missing.length > 0 ? `✅ ${missing.length} parça eklendi` : 'Örnek dolap zaten ekli',
      'Aşağıdaki "Kıyafetler" listesinde görebilirsin.'
    );
  }

  // Etkinlik modu denemesi: etkinliği yarın olan bir kıyafet ekler (bildirimler kurulur)
  function addEventSample() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    addItem({
      name: 'Yeşil saten elbise',
      category: 'Elbise',
      price: 2400,
      photoFileName: null,
      color: 'Yeşil',
      event: { type: 'Düğün', date },
    });
    Alert.alert('🎉 Eklendi', 'Etkinliği yarın: bu akşam 20:00 ve yarın 10:00 bildirim gelecek.');
  }

  // Listedeki ilk kıyafete kombin önerir ve arşive kaydeder
  function suggestAndSaveOutfit() {
    if (items.length === 0) {
      Alert.alert('Dolap boş', 'Önce "🎨 Renkli örnek dolap" ekle.');
      return;
    }
    const outfit = outfitFor(items[0], items);
    saveOutfit(outfit.items.map((item) => item.id));
    const names = outfit.items.map((item) => item.name).join(' + ');
    const missing = outfit.missing.length > 0 ? `\n\nEksik: ${outfit.missing.join(', ')}` : '';
    Alert.alert('✨ Kombin kaydedildi', `${names}\n\n${outfit.text}${missing}`);
  }

  // "Nereye giderken giydin?" denemesi: önce tekrar uyarısına bakar
  function wearAt(item: ClothingItem, place: PlaceName) {
    const warning = repeatWarning(item, place);
    if (!warning) {
      wearItem(item.id, place);
      return;
    }
    const alternatives = freshAlternatives(item, place, items).map((other) => other.name);
    const suggestion =
      alternatives.length > 0 ? `\n\nBunun yerine: ${alternatives.join(' · ')}` : '';
    Alert.alert(warning.level === 'strong' ? '🚨 Dur kızım!' : '💭 Hatırlatma', warning.message + suggestion, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Yine de giy', onPress: () => wearItem(item.id, place) },
    ]);
  }

  async function testExport() {
    const ok = await exportBackup({ items, outfits, zodiac, quizResults });
    if (!ok) {
      Alert.alert('Yedek hazırlanamadı', 'Bu cihazda paylaşım penceresi açılamadı.');
    }
  }

  async function testImport() {
    const read = await readBackup();
    if (!read.ok) {
      if (read.reason !== 'canceled') {
        Alert.alert('Yüklenemedi', backupErrorText(read.reason));
      }
      return;
    }
    Alert.alert(
      '📥 Yedeği yükle?',
      `${read.summary}\n\nŞu anki dolabın silinip yedektekiyle değiştirilecek.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Yükle',
          style: 'destructive',
          onPress: () => {
            const ok = restoreAll(read.backup);
            Alert.alert(ok ? '✅ Dolabın geri geldi!' : 'Bir sorun oldu', ok ? read.summary : 'Mevcut dolabına dokunulmadı.');
          },
        },
      ]
    );
  }

  async function testNotification() {
    const sent = await sendTestNotification();
    if (!sent) {
      Alert.alert('Bildirim izni yok', 'Ayarlar > Expo Go > Bildirimler kısmından izin verebilirsin.');
    }
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>🧪 Deneme paneli (geçici)</Text>

      {!isLoaded && <Text style={styles.muted}>Yükleniyor...</Text>}
      {isLoaded && items.length === 0 && <Text style={styles.muted}>Dolap boş.</Text>}

      <View style={styles.row}>
        <Pressable style={styles.primaryButton} onPress={addSample}>
          <Text style={styles.primaryButtonText}>+ Örnek kıyafet ekle</Text>
        </Pressable>
        <Pressable style={styles.softButton} onPress={addSampleWithPhoto}>
          <Text style={styles.softButtonText}>📷 Fotoğraflı ekle</Text>
        </Pressable>
      </View>
      <Pressable style={styles.softButton} onPress={testNotification}>
        <Text style={styles.softButtonText}>🔔 Test bildirimi (5 sn)</Text>
      </Pressable>
      <View style={styles.row}>
        <Pressable style={styles.softButton} onPress={testExport}>
          <Text style={styles.softButtonText}>📤 Yedeği dışa aktar</Text>
        </Pressable>
        <Pressable style={styles.softButton} onPress={testImport}>
          <Text style={styles.softButtonText}>📥 Yedeği yükle</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>🔮 Burç</Text>
      <View style={styles.row}>
        {ZODIAC_SIGNS.map((sign) => (
          <Pressable
            key={sign.name}
            style={zodiac === sign.name ? styles.primaryButton : styles.softButton}
            onPress={() => setZodiac(sign.name)}>
            <Text style={zodiac === sign.name ? styles.primaryButtonText : styles.softButtonText}>
              {sign.emoji} {sign.name}
            </Text>
          </Pressable>
        ))}
      </View>
      {!zodiac && <Text style={styles.muted}>Burcunu seç, yıldızlar dolabına baksın 🔮</Text>}
      {daily && (
        <View style={styles.card}>
          <Text style={styles.name}>{daily.title}</Text>
          <Text style={styles.muted}>{daily.personality}</Text>
          {daily.lines.map((line) => (
            <Text key={line} style={styles.horoscopeLine}>
              {line}
            </Text>
          ))}
          <Text style={styles.comparison}>🍀 Şanslı rengin: {daily.luckyColor}</Text>
          {daily.suggestion && (
            <>
              <Text style={styles.horoscopeLine}>{daily.suggestion.text}</Text>
              <Text style={styles.muted}>
                → {daily.suggestion.outfit.items.map((item) => item.name).join(' + ')}
              </Text>
            </>
          )}
        </View>
      )}
      {weekly && (
        <View style={styles.card}>
          <Text style={styles.name}>
            {weekly.title} ({weekly.range})
          </Text>
          <Text style={styles.horoscopeLine}>{weekly.love}</Text>
          <Text style={styles.horoscopeLine}>{weekly.money}</Text>
          <Text style={styles.horoscopeLine}>{weekly.wardrobe}</Text>
        </View>
      )}

      <DevQuiz />

      <Text style={styles.title}>👗 Kombin arşivi</Text>
      <View style={styles.row}>
        <Pressable style={styles.softButton} onPress={addColoredSamples}>
          <Text style={styles.softButtonText}>🎨 Renkli örnek dolap</Text>
        </Pressable>
        <Pressable style={styles.softButton} onPress={addEventSample}>
          <Text style={styles.softButtonText}>🎉 Yarın etkinlikli örnek</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={suggestAndSaveOutfit}>
          <Text style={styles.primaryButtonText}>✨ Kombin öner + kaydet</Text>
        </Pressable>
      </View>
      {outfits.length === 0 && <Text style={styles.muted}>Arşiv boş.</Text>}
      {sortOutfits(outfits).map((outfit) => (
        <View key={outfit.id} style={styles.card}>
          <Text style={styles.name}>
            {outfit.favorite ? '⭐ ' : ''}
            {outfitName(outfit, items)}
          </Text>
          <Text style={styles.muted}>
            {outfitItems(outfit, items)
              .map((item) => item.name)
              .join(' + ')}
          </Text>
          <Text style={styles.muted}>Kombin olarak giyilme: {outfit.wornDates.length}</Text>
          <View style={styles.row}>
            <Pressable style={styles.primaryButton} onPress={() => wearOutfit(outfit.id)}>
              <Text style={styles.primaryButtonText}>👗 Bu kombini giydim</Text>
            </Pressable>
            <Pressable style={styles.softButton} onPress={() => toggleFavoriteOutfit(outfit.id)}>
              <Text style={styles.softButtonText}>{outfit.favorite ? '☆' : '⭐'}</Text>
            </Pressable>
            <Pressable style={styles.softButton} onPress={() => deleteOutfit(outfit.id)}>
              <Text style={styles.softButtonText}>Sil</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Text style={styles.title}>👚 Kıyafetler</Text>

      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          {item.photoFileName && (
            <Image source={{ uri: photoUri(item.photoFileName) }} style={styles.photo} />
          )}
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.priceStrike}>{item.price} TL</Text>
          <Text style={styles.muted}>{starbucksIndexText(item.price)}</Text>
          <Text style={styles.muted}>{starbucksIndexMeme(item.price)}</Text>
          <Text style={styles.price}>Giyim başına: {costPerWear(item)} TL</Text>
          {lastWearText(item) && <Text style={styles.muted}>📍 {lastWearText(item)}</Text>}
          {eventCountdownText(item) && (
            <Text style={styles.horoscopeLine}>
              {eventCountdownText(item)} (bugün gösterilen maliyet: {eventDayCost(item)} TL)
            </Text>
          )}
          <Text style={styles.muted}>
            Giyilme: {wearCount(item)} / {item.targetWears}
            {isPaidOff(item) ? ' · Amorti edildi 🎉' : ''}
          </Text>
          {wearCount(item) > 0 && (
            <Text style={styles.comparison}>{comparisonText(costPerWear(item))}</Text>
          )}

          <View style={styles.row}>
            <Pressable style={styles.primaryButton} onPress={() => wearItem(item.id)}>
              <Text style={styles.primaryButtonText}>Giydim</Text>
            </Pressable>
            <Pressable style={styles.softButton} onPress={() => wearAt(item, 'Okul')}>
              <Text style={styles.softButtonText}>🎓 Okul</Text>
            </Pressable>
            <Pressable style={styles.softButton} onPress={() => undoWear(item.id)}>
              <Text style={styles.softButtonText}>Geri al</Text>
            </Pressable>
            <Pressable style={styles.softButton} onPress={() => deleteItem(item.id)}>
              <Text style={styles.softButtonText}>Sil</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

// Şu anki zaman (milisaniye). Sadece butona basınca çağrılır.
function nowMs(): number {
  return Date.now();
}

// Mini Dolap Kahoot'u (geçici deneme). Hafta içiyse yaklaşan Cumartesi'nin sorularıyla dener.
function DevQuiz() {
  const { items, quizResults, saveQuizResult } = useApp();
  const [step, setStep] = useState<number | null>(null); // null: başlamadı
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startedAt, setStartedAt] = useState(0);

  const today = new Date();
  const quizDate = new Date(today);
  quizDate.setDate(today.getDate() + daysUntilQuiz(today)); // Hafta içiyse yaklaşan Cumartesi
  const quiz = weeklyQuiz(items, quizDate);
  const played = playedThisWeek(quizResults, quizDate);
  const question = step !== null ? quiz.questions[step] : null;

  function start() {
    setStep(0);
    setScore(0);
    setCorrectCount(0);
    setStartedAt(nowMs());
  }

  function answer(index: number) {
    if (step === null || !question) {
      return;
    }
    const seconds = (nowMs() - startedAt) / 1000;
    const correct = index === question.correctIndex && seconds <= 15;
    const nextScore = score + answerPoints(correct, seconds);
    const nextCorrect = correctCount + (correct ? 1 : 0);
    setScore(nextScore);
    setCorrectCount(nextCorrect);
    const isLast = step === quiz.questions.length - 1;
    Alert.alert(correct ? '✅ Doğru!' : seconds > 15 ? '⏰ Süre doldu' : '❌ Yanlış', correct ? question.correctText : question.wrongText, [
      {
        text: isLast ? 'Sonucu gör' : 'Sıradaki',
        onPress: () => {
          if (!isLast) {
            setStep(step + 1);
            setStartedAt(nowMs());
            return;
          }
          const badge = quizBadge(nextCorrect);
          saveQuizResult({
            weekKey: quiz.weekKey,
            correctCount: nextCorrect,
            score: nextScore,
            badgeTitle: badge.title,
            playedAt: todayString(),
          });
          setStep(null);
          Alert.alert(`${badge.emoji} ${badge.title}`, `${nextCorrect}/5 doğru · ${nextScore} puan\n\n${badge.message}`);
        },
      },
    ]);
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{"🎯 Dolap Kahoot'u"}</Text>
      <Text style={styles.muted}>
        {quiz.isOpen ? 'Bugün açık!' : `Normalde ${quiz.daysUntilOpen} gün sonra açılıyor (test için Cumartesi soruları)`}
        {' · '}Seri: {quizStreak(quizResults)} hafta 🔥 · En yüksek: {bestQuizScore(quizResults)}
      </Text>
      {quiz.blockedMessage && <Text style={styles.muted}>{quiz.blockedMessage}</Text>}
      {!quiz.blockedMessage && played && step === null && (
        <Text style={styles.muted}>{"Bu haftanın Kahoot'unu oynadın ✅ Gelecek hafta yenileri gelir."}</Text>
      )}
      {!quiz.blockedMessage && !played && step === null && (
        <Pressable style={styles.primaryButton} onPress={start}>
          <Text style={styles.primaryButtonText}>🎯 Başla (5 soru)</Text>
        </Pressable>
      )}
      {question && (
        <View style={styles.card}>
          <Text style={styles.muted}>Soru {step! + 1}/5 · 15 saniye · Puan: {score}</Text>
          {question.photoItemId && (
            <Image
              source={{ uri: photoUri(items.find((item) => item.id === question.photoItemId)?.photoFileName ?? null) }}
              style={styles.photo}
              blurRadius={8}
            />
          )}
          <Text style={styles.name}>{question.prompt}</Text>
          {question.options.map((option, index) => (
            <Pressable key={option.label + index} style={styles.softButton} onPress={() => answer(index)}>
              <Text style={styles.softButtonText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
  },
  title: {
    ...Typography.heading,
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
    ...Shadows.card,
  },
  photo: {
    width: 120,
    aspectRatio: 3 / 4,
    borderRadius: Radius.md,
    marginBottom: Spacing.two,
  },
  name: {
    ...Typography.bodyBold,
    color: colors.text,
  },
  priceStrike: {
    ...Typography.priceStrike,
    color: colors.textMuted,
  },
  price: {
    ...Typography.price,
    color: colors.primary,
  },
  comparison: {
    ...Typography.bodyBold,
    color: colors.primary,
  },
  horoscopeLine: {
    ...Typography.body,
    color: colors.text,
  },
  muted: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
    marginTop: Spacing.two,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    alignSelf: 'flex-start',
  },
  primaryButtonText: {
    ...Typography.button,
    color: colors.onPrimary,
  },
  softButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  softButtonText: {
    ...Typography.button,
    color: colors.primary,
  },
});
