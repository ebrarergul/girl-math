/**
 * DOLAP EKRANI
 *
 * Dolaptaki kıyafetleri 2 sütunlu kartlar halinde gösterir. Üstte arama kutusu, sıralama
 * butonu ve kategori hapları var. Dolap boşsa "ilk parçanı ekle" mesajı çıkar.
 * Karta basılı tutunca hızlı Giydim (Ana sayfa şeridiyle aynı kural: tekrar basılı tutunca geri al).
 */

import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClothingCard } from '@/components/clothing-card';
import { useQuickWear } from '@/components/quick-wear';
import { ScreenBackground } from '@/components/screen-background';
import { BottomTabInset, Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { isPaidOff, wearCount } from '@/lib/girl-math';
import { CATEGORIES, type Category, type ClothingItem } from '@/lib/types';

const colors = Colors.light;

// "Tümü" hapı seçiliyken kategori filtresi yok demektir
const ALL = 'Tümü' as const;
const FILTERS = [ALL, ...CATEGORIES];

// Sıralama seçenekleri. "newest" varsayılan: kıyafetler zaten en yeni en başta geliyor.
type SortKey = 'newest' | 'priceDesc' | 'leastWorn' | 'closest';
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'En yeni' },
  { key: 'priceDesc', label: 'En pahalı' },
  { key: 'leastWorn', label: 'En az giyilen' },
  { key: 'closest', label: 'Amortiye en yakın' },
];

// Hedefe kaç giyim kaldı; amorti edilenler en sona gitsin diye çok büyük sayı sayılır
function remainingWears(item: ClothingItem): number {
  return isPaidOff(item) ? Number.MAX_SAFE_INTEGER : item.targetWears - wearCount(item);
}

function sortItems(list: ClothingItem[], sort: SortKey): ClothingItem[] {
  const copy = [...list];
  switch (sort) {
    case 'priceDesc':
      return copy.sort((a, b) => b.price - a.price);
    case 'leastWorn':
      // Eşitlikte pahalı olan önce: en çok "zarar yazan" parça en üstte
      return copy.sort((a, b) => wearCount(a) - wearCount(b) || b.price - a.price);
    case 'closest':
      return copy.sort((a, b) => remainingWears(a) - remainingWears(b));
    default:
      return copy;
  }
}

