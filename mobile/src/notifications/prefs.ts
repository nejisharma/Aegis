import { getPref, setPref } from '../lib/storage';
import type { PushPrefs } from '../api/types';

export const DEFAULT_PREFS: PushPrefs = { critical_cve: true, news_digest: true, watchlist: true, watchlist_terms: [] };
export const WATCHLIST_MAX_TERMS = 20;

const PREFS_KEY = 'push-prefs';
const TOKEN_KEY = 'push-token';

export const loadPrefs = async (): Promise<PushPrefs> => ({ ...DEFAULT_PREFS, ...(await getPref<Partial<PushPrefs>>(PREFS_KEY, {})) });
export const savePrefs = (prefs: PushPrefs) => setPref(PREFS_KEY, prefs);
export const loadToken = () => getPref<string | null>(TOKEN_KEY, null);
export const saveToken = (token: string | null) => setPref(TOKEN_KEY, token);

export type PushToggle = 'critical_cve' | 'news_digest' | 'watchlist';

export const CATEGORY_META: { key: PushToggle; title: string; description: string }[] = [
  { key: 'critical_cve', title: 'Critical CVEs', description: 'Immediate alert for new CVSS ≥ 9.0 vulnerabilities published to NVD.' },
  { key: 'news_digest', title: 'News digest', description: 'A batched summary of new security stories, at most every 3 hours.' },
  { key: 'watchlist', title: 'Watchlist alerts', description: 'Any new CVE (any severity) that mentions one of your watchlist terms.' },
];

/** Normalise a user-typed term the same way the server does. */
export function normalizeTerm(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}
