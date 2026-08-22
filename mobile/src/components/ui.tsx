import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { ChevronRight, WifiOff } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { severityColor, type Severity } from '../lib/cvss';
import { timeAgo } from '../lib/format';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title.toUpperCase()}</Text>
      {right}
    </View>
  );
}

export function StatCard({ label, value, color = colors.accent }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export function CVSSBadge({ score, severity }: { score: number | null; severity?: Severity | string }) {
  const sev = severity ?? (score === null ? 'NONE' : undefined);
  const color = severityColor(sev ?? 'NONE');
  return (
    <View style={[s.badge, { borderColor: color, backgroundColor: `${color}26` }]}>
      <Text style={[s.badgeText, { color }]}>{score === null ? 'N/A' : score.toFixed(1)}</Text>
      {sev && sev !== 'NONE' ? <Text style={[s.badgeSev, { color }]}>{String(sev).toUpperCase()}</Text> : null}
    </View>
  );
}

export function Pill({ label, color = colors.subtle }: { label: string; color?: string }) {
  return (
    <View style={[s.pill, { borderColor: `${color}66`, backgroundColor: `${color}1f` }]}>
      <Text style={[s.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function SeverityDot({ color, size = 8 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function ListRow({
  title,
  subtitle,
  left,
  right,
  onPress,
  chevron = !!onPress,
}: {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [s.row, pressed && s.rowPressed]}>
      {left ? <View style={s.rowLeft}>{left}</View> : null}
      <View style={s.rowBody}>
        <Text style={s.rowTitle} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={s.rowSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {chevron ? <ChevronRight size={16} color={colors.muted} /> : null}
    </Pressable>
  );
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View style={{ gap: spacing.sm, padding: spacing.md }}>
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={[s.skel, { width: `${90 - (i % 3) * 15}%` }]} />
      ))}
    </View>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={s.center}>
      <ActivityIndicator color={colors.accent} />
      <Text style={s.muted}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, message, onRetry }: { title: string; message?: string; onRetry?: () => void }) {
  return (
    <View style={s.center}>
      <Text style={s.emptyTitle}>{title}</Text>
      {message ? <Text style={s.muted}>{message}</Text> : null}
      {onRetry ? (
        <Pressable onPress={onRetry} style={s.retry}>
          <Text style={s.retryText}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function OfflineBanner({ visible, networkError = true }: { visible: boolean; networkError?: boolean }) {
  if (!visible) return null;
  return (
    <View style={s.offline}>
      <WifiOff size={14} color={colors.medium} />
      <Text style={s.offlineText}>{networkError ? 'Offline — showing cached data' : 'Could not refresh — showing cached data'}</Text>
    </View>
  );
}

export function KeyValue({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <View style={s.kv}>
      <Text style={s.kvLabel}>{label}</Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text style={[s.kvValue, mono && s.mono]} selectable>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

/** "Updated 3m ago" line under a feed so cached data is not mistaken for live. */
export function UpdatedAt({ at, refreshing }: { at: number | null | undefined; refreshing?: boolean }) {
  return (
    <Text style={s.updatedAt}>
      {refreshing ? 'Refreshing…' : at ? `Updated ${timeAgo(at)}` : 'Showing cached data'}
    </Text>
  );
}

/** Reserved slot for a future ad placement. Intentionally renders nothing in v1. */
export function AdSlot(_props: { placement: string }) {
  return null;
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: { color: colors.subtle, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statLabel: { color: colors.muted, fontSize: 10, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  badgeSev: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 11, fontWeight: '600' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  chipText: { color: colors.subtle, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: colors.accent },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.surfaceAlt },
  rowLeft: { alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  rowSubtitle: { color: colors.muted, fontSize: 12 },
  skel: { height: 12, borderRadius: 6, backgroundColor: colors.surfaceAlt },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  muted: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  retry: {
    marginTop: spacing.sm,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  retryText: { color: colors.accent, fontWeight: '600' },
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(234,179,8,0.12)',
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
  },
  offlineText: { color: colors.medium, fontSize: 12, fontWeight: '600' },
  updatedAt: { color: colors.muted, fontSize: 11, paddingHorizontal: spacing.lg, paddingBottom: 4 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 6 },
  kvLabel: { color: colors.muted, fontSize: 12, flexShrink: 0 },
  kvValue: { color: colors.text, fontSize: 13, flex: 1, textAlign: 'right' },
  mono: { fontFamily: 'monospace', fontSize: 12 },
});
