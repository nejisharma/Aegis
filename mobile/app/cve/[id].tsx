import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ExternalLink } from 'lucide-react-native';
import { ErrorState } from '../../src/components/ErrorState';
import { Screen } from '../../src/components/Screen';
import { CVSSBadge, Card, EmptyState, KeyValue, Loading, OfflineBanner, Pill, SectionHeader } from '../../src/components/ui';
import { useCve } from '../../src/hooks/useApi';
import { summarizeCve } from '../../src/lib/cvss';
import { shortDate } from '../../src/lib/format';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function CveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cveId = (id ?? '').toUpperCase();
  const { data, error, isLoading, isOffline, isNetworkError, mutate } = useCve(cveId);
  const item = data?.vulnerabilities.find((v) => v.cve.id === cveId) ?? data?.vulnerabilities[0];

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: cveId }} />
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
  const c = summarizeCve(item);
  const metric = item.cve.metrics?.cvssMetricV31?.[0]?.cvssData;
  const weaknesses = item.cve.weaknesses?.flatMap((w) => w.description.map((d) => d.value)).filter((v) => v !== 'NVD-CWE-noinfo' && v !== 'NVD-CWE-Other') ?? [];
  const refs = item.cve.references ?? [];

  return (
    <View style={{ padding: spacing.lg, gap: spacing.md }}>
      <View style={s.top}>
        <Text style={s.id} selectable>
          {c.id}
        </Text>
        <CVSSBadge score={c.score} severity={c.severity} />
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

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  id: { color: colors.accent, fontSize: 18, fontWeight: '700', fontFamily: 'monospace' },
  desc: { color: colors.text, fontSize: 14, lineHeight: 21 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: spacing.lg },
  ref: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg, paddingVertical: 8 },
  refText: { color: colors.subtle, fontSize: 12, flex: 1 },
  nvd: { marginTop: spacing.md, alignSelf: 'center', borderWidth: 1, borderColor: colors.accent, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
  nvdText: { color: colors.accent, fontWeight: '600' },
});
