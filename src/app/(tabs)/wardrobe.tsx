/**
 * DOLAP EKRANI
 *
 * Dolaptaki kıyafetleri 2 sütunlu kartlar halinde gösterir. Üstte arama kutusu ve
 * kategori hapları var. Dolap boşsa "ilk parçanı ekle" mesajı çıkar.
 */

import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClothingCard } from '@/components/clothing-card';
import { BottomTabInset, Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { CATEGORIES, type Category, type ClothingItem } from '@/lib/types';

const colors = Colors.light;

// "Tümü" hapı seçiliyken kategori filtresi yok demektir
const ALL = 'Tümü' as const;
const FILTERS = [ALL, ...CATEGORIES];

export default function WardrobeScreen() {
  const router = useRouter();
  const { items, isLoaded } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | typeof ALL>(ALL);

  // Önce kategoriye, sonra arama yazısına göre süz (büyük/küçük harf fark etmez)
  const query = search.trim().toLocaleLowerCase('tr');
  const filtered = items.filter(
    (item) =>
      (category === ALL || item.category === category) &&
      item.name.toLocaleLowerCase('tr').includes(query),
  );
  const isFiltering = query !== '' || category !== ALL;

  // Tek sayıda kıyafet varsa son kart tüm satırı kaplamasın diye sona boş bir yer eklenir
  const data: (ClothingItem | null)[] =
    filtered.length % 2 === 1 ? [...filtered, null] : filtered;

  return (
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
                  <Text style={styles.subtitle}>{items.length} parça</Text>
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
            />
          ) : (
            <View style={styles.spacer} />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  row: {
    gap: Spacing.three,
  },
  header: {
    paddingHorizontal: Spacing.two,
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: colors.card,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.three,
    ...Shadows.card,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: colors.text,
    paddingVertical: Spacing.three,
  },
  // Hap sırası ekranın iki kenarına kadar uzansın diye listenin ve başlığın iç boşluğu kadar
  // dışarı taşırılır; ilk hap yine başlıkla aynı hizada başlar
  chipScroll: {
    marginHorizontal: -(Spacing.three + Spacing.two),
  },
  chips: {
    paddingHorizontal: Spacing.three + Spacing.two,
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
