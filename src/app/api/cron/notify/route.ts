import { NextRequest, NextResponse } from 'next/server';
import type { ExpoPushMessage } from 'expo-server-sdk';
import { API_URLS } from '@/lib/constants';
import type { NVDResponse } from '@/types/cve';
import type { NewsItem } from '@/types/news';
import { addSeen, getDevices, getRedis, getSeen, KEYS, removeDevices } from '@/lib/push/redis';
import { buildDigest, cveSummary, pickNewCriticalCves, pickWatchlistHits } from '@/lib/push/detectors';
import { sendPush } from '@/lib/push/expo-push';
import type { PushCategory } from '@/lib/push/types';

export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

async function fetchRecentCves(severity?: 'CRITICAL'): Promise<NVDResponse['vulnerabilities']> {
  const end = new Date();
  const start = new Date(end.getTime() - 2 * 60 * 60 * 1000);
  const url =
    `${API_URLS.NVD_CVE}?${severity ? `cvssV3Severity=${severity}` : 'noRejected'}` +
    `&pubStartDate=${encodeURIComponent(start.toISOString())}` +
    `&pubEndDate=${encodeURIComponent(end.toISOString())}&resultsPerPage=${severity ? 50 : 200}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'AEGIS-Dashboard/1.0' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`NVD ${res.status}`);
  const data = (await res.json()) as NVDResponse;
  return data.vulnerabilities ?? [];
}

async function fetchNews(origin: string): Promise<NewsItem[]> {
  const res = await fetch(`${origin}/api/news`, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`news ${res.status}`);
  const data = (await res.json()) as { items: NewsItem[] };
  return data.items ?? [];
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const redis = getRedis();
  if (!redis) return NextResponse.json({ skipped: 'no redis' });

  const devices = await getDevices(redis);
  const tokensFor = (cat: PushCategory) =>
    Object.entries(devices)
      .filter(([, d]) => d.prefs[cat])
      .map(([t]) => t);

  const result = { cve: 0, digest: false, watchlist: 0, pruned: 0, errors: [] as string[] };
  const invalid = new Set<string>();

  // (a) Critical CVEs: one push per CVE, immediately.
  try {
    const cveTokens = tokensFor('critical_cve');
    const vulns = await fetchRecentCves('CRITICAL');
    const seen = await getSeen(redis, KEYS.seenCve);
    const fresh = pickNewCriticalCves(vulns, seen);
    if (fresh.length) {
      if (cveTokens.length) {
        const messages: ExpoPushMessage[] = fresh.flatMap((v) =>
          cveTokens.map((to) => ({
            to,
            sound: 'default' as const,
            title: `Critical CVE: ${v.cve.id}`,
            body: cveSummary(v),
            data: { url: `aegis://cve/${v.cve.id}` },
            channelId: 'critical',
          })),
        );
        const r = await sendPush(messages);
        r.invalidTokens.forEach((t) => invalid.add(t));
      }
      await addSeen(redis, KEYS.seenCve, fresh.map((v) => v.cve.id));
      result.cve = fresh.length;
    }
  } catch (err) {
    result.errors.push(`cve: ${err instanceof Error ? err.message : String(err)}`);
  }

  // (c) Watchlist: any new CVE (any severity) mentioning a term a device watches.
  try {
    const watchers = Object.entries(devices).filter(([, d]) => d.prefs.watchlist && d.prefs.watchlist_terms?.length);
    if (watchers.length) {
      const vulns = await fetchRecentCves();
      const seen = await getSeen(redis, KEYS.seenWatch);
      const messages: ExpoPushMessage[] = [];
      const notified = new Set<string>();
      for (const [to, d] of watchers) {
        for (const hit of pickWatchlistHits(vulns, d.prefs.watchlist_terms, seen, 5)) {
          notified.add(hit.cve.cve.id);
          messages.push({
            to,
            sound: 'default' as const,
            title: `Watchlist · ${hit.term}: ${hit.cve.cve.id}`,
            body: cveSummary(hit.cve),
            data: { url: `aegis://cve/${hit.cve.cve.id}` },
            channelId: 'watchlist',
          });
        }
      }
      if (messages.length) {
        const r = await sendPush(messages);
        r.invalidTokens.forEach((t) => invalid.add(t));
      }
      // Every CVE in this window is now "seen" for watchlist purposes, so a term added later does not replay old CVEs.
      await addSeen(redis, KEYS.seenWatch, vulns.map((v) => v.cve.id));
      result.watchlist = notified.size;
    }
  } catch (err) {
    result.errors.push(`watchlist: ${err instanceof Error ? err.message : String(err)}`);
  }

  // (b) News digest: batched, at most every 3 h.
  try {
    const newsTokens = tokensFor('news_digest');
    const items = await fetchNews(request.nextUrl.origin);
    const seen = await getSeen(redis, KEYS.seenNews);
    const lastDigest = await redis.get<string>(KEYS.lastDigest);

    if (seen.size === 0 && items.length) {
      // First run ever: seed the seen-set silently so nobody gets "40 new stories".
      await addSeen(redis, KEYS.seenNews, items.map((i) => i.id));
      await redis.set(KEYS.lastDigest, new Date().toISOString());
    } else {
      const digest = buildDigest(items, seen, lastDigest ?? null, new Date());
      if (digest) {
        if (newsTokens.length) {
          const r = await sendPush(
            newsTokens.map((to) => ({
              to,
              title: digest.count === 1 ? '1 new security story' : `${digest.count} new security stories`,
              body: digest.newest.title,
              data: { url: 'aegis://news' },
              channelId: 'news',
            })),
          );
          r.invalidTokens.forEach((t) => invalid.add(t));
        }
        await addSeen(redis, KEYS.seenNews, digest.newIds);
        await redis.set(KEYS.lastDigest, new Date().toISOString());
        result.digest = true;
      }
    }
  } catch (err) {
    result.errors.push(`news: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (invalid.size) {
    await removeDevices(redis, [...invalid]);
    result.pruned = invalid.size;
  }
  return NextResponse.json(result);
}
