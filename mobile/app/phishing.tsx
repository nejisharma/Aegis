import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import { Screen } from '../src/components/Screen';
import { EmptyState, ListRow, OfflineBanner, Pill, Skeleton, StatCard } from '../src/components/ui';
import { usePhishing } from '../src/hooks/useApi';
import { timeAgo } from '../src/lib/format';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';

export default function PhishingScreen() {
  const { data, error, isLoading, isValidating, isOffline, mutate } = usePhishing();
  const entries = data?.entries ?? [];

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Phishing Feed' }} />
      <OfflineBanner visible={isOffline} />
      <View style={s.warn}>
        <AlertTriangle size={14} color={colors.medium} />
        <Text style={s.warnText}>Live phishing URLs — do not visit.</Text>
      </View>
      {isLoading && !data ? (
        <Skeleton lines={8} />
      ) : error && !data ? (
        <EmptyState title="Could not load phishing feed" message={error.message} onRetry={() => mutate()} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e, i) => `${e.id ?? i}-${e.url}`}
          refreshing={!!data && isValidating}
          onRefresh={() => mutate()}
          ListHeaderComponent={
            <View style={s.stats}>
              <StatCard label="Source" value={data?.source ?? '—'} />
              <StatCard label="Total" value={data?.total ?? entries.length} color={colors.high} />
            </View>
          }
          ListEmptyComponent={<EmptyState title="No phishing entries" onRetry={() => mutate()} />}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          renderItem={({ item }) => (
            <ListRow
              title={item.url.replace(/^https?:\/\//, '')}
              subtitle={[item.submission_time ? timeAgo(item.submission_time) : null, item.verified ? `verified: ${item.verified}` : null].filter(Boolean).join(' · ')}
              right={item.target ? <Pill label={item.target} color={colors.high} /> : undefined}
              chevron={false}
              onPress={() => Alert.alert('Phishing URL', item.url)}
            />
          )}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  warn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(234,179,8,0.12)', paddingHorizontal: spacing.lg, paddingVertical: 6 },
  warnText: { color: colors.medium, fontSize: 12, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg },
});
