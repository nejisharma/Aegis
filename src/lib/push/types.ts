export type PushCategory = 'critical_cve' | 'news_digest';

export interface PushPrefs {
  critical_cve: boolean;
  news_digest: boolean;
}

export const DEFAULT_PREFS: PushPrefs = { critical_cve: true, news_digest: true };

export function normalizePrefs(input: unknown): PushPrefs {
  const p = (input ?? {}) as Partial<Record<PushCategory, unknown>>;
  return {
    critical_cve: typeof p.critical_cve === 'boolean' ? p.critical_cve : DEFAULT_PREFS.critical_cve,
    news_digest: typeof p.news_digest === 'boolean' ? p.news_digest : DEFAULT_PREFS.news_digest,
  };
}
