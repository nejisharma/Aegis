import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ExternalLink } from 'lucide-react-native';
import { ErrorState } from '../../src/components/ErrorState';
import { Screen } from '../../src/components/Screen';
import { Card, EmptyState, KeyValue, ListRow, Loading, OfflineBanner, Pill, SectionHeader, StatCard } from '../../src/components/ui';
import { useMitre } from '../../src/hooks/useApi';
import { countryToIso, techniqueBelongsToTactic } from '../../src/lib/mitre';
import { flagEmoji } from '../../src/lib/format';
import { openUrl } from '../../src/lib/browser';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import type { MITREData, MITREGroup, MITRETechnique } from '../../src/api/types';

export default function AptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, isLoading, isOffline, mutate } = useMitre();
  const group = data?.groups.find((g) => g.id === id);

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: group?.name ?? id ?? 'APT Group' }} />
      <OfflineBanner visible={isOffline} />
      {isLoading && !data ? (
        <Loading />
      ) : !group || !data ? (
        error ? <ErrorState error={error} onRetry={() => mutate()} /> : <EmptyState title="Group not found" message={`No ATT&CK group with id ${id}`} />
      ) : (
        <GroupBody group={group} data={data} />
      )}
    </Screen>
  );
}

interface TacticSection {
  tacticId: string;
  name: string;
  techniques: MITRETechnique[];
}

interface SoftwareRef {
  id: string;
  name: string;
  type?: 'malware' | 'tool';
}

function GroupBody({ group, data }: { group: MITREGroup; data: MITREData }) {
  const router = useRouter();
  const iso = countryToIso(group.country);

  const byTactic = useMemo(() => {
    const techniques = data.techniques.filter((t) => group.techniqueIds.includes(t.id));
    const sections: TacticSection[] = [];
    const seen = new Set<string>();
    for (const tac of data.tactics) {
      const list = techniques.filter((t) => techniqueBelongsToTactic(t, tac));
      if (list.length) {
        sections.push({ tacticId: tac.id, name: tac.name, techniques: list });
        list.forEach((t) => seen.add(t.id));
      }
    }
    const orphans = techniques.filter((t) => !seen.has(t.id));
    if (orphans.length) sections.push({ tacticId: 'other', name: 'Other', techniques: orphans });
    return sections;
  }, [data, group]);

  const software = useMemo<SoftwareRef[]>(
    () =>
      group.softwareIds.map((sid) => {
        const sw = data.software.find((x) => x.id === sid);
        return sw ? { id: sw.id, name: sw.name, type: sw.type } : { id: sid, name: sid };
      }),
    [data, group],
  );
  const aliases = group.aliases.filter((a) => a !== group.name);
  const attribution = `${iso ? `${flagEmoji(iso)} ` : ''}${group.country ?? ''}`;

  return (
    <View style={{ paddingBottom: spacing.xl }}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <View style={s.top}>
          <Text style={s.id} selectable>
            {group.id}
          </Text>
          {group.country ? <Text style={s.country}>{attribution}</Text> : null}
        </View>
        <Text style={s.name} selectable>
          {group.name}
        </Text>
        {aliases.length ? (
          <View style={s.pills}>
            {aliases.map((a) => (
              <Pill key={a} label={a} />
            ))}
          </View>
        ) : null}
        <View style={s.stats}>
          <StatCard label="Techniques" value={group.techniqueIds.length} />
          <StatCard label="Software" value={group.softwareIds.length} color={colors.medium} />
          <StatCard label="Tactics" value={byTactic.filter((x) => x.tacticId !== 'other').length} color={colors.high} />
        </View>
        <Text style={s.desc} selectable>
          {group.description || 'No description available.'}
        </Text>
        {group.country ? (
          <Card>
            <KeyValue label="Country of origin" value={attribution} />
          </Card>
        ) : null}
      </View>

      {byTactic.map((sec) => (
        <View key={sec.tacticId}>
          <SectionHeader title={`${sec.name} (${sec.techniques.length})`} />
          {sec.techniques.map((t) => (
            <ListRow
              key={`${sec.tacticId}-${t.id}`}
              title={t.name}
              subtitle={t.id}
              onPress={() => router.push({ pathname: '/mitre/technique/[id]', params: { id: t.id } })}
            />
          ))}
        </View>
      ))}
      {!byTactic.length ? <Text style={s.none}>No techniques mapped.</Text> : null}

      {software.length ? (
        <View>
          <SectionHeader title={`Software (${software.length})`} />
          <View style={[s.pills, { paddingHorizontal: spacing.lg }]}>
            {software.map((sw) => (
              <Pill key={sw.id} label={sw.name} color={sw.type === 'malware' ? colors.high : colors.medium} />
            ))}
          </View>
        </View>
      ) : null}

      <Pressable onPress={() => openUrl(group.url)} style={s.link}>
        <ExternalLink size={14} color={colors.accent} />
        <Text style={s.linkText}>View on MITRE ATT&CK</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  id: { color: colors.accent, fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  country: { color: colors.subtle, fontSize: 13 },
  name: { color: colors.text, fontSize: 22, fontWeight: '700' },
  desc: { color: colors.text, fontSize: 14, lineHeight: 21 },
  stats: { flexDirection: 'row', gap: spacing.sm },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  none: { color: colors.muted, fontSize: 13, paddingHorizontal: spacing.lg },
  link: {
    marginTop: spacing.xl,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  linkText: { color: colors.accent, fontWeight: '600' },
});
