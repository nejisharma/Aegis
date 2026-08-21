import { getPref, setPref } from '../lib/storage';
import type { PushPrefs } from '../api/types';

export const DEFAULT_PREFS: PushPrefs = { critical_cve: true, news_digest: true };

const PREFS_KEY = 'push-prefs';
const TOKEN_KEY = 'push-token';

export const loadPrefs = () => getPref<PushPrefs>(PREFS_KEY, DEFAULT_PREFS);
export const savePrefs = (prefs: PushPrefs) => setPref(PREFS_KEY, prefs);
export const loadToken = () => getPref<string | null>(TOKEN_KEY, null);
export const saveToken = (token: string | null) => setPref(TOKEN_KEY, token);

export const CATEGORY_META: { key: keyof PushPrefs; title: string; description: string }[] = [
  { key: 'critical_cve', title: 'Critical CVEs', description: 'Immediate alert for new CVSS ≥ 9.0 vulnerabilities published to NVD.' },
  { key: 'news_digest', title: 'News digest', description: 'A batched summary of new security stories, at most every 3 hours.' },
];
