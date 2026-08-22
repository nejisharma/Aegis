import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { openUrl } from '../../../src/lib/browser';
import { shareLink } from '../../../src/lib/share';
import { Bookmark, BookmarkCheck, Share2 } from 'lucide-react-native';
import { ErrorState } from '../../../src/components/ErrorState';
import { Screen } from '../../../src/components/Screen';
import { ScreenTitle } from '../../../src/components/ScreenTitle';
import { Chip, EmptyState, OfflineBanner, Skeleton, UpdatedAt } from '../../../src/components/ui';
import { useNews } from '../../../src/hooks/useApi';
import { getArticle } from '../../../src/api/endpoints';
import { NEWS_SOURCES } from '../../../src/lib/constants';
import { timeAgo } from '../../../src/lib/format';
import { useSaved } from '../../../src/lib/saved';
import { useColors } from '../../../src/theme/ThemeProvider';
import type { Palette } from '../../../src/theme/palettes';
import { spacing } from '../../../src/theme/spacing';
import type { NewsItem } from '../../../src/api/types';

export default function NewsScreen() {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const [source, setSource] = useState<string | null>(null);
  const { data, error, isLoading, isValidating, isOffline, isNetworkError, updatedAt, mutate } = useNews();
  const saved = useSaved();

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
        <Chip label={saved.items.length ? `Saved (${saved.items.length})` : 'Saved'} active={false} onPress={() => router.push('/saved')} />
      </ScrollView>
      {data ? <UpdatedAt at={updatedAt} refreshing={isValidating} /> : null}
      {isLoading && !data ? (
        <Skeleton lines={8} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <NewsRow item={item} isSaved={saved.has(item.id)} onSave={saved.save} onRemove={saved.remove} />}
          extraData={saved.items}
          refreshControl={<RefreshControl refreshing={isValidating} onRefresh={() => mutate()} tintColor={colors.accent} />}
          ListEmptyComponent={<EmptyState title="No stories" message="Nothing from this source right now." />}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        />
      )}
    </Screen>
  );
}

function NewsRow({
  item,
  isSaved,
  onSave,
  onRemove,
}: {
  item: NewsItem;
  isSaved: boolean;
  onSave: ReturnType<typeof useSaved>['save'];
  onRemove: ReturnType<typeof useSaved>['remove'];
}) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [busy, setBusy] = useState(false);

  const toggleSave = async () => {
    if (busy) return;
    if (isSaved) {
      onRemove(item.id);
      return;
    }
    setBusy(true);
    try {
      const article = await getArticle(item.link);
      await onSave(item, article);
    } catch {
      Alert.alert('Could not save', 'This article could not be fetched for offline reading.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable onPress={() => openUrl(item.link, colors)} style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.surfaceAlt }]}>
      <View style={s.meta}>
        <Text style={s.source}>
          {item.sourceIcon} {item.source}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={s.time}>{timeAgo(item.pubDate)}</Text>
          <Pressable onPress={() => shareLink(item.title, item.link)} hitSlop={10}>
            <Share2 size={14} color={colors.muted} />
          </Pressable>
          {busy ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ width: 14, height: 14 }} />
          ) : (
            <Pressable onPress={toggleSave} hitSlop={10} accessibilityLabel={isSaved ? 'Remove from saved' : 'Save for offline'}>
              {isSaved ? <BookmarkCheck size={14} color={colors.accent} /> : <Bookmark size={14} color={colors.muted} />}
            </Pressable>
          )}
        </View>
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

const makeStyles = (c: Palette) => StyleSheet.create({
  h1: { color: c.text, fontSize: 22, fontWeight: '700', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  chips: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border, gap: 4 },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
  source: { color: c.accent, fontSize: 11, fontWeight: '600' },
  time: { color: c.muted, fontSize: 11 },
  title: { color: c.text, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  desc: { color: c.subtle, fontSize: 12, lineHeight: 17 },
});
