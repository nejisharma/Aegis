import { useCallback, useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Bookmark, FileText, Globe, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/Screen';
import { Segmented } from '../../../src/components/Segmented';
import { ScreenTitle } from '../../../src/components/ScreenTitle';
import { Card, SectionHeader } from '../../../src/components/ui';
import { openUrl } from '../../../src/lib/browser';
import { SITE_URL } from '../../../src/lib/constants';
import { CATEGORY_META, DEFAULT_PREFS, loadPrefs, loadToken } from '../../../src/notifications/prefs';
import { disablePush, registerForPush, setPushPref, type RegisterStatus } from '../../../src/notifications/register';
import { useColors, useTheme, type ThemeMode } from '../../../src/theme/ThemeProvider';
import type { Palette } from '../../../src/theme/palettes';
import { radius, spacing } from '../../../src/theme/spacing';
import type { PushPrefs } from '../../../src/api/types';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
];

export default function SettingsScreen() {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const { mode, setMode } = useTheme();
  const router = useRouter();
  const [prefs, setPrefs] = useState<PushPrefs>(DEFAULT_PREFS);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [status, setStatus] = useState<RegisterStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadPrefs().then(setPrefs);
    loadToken().then((t) => setEnabled(!!t));
  }, []);

  const enable = useCallback(async () => {
    setBusy(true);
    const r = await registerForPush(prefs);
    setStatus(r.status);
    setMessage(r.message ?? null);
    setEnabled(r.status === 'registered');
    setBusy(false);
  }, [prefs]);

  const disable = useCallback(async () => {
    setBusy(true);
    await disablePush();
    setEnabled(false);
    setStatus(null);
    setBusy(false);
  }, []);

  const toggle = useCallback(async (key: 'critical_cve' | 'news_digest' | 'watchlist', value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    const saved = await setPushPref(key, value);
    setPrefs(saved);
  }, []);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen scroll edges={['top', 'left', 'right']}>
      <ScreenTitle title="Settings" />

      <SectionHeader title="Push notifications" />
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Card>
          <View style={s.prefRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Push notifications</Text>
              <Text style={s.desc}>
                {enabled
                  ? 'This device is registered for alerts.'
                  : 'Critical CVE alerts, news digest and watchlist hits. Only an anonymous device token is stored.'}
              </Text>
              {status === 'denied' ? <Text style={s.warn}>Permission denied — allow notifications for Aegis Intel in system settings.</Text> : null}
              {status === 'unsupported' || status === 'error' ? <Text style={s.warn}>{message}</Text> : null}
            </View>
            {busy ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Switch
                value={!!enabled}
                onValueChange={(v) => (v ? enable() : disable())}
                trackColor={{ true: colors.accent, false: colors.border }}
                thumbColor={colors.text}
                disabled={enabled === null}
              />
            )}
          </View>
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          {CATEGORY_META.map((c, i) => (
            <View key={c.key} style={[s.prefRow, i > 0 && s.prefRowBorder, !enabled && s.dimmed]}>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{c.title}</Text>
                <Text style={s.desc}>{c.description}</Text>
              </View>
              <Switch
                value={prefs[c.key]}
                onValueChange={(v) => toggle(c.key, v)}
                trackColor={{ true: colors.accent, false: colors.border }}
                thumbColor={colors.text}
                disabled={!enabled}
              />
            </View>
          ))}
        </Card>
      </View>

      <SectionHeader title="Watchlist" />
      <View style={{ paddingHorizontal: spacing.lg }}>
        <LinkRow icon={<Bookmark size={16} color={colors.accent} />} label="Manage watchlist terms" onPress={() => router.push('/watchlist')} />
      </View>

      <SectionHeader title="Appearance" />
      <Segmented<ThemeMode> options={THEME_OPTIONS} value={mode} onChange={setMode} />

      <SectionHeader title="About" />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
        <LinkRow icon={<Globe size={16} color={colors.accent} />} label="aegis.neeraj.ca" onPress={() => openUrl(SITE_URL, colors)} />
        <LinkRow icon={<ShieldCheck size={16} color={colors.accent} />} label="Privacy policy" onPress={() => openUrl(`${SITE_URL}/privacy`, colors)} />
        <LinkRow icon={<FileText size={16} color={colors.accent} />} label="Terms & conditions" onPress={() => openUrl(`${SITE_URL}/terms`, colors)} />
      </View>

      <Text style={s.footer}>
        Aegis {version} · Data from NVD, MITRE ATT&CK, abuse.ch, AbuseIPDB, Shodan InternetDB, ip-api, Ransomware.live, OpenPhish and public RSS feeds.
        Threat map activity is simulated for visualisation.
      </Text>
      <Text style={s.footerAuthor}>
        Built by{' '}
        <Text style={s.footerLink} onPress={() => openUrl('https://neeraj.ca', colors)}>
          Neeraj Sharma
        </Text>
      </Text>
    </Screen>
  );
}

function LinkRow({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.link, pressed && { backgroundColor: colors.surfaceAlt }]}>
      {icon}
      <Text style={s.linkText}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  h1: { color: c.text, fontSize: 22, fontWeight: '700', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { color: c.text, fontSize: 14, fontWeight: '600' },
  desc: { color: c.muted, fontSize: 12, marginTop: 2, lineHeight: 16 },
  warn: { color: c.medium, fontSize: 12, marginTop: 6 },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  prefRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: c.surface,
    borderColor: c.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  linkText: { color: c.text, fontSize: 14 },
  footer: { color: c.muted, fontSize: 11, lineHeight: 16, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.sm, textAlign: 'center' },
  footerLink: { color: c.accent, textDecorationLine: 'underline' },
  footerAuthor: { color: c.muted, fontSize: 12, textAlign: 'center', paddingBottom: spacing.xl },
  dimmed: { opacity: 0.45 },
});
