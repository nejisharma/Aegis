import type { CVEItem } from '@/types/cve';
import type { NewsItem } from '@/types/news';

export const CRITICAL_THRESHOLD = 9.0;
export const DIGEST_MIN_INTERVAL_MS = 3 * 60 * 60 * 1000;

export function cvssScore(item: CVEItem): number | null {
  const m = item.cve.metrics?.cvssMetricV31?.[0];
  return m ? m.cvssData.baseScore : null;
}

export function cveSummary(item: CVEItem, max = 120): string {
  const en = item.cve.descriptions.find((d) => d.lang === 'en') ?? item.cve.descriptions[0];
  const text = en?.value ?? '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** CVEs with CVSS v3.1 >= 9.0 that have not been seen, in input order, capped at `max`. */
export function pickNewCriticalCves(vulns: CVEItem[], seen: Set<string>, max = 5): CVEItem[] {
  const out: CVEItem[] = [];
  for (const v of vulns) {
    if (out.length >= max) break;
    const score = cvssScore(v);
    if (score === null || score < CRITICAL_THRESHOLD) continue;
    if (seen.has(v.cve.id)) continue;
    out.push(v);
  }
  return out;
}

export interface Digest {
  count: number;
  newest: NewsItem;
  newIds: string[];
}

/** A digest is due when there is at least one unseen item and the last digest is older than 3 h. */
export function buildDigest(
  items: NewsItem[],
  seen: Set<string>,
  lastDigestIso: string | null,
  now: Date,
): Digest | null {
  const fresh = items.filter((i) => !seen.has(i.id));
  if (fresh.length === 0) return null;
  if (lastDigestIso) {
    const last = new Date(lastDigestIso).getTime();
    if (!Number.isNaN(last) && now.getTime() - last < DIGEST_MIN_INTERVAL_MS) return null;
  }
  return { count: fresh.length, newest: fresh[0], newIds: fresh.map((i) => i.id) };
}
