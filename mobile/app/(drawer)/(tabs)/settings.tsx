import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Bell, BellOff, ExternalLink, Globe } from 'lucide-react-native';
import { Screen } from '../../../src/components/Screen';
import { ScreenTitle } from '../../../src/components/ScreenTitle';
import { Card, SectionHeader } from '../../../src/components/ui';
import { openUrl } from '../../../src/lib/browser';
import { SITE_URL } from '../../../src/lib/constants';
import { CATEGORY_META, DEFAULT_PREFS, loadPrefs, loadToken } from '../../../src/notifications/prefs';
import { disablePush, registerForPush, setPushPref, type RegisterStatus } from '../../../src/notifications/register';
import { colors } from '../../../src/theme/colors';
import { radius, spacing } from '../../../src/theme/spacing';
import type { PushPrefs } from '../../../src/api/types';

export default function SettingsScreen() {
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

  const toggle = useCallback(async (key: keyof PushPrefs, value: boolean) => {
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
          <View style={s.enableRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{enabled ? 'Notifications on' : 'Notifications off'}</Text>
              <Text style={s.desc}>
                {enabled
                  ? 'This device is registered for alerts.'
                  : 'Enable to get critical CVE alerts and a news digest. Only an anonymous device token is stored.'}
              </Text>
              {status === 'denied' ? <Text style={s.warn}>Permission denied — allow notifications for Aegis in system settings.</Text> : null}
              {status === 'unsupported' || status === 'error' ? <Text style={s.warn}>{message}</Text> : null}
            </View>
            <Pressable onPress={enabled ? disable : enable} disabled={busy || enabled === null} style={[s.btn, enabled && s.btnOff]}>
              {enabled ? <BellOff size={16} color={colors.subtle} /> : <Bell size={16} color={colors.bg} />}
              <Text style={[s.btnText, enabled && s.btnTextOff]}>{busy ? '…' : enabled ? 'Disable' : 'Enable'}</Text>
            </Pressable>
          </View>
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          {CATEGORY_META.map((c, i) => (
            <View key={c.key} style={[s.prefRow, i > 0 && s.prefRowBorder]}>
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

      <SectionHeader title="About" />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
        <LinkRow icon={<Globe size={16} color={colors.accent} />} label="aegis.neeraj.ca" onPress={() => openUrl(SITE_URL)} />
        <LinkRow icon={<ExternalLink size={16} color={colors.accent} />} label="Privacy notice" onPress={() => openUrl(`${SITE_URL}/privacy`)} />
      </View>

      <Text style={s.footer}>
        Aegis {version} · Data from NVD, MITRE ATT&CK, abuse.ch, AbuseIPDB, Shodan InternetDB, ip-api, Ransomware.live, OpenPhish and public RSS feeds.
        Threat map activity is simulated for visualisation. Built by{' '}
        <Text style={s.footerLink} onPress={() => openUrl('https://neeraj.ca')}>
          Neeraj Sharma
        </Text>
        .
      </Text>
    </Screen>
  );
}

function LinkRow({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.link, pressed && { backgroundColor: colors.surfaceAlt }]}>
      {icon}
      <Text style={s.linkText}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  h1: { color: colors.text, fontSize: 22, fontWeight: '700', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  enableRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { color: colors.text, fontSize: 14, fontWeight: '600' },
  desc: { color: colors.muted, fontSize: 12, marginTop: 2, lineHeight: 16 },
  warn: { color: colors.medium, fontSize: 12, marginTop: 6 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accent, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md },
  btnOff: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  btnText: { color: colors.bg, fontWeight: '700', fontSize: 13 },
  btnTextOff: { color: colors.subtle },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  prefRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  linkText: { color: colors.text, fontSize: 14 },
  footer: { color: colors.muted, fontSize: 11, lineHeight: 16, padding: spacing.lg, paddingTop: spacing.xl, textAlign: 'center' },
  footerLink: { color: colors.accent, textDecorationLine: 'underline' },
});
