import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { Screen } from '../src/components/Screen';
import { EmptyState, Loading } from '../src/components/ui';
import { timeAgo } from '../src/lib/format';
import { useSaved, type SavedArticle } from '../src/lib/saved';
import { useColors } from '../src/theme/ThemeProvider';
import type { Palette } from '../src/theme/palettes';
import { spacing } from '../src/theme/spacing';

/** ~200 words per minute, ~5 chars per word. */
function readMinutes(length: number): number {
  return Math.max(1, Math.ceil(length / 5 / 200));
}

export default function SavedScreen() {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const { items, loaded, remove } = useSaved();

  return (
    <Screen title="Saved for offline">
      {!loaded ? (
        <Loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => <SavedRow item={item} onOpen={() => router.push({ pathname: '/reader/[id]', params: { id: item.id } })} onRemove={() => remove(item.id)} />}
          ListEmptyComponent={<EmptyState title="Nothing saved yet" message="Tap the bookmark on any story to keep it for offline reading." />}
          contentContainerStyle={{ paddingBottom: spacing.xl, flexGrow: 1 }}
        />
      )}
      <Text style={s.hint}>{items.length ? `${items.length} article${items.length === 1 ? '' : 's'} stored on this device` : ''}</Text>
    </Screen>
  );
}

function SavedRow({ item, onOpen, onRemove }: { item: SavedArticle; onOpen: () => void; onRemove: () => void }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.surfaceAlt }]}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.title} numberOfLines={3}>
          {item.title}
        </Text>
        <Text style={s.meta}>
          {item.source} · saved {timeAgo(item.savedAt)} · {readMinutes(item.length)} min read
        </Text>
      </View>
      <Pressable onPress={onRemove} hitSlop={12} accessibilityLabel="Remove saved article" style={s.trash}>
        <Trash2 size={18} color={colors.muted} />
      </Pressable>
    </Pressable>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  title: { color: c.text, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  meta: { color: c.muted, fontSize: 11 },
  trash: { padding: 6 },
  hint: { color: c.muted, fontSize: 11, textAlign: 'center', paddingVertical: spacing.sm },
});
