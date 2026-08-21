import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { BarChart3, Bug, Calendar, Crosshair, Fish, Lock, Shield } from 'lucide-react-native';
import { Screen } from '../../src/components/Screen';
import { AdSlot } from '../../src/components/ui';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/spacing';

const SECTIONS: { href: Href; title: string; subtitle: string; Icon: typeof Shield; color: string }[] = [
  { href: '/apt', title: 'APT Tracker', subtitle: 'MITRE ATT&CK groups, TTPs, targets', Icon: Crosshair, color: colors.critical },
  { href: '/mitre', title: 'MITRE ATT&CK', subtitle: 'Tactics → techniques, colored by APT use', Icon: Shield, color: colors.accent },
  { href: '/ransomware', title: 'Ransomware', subtitle: 'Active groups and recent victims', Icon: Lock, color: colors.high },
  { href: '/malware', title: 'Malware Bazaar', subtitle: 'Recent samples, hashes and signatures', Icon: Bug, color: colors.medium },
  { href: '/phishing', title: 'Phishing Feed', subtitle: 'Live OpenPhish / PhishTank URLs', Icon: Fish, color: colors.low },
  { href: '/calendar', title: 'Vuln Calendar', subtitle: 'Patch Tuesday, Adobe, Oracle CPU', Icon: Calendar, color: colors.success },
  { href: '/analytics', title: 'Analytics', subtitle: 'CVSS distribution, attack vectors, countries', Icon: BarChart3, color: colors.subtle },
];

export default function IntelScreen() {
  const router = useRouter();
  return (
    <Screen scroll edges={['top', 'left', 'right']}>
      <Text style={s.h1}>Threat Intel</Text>
      <View style={s.grid}>
        {SECTIONS.map(({ href, title, subtitle, Icon, color }) => (
          <Pressable key={title} onPress={() => router.push(href)} style={({ pressed }) => [s.tile, pressed && s.tilePressed]}>
            <View style={[s.iconWrap, { backgroundColor: `${color}1f` }]}>
              <Icon size={20} color={color} />
            </View>
            <Text style={s.title}>{title}</Text>
            <Text style={s.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </Pressable>
        ))}
      </View>
      <AdSlot placement="intel" />
    </Screen>
  );
}

const s = StyleSheet.create({
  h1: { color: colors.text, fontSize: 22, fontWeight: '700', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.lg, gap: spacing.md },
  tile: {
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6,
    minHeight: 120,
  },
  tilePressed: { backgroundColor: colors.surfaceAlt },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 4 },
  subtitle: { color: colors.muted, fontSize: 11, lineHeight: 15 },
});
