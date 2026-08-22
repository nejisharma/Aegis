import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Plus, X } from 'lucide-react-native';
import { ErrorState } from '../src/components/ErrorState';
import { Screen } from '../src/components/Screen';
import { SearchBar } from '../src/components/SearchBar';
import { CVSSBadge, Card, ListRow, OfflineBanner, SectionHeader, Skeleton, UpdatedAt } from '../src/components/ui';
import { useRecentCves } from '../src/hooks/useApi';
import { summarizeCve } from '../src/lib/cvss';
import { shortDate, truncate } from '../src/lib/format';
import { loadPrefs, loadToken, normalizeTerm, WATCHLIST_MAX_TERMS } from '../src/notifications/prefs';
import { setWatchlistTerms } from '../src/notifications/register';
import { colors } from '../src/theme/colors';
import { radius, spacing } from '../src/theme/spacing';
import type { CVEItem } from '../src/api/types';

const SUGGESTIONS = ['microsoft', 'cisco', 'fortinet', 'vmware', 'apache', 'linux kernel', 'chrome', 'openssl', 'wordpress', 'ivanti'];

function matches(item: CVEItem, term: string): boolean {
  const t = term.toLowerCase();
  if (item.cve.id.toLowerCase().includes(t)) return true;
  const text = item.cve.descriptions.map((d) => d.value).join(' ').toLowerCase();
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(text);
}

export default function WatchlistScreen() {
  const router = useRouter();
  const [terms, setTerms] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const recent = useRecentCves();

  useEffect(() => {
    loadPrefs().then((p) => {
      setTerms(p.watchlist_terms);
      setLoaded(true);
    });
    loadToken().then((t) => setPushEnabled(!!t));
  }, []);

  const persist = useCallback(async (next: string[]) => {
    setTerms(next);
    await setWatchlistTerms(next);
  }, []);

  const add = useCallback(
    (raw: string) => {
      const t = normalizeTerm(raw);
      if (t.length < 2 || t.length > 40 || terms.includes(t) || terms.length >= WATCHLIST_MAX_TERMS) return;
      setDraft('');
      persist([...terms, t]);
    },
    [terms, persist],
  );

  const remove = useCallback((t: string) => persist(terms.filter((x) => x !== t)), [terms, persist]);

  const hits = useMemo(() => {
    const items = recent.data?.vulnerabilities ?? [];
    return items
      .map((item) => ({ item, term: terms.find((t) => matches(item, t)) }))
      .filter((h): h is { item: CVEItem; term: string } => !!h.term)
      .slice(0, 50);
  }, [recent.data, terms]);

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Watchlist' }} />
      <OfflineBanner visible={recent.isOffline} networkError={recent.isNetworkError} />
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={s.lead}>
          Products, vendors or keywords you care about. Matching CVEs show here, and if notifications are on you get a push the moment one is published.
        </Text>

        <View style={s.inputRow}>
          <View style={{ flex: 1 }}>
            <SearchBar value={draft} onChangeText={setDraft} onSubmit={() => add(draft)} placeholder="e.g. fortinet, exchange, log4j" />
          </View>
          <Pressable onPress={() => add(draft)} style={[s.addBtn, !normalizeTerm(draft) && { opacity: 0.4 }]} disabled={!normalizeTerm(draft)}>
            <Plus size={20} color={colors.bg} />
          </Pressable>
        </View>

        {loaded && terms.length === 0 ? (
          <Card>
            <Text style={s.cardTitle}>Suggestions</Text>
            <View style={s.chips}>
              {SUGGESTIONS.map((t) => (
                <Pressable key={t} onPress={() => add(t)} style={s.suggestion}>
                  <Text style={s.suggestionText}>+ {t}</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        ) : null}

        {terms.length ? (
          <View style={s.chips}>
            {terms.map((t) => (
              <View key={t} style={s.term}>
                <Text style={s.termText}>{t}</Text>
                <Pressable onPress={() => remove(t)} hitSlop={8}>
                  <X size={14} color={colors.accent} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {!pushEnabled && terms.length ? (
          <Pressable onPress={() => router.push('/settings')} style={s.notice}>
            <Text style={s.noticeText}>Notifications are off — enable them in Settings to get alerted for these terms.</Text>
          </Pressable>
        ) : null}
      </View>

      {terms.length ? (
        <>
          <SectionHeader title={`Matching CVEs · last 30 days`} right={<UpdatedAt at={recent.updatedAt} refreshing={recent.isRefreshing} />} />
          {recent.isLoading && !recent.data ? (
            <Skeleton lines={5} />
          ) : recent.error && !recent.data ? (
            <ErrorState error={recent.error} onRetry={() => recent.mutate()} />
          ) : hits.length === 0 ? (
            <Text style={s.empty}>No recent CVEs mention your terms. You will be notified when one does.</Text>
          ) : (
            hits.map(({ item, term }) => {
              const c = summarizeCve(item);
              return (
                <ListRow
                  key={c.id}
                  title={`${c.id} · ${term}`}
                  subtitle={`${shortDate(c.published)} · ${truncate(c.description, 100)}`}
                  right={<CVSSBadge score={c.score} severity={c.severity} />}
                  onPress={() => router.push({ pathname: '/cve/[id]', params: { id: c.id } })}
                />
              );
            })
          )}
          <View style={{ height: spacing.xl }} />
        </>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  lead: { color: colors.subtle, fontSize: 13, lineHeight: 19 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: -spacing.lg },
  addBtn: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: spacing.lg },
  cardTitle: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestion: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  suggestionText: { color: colors.subtle, fontSize: 12 },
  term: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accentDim, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  termText: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  notice: { backgroundColor: 'rgba(234,179,8,0.12)', borderRadius: radius.md, padding: spacing.md },
  noticeText: { color: colors.medium, fontSize: 12 },
  empty: { color: colors.muted, fontSize: 13, textAlign: 'center', padding: spacing.lg },
});
