import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Gamepad2, Pause, Play } from 'lucide-react-native';
import { Screen } from '../../../src/components/Screen';
import { ScreenTitle } from '../../../src/components/ScreenTitle';
import { ThreatMap } from '../../../src/components/ThreatMap';
import { EventDetailSheet } from '../../../src/components/EventDetailSheet';
import { CVSSBadge, ListRow, OfflineBanner, SectionHeader, SeverityDot, Skeleton, StatCard } from '../../../src/components/ui';
import { useSimulatedThreats } from '../../../src/hooks/useSimulatedThreats';
import { useRecentCriticalCves } from '../../../src/hooks/useApi';
import { SEVERITY_COLORS, THREAT_TYPE_LABELS } from '../../../src/lib/constants';
import { summarizeCve } from '../../../src/lib/cvss';
import { timeAgo, truncate } from '../../../src/lib/format';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import type { ThreatEvent } from '../../../src/api/types';

export default function HomeScreen() {
  const router = useRouter();
  const { events, isActive, toggleActive } = useSimulatedThreats();
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [selected, setSelected] = useState<ThreatEvent | null>(null);
  const critical = useRecentCriticalCves();

  const stats = useMemo(() => {
    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const e of events) bySeverity[e.severity] += 1;
    return bySeverity;
  }, [events]);

  const criticalCves = useMemo(() => {
    const items = critical.data?.vulnerabilities ?? [];
    return items.map(summarizeCve).filter((c) => c.severity === 'CRITICAL').slice(0, 5);
  }, [critical.data]);

  const header = (
    <View>
      <ScreenTitle title="Aegis" />
      <OfflineBanner visible={critical.isOffline} />
      <View style={s.statsRow}>
        <StatCard label="Critical" value={stats.critical} color={colors.critical} />
        <StatCard label="High" value={stats.high} color={colors.high} />
        <StatCard label="Medium" value={stats.medium} color={colors.medium} />
        <StatCard label="Low" value={stats.low} color={colors.low} />
      </View>

      <View style={s.mapHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[s.liveDot, { backgroundColor: isActive ? colors.success : colors.muted }]} />
          <Text style={s.mapTitle}>LIVE THREAT MAP</Text>
          <Text style={s.simulated}>· simulated activity</Text>
        </View>
        <Pressable onPress={toggleActive} hitSlop={8}>
          {isActive ? <Pause size={16} color={colors.subtle} /> : <Play size={16} color={colors.subtle} />}
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <ThreatMap events={events} height={280} highlightedId={highlighted} />
      </View>

      <SectionHeader title="Recent events" right={<Text style={s.count}>{events.length}</Text>} />
    </View>
  );

  const footer = (
    <View>
      <Pressable onPress={() => router.push('/phish-game')} style={s.gameBanner}>
        <View style={s.gameIcon}>
          <Gamepad2 size={20} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.gameTitle}>Phish or Not?</Text>
          <Text style={s.gameSub}>Swipe through 10 messages and spot the phishing. Can you beat your best?</Text>
        </View>
      </Pressable>
      <SectionHeader title="Latest critical CVEs" />
      {critical.isLoading && !critical.data ? (
        <Skeleton lines={4} />
      ) : criticalCves.length === 0 ? (
        <Text style={s.empty}>No critical CVEs returned right now.</Text>
      ) : (
        criticalCves.map((c) => (
          <ListRow
            key={c.id}
            title={c.id}
            subtitle={truncate(c.description, 110)}
            right={<CVSSBadge score={c.score} severity={c.severity} />}
            onPress={() => router.push({ pathname: '/cve/[id]', params: { id: c.id } })}
          />
        ))
      )}
      <View style={{ height: spacing.xl }} />
    </View>
  );

  return (
    <Screen edges={['top', 'left', 'right']}>
      <FlatList
        data={events.slice(0, 12)}
        keyExtractor={(e) => e.id}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        renderItem={({ item }) => (
          <EventRow
            event={item}
            active={item.id === highlighted}
            onPress={() => {
              setHighlighted(item.id);
              setSelected(item);
            }}
          />
        )}
        ListEmptyComponent={<Text style={s.empty}>{isActive ? 'Waiting for events…' : 'Paused'}</Text>}
      />
      <EventDetailSheet event={selected} onClose={() => setSelected(null)} />
    </Screen>
  );
}

function EventRow({ event, active, onPress }: { event: ThreatEvent; active: boolean; onPress: () => void }) {
  const color = SEVERITY_COLORS[event.severity];
  return (
    <Pressable onPress={onPress} style={[s.event, active && s.eventActive]}>
      <SeverityDot color={color} />
      <View style={{ flex: 1 }}>
        <Text style={s.eventTitle} numberOfLines={1}>
          {event.label}
        </Text>
        <Text style={s.eventMeta}>
          {event.sourceCountry} → {event.targetCountry} · {THREAT_TYPE_LABELS[event.type]} · {timeAgo(event.timestamp)}
        </Text>
      </View>
      <Text style={[s.sev, { color }]}>{event.severity.toUpperCase()}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  h1: { color: colors.text, fontSize: 22, fontWeight: '700', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  mapTitle: { color: colors.subtle, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  simulated: { color: colors.muted, fontSize: 11 },
  count: { color: colors.muted, fontSize: 11, fontVariant: ['tabular-nums'] },
  event: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  eventActive: { backgroundColor: colors.surfaceAlt },
  eventTitle: { color: colors.text, fontSize: 13, fontWeight: '600' },
  eventMeta: { color: colors.muted, fontSize: 11, marginTop: 2 },
  sev: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  empty: { color: colors.muted, fontSize: 13, textAlign: 'center', padding: spacing.lg },
  gameBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.4)',
    backgroundColor: colors.accentDim,
  },
  gameIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  gameTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  gameSub: { color: colors.subtle, fontSize: 12, marginTop: 2 },
});
