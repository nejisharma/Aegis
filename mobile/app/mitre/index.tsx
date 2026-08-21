import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { EmptyState, ListRow, OfflineBanner, Skeleton, StatCard } from '../../src/components/ui';
import { useMitre } from '../../src/hooks/useApi';
import { techniquesForTactic } from '../../src/lib/mitre';
import { truncate } from '../../src/lib/format';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function MitreTacticsScreen() {
  const router = useRouter();
  const { data, error, isLoading, isOffline, mutate } = useMitre();

  const rows = useMemo(() => {
    if (!data) return [];
    return data.tactics.map((tactic) => ({ tactic, count: techniquesForTactic(data.techniques, tactic).length }));
  }, [data]);

  const topLevel = data?.techniques.filter((t) => !t.isSubtechnique).length ?? 0;

  return (
    <Screen>
      <Stack.Screen options={{ title: 'MITRE ATT&CK' }} />
      <OfflineBanner visible={isOffline} />
      {isLoading && !data ? (
        <Skeleton lines={8} />
      ) : error && !data ? (
        <EmptyState title="Could not load ATT&CK data" message={error.message} onRetry={() => mutate()} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.tactic.id}
          ListHeaderComponent={
            <View style={s.stats}>
              <StatCard label="Tactics" value={data?.tactics.length ?? 0} />
              <StatCard label="Techniques" value={topLevel} color={colors.high} />
              <StatCard label="Groups" value={data?.groups.length ?? 0} color={colors.critical} />
            </View>
          }
          ListEmptyComponent={<EmptyState title="No tactics" onRetry={() => mutate()} />}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          renderItem={({ item: { tactic, count } }) => (
            <ListRow
              title={tactic.name}
              subtitle={truncate(tactic.description.replace(/\s+/g, ' '), 90)}
              right={<Text style={s.count}>{count} techniques</Text>}
              onPress={() => router.push({ pathname: '/mitre/[tactic]', params: { tactic: tactic.id } })}
            />
          )}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  stats: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg },
  count: { color: colors.accent, fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
