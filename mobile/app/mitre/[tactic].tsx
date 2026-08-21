import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ErrorState } from '../../src/components/ErrorState';
import { Screen } from '../../src/components/Screen';
import { EmptyState, ListRow, OfflineBanner, SeverityDot, Skeleton } from '../../src/components/ui';
import { useMitre } from '../../src/hooks/useApi';
import { groupUsageCounts, subtechniquesOf, techniquesForTactic, usageColor } from '../../src/lib/mitre';
import { truncate } from '../../src/lib/format';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function MitreTacticScreen() {
  const router = useRouter();
  const { tactic: tacticId } = useLocalSearchParams<{ tactic: string }>();
  const { data, error, isLoading, isOffline, isNetworkError, mutate } = useMitre();
  const tactic = data?.tactics.find((t) => t.id === tacticId);

  const rows = useMemo(() => {
    if (!data || !tactic) return [];
    const usage = groupUsageCounts(data.groups);
    return techniquesForTactic(data.techniques, tactic)
      .map((t) => ({ technique: t, groups: usage[t.id] ?? 0, subs: subtechniquesOf(data.techniques, t).length }))
      .sort((a, b) => b.groups - a.groups || a.technique.id.localeCompare(b.technique.id));
  }, [data, tactic]);

  return (
    <Screen>
      <Stack.Screen options={{ title: tactic?.name ?? 'Tactic' }} />
      <OfflineBanner visible={isOffline} networkError={isNetworkError} />
      {isLoading && !data ? (
        <Skeleton lines={8} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : !tactic ? (
        <EmptyState title="Tactic not found" message={`No tactic with id ${tacticId}`} onRetry={() => mutate()} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.technique.id}
          ListHeaderComponent={
            <View style={s.header}>
              <Text style={s.tacticId}>{tactic.id}</Text>
              <Text style={s.desc}>{truncate(tactic.description.replace(/\s+/g, ' '), 240)}</Text>
              <Text style={s.count}>{rows.length} techniques · colored by APT group usage</Text>
            </View>
          }
          ListEmptyComponent={<EmptyState title="No techniques" />}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          renderItem={({ item: { technique, groups, subs } }) => (
            <ListRow
              title={technique.name}
              subtitle={`${technique.id} · used by ${groups} group${groups === 1 ? '' : 's'}${subs ? ` · ${subs} sub-technique${subs === 1 ? '' : 's'}` : ''}`}
              left={<SeverityDot color={usageColor(groups)} size={10} />}
              onPress={() => router.push({ pathname: '/mitre/technique/[id]', params: { id: technique.id } })}
            />
          )}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { padding: spacing.lg, gap: spacing.sm },
  tacticId: { color: colors.accent, fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
  desc: { color: colors.subtle, fontSize: 13, lineHeight: 19 },
  count: { color: colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
});
