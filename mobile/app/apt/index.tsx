import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ErrorState } from '../../src/components/ErrorState';
import { Screen } from '../../src/components/Screen';
import { SearchBar } from '../../src/components/SearchBar';
import { EmptyState, ListRow, OfflineBanner, Skeleton } from '../../src/components/ui';
import { useMitre } from '../../src/hooks/useApi';
import { countryToIso, filterGroups, sortGroupsByTechniques } from '../../src/lib/mitre';
import { flagEmoji, truncate } from '../../src/lib/format';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

const NO_FLAG = '\u{1F3F3}️';

export default function AptTrackerScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data, error, isLoading, isOffline, mutate } = useMitre();

  const groups = useMemo(() => filterGroups(sortGroupsByTechniques(data?.groups ?? []), query), [data, query]);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'APT Tracker' }} />
      <OfflineBanner visible={isOffline} />
      <SearchBar value={query} onChangeText={setQuery} placeholder="Group, alias or country" />
      {isLoading && !data ? (
        <Skeleton lines={8} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={<Text style={s.count}>{groups.length} groups</Text>}
          ListEmptyComponent={<EmptyState title="No groups" message={query ? `Nothing matched "${query}".` : undefined} />}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          renderItem={({ item: g }) => {
            const iso = countryToIso(g.country);
            const flag = iso ? flagEmoji(iso) : '';
            const aliases = g.aliases.filter((a) => a !== g.name).join(', ');
            return (
              <ListRow
                title={g.name}
                subtitle={`${aliases ? `${truncate(aliases, 80)} · ` : ''}${g.techniqueIds.length} techniques`}
                left={
                  <View style={s.flagWrap}>
                    <Text style={s.flag}>{flag || NO_FLAG}</Text>
                  </View>
                }
                onPress={() => router.push({ pathname: '/apt/[id]', params: { id: g.id } })}
              />
            );
          }}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  count: { color: colors.muted, fontSize: 11, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, textTransform: 'uppercase', letterSpacing: 1 },
  flagWrap: { width: 32, alignItems: 'center' },
  flag: { fontSize: 22 },
});
