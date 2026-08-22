import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Gamepad2, Pause, Play } from 'lucide-react-native';
import { Screen } from '../../../src/components/Screen';
import { ScreenTitle } from '../../../src/components/ScreenTitle';
import { ThreatMap } from '../../../src/components/ThreatMap';
import { EventDetailSheet } from '../../../src/components/EventDetailSheet';
import { CVSSBadge, ListRow, OfflineBanner, SectionHeader, SeverityDot, Skeleton, StatCard, UpdatedAt } from '../../../src/components/ui';
import { useSimulatedThreats } from '../../../src/hooks/useSimulatedThreats';
import { useKevIds, useRecentCriticalCves } from '../../../src/hooks/useApi';
import { KevBadge } from '../../../src/components/ExploitBadges';
import { SEVERITY_COLORS, THREAT_TYPE_LABELS } from '../../../src/lib/constants';
import { summarizeCve } from '../../../src/lib/cvss';
import { timeAgo, truncate } from '../../../src/lib/format';
import { useColors } from '../../../src/theme/ThemeProvider';
import type { Palette } from '../../../src/theme/palettes';
import { spacing } from '../../../src/theme/spacing';
import type { ThreatEvent } from '../../../src/api/types';

export default function HomeScreen() {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const { events, isActive, toggleActive } = useSimulatedThreats();
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [selected, setSelected] = useState<ThreatEvent | null>(null);
  const critical = useRecentCriticalCves();
  const { ids: kevIds } = useKevIds();
  const { width } = useWindowDimensions();
  // Tablets / landscape: map on the left, event list on the right.
  const wide = width >= 768;

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
      <OfflineBanner visible={critical.isOffline} networkError={critical.isNetworkError} />
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
      {wide ? (
        <View style={s.wideRow}>
          <View style={{ flex: 3 }}>
            <ThreatMap events={events} height={440} highlightedId={highlighted} />
          </View>
          <View style={s.wideList}>
            <SectionHeader title="Recent events" right={<Text style={s.count}>{events.length}</Text>} />
            {events.slice(0, 8).map((e) => (
              <EventRow key={e.id} event={e} active={e.id === highlighted} onPress={() => { setHighlighted(e.id); setSelected(e); }} />
            ))}
          </View>
        </View>
      ) : (
        <>
          <View style={{ paddingHorizontal: spacing.lg }}>
            <ThreatMap events={events} height={280} highlightedId={highlighted} />
          </View>
          <SectionHeader title="Recent events" right={<Text style={s.count}>{events.length}</Text>} />
        </>
      )}
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
      <SectionHeader title="Latest critical CVEs" right={<UpdatedAt at={critical.updatedAt} refreshing={critical.isRefreshing} />} />
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
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {kevIds.has(c.id) ? <KevBadge /> : null}
                <CVSSBadge score={c.score} severity={c.severity} />
              </View>
            }
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
        data={wide ? [] : events.slice(0, 12)}
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
        ListEmptyComponent={wide ? null : <Text style={s.empty}>{isActive ? 'Waiting for events…' : 'Paused'}</Text>}
        refreshControl={<RefreshControl refreshing={critical.isRefreshing} onRefresh={() => critical.mutate()} tintColor={colors.accent} colors={[colors.accent]} />}
      />
      <EventDetailSheet event={selected} onClose={() => setSelected(null)} />
    </Screen>
  );
}

function EventRow({ event, active, onPress }: { event: ThreatEvent; active: boolean; onPress: () => void }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
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

const makeStyles = (c: Palette) => StyleSheet.create({
  h1: { color: c.text, fontSize: 22, fontWeight: '700', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  wideRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, alignItems: 'flex-start' },
  wideList: { flex: 2, backgroundColor: c.surface, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, overflow: 'hidden' },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  mapTitle: { color: c.subtle, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  simulated: { color: c.muted, fontSize: 11 },
  count: { color: c.muted, fontSize: 11, fontVariant: ['tabular-nums'] },
  event: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  eventActive: { backgroundColor: c.surfaceAlt },
  eventTitle: { color: c.text, fontSize: 13, fontWeight: '600' },
  eventMeta: { color: c.muted, fontSize: 11, marginTop: 2 },
  sev: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  empty: { color: c.muted, fontSize: 13, textAlign: 'center', padding: spacing.lg },
  gameBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${c.accent}66`,
    backgroundColor: c.accentDim,
  },
  gameIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' },
  gameTitle: { color: c.text, fontSize: 14, fontWeight: '800' },
  gameSub: { color: c.subtle, fontSize: 12, marginTop: 2 },
});
