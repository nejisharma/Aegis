import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { openUrl } from '../../../src/lib/browser';
import { ErrorState } from '../../../src/components/ErrorState';
import { Screen } from '../../../src/components/Screen';
import { ScreenTitle } from '../../../src/components/ScreenTitle';
import { Chip, EmptyState, OfflineBanner, Skeleton } from '../../../src/components/ui';
import { useNews } from '../../../src/hooks/useApi';
import { NEWS_SOURCES } from '../../../src/lib/constants';
import { timeAgo } from '../../../src/lib/format';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import type { NewsItem } from '../../../src/api/types';

export default function NewsScreen() {
  const [source, setSource] = useState<string | null>(null);
  const { data, error, isLoading, isValidating, isOffline, isNetworkError, mutate } = useNews();

  const items = useMemo(() => {
    const all = data?.items ?? [];
    return source ? all.filter((i) => i.source === source) : all;
  }, [data, source]);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenTitle title="Security News" />
      <OfflineBanner visible={isOffline} networkError={isNetworkError} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={{ flexGrow: 0, height: 52 }}>
        <Chip label="All" active={source === null} onPress={() => setSource(null)} />
        {NEWS_SOURCES.map((src) => (
          <Chip key={src} label={src} active={source === src} onPress={() => setSource(src)} />
        ))}
      </ScrollView>
      {isLoading && !data ? (
        <Skeleton lines={8} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <NewsRow item={item} />}
          refreshControl={<RefreshControl refreshing={isValidating} onRefresh={() => mutate()} tintColor={colors.accent} />}
          ListEmptyComponent={<EmptyState title="No stories" message="Nothing from this source right now." />}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        />
      )}
    </Screen>
  );
}

function NewsRow({ item }: { item: NewsItem }) {
  return (
    <Pressable onPress={() => openUrl(item.link)} style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.surfaceAlt }]}>
      <View style={s.meta}>
        <Text style={s.source}>
          {item.sourceIcon} {item.source}
        </Text>
        <Text style={s.time}>{timeAgo(item.pubDate)}</Text>
      </View>
      <Text style={s.title}>{item.title}</Text>
      {item.description ? (
        <Text style={s.desc} numberOfLines={3}>
          {item.description}
        </Text>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  h1: { color: colors.text, fontSize: 22, fontWeight: '700', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  chips: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, gap: 4 },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
  source: { color: colors.accent, fontSize: 11, fontWeight: '600' },
  time: { color: colors.muted, fontSize: 11 },
  title: { color: colors.text, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  desc: { color: colors.subtle, fontSize: 12, lineHeight: 17 },
});
