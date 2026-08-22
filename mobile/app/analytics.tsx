import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { RefreshCw } from 'lucide-react-native';
import { ErrorState } from '../src/components/ErrorState';
import { Screen } from '../src/components/Screen';
import { Card, EmptyState, OfflineBanner, Skeleton } from '../src/components/ui';
import { useMitre, useRecentCves } from '../src/hooks/useApi';
import { attackVectorDistribution, severityDistribution, topCountries, topTechniquesByUsage, type Bucket } from '../src/lib/analytics';
import { generateBatch } from '../src/lib/threat-simulator';
import { severityColor } from '../src/lib/cvss';
import { flagEmoji } from '../src/lib/format';
import { useColors } from '../src/theme/ThemeProvider';
import type { Palette } from '../src/theme/palettes';
import { radius, spacing } from '../src/theme/spacing';

/** Broad NVD keyword so the sample spans all severities (the home tab's "critical" query is too narrow). */
/** Roughly what the web map accumulates in its 60-second window. */
const SIM_EVENTS = 120;

const VECTOR_COLORS: Record<string, keyof Palette> = {
  NETWORK: 'critical',
  ADJACENT: 'high',
  LOCAL: 'medium',
  PHYSICAL: 'low',
};

export default function AnalyticsScreen() {
  const colors = useColors();
  const cves = useRecentCves();
  const mitre = useMitre();
  // Mirrors the web: counts derived from the simulated threat stream; the refresh button re-rolls the sample.
  const [events, setEvents] = useState(() => generateBatch(SIM_EVENTS));

  const items = cves.data?.vulnerabilities ?? [];
  const severity = useMemo(() => severityDistribution(items), [items]);
  const vectors = useMemo(() => attackVectorDistribution(items), [items]);
  const techniques = useMemo(() => (mitre.data ? topTechniquesByUsage(mitre.data.techniques, mitre.data.groups, 8) : []), [mitre.data]);
  const attackers = useMemo(() => topCountries(events, 'source', 8), [events]);
  const targets = useMemo(() => topCountries(events, 'target', 8), [events]);

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Analytics' }} />
      <OfflineBanner visible={cves.isOffline || mitre.isOffline} />
      <View style={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl }}>
        <Card>
          <CardTitle title="CVSS severity" note={`latest ${items.length} NVD results`} />
          {cves.isLoading && !cves.data ? (
            <Skeleton lines={4} />
          ) : cves.error && !cves.data ? (
            <ErrorState error={cves.error} onRetry={() => cves.mutate()} />
          ) : (
            <Bars buckets={severity} colorFor={(b) => severityColor(b.label)} />
          )}
        </Card>

        <Card>
          <CardTitle title="Attack vectors" note="CVSS v3.1 AV" />
          {cves.isLoading && !cves.data ? <Skeleton lines={4} /> : cves.data ? <Bars buckets={vectors} colorFor={(b) => colors[VECTOR_COLORS[b.label] ?? 'muted']} /> : null}
        </Card>

        <Card>
          <CardTitle title="Top ATT&CK techniques" note="by APT group usage" />
          {mitre.isLoading && !mitre.data ? (
            <Skeleton lines={6} />
          ) : mitre.error && !mitre.data ? (
            <ErrorState error={mitre.error} onRetry={() => mitre.mutate()} />
          ) : (
            <View style={{ gap: spacing.sm }}>
              {techniques.map((t, i) => (
                <BarRow key={t.id} rank={i + 1} label={`${t.name} (${t.id})`} value={t.count} pct={t.pct} color={colors.accent} />
              ))}
            </View>
          )}
        </Card>

        <Card>
          <CardTitle
            title="Top attacking countries"
            note="simulated"
            right={
              <Pressable onPress={() => setEvents(generateBatch(SIM_EVENTS))} hitSlop={8}>
                <RefreshCw size={14} color={colors.muted} />
              </Pressable>
            }
          />
          <View style={{ gap: spacing.sm }}>
            {attackers.map((c, i) => (
              <BarRow key={c.code} rank={i + 1} label={`${flagEmoji(c.code)} ${c.name}`} value={c.count} pct={c.pct} color={colors.critical} />
            ))}
          </View>
        </Card>

        <Card>
          <CardTitle title="Top targeted countries" note="simulated" />
          <View style={{ gap: spacing.sm }}>
            {targets.map((c, i) => (
              <BarRow key={c.code} rank={i + 1} label={`${flagEmoji(c.code)} ${c.name}`} value={c.count} pct={c.pct} color={colors.low} />
            ))}
          </View>
        </Card>
      </View>
    </Screen>
  );
}

function CardTitle({ title, note, right }: { title: string; note?: string; right?: ReactNode }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={s.cardHead}>
      <Text style={s.cardTitle}>{title}</Text>
      {note ? <Text style={s.cardNote}>{note}</Text> : null}
      {right}
    </View>
  );
}

function Bars({ buckets, colorFor }: { buckets: Bucket[]; colorFor: (b: Bucket) => string }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const max = Math.max(1, ...buckets.map((b) => b.count));
  if (!buckets.some((b) => b.count > 0)) return <Text style={s.none}>No scored results.</Text>;
  return (
    <View style={{ gap: spacing.sm }}>
      {buckets.map((b) => (
        <BarRow key={b.label} label={b.label} value={`${b.count} · ${Math.round(b.pct * 100)}%`} pct={b.count / max} color={colorFor(b)} />
      ))}
    </View>
  );
}

function BarRow({ rank, label, value, pct, color }: { rank?: number; label: string; value: string | number; pct: number; color: string }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={s.barRow}>
      {rank !== undefined ? <Text style={s.rank}>{rank}</Text> : null}
      <Text style={s.barLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={s.track}>
        <View style={[s.fill, { width: `${Math.max(2, Math.round(pct * 100))}%`, backgroundColor: color }]} />
      </View>
      <Text style={[s.value, { color }]}>{value}</Text>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardTitle: { color: c.text, fontSize: 14, fontWeight: '700' },
  cardNote: { color: c.muted, fontSize: 11, flex: 1 },
  none: { color: c.muted, fontSize: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rank: { color: c.muted, fontSize: 11, width: 14, textAlign: 'right', fontVariant: ['tabular-nums'] },
  barLabel: { color: c.subtle, fontSize: 12, width: 120 },
  track: { flex: 1, height: 12, borderRadius: radius.sm, backgroundColor: c.surfaceAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.sm },
  value: { fontSize: 11, fontWeight: '600', minWidth: 44, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
