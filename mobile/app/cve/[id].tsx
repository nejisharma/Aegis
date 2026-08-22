import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { shareCve } from '../../src/lib/share';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ExternalLink, Share2 } from 'lucide-react-native';
import { ErrorState } from '../../src/components/ErrorState';
import { Screen } from '../../src/components/Screen';
import { CVSSBadge, Card, EmptyState, KeyValue, Loading, OfflineBanner, Pill, SectionHeader, Skeleton } from '../../src/components/ui';
import { KevBadge } from '../../src/components/ExploitBadges';
import { useCve, useEpss, useKev } from '../../src/hooks/useApi';
import { epssPercent, epssTone, epssTopPercent, kevSummaryLine } from '../../src/lib/exploit';
import { summarizeCve } from '../../src/lib/cvss';
import { shortDate } from '../../src/lib/format';
import { useColors } from '../../src/theme/ThemeProvider';
import type { Palette } from '../../src/theme/palettes';
import { spacing } from '../../src/theme/spacing';

export default function CveDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cveId = (id ?? '').toUpperCase();
  const { data, error, isLoading, isOffline, isNetworkError, mutate } = useCve(cveId);
  const item = data?.vulnerabilities.find((v) => v.cve.id === cveId) ?? data?.vulnerabilities[0];

  return (
    <Screen scroll>
      <Stack.Screen
        options={{
          title: cveId,
          headerRight: () => (
            <Pressable onPress={() => shareCve(cveId, item ? summarizeCve(item).description.slice(0, 140) : undefined)} hitSlop={10} style={{ paddingHorizontal: 4 }}>
              <Share2 size={20} color={colors.accent} />
            </Pressable>
          ),
        }}
      />
      <OfflineBanner visible={isOffline} networkError={isNetworkError} />
      {isLoading && !item ? (
        <Loading />
      ) : !item ? (
        error ? <ErrorState error={error} onRetry={() => mutate()} /> : <EmptyState title="CVE not found" message={`NVD has no record for ${cveId}`} />
      ) : (
        <CveBody item={item} />
      )}
    </Screen>
  );
}

function CveBody({ item }: { item: NonNullable<ReturnType<typeof useCve>['data']>['vulnerabilities'][number] }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const c = summarizeCve(item);
  const metric = item.cve.metrics?.cvssMetricV31?.[0]?.cvssData;
  const weaknesses = item.cve.weaknesses?.flatMap((w) => w.description.map((d) => d.value)).filter((v) => v !== 'NVD-CWE-noinfo' && v !== 'NVD-CWE-Other') ?? [];
  const refs = item.cve.references ?? [];
  const ids = useMemo(() => [c.id], [c.id]);
  const epss = useEpss(ids);
  const kev = useKev();
  const epssScore = epss.data?.scores[c.id];
  const kevItem = kev.data?.items.find((k) => k.cveID === c.id);
  const exploitLoading = (epss.isLoading && !epss.data) || (kev.isLoading && !kev.data);
  // Hide the card entirely when both sources failed; a partial failure just hides that row.
  const exploitFailed = !!epss.error && !epss.data && !!kev.error && !kev.data;

  return (
    <View style={{ padding: spacing.lg, gap: spacing.md }}>
      <View style={s.top}>
        <Text style={s.id} selectable>
          {c.id}
        </Text>
        <View style={s.badges}>
          {kevItem ? <KevBadge size="md" /> : null}
          <CVSSBadge score={c.score} severity={c.severity} />
        </View>
      </View>
      <Text style={s.desc} selectable>
        {c.description}
      </Text>

      <Card>
        <KeyValue label="Published" value={shortDate(item.cve.published)} />
        <KeyValue label="Last modified" value={shortDate(item.cve.lastModified)} />
        <KeyValue label="Status" value={item.cve.vulnStatus} />
        {metric ? (
          <>
            <KeyValue label="Attack vector" value={metric.attackVector} />
            <KeyValue label="Complexity" value={metric.attackComplexity} />
            <KeyValue label="Privileges" value={metric.privilegesRequired} />
            <KeyValue label="User interaction" value={metric.userInteraction} />
            <KeyValue label="Impact (C/I/A)" value={`${metric.confidentialityImpact[0]}/${metric.integrityImpact[0]}/${metric.availabilityImpact[0]}`} />
            <KeyValue label="Vector" value={metric.vectorString} mono />
          </>
        ) : null}
      </Card>

      {exploitFailed ? null : (
        <Card>
          <SectionHeader title="Exploitation" />
          {exploitLoading ? (
            <Skeleton lines={2} />
          ) : (
            <>
              {epssScore ? (
                <View style={s.exploitRow}>
                  <Text style={[s.exploitHeadline, { color: colors[epssTone(epssScore.epss)] }]}>
                    {epssPercent(epssScore.epss)} · {epssTopPercent(epssScore.percentile)} of all CVEs
                  </Text>
                  <Text style={s.exploitHint}>Probability of exploitation in the next 30 days (FIRST EPSS)</Text>
                </View>
              ) : null}
              {kev.data ? (
                <View style={s.exploitRow}>
                  <Text style={[s.exploitHeadline, { color: kevItem ? colors.critical : colors.subtle }]}>
                    {kevItem ? kevSummaryLine(kevItem) : 'Not in CISA KEV'}
                  </Text>
                  {kevItem?.requiredAction ? <Text style={s.exploitHint}>{kevItem.requiredAction}</Text> : null}
                </View>
              ) : null}
            </>
          )}
        </Card>
      )}

      {weaknesses.length ? (
        <View>
          <SectionHeader title="Weaknesses" />
          <View style={s.pills}>
            {weaknesses.map((w) => (
              <Pill key={w} label={w} color={colors.high} />
            ))}
          </View>
        </View>
      ) : null}

      {refs.length ? (
        <View>
          <SectionHeader title={`References (${refs.length})`} />
          {refs.slice(0, 15).map((r) => (
            <Pressable key={r.url} onPress={() => Linking.openURL(r.url)} style={s.ref}>
              <ExternalLink size={14} color={colors.accent} />
              <Text style={s.refText} numberOfLines={1}>
                {r.url.replace(/^https?:\/\//, '')}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Pressable onPress={() => Linking.openURL(`https://nvd.nist.gov/vuln/detail/${c.id}`)} style={s.nvd}>
        <Text style={s.nvdText}>View on NVD</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  id: { color: c.accent, fontSize: 18, fontWeight: '700', fontFamily: 'monospace' },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  exploitRow: { paddingVertical: 6, gap: 2 },
  exploitHeadline: { fontSize: 14, fontWeight: '700' },
  exploitHint: { color: c.muted, fontSize: 12, lineHeight: 17 },
  desc: { color: c.text, fontSize: 14, lineHeight: 21 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: spacing.lg },
  ref: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg, paddingVertical: 8 },
  refText: { color: c.subtle, fontSize: 12, flex: 1 },
  nvd: { marginTop: spacing.md, alignSelf: 'center', borderWidth: 1, borderColor: c.accent, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
  nvdText: { color: c.accent, fontWeight: '600' },
});
