export type PushCategory = 'critical_cve' | 'news_digest' | 'watchlist';

export interface PushPrefs {
  critical_cve: boolean;
  news_digest: boolean;
  watchlist: boolean;
  /** Lower-cased keywords (product names, vendors, CVE prefixes) the device wants alerts for. Max 20, each 2–40 chars. */
  watchlist_terms: string[];
}

export const DEFAULT_PREFS: PushPrefs = { critical_cve: true, news_digest: true, watchlist: true, watchlist_terms: [] };

export const WATCHLIST_MAX_TERMS = 20;

export function normalizeTerms(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const t = raw.trim().toLowerCase().replace(/\s+/g, ' ');
    if (t.length < 2 || t.length > 40 || out.includes(t)) continue;
    out.push(t);
    if (out.length >= WATCHLIST_MAX_TERMS) break;
  }
  return out;
}

export function normalizePrefs(input: unknown): PushPrefs {
  const p = (input ?? {}) as Partial<Record<keyof PushPrefs, unknown>>;
  return {
    critical_cve: typeof p.critical_cve === 'boolean' ? p.critical_cve : DEFAULT_PREFS.critical_cve,
    news_digest: typeof p.news_digest === 'boolean' ? p.news_digest : DEFAULT_PREFS.news_digest,
    watchlist: typeof p.watchlist === 'boolean' ? p.watchlist : DEFAULT_PREFS.watchlist,
    watchlist_terms: normalizeTerms(p.watchlist_terms),
  };
}
