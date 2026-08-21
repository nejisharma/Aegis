import { useMemo } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { ErrorState } from '../src/components/ErrorState';
import { Screen } from '../src/components/Screen';
import { Card, EmptyState, KeyValue, OfflineBanner, Pill, SectionHeader, Skeleton, StatCard } from '../src/components/ui';
import { useRansomware } from '../src/hooks/useApi';
import { flagEmoji, timeAgo } from '../src/lib/format';
import { countryToIso } from '../src/lib/mitre';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import type { RansomwareGroup, RansomwareVictim } from '../src/api/types';

function statusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return colors.critical;
    case 'disrupted':
      return colors.medium;
    case 'rebranded':
      return colors.muted;
    default:
      return colors.subtle;
  }
}

export default function RansomwareScreen() {
  const { data, error, isLoading, isValidating, isOffline, mutate } = useRansomware();

  return (
    <Screen scroll refreshControl={<RefreshControl refreshing={!!data && isValidating} onRefresh={() => mutate()} tintColor={colors.accent} />}>
      <Stack.Screen options={{ title: 'Ransomware' }} />
      <OfflineBanner visible={isOffline} />
      {isLoading && !data ? (
        <Skeleton lines={8} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : !data ? null : data.type === 'victims' ? (
        <VictimsList victims={data.data} />
      ) : (
        <GroupsList groups={data.data} />
      )}
    </Screen>
  );
}

function VictimsList({ victims }: { victims: RansomwareVictim[] }) {
  const groupCount = useMemo(() => new Set(victims.map((v) => v.group.toLowerCase())).size, [victims]);
  if (!victims.length) return <EmptyState title="No recent victims" />;
  return (
    <View style={{ paddingBottom: spacing.xl }}>
      <View style={s.stats}>
        <StatCard label="Recent victims" value={victims.length} color={colors.critical} />
        <StatCard label="Active groups" value={groupCount} color={colors.high} />
      </View>
      <SectionHeader title="Recent victims" />
      {victims.map((v, i) => {
        const iso = countryToIso(v.country);
        return (
          <View key={`${v.group}-${v.victim}-${i}`} style={s.row}>
            <View style={s.rowTop}>
              <Text style={s.victim} numberOfLines={2}>
                {v.victim}
              </Text>
              <Pill label={v.group} color={colors.high} />
            </View>
            <Text style={s.meta}>
              {iso ? `${flagEmoji(iso)} ` : ''}
              {v.country}
              {' · '}
              {timeAgo(v.date)}
              {v.activity ? ` · ${v.activity}` : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function GroupsList({ groups }: { groups: RansomwareGroup[] }) {
  if (!groups.length) return <EmptyState title="No groups" />;
  return (
    <View style={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl }}>
      {groups.map((g) => (
        <Card key={g.name}>
          <View style={s.rowTop}>
            <Text style={s.groupName}>{g.name}</Text>
            <Pill label={g.status.toUpperCase()} color={statusColor(g.status)} />
          </View>
          <Text style={s.desc}>{g.description}</Text>
          <KeyValue label="Active" value={`${g.firstSeen} – ${g.lastSeen}`} />
          <KeyValue label="Known victims" value={g.victimCount.toLocaleString()} />
          {g.ttps.length ? (
            <View style={s.pills}>
              {g.ttps.map((t) => (
                <Pill key={t} label={t} />
              ))}
            </View>
          ) : null}
        </Card>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  stats: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg },
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  victim: { color: colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  meta: { color: colors.muted, fontSize: 12 },
  groupName: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  desc: { color: colors.subtle, fontSize: 13, lineHeight: 19, marginVertical: spacing.sm },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
});
