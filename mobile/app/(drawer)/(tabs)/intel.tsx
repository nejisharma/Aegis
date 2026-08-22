import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAnimatedCounter } from '../../../src/hooks/useAnimatedCounter';
import { useMitre } from '../../../src/hooks/useApi';
import { StatCard } from '../../../src/components/ui';
import { useRouter, type Href } from 'expo-router';
import { BarChart3, Bookmark, Bug, Calendar, Crosshair, Fish, Gamepad2, Lock, Shield } from 'lucide-react-native';
import { Screen } from '../../../src/components/Screen';
import { ScreenTitle } from '../../../src/components/ScreenTitle';
import { AdSlot } from '../../../src/components/ui';
import { useColors } from '../../../src/theme/ThemeProvider';
import type { Palette } from '../../../src/theme/palettes';
import { radius, spacing } from '../../../src/theme/spacing';

const SECTIONS: { href: Href; title: string; subtitle: string; Icon: typeof Shield; color: keyof Palette }[] = [
  { href: '/watchlist', title: 'My Watchlist', subtitle: 'CVE alerts for the products you care about', Icon: Bookmark, color: 'accent' },
  { href: '/apt', title: 'APT Tracker', subtitle: 'MITRE ATT&CK groups, TTPs, targets', Icon: Crosshair, color: 'critical' },
  { href: '/mitre', title: 'MITRE ATT&CK', subtitle: 'Tactics → techniques, colored by APT use', Icon: Shield, color: 'accent' },
  { href: '/ransomware', title: 'Ransomware', subtitle: 'Active groups and recent victims', Icon: Lock, color: 'high' },
  { href: '/malware', title: 'Malware Bazaar', subtitle: 'Recent samples, hashes and signatures', Icon: Bug, color: 'medium' },
  { href: '/phishing', title: 'Phishing Feed', subtitle: 'Live OpenPhish / PhishTank URLs', Icon: Fish, color: 'low' },
  { href: '/calendar', title: 'Vuln Calendar', subtitle: 'Patch Tuesday, Adobe, Oracle CPU', Icon: Calendar, color: 'success' },
  { href: '/analytics', title: 'Analytics', subtitle: 'CVSS distribution, attack vectors, countries', Icon: BarChart3, color: 'subtle' },
  { href: '/phish-game', title: 'Phish or Not?', subtitle: 'Swipe game: spot the phishing message', Icon: Gamepad2, color: 'accent' },
];

export default function IntelScreen() {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  // Same headline figures as the website overview: drifting counters plus the live APT group count.
  const totalCves = useAnimatedCounter(254387, 2000, 6000);
  const malwareSamples = useAnimatedCounter(12847, 4000, 10000);
  const iocsTracked = useAnimatedCounter(89234, 3000, 8000);
  const mitre = useMitre();
  const aptGroups = mitre.data?.groups.length || 142;
  return (
    <Screen scroll edges={['top', 'left', 'right']}>
      <ScreenTitle title="Threat Intel" />
      <View style={s.stats}>
        <StatCard label="Total CVEs" value={totalCves.toLocaleString()} color={colors.accent} />
        <StatCard label="Malware samples" value={malwareSamples.toLocaleString()} color={colors.medium} />
      </View>
      <View style={[s.stats, { paddingTop: spacing.sm }]}>
        <StatCard label="IOCs tracked" value={iocsTracked.toLocaleString()} color={colors.high} />
        <StatCard label="APT groups" value={aptGroups} color={colors.critical} />
      </View>
      <View style={s.grid}>
        {SECTIONS.map(({ href, title, subtitle, Icon, color: colorKey }) => {
          const color = colors[colorKey];
          return (
            <Pressable key={title} onPress={() => router.push(href)} style={({ pressed }) => [s.tile, pressed && s.tilePressed]}>
              <View style={[s.iconWrap, { backgroundColor: `${color}1f` }]}>
                <Icon size={20} color={color} />
              </View>
              <Text style={s.title}>{title}</Text>
              <Text style={s.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <AdSlot placement="intel" />
    </Screen>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  h1: { color: c.text, fontSize: 22, fontWeight: '700', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.lg, gap: spacing.md },
  tile: {
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: c.surface,
    borderColor: c.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6,
    minHeight: 120,
  },
  tilePressed: { backgroundColor: c.surfaceAlt },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { color: c.text, fontSize: 14, fontWeight: '700', marginTop: 4 },
  subtitle: { color: c.muted, fontSize: 11, lineHeight: 15 },
});
