import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { ErrorState } from '../src/components/ErrorState';
import { Screen } from '../src/components/Screen';
import { Donut, HBarChart, Radar, VBarChart, type ChartDatum } from '../src/components/charts';
import { Card, OfflineBanner, Skeleton, UpdatedAt } from '../src/components/ui';
import { useMalwareRecent, useMitre, useRecentCves, useThreatFoxRecent } from '../src/hooks/useApi';
import { useSimulatedThreats } from '../src/hooks/useSimulatedThreats';
import {
  attackVectorDistribution,
  FILE_TYPE_COLORS,
  groupCounts,
  IOC_TYPE_COLORS,
  severityCounts,
  severityDistribution,
  threatRadar,
  threatTypeDistribution,
  topCountries,
  topTechniquesByUsage,
} from '../src/lib/analytics';
import { severityColor } from '../src/lib/cvss';
import { flagEmoji } from '../src/lib/format';
import { useColors } from '../src/theme/ThemeProvider';
import type { Palette } from '../src/theme/palettes';
import { radius, spacing } from '../src/theme/spacing';

const VECTOR_COLORS: Record<string, keyof Palette> = {
  NETWORK: 'critical',
  ADJACENT: 'high',
  LOCAL: 'medium',
  PHYSICAL: 'low',
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function AnalyticsScreen() {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const { events } = useSimulatedThreats();
  const mitre = useMitre();
  const threatfox = useThreatFoxRecent();
  const malware = useMalwareRecent();
  const cves = useRecentCves();

  // --- Live (simulated, last 60 s) ---
  const attackers = useMemo<ChartDatum[]>(
    () => topCountries(events, 'source', 10).map((c) => ({ label: c.name, value: c.count, color: colors.critical, prefix: flagEmoji(c.code) })),
    [events, colors],
  );
  const targets = useMemo<ChartDatum[]>(
    () => topCountries(events, 'target', 10).map((c) => ({ label: c.name, value: c.count, color: colors.low, prefix: flagEmoji(c.code) })),
    [events, colors],
  );
  const severity = useMemo<ChartDatum[]>(
    () => severityCounts(events).map((b) => ({ label: capitalize(b.severity), value: b.count, color: colors[b.severity] })),
    [events, colors],
  );
  const types = useMemo<ChartDatum[]>(() => threatTypeDistribution(events).map((t) => ({ label: t.type, value: t.count, color: t.color })), [events]);
  const totalEvents = events.length;
  const radar = useMemo(() => threatRadar(events), [events]);

  // --- Network-backed ---
  const techniques = useMemo<ChartDatum[]>(
    () => (mitre.data ? topTechniquesByUsage(mitre.data.techniques, mitre.data.groups, 10) : []).map((t) => ({ label: `${t.name} (${t.id})`, value: t.count, color: colors.accent })),
    [mitre.data, colors],
  );
  const iocTypes = useMemo<ChartDatum[]>(
    () => groupCounts(threatfox.data?.data ?? [], (i) => i.threat_type, 7).map((g, i) => ({ label: g.label, value: g.count, color: IOC_TYPE_COLORS[i % IOC_TYPE_COLORS.length] })),
    [threatfox.data],
  );
  const fileTypes = useMemo<ChartDatum[]>(
    () => groupCounts(malware.data?.data ?? [], (m) => m.file_type, 8).map((g, i) => ({ label: g.label, value: g.count, color: FILE_TYPE_COLORS[i % FILE_TYPE_COLORS.length] })),
    [malware.data],
  );
  const malwareCount = malware.data?.data.length ?? 0;

  const cveItems = cves.data?.vulnerabilities ?? [];
  const cvss = useMemo<ChartDatum[]>(() => severityDistribution(cveItems).map((b) => ({ label: capitalize(b.label.toLowerCase()), value: b.count, color: severityColor(b.label) })), [cveItems]);
  const vectors = useMemo<ChartDatum[]>(
    () => attackVectorDistribution(cveItems).map((b) => ({ label: capitalize(b.label.toLowerCase()), value: b.count, color: colors[VECTOR_COLORS[b.label] ?? 'muted'] })),
    [cveItems, colors],
  );

  const waiting = <Text style={s.none}>Waiting for threat events…</Text>;

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Analytics' }} />
      <OfflineBanner visible={mitre.isOffline || threatfox.isOffline || malware.isOffline || cves.isOffline} />
      <View style={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl }}>
        <Text style={s.intro}>Live metrics from threat feeds, MITRE ATT&CK &amp; simulated events</Text>

        {/* 1. Top Attacking Countries */}
        <Card>
          <CardTitle title="Top Attacking Countries" live />
          {attackers.length ? <HBarChart data={attackers} /> : waiting}
        </Card>

        {/* 2. Top Targeted Countries */}
        <Card>
          <CardTitle title="Top Targeted Countries" live />
          {targets.length ? <HBarChart data={targets} /> : waiting}
        </Card>

        {/* 3. Threat Severity */}
        <Card>
          <CardTitle title="Threat Severity" live />
          {severity.some((d) => d.value > 0) ? <VBarChart data={severity} height={200} /> : waiting}
        </Card>

        {/* 4. Attack Types */}
        <Card>
          <CardTitle title="Attack Types" live />
          {types.length ? <Donut data={types} size={180} centerLabel={String(totalEvents)} centerSub="Events" /> : waiting}
        </Card>

        {/* 5. Top ATT&CK Techniques */}
        <Card>
          <CardTitle title="Top ATT&CK Techniques" note="by APT group usage" />
          {mitre.isLoading && !mitre.data ? (
            <Skeleton lines={6} />
          ) : mitre.error && !mitre.data ? (
            <ErrorState error={mitre.error} onRetry={() => mitre.mutate()} />
          ) : techniques.length ? (
            <HBarChart data={techniques} />
          ) : (
            <Text style={s.none}>No MITRE data available</Text>
          )}
          {mitre.data ? <UpdatedAt at={mitre.updatedAt} refreshing={mitre.isRefreshing} /> : null}
        </Card>

        {/* 6. Threat Radar */}
        <Card>
          <CardTitle title="Threat Radar" live />
          <Radar axes={radar} size={260} color={colors.accent} />
        </Card>

        {/* 7. IOC Threat Types */}
        <Card>
          <CardTitle title="IOC Threat Types" note="ThreatFox — Last 24h" />
          {threatfox.isLoading && !threatfox.data ? (
            <Skeleton lines={4} />
          ) : threatfox.error && !threatfox.data ? (
            <ErrorState error={threatfox.error} onRetry={() => threatfox.mutate()} />
          ) : iocTypes.length ? (
            <VBarChart data={iocTypes} height={210} />
          ) : (
            <Text style={s.none}>No IOC data — check API key configuration</Text>
          )}
          {threatfox.data ? <UpdatedAt at={threatfox.updatedAt} refreshing={threatfox.isRefreshing} /> : null}
        </Card>

        {/* 8. Malware File Types */}
        <Card>
          <CardTitle title="Malware File Types" note={`MalwareBazaar — Latest ${malwareCount || 100}`} />
          {malware.isLoading && !malware.data ? (
            <Skeleton lines={4} />
          ) : malware.error && !malware.data ? (
            <ErrorState error={malware.error} onRetry={() => malware.mutate()} />
          ) : fileTypes.length ? (
            <Donut data={fileTypes} size={180} centerLabel={String(malwareCount)} centerSub="Samples" />
          ) : (
            <Text style={s.none}>No malware data — check API key configuration</Text>
          )}
          {malware.data ? <UpdatedAt at={malware.updatedAt} refreshing={malware.isRefreshing} /> : null}
        </Card>

        {/* App-only extras */}
        <Card>
          <CardTitle title="CVSS Severity" note={`latest ${cveItems.length} NVD results`} />
          {cves.isLoading && !cves.data ? (
            <Skeleton lines={4} />
          ) : cves.error && !cves.data ? (
            <ErrorState error={cves.error} onRetry={() => cves.mutate()} />
          ) : cvss.some((d) => d.value > 0) ? (
            <VBarChart data={cvss} height={200} />
          ) : (
            <Text style={s.none}>No scored results.</Text>
          )}
          {cves.data ? <UpdatedAt at={cves.updatedAt} refreshing={cves.isRefreshing} /> : null}
        </Card>

        <Card>
          <CardTitle title="Attack Vectors" note="CVSS v3.1 AV" />
          {cves.isLoading && !cves.data ? (
            <Skeleton lines={4} />
          ) : cves.data ? (
            vectors.some((d) => d.value > 0) ? (
              <VBarChart data={vectors} height={200} />
            ) : (
              <Text style={s.none}>No scored results.</Text>
            )
          ) : null}
        </Card>
      </View>
    </Screen>
  );
}

function CardTitle({ title, note, live, right }: { title: string; note?: string; live?: boolean; right?: ReactNode }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={s.cardHead}>
      <Text style={s.cardTitle}>{title}</Text>
      {note ? <Text style={s.cardNote}>{note}</Text> : null}
      {live ? (
        <View style={s.live}>
          <View style={s.liveDot} />
          <Text style={s.liveText}>live · last 60 s</Text>
        </View>
      ) : null}
      {right}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    intro: { color: c.muted, fontSize: 12, marginBottom: spacing.xs },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    cardTitle: { color: c.text, fontSize: 14, fontWeight: '700' },
    cardNote: { color: c.muted, fontSize: 11, flex: 1 },
    live: {
      marginLeft: 'auto',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius.sm,
      backgroundColor: `${c.success}1a`,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.success, shadowColor: c.success, shadowOpacity: 0.9, shadowRadius: 4 },
    liveText: { color: c.success, fontSize: 10, fontWeight: '600' },
    none: { color: c.muted, fontSize: 12, paddingVertical: spacing.lg, textAlign: 'center' },
  });