export default function WardrobeScreen() {
  const router = useRouter();
  const { items, isLoaded } = useApp();
  const { toggleWear, toastView } = useQuickWear();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | typeof ALL>(ALL);
  const [sort, setSort] = useState<SortKey>('newest');

  // iPhone'un kendi seçim penceresiyle sıralama seçtirir
  function openSortMenu() {
    Alert.alert('Sırala', undefined, [
      ...SORTS.map((option) => ({
        text: option.key === sort ? `✓ ${option.label}` : option.label,
        onPress: () => setSort(option.key),
      })),
      { text: 'Vazgeç', style: 'cancel' as const },
    ]);
  }

  // Önce kategoriye, sonra arama yazısına göre süz (büyük/küçük harf fark etmez)
  const query = search.trim().toLocaleLowerCase('tr');
  const filtered = sortItems(items, sort).filter(
    (item) =>
      (category === ALL || item.category === category) &&
      item.name.toLocaleLowerCase('tr').includes(query),
  );
  const isFiltering = query !== '' || category !== ALL;

  // Tek sayıda kıyafet varsa son kart tüm satırı kaplamasın diye sona boş bir yer eklenir
  const data: (ClothingItem | null)[] =
    filtered.length % 2 === 1 ? [...filtered, null] : filtered;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <FlatList
          data={data}
          keyExtractor={(item, index) => item?.id ?? `bos-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View style={styles.titleText}>
                  <Text style={styles.label}>GIRL MATH</Text>
                  <Text style={styles.title}>Dolabım</Text>
                  {isLoaded && items.length > 0 && (
                    <Text style={styles.subtitle}>
                      {items.length} parça · Basılı tut, Giydim sayılsın
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={() => router.push('/add-item')}
                  accessibilityLabel="Yeni parça ekle"
                  style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
                  <SymbolView
                    name={{ ios: 'plus', android: 'add', web: 'add' }}
                    tintColor={colors.onPrimary}
                    size={22}
                    weight="bold"
                  />
                </Pressable>
              </View>

              <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                  <SymbolView
                    name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                    tintColor={colors.textMuted}
                    size={18}
                  />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Dolabında ara"
                    placeholderTextColor={colors.textMuted}
                    style={styles.searchInput}
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                  />
                </View>
                {/* Sıralama butonu: varsayılan dışında bir sıralama seçiliyse pembe olur */}
                <Pressable
                  onPress={openSortMenu}
                  accessibilityLabel="Sırala"
                  style={({ pressed }) => [
                    styles.sortButton,
                    sort !== 'newest' && styles.sortButtonActive,
                    pressed && styles.sortButtonPressed,
                  ]}>
                  <SymbolView
                    name={{ ios: 'arrow.up.arrow.down', android: 'sort', web: 'sort' }}
                    tintColor={sort !== 'newest' ? colors.onPrimary : colors.text}
                    size={18}
                    weight="semibold"
                  />
                </Pressable>
              </View>
              {sort !== 'newest' && (
                <Text style={styles.sortNote}>
                  Sıralama: {SORTS.find((option) => option.key === sort)?.label}
                </Text>
              )}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
                contentContainerStyle={styles.chips}>
                {FILTERS.map((name) => {
                  const selected = name === category;
                  return (
                    <Pressable
                      key={name}
                      onPress={() => setCategory(name)}
                      style={[styles.chip, selected && styles.chipSelected]}>
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <SymbolView
                  name={
                    !isLoaded
                      ? { ios: 'hourglass', android: 'hourglass_empty', web: 'hourglass_empty' }
                      : isFiltering
                        ? { ios: 'magnifyingglass', android: 'search', web: 'search' }
                        : { ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' }
                  }
                  tintColor={colors.primary}
                  size={34}
                  weight="light"
                />
              </View>
              <Text style={styles.emptyTitle}>
                {!isLoaded
                  ? 'Dolabın açılıyor…'
                  : isFiltering
                    ? 'Bu aramada parça yok'
                    : 'Dolabın şimdilik boş'}
              </Text>
              {isLoaded && !isFiltering && (
                <Text style={styles.emptyText}>
                  İlk parçanı ekle, her giydiğinde maliyeti nasıl düştüğünü gör.
                </Text>
              )}
              {isLoaded && !isFiltering && (
                <Pressable
                  onPress={() => router.push('/add-item')}
                  style={({ pressed }) => [styles.emptyButton, pressed && styles.addButtonPressed]}>
                  <Text style={styles.emptyButtonText}>İlk parçanı ekle</Text>
                </Pressable>
              )}
            </View>
          }
          renderItem={({ item }) =>
            item ? (
              <ClothingCard
                item={item}
                onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                onLongPress={() => toggleWear(item)}
              />
            ) : (
              <View style={styles.spacer} />
            )
          }
        />
        {toastView}
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four, // Diğer ekranlarla aynı kenar boşluğu (kartlar başlıkla hizalı)
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  row: {
    gap: Spacing.three,
  },
  header: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.one,
    gap: Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  titleText: {
    gap: Spacing.one,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  addButtonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.95 }],
  },
  emptyButton: {
    marginTop: Spacing.three,
    backgroundColor: colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    ...Shadows.button,
  },
  emptyButtonText: {
    ...Typography.button,
    color: colors.onPrimary,
  },
  label: {
    ...Typography.label,
    color: colors.primary,
  },
  title: {
    ...Typography.title,
    color: colors.text,
  },
  subtitle: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: colors.card,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    ...Shadows.card,
  },
  sortButton: {
    width: 50,
    height: 50,
    borderRadius: Radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  sortButtonActive: {
    backgroundColor: colors.primary,
  },
  sortButtonPressed: {
    transform: [{ scale: 0.94 }],
  },
  sortNote: {
    ...Typography.caption,
    color: colors.primary,
    marginTop: Spacing.two,
    marginLeft: Spacing.two,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: colors.text,
    paddingVertical: Spacing.three,
  },
  // Hap sırası ekranın iki kenarına kadar uzansın diye listenin iç boşluğu kadar dışarı
  // taşırılır; ilk hap yine başlıkla aynı hizada başlar
  chipScroll: {
    marginHorizontal: -Spacing.four,
  },
  chips: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  chip: {
    backgroundColor: colors.card,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...Typography.bodyBold,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.onPrimary,
  },
  spacer: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    gap: Spacing.two,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    ...Typography.heading,
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
