import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ExternalLink } from 'lucide-react-native';
import { ErrorState } from '../../../src/components/ErrorState';
import { Screen } from '../../../src/components/Screen';
import { Card, EmptyState, KeyValue, ListRow, Loading, OfflineBanner, Pill, SectionHeader, SeverityDot } from '../../../src/components/ui';
import { useMitre } from '../../../src/hooks/useApi';
import { groupsUsingTechnique, subtechniquesOf, tacticsForTechnique, usageColor } from '../../../src/lib/mitre';
import { openUrl } from '../../../src/lib/browser';
import { useColors } from '../../../src/theme/ThemeProvider';
import type { Palette } from '../../../src/theme/palettes';
import { spacing } from '../../../src/theme/spacing';
import type { MITREData, MITRETechnique } from '../../../src/api/types';

export default function TechniqueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, isLoading, isOffline, isNetworkError, mutate } = useMitre();
  const technique = data?.techniques.find((t) => t.id === id);

  return (
    <Screen scroll title={id ?? 'Technique'}>
      <OfflineBanner visible={isOffline} networkError={isNetworkError} />
      {isLoading && !data ? (
        <Loading />
      ) : !technique || !data ? (
        error ? <ErrorState error={error} onRetry={() => mutate()} /> : <EmptyState title="Technique not found" message={`No ATT&CK technique with id ${id}`} />
      ) : (
        <TechniqueBody technique={technique} data={data} />
      )}
    </Screen>
  );
}

function TechniqueBody({ technique, data }: { technique: MITRETechnique; data: MITREData }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const tactics = useMemo(() => tacticsForTechnique(data.tactics, technique), [data, technique]);
  const groups = useMemo(() => groupsUsingTechnique(data.groups, technique.id).sort((a, b) => a.name.localeCompare(b.name)), [data, technique]);
  const subs = useMemo(() => subtechniquesOf(data.techniques, technique), [data, technique]);
  const parent = technique.isSubtechnique ? data.techniques.find((t) => t.id === (technique.parentId ?? technique.id.split('.')[0])) : undefined;

  return (
    <View style={{ paddingBottom: spacing.xl }}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <View style={s.top}>
          <Text style={s.id} selectable>
            {technique.id}
          </Text>
          <View style={s.usage}>
            <SeverityDot color={usageColor(groups.length, colors)} />
            <Text style={s.usageText}>
              used by {groups.length} group{groups.length === 1 ? '' : 's'}
            </Text>
          </View>
        </View>
        <Text style={s.name} selectable>
          {technique.name}
        </Text>
        {technique.isSubtechnique && parent ? (
          <Pressable onPress={() => router.push({ pathname: '/mitre/technique/[id]', params: { id: parent.id } })}>
            <Text style={s.parent}>
              Sub-technique of {parent.id} {parent.name}
            </Text>
          </Pressable>
        ) : null}
        {tactics.length ? (
          <View style={s.pills}>
            {tactics.map((t) => (
              <Pill key={t.id} label={t.name} color={colors.accent} />
            ))}
          </View>
        ) : null}
        {technique.platforms.length ? (
          <Card>
            <KeyValue label="Platforms" value={technique.platforms.join(', ')} />
          </Card>
        ) : null}
        <Text style={s.desc} selectable>
          {technique.description || 'No description available.'}
        </Text>
      </View>

      {technique.detection ? (
        <View>
          <SectionHeader title="Detection" />
          <Text style={[s.desc, s.padded]} selectable>
            {technique.detection}
          </Text>
        </View>
      ) : null}

      {subs.length ? (
        <View>
          <SectionHeader title={`Sub-techniques (${subs.length})`} />
          {subs.map((t) => (
            <ListRow key={t.id} title={t.name} subtitle={t.id} onPress={() => router.push({ pathname: '/mitre/technique/[id]', params: { id: t.id } })} />
          ))}
        </View>
      ) : null}

      <View>
        <SectionHeader title={`Used by ${groups.length} group${groups.length === 1 ? '' : 's'}`} />
        {groups.length ? (
          groups.map((g) => (
            <ListRow
              key={g.id}
              title={g.name}
              subtitle={`${g.id}${g.country ? ` · ${g.country}` : ''}`}
              onPress={() => router.push({ pathname: '/apt/[id]', params: { id: g.id } })}
            />
          ))
        ) : (
          <Text style={[s.muted, s.padded]}>No tracked APT groups are known to use this technique.</Text>
        )}
      </View>

      <Pressable onPress={() => openUrl(technique.url, colors)} style={s.link}>
        <ExternalLink size={14} color={colors.accent} />
        <Text style={s.linkText}>View on MITRE ATT&CK</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  id: { color: c.accent, fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  usage: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  usageText: { color: c.subtle, fontSize: 12 },
  name: { color: c.text, fontSize: 22, fontWeight: '700' },
  parent: { color: c.accent, fontSize: 12 },
  desc: { color: c.text, fontSize: 14, lineHeight: 21 },
  muted: { color: c.muted, fontSize: 13 },
  padded: { paddingHorizontal: spacing.lg },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  link: {
    marginTop: spacing.xl,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: c.accent,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  linkText: { color: c.accent, fontWeight: '600' },
});
