import { useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ErrorState } from '../src/components/ErrorState';
import { Screen } from '../src/components/Screen';
import { SearchBar } from '../src/components/SearchBar';
import { EmptyState, ListRow, OfflineBanner, Pill, SectionHeader, Skeleton, StatCard, UpdatedAt } from '../src/components/ui';
import { useKev } from '../src/hooks/useApi';
import { addedWithinDays } from '../src/lib/exploit';
import { shortDate } from '../src/lib/format';
import { useColors } from '../src/theme/ThemeProvider';
import type { Palette } from '../src/theme/palettes';
import { spacing } from '../src/theme/spacing';
import type { KevItem } from '../src/api/types';

export default function KevScreen() {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data, error, isLoading, isValidating, isOffline, isNetworkError, updatedAt, mutate } = useKev();

  const items = data?.items ?? [];
  const addedThisWeek = useMemo(() => items.filter((k) => addedWithinDays(k.dateAdded, 7)).length, [items]);
  const ransomware = useMemo(() => items.filter((k) => k.knownRansomwareCampaignUse === 'Known').length, [items]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((k) =>
      [k.cveID, k.vendorProject, k.product, k.vulnerabilityName].some((f) => f.toLowerCase().includes(q)),
    );
  }, [items, query]);

  return (
    <Screen scroll title="CISA KEV" refreshControl={<RefreshControl refreshing={!!data && isValidating} onRefresh={() => mutate()} tintColor={colors.accent} />}>
      <OfflineBanner visible={isOffline} networkError={isNetworkError} />
      {data ? <UpdatedAt at={updatedAt} refreshing={isValidating} /> : null}
      {isLoading && !data ? (
        <Skeleton lines={8} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : !data ? null : (
        <View style={{ paddingBottom: spacing.xl }}>
          <View style={s.stats}>
            <StatCard label="In catalog" value={data.count.toLocaleString()} color={colors.critical} />
            <StatCard label="Added 7 days" value={addedThisWeek} color={colors.high} />
            <StatCard label="Ransomware" value={ransomware} color={colors.medium} />
          </View>
          <View style={s.search}>
            <SearchBar value={query} onChangeText={setQuery} placeholder="Filter by CVE, vendor, product…" />
          </View>
          <SectionHeader title={query ? `${filtered.length} matches` : `Latest ${items.length} additions`} />
          {filtered.length === 0 ? (
            <EmptyState title="No matches" message={`Nothing in the latest ${items.length} KEV entries matched “${query}”.`} />
          ) : (
            filtered.map((k) => <KevRow key={k.cveID} item={k} onPress={() => router.push({ pathname: '/cve/[id]', params: { id: k.cveID } })} />)
          )}
          <Text style={s.foot}>Catalog {data.catalogVersion} · released {shortDate(data.dateReleased)}</Text>
        </View>
      )}
    </Screen>
  );
}

function KevRow({ item, onPress }: { item: KevItem; onPress: () => void }) {
  const colors = useColors();
  return (
    <ListRow
      title={`${item.vendorProject} ${item.product}`.trim()}
      subtitle={`${item.cveID} · added ${shortDate(item.dateAdded)} · due ${shortDate(item.dueDate)}`}
      right={item.knownRansomwareCampaignUse === 'Known' ? <Pill label="Ransomware" color={colors.critical} /> : undefined}
      onPress={onPress}
    />
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  stats: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg },
  search: { paddingHorizontal: spacing.lg },
  foot: { color: c.muted, fontSize: 11, textAlign: 'center', paddingTop: spacing.lg },
});
