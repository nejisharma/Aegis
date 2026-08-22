import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ExternalLink, X } from 'lucide-react-native';
import type { RansomwareVictim } from '../api/types';
import { openUrl } from '../lib/browser';
import { flagEmoji, shortDate, timeAgo } from '../lib/format';
import { countryToIso } from '../lib/mitre';
import { useColors } from '../theme/ThemeProvider';
import type { Palette } from '../theme/palettes';
import { radius, spacing } from '../theme/spacing';
import { KeyValue, Pill } from './ui';

interface Props {
  victim: RansomwareVictim | null;
  onClose: () => void;
}

/** Bottom sheet with everything Ransomware.live gives us about one leak-site post. */
export function VictimDetailSheet({ victim, onClose }: Props) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const iso = victim ? countryToIso(victim.country) : null;
  const groupSlug = victim ? victim.group.toLowerCase().replace(/[^a-z0-9]+/g, '') : '';
  const website = victim?.website ? (victim.website.startsWith('http') ? victim.website : `https://${victim.website}`) : null;

  return (
    <Modal visible={!!victim} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      {victim ? (
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.header}>
            <Pill label={victim.group} color={colors.high} />
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={18} color={colors.muted} />
            </Pressable>
          </View>
          <Text style={s.title} selectable>
            {victim.victim}
          </Text>
          <Text style={s.lead}>
            Listed on the {victim.group} leak site {timeAgo(victim.date)}. Appearing here means the group claims to have breached this organisation; it is not independently verified.
          </Text>
          <View style={s.card}>
            <KeyValue label="Country" value={`${iso ? `${flagEmoji(iso)} ` : ''}${victim.country}`} />
            <KeyValue label="Sector" value={victim.activity ?? 'Unknown'} />
            <KeyValue label="Discovered" value={shortDate(victim.date)} />
            {victim.website ? <KeyValue label="Website" value={victim.website} mono /> : null}
          </View>
          <View style={s.actions}>
            <Pressable onPress={() => openUrl(`https://www.ransomware.live/group/${groupSlug}`, colors)} style={s.btn}>
              <ExternalLink size={14} color={colors.accent} />
              <Text style={s.btnText}>Group profile on Ransomware.live</Text>
            </Pressable>
            {website ? (
              <Pressable onPress={() => openUrl(website, colors)} style={s.btnGhost}>
                <Text style={s.btnGhostText}>Open victim website</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
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
    title: { color: c.text, fontSize: 18, fontWeight: '800', lineHeight: 24 },
    lead: { color: c.subtle, fontSize: 12, lineHeight: 17 },
    card: { backgroundColor: c.surfaceAlt, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 4, marginTop: 4 },
    actions: { gap: spacing.sm, marginTop: spacing.sm },
    btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: c.accent, borderRadius: radius.md, paddingVertical: 10 },
    btnText: { color: c.accent, fontWeight: '700', fontSize: 13 },
    btnGhost: { alignItems: 'center', paddingVertical: 8 },
    btnGhostText: { color: c.muted, fontSize: 12, textDecorationLine: 'underline' },
  });
