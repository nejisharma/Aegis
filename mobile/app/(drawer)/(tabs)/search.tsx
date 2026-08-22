import { useState, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { mutate as swrMutate } from 'swr';
import { useEffect } from 'react';
import { Clock, X } from 'lucide-react-native';
import { useSearchHistory } from '../../../src/lib/history';
import { useRouter } from 'expo-router';
import { ErrorState } from '../../../src/components/ErrorState';
import { Screen } from '../../../src/components/Screen';
import { ScreenTitle } from '../../../src/components/ScreenTitle';
import { SearchBar } from '../../../src/components/SearchBar';
import { Segmented } from '../../../src/components/Segmented';
import { CVSSBadge, Card, EmptyState, KeyValue, ListRow, Loading, Pill, SectionHeader } from '../../../src/components/ui';
import { useAbuseIpdb, useCveSearch, useDebounced, useExploits, useGeoIp, useIocLookup, useKevIds, useShodan } from '../../../src/hooks/useApi';
import { KevBadge } from '../../../src/components/ExploitBadges';
import { summarizeCve, severityColor } from '../../../src/lib/cvss';
import { detectIocType } from '../../../src/lib/ioc';
import { flagEmoji, shortDate, truncate } from '../../../src/lib/format';
import { openUrl } from '../../../src/lib/browser';
import { useColors } from '../../../src/theme/ThemeProvider';
import type { Palette } from '../../../src/theme/palettes';
import { spacing } from '../../../src/theme/spacing';

type Mode = 'cve' | 'ioc' | 'ip' | 'exploits';

const PLACEHOLDER: Record<Mode, string> = {
  cve: 'Keyword or CVE ID, e.g. CVE-2024-3094',
  ioc: 'IP, domain, URL or file hash',
  ip: 'IPv4 or IPv6 address',
  exploits: 'Product, package or CVE, e.g. log4j',
};

export default function SearchScreen() {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [mode, setMode] = useState<Mode>('cve');
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const debounced = useDebounced(query, 600);
  // CVE / Exploits search as you type (like the website); IOC / IP only on Enter or the Look up button.
  const explicit = mode === 'ioc' || mode === 'ip';
  const effective = explicit ? submitted : submitted || debounced;
  const history = useSearchHistory(mode);

  // Remember completed searches: explicit submits, or debounced terms of 3+ chars for the type-ahead modes.
  useEffect(() => {
    if (!effective || (!explicit && effective.trim().length < 3)) return;
    history.add(effective);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effective, explicit]);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenTitle title="Search" />
      <Segmented
        value={mode}
        onChange={(m) => {
          setMode(m);
          setSubmitted('');
        }}
        options={[
          { value: 'cve', label: 'CVE' },
          { value: 'ioc', label: 'IOC' },
          { value: 'ip', label: 'IP Intel' },
          { value: 'exploits', label: 'Exploits' },
        ]}
      />
      <SearchBar value={query} onChangeText={(t) => { setQuery(t); setSubmitted(''); }} onSubmit={() => setSubmitted(query.trim())} placeholder={PLACEHOLDER[mode]} />
      {explicit && query.trim() && !submitted ? (
        <Pressable onPress={() => setSubmitted(query.trim())} style={s.lookupBtn}>
          <Text style={s.lookupText}>Look up</Text>
        </Pressable>
      ) : null}
      {!query.trim() && history.items.length ? (
        <View style={s.history}>
          <View style={s.historyHead}>
            <Text style={s.historyTitle}>RECENT</Text>
            <Pressable onPress={history.clear} hitSlop={8}>
              <Text style={s.historyClear}>Clear</Text>
            </Pressable>
          </View>
          <View style={s.historyChips}>
            {history.items.map((h) => (
              <View key={h} style={s.historyChip}>
                <Pressable
                  onPress={() => {
                    setQuery(h);
                    setSubmitted(h);
                  }}
                  style={s.historyChipMain}
                >
                  <Clock size={12} color={colors.muted} />
                  <Text style={s.historyChipText} numberOfLines={1}>
                    {h}
                  </Text>
                </Pressable>
                <Pressable onPress={() => history.remove(h)} hitSlop={8}>
                  <X size={12} color={colors.muted} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.accent}
            colors={[colors.accent]}
            onRefresh={async () => {
              if (!effective) return;
              setRefreshing(true);
              // Revalidate every cached query for the current mode/term.
              await swrMutate((key) => typeof key === 'string' && key.includes(`:${effective}`), undefined, { revalidate: true });
              setRefreshing(false);
            }}
          />
        }
      >
        {mode === 'cve' && <CveResults keyword={effective} />}
        {mode === 'ioc' && <IocResults query={effective} />}
        {mode === 'ip' && <IpResults ip={effective} />}
        {mode === 'exploits' && <ExploitResults keyword={effective} />}
      </ScrollView>
    </Screen>
  );
}

function moreChars(q: string) {
  const n = 3 - q.trim().length;
  return `Type ${n} more character${n > 1 ? 's' : ''} to search…`;
}

function Hint({ text }: { text: string }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return <Text style={s.hint}>{text}</Text>;
}

function CveResults({ keyword }: { keyword: string }) {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useCveSearch(keyword.trim().length >= 3 ? keyword : '', 25);
  const { ids: kevIds } = useKevIds();
  if (!keyword.trim()) return <Hint text="Searches the NVD database. Results include CVSS v3.1 scores." />;
  if (keyword.trim().length < 3) return <Hint text={moreChars(keyword)} />;
  if (isLoading && !data) return <Loading label="Searching NVD…" />;
  if (error && !data) return <ErrorState error={error} onRetry={() => mutate()} />;
  const items = (data?.vulnerabilities ?? []).map(summarizeCve);
  if (!items.length) return <EmptyState title="No results" message={`Nothing matched “${keyword}”.`} />;
  return (
    <View>
      <SectionHeader title={`${data?.totalResults ?? items.length} results`} />
      {items.map((c) => (
        <ListRow
          key={c.id}
          title={c.id}
          subtitle={`${shortDate(c.published)} · ${truncate(c.description, 100)}`}
          right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {kevIds.has(c.id) ? <KevBadge /> : null}
              <CVSSBadge score={c.score} severity={c.severity} />
            </View>
          }
          onPress={() => router.push({ pathname: '/cve/[id]', params: { id: c.id } })}
        />
      ))}
    </View>
  );
}

function IocResults({ query }: { query: string }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const type = detectIocType(query);
  const { data, error, isLoading, mutate } = useIocLookup(query);
  if (!query.trim()) return <Hint text="Checks ThreatFox, URLhaus, AbuseIPDB (IPs), MalwareBazaar and VirusTotal (hashes). Press search or Look up to run." />;
  if (type === 'unknown') return <Hint text="Enter an IP address, domain, URL, or MD5/SHA1/SHA256 hash." />;
  if (isLoading && !data) return <Loading label={`Looking up ${type}…`} />;
  if (error && !data) return <ErrorState error={error} onRetry={() => mutate()} />;
  if (!data) return null;

  const tf = Array.isArray(data.threatfox?.data) ? data.threatfox.data : [];
  const uh = Array.isArray(data.urlhaus?.urls) ? data.urlhaus.urls : [];
  const ab = data.abuseipdb;
  const mb = Array.isArray(data.malware?.data) ? data.malware.data : [];
  const vt = data.virustotal && typeof data.virustotal === 'object' ? data.virustotal.attributes : undefined;
  const hits = tf.length + uh.length + (ab && ab.abuseConfidenceScore > 0 ? 1 : 0) + mb.length + (vt?.last_analysis_stats?.malicious ? 1 : 0);

  return (
    <View style={{ padding: spacing.lg, gap: spacing.md }}>
      <View style={s.verdict}>
        <Pill label={type.toUpperCase()} color={colors.accent} />
        <Text style={[s.verdictText, { color: hits ? colors.critical : colors.success }]}>{hits ? `${hits} threat indicator${hits > 1 ? 's' : ''} found` : 'No known threat indicators'}</Text>
      </View>

      {ab ? (
        <Card>
          <Text style={s.cardTitle}>AbuseIPDB</Text>
          <KeyValue label="Abuse confidence" value={<Text style={{ color: ab.abuseConfidenceScore > 50 ? colors.critical : ab.abuseConfidenceScore > 0 ? colors.medium : colors.success, fontWeight: '700' }}>{ab.abuseConfidenceScore}%</Text>} />
          <KeyValue label="Reports" value={ab.totalReports} />
          <KeyValue label="ISP" value={ab.isp ?? '—'} />
          <KeyValue label="Usage" value={ab.usageType ?? '—'} />
          <KeyValue label="Country" value={`${flagEmoji(ab.countryCode)} ${ab.countryCode ?? '—'}`} />
          {ab.lastReportedAt ? <KeyValue label="Last reported" value={shortDate(ab.lastReportedAt)} /> : null}
        </Card>
      ) : null}

      {vt ? (
        <Card>
          <Text style={s.cardTitle}>VirusTotal</Text>
          <KeyValue label="Malicious" value={<Text style={{ color: vt.last_analysis_stats?.malicious ? colors.critical : colors.success, fontWeight: '700' }}>{vt.last_analysis_stats?.malicious ?? 0} / {Object.values(vt.last_analysis_stats ?? {}).reduce((a, b) => a + b, 0)}</Text>} />
          {vt.meaningful_name ? <KeyValue label="Name" value={vt.meaningful_name} /> : null}
          {vt.type_description ? <KeyValue label="Type" value={vt.type_description} /> : null}
        </Card>
      ) : null}

      <Card>
        <Text style={s.cardTitle}>ThreatFox · {tf.length} IOC{tf.length === 1 ? '' : 's'}</Text>
        {tf.slice(0, 10).map((i) => (
          <View key={i.id} style={s.sub}>
            <Text style={s.subTitle}>{i.malware_printable}</Text>
            <Text style={s.subMeta}>{i.threat_type_desc} · confidence {i.confidence_level}% · {shortDate(i.first_seen)}</Text>
          </View>
        ))}
        {!tf.length ? <Text style={s.none}>No matches</Text> : null}
      </Card>

      <Card>
        <Text style={s.cardTitle}>URLhaus · {uh.length} URL{uh.length === 1 ? '' : 's'}</Text>
        {uh.slice(0, 10).map((u) => (
          <View key={u.id} style={s.sub}>
            <Text style={s.subTitle} numberOfLines={1}>{u.url}</Text>
            <Text style={s.subMeta}>{u.threat} · {u.url_status} · {shortDate(u.date_added)}</Text>
          </View>
        ))}
        {!uh.length ? <Text style={s.none}>No matches</Text> : null}
      </Card>

      {type === 'hash' ? (
        <Card>
          <Text style={s.cardTitle}>MalwareBazaar</Text>
          {mb.slice(0, 3).map((m) => (
            <View key={m.sha256_hash} style={s.sub}>
              <Text style={s.subTitle}>{m.signature ?? m.file_name ?? 'Unnamed sample'}</Text>
              <Text style={s.subMeta}>{m.file_type ?? '?'} · first seen {shortDate(m.first_seen)}</Text>
            </View>
          ))}
          {!mb.length ? <Text style={s.none}>Not in MalwareBazaar</Text> : null}
        </Card>
      ) : null}

      {data.errors.length ? <Text style={s.errors}>{data.errors.join('\n')}</Text> : null}
    </View>
  );
}

function IpResults({ ip }: { ip: string }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const valid = detectIocType(ip) === 'ip';
  const geo = useGeoIp(valid ? ip : '');
  const shodan = useShodan(valid ? ip : '');
  const abuse = useAbuseIpdb(valid ? ip : '');
  if (!ip.trim()) return <Hint text="GeoIP (ip-api.com) + Shodan InternetDB open ports and known vulns. Press search or Look up to run." />;
  if (!valid) return <Hint text="Enter a valid IPv4 or IPv6 address." />;
  if (geo.isLoading && !geo.data) return <Loading label="Resolving…" />;
  const g = geo.data;
  const sh = shodan.data;
  return (
    <View style={{ padding: spacing.lg, gap: spacing.md }}>
      {g && g.status === 'success' ? (
        <Card>
          <Text style={s.cardTitle}>{flagEmoji(g.countryCode)} {g.city ? `${g.city}, ` : ''}{g.country}</Text>
          <KeyValue label="IP" value={g.query} mono />
          <KeyValue label="ISP" value={g.isp} />
          <KeyValue label="Organisation" value={g.org || '—'} />
          <KeyValue label="AS" value={g.as || '—'} />
          <KeyValue label="Region" value={g.regionName || '—'} />
          <KeyValue label="Timezone" value={g.timezone || '—'} />
          <KeyValue label="Coordinates" value={`${g.lat.toFixed(3)}, ${g.lon.toFixed(3)}`} mono />
        </Card>
      ) : (
        <ErrorState error={geo.error} onRetry={() => geo.mutate()} />
      )}

      <Card>
        <Text style={s.cardTitle}>Shodan InternetDB</Text>
        {shodan.isLoading && !sh ? (
          <Text style={s.none}>Loading…</Text>
        ) : !sh ? (
          <Text style={s.none}>{shodan.error?.status === 404 ? 'No information for this IP' : shodan.error?.message ?? 'Unavailable'}</Text>
        ) : (
          <>
            <KeyValue label="Open ports" value={sh.ports.length ? sh.ports.join(', ') : 'None observed'} mono />
            {sh.hostnames.length ? <KeyValue label="Hostnames" value={sh.hostnames.join(', ')} /> : null}
            {sh.tags.length ? <KeyValue label="Tags" value={sh.tags.join(', ')} /> : null}
            {sh.cpes.length ? <KeyValue label="CPEs" value={sh.cpes.slice(0, 5).join('\n')} mono /> : null}
            <View style={{ marginTop: 6 }}>
              <Text style={s.subMeta}>Known vulnerabilities ({sh.vulns.length})</Text>
              <View style={[s.pills, { paddingHorizontal: 0, marginTop: 6 }]}>
                {sh.vulns.slice(0, 20).map((v) => (
                  <Pill key={v} label={v} color={colors.critical} />
                ))}
                {sh.vulns.length > 20 ? <Pill label={`+${sh.vulns.length - 20} more`} /> : null}
              </View>
            </View>
          </>
        )}
      </Card>

      {abuse.data ? (
        <Card>
          <Text style={s.cardTitle}>AbuseIPDB</Text>
          <KeyValue label="Abuse confidence" value={<Text style={{ color: abuse.data.abuseConfidenceScore > 50 ? colors.critical : abuse.data.abuseConfidenceScore > 0 ? colors.medium : colors.success, fontWeight: '700' }}>{abuse.data.abuseConfidenceScore}%</Text>} />
          <KeyValue label="Reports" value={abuse.data.totalReports} />
          <KeyValue label="Usage" value={abuse.data.usageType ?? '—'} />
        </Card>
      ) : null}
    </View>
  );
}

function ExploitResults({ keyword }: { keyword: string }) {
  const colors = useColors();
  const { data, error, isLoading, mutate } = useExploits(keyword.trim().length >= 3 ? keyword : '');
  if (!keyword.trim()) return <Hint text="Searches the GitHub Advisory Database for public exploits and advisories." />;
  if (keyword.trim().length < 3) return <Hint text={moreChars(keyword)} />;
  if (isLoading && !data) return <Loading label="Searching advisories…" />;
  if (error && !data) return <ErrorState error={error} onRetry={() => mutate()} />;
  const items = data?.advisories ?? [];
  if (!items.length) return <EmptyState title="No advisories" message={`Nothing matched “${keyword}”.`} />;
  return (
    <View>
      <SectionHeader title={`${items.length} advisories`} />
      {items.map((a) => {
        const color = severityColor(a.severity);
        return (
          <ListRow
            key={a.id}
            title={a.summary}
            subtitle={`${a.cveId ?? a.id} · ${shortDate(a.publishedAt)}${a.vulnerabilities[0]?.packageName ? ` · ${a.vulnerabilities[0].packageName}` : ''}`}
            right={<Pill label={a.severity.toUpperCase()} color={color} />}
            onPress={() => openUrl(a.url, colors)}
          />
        );
      })}
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  h1: { color: c.text, fontSize: 22, fontWeight: '700', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  hint: { color: c.muted, fontSize: 13, textAlign: 'center', padding: spacing.xl, lineHeight: 19 },
  history: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  historyHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  historyTitle: { color: c.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  historyClear: { color: c.accent, fontSize: 12, fontWeight: '600' },
  historyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  historyChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, borderRadius: 999, paddingLeft: 10, paddingRight: 8, paddingVertical: 5, maxWidth: '100%' },
  historyChipMain: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 220 },
  historyChipText: { color: c.subtle, fontSize: 12 },
  lookupBtn: { alignSelf: 'flex-end', marginRight: spacing.lg, backgroundColor: c.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  lookupText: { color: c.bg, fontWeight: '800', fontSize: 13 },
  verdict: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  verdictText: { fontSize: 14, fontWeight: '700' },
  cardTitle: { color: c.text, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  sub: { paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  subTitle: { color: c.text, fontSize: 13, fontWeight: '600' },
  subMeta: { color: c.muted, fontSize: 11, marginTop: 2 },
  none: { color: c.muted, fontSize: 12 },
  errors: { color: c.medium, fontSize: 11 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
