import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter, type Href } from 'expo-router';
import type { DrawerContentComponentProps } from 'expo-router/drawer';
import {
  BarChart3,
  Bookmark,
  Bug,
  Calendar,
  Crosshair,
  Fish,
  Gamepad2,
  Globe,
  Lock,
  Newspaper,
  Search,
  Settings,
  Shield,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

type Item = { href: Href; label: string; Icon: typeof Shield; match: string };

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: 'Dashboard',
    items: [
      { href: '/', label: 'Home · Threat Map', Icon: Globe, match: '/' },
      { href: '/news', label: 'Security News', Icon: Newspaper, match: '/news' },
      { href: '/search', label: 'Search (CVE · IOC · IP · Exploits)', Icon: Search, match: '/search' },
      { href: '/watchlist', label: 'My Watchlist', Icon: Bookmark, match: '/watchlist' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { href: '/apt', label: 'APT Tracker', Icon: Crosshair, match: '/apt' },
      { href: '/mitre', label: 'MITRE ATT&CK', Icon: Shield, match: '/mitre' },
      { href: '/ransomware', label: 'Ransomware', Icon: Lock, match: '/ransomware' },
      { href: '/malware', label: 'Malware Bazaar', Icon: Bug, match: '/malware' },
      { href: '/phishing', label: 'Phishing Feed', Icon: Fish, match: '/phishing' },
      { href: '/calendar', label: 'Vuln Calendar', Icon: Calendar, match: '/calendar' },
      { href: '/analytics', label: 'Analytics', Icon: BarChart3, match: '/analytics' },
    ],
  },
  {
    title: 'Play',
    items: [{ href: '/phish-game', label: 'Phish or Not?', Icon: Gamepad2, match: '/phish-game' }],
  },
  {
    title: 'App',
    items: [{ href: '/settings', label: 'Settings & Notifications', Icon: Settings, match: '/settings' }],
  },
];

export function DrawerContent({ navigation }: DrawerContentComponentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const go = (href: Href) => {
    navigation.closeDrawer();
    router.push(href);
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
      <View style={s.brand}>
        <Image source={require('../../assets/splash-icon.png')} style={s.brandIcon} resizeMode="contain" />
        <View>
          <Text style={s.brandName}>AEGIS</Text>
          <Text style={s.brandSub}>Security Intelligence</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg }}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{section.title.toUpperCase()}</Text>
            {section.items.map(({ href, label, Icon, match }) => {
              const active = match === '/' ? pathname === '/' : pathname.startsWith(match);
              return (
                <Pressable key={label} onPress={() => go(href)} style={({ pressed }) => [s.item, active && s.itemActive, pressed && s.itemPressed]}>
                  <Icon size={18} color={active ? colors.accent : colors.subtle} />
                  <Text style={[s.itemText, active && s.itemTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
      <Text style={s.footer}>aegis.neeraj.ca</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  brandIcon: { width: 44, height: 44 },
  brandName: { color: colors.text, fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  brandSub: { color: colors.muted, fontSize: 11 },
  section: { paddingTop: spacing.md },
  sectionTitle: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, paddingHorizontal: spacing.lg, paddingBottom: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: 11, marginHorizontal: spacing.sm, borderRadius: radius.md },
  itemActive: { backgroundColor: colors.accentDim },
  itemPressed: { backgroundColor: colors.surfaceAlt },
  itemText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  itemTextActive: { color: colors.accent, fontWeight: '700' },
  footer: { color: colors.muted, fontSize: 11, textAlign: 'center', paddingTop: spacing.sm },
});
