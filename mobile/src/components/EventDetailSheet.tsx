import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import type { ThreatEvent } from '../api/types';
import { SEVERITY_COLORS, THREAT_TYPE_LABELS } from '../lib/constants';
import { flagEmoji, timeAgo } from '../lib/format';
import { useColors } from '../theme/ThemeProvider';
import type { Palette } from '../theme/palettes';
import { radius, spacing } from '../theme/spacing';

const TYPE_DESCRIPTIONS: Record<ThreatEvent['type'], string> = {
  malware: 'Delivery or execution of malicious software (droppers, loaders, stealers, beacons).',
  phishing: 'Credential harvesting or social-engineering lure aimed at users of the target.',
  exploit: 'Attempted exploitation of a known vulnerability in exposed software.',
  ddos: 'Volumetric or application-layer traffic flood against the target.',
  bruteforce: 'Credential guessing / password spraying against remote services.',
  ransomware: 'Encryption or data-extortion activity by a ransomware operation.',
  apt: 'Activity attributed to a state-sponsored or advanced persistent threat group.',
};

interface Props {
  event: ThreatEvent | null;
  onClose: () => void;
}

/** Bottom-sheet with the same information as the website's marker popup, plus coordinates and a type description. */
export function EventDetailSheet({ event, onClose }: Props) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const color = event ? SEVERITY_COLORS[event.severity] : colors.muted;
  return (
    <Modal visible={!!event} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      {event ? (
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.header}>
            <Text style={[s.kicker, { color }]}>
              {THREAT_TYPE_LABELS[event.type]} — {event.severity.toUpperCase()}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={18} color={colors.muted} />
            </Pressable>
          </View>
          <Text style={s.label}>{event.label}</Text>
          <Text style={s.desc}>{TYPE_DESCRIPTIONS[event.type]}</Text>

          <View style={s.route}>
            <Endpoint title="Source" code={event.sourceCountryCode} name={event.sourceCountry} lat={event.sourceLat} lng={event.sourceLng} accent={colors.accent} />
            <Text style={s.arrow}>→</Text>
            <Endpoint title="Target" code={event.targetCountryCode} name={event.targetCountry} lat={event.targetLat} lng={event.targetLng} accent={colors.high} />
          </View>

          <View style={s.footer}>
            <Text style={s.meta}>Observed {timeAgo(event.timestamp)}</Text>
            <Text style={s.meta}>Simulated event · {event.id.slice(-6)}</Text>
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

function Endpoint({ title, code, name, lat, lng, accent }: { title: string; code: string; name: string; lat: number; lng: number; accent: string }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={s.endpoint}>
      <Text style={[s.endpointTitle, { color: accent }]}>{title.toUpperCase()}</Text>
      <Text style={s.endpointName}>
        {flagEmoji(code)} {name}
      </Text>
      <Text style={s.coords}>
        {lat.toFixed(2)}°, {lng.toFixed(2)}°
      </Text>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: radius.lg + 6,
    borderTopRightRadius: radius.lg + 6,
    borderTopWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
    paddingBottom: spacing.xl + 8,
    gap: spacing.sm,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  label: { color: c.text, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  desc: { color: c.subtle, fontSize: 12, lineHeight: 17 },
  route: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  endpoint: { flex: 1, backgroundColor: c.surfaceAlt, borderRadius: radius.md, padding: spacing.md, gap: 2 },
  endpointTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  endpointName: { color: c.text, fontSize: 14, fontWeight: '600' },
  coords: { color: c.muted, fontSize: 11, fontVariant: ['tabular-nums'] },
  arrow: { color: c.muted, fontSize: 18 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  meta: { color: c.muted, fontSize: 11 },
});
