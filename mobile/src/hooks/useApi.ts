import useSWR, { type SWRConfiguration } from 'swr';
import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '../api/client';
import * as ep from '../api/endpoints';
import { detectIocType, type IocType } from '../lib/ioc';

/**
 * Thin wrapper: the SWR key is a descriptive string so the persisted cache survives restarts,
 * and `fetcher` ignores the key. `isOffline` is true when the fetch failed but cached data exists.
 */
/** Last successful fetch time per key (in-memory; persisted cache entries show "cached" until refreshed). */
const fetchedAt = new Map<string, number>();
export const lastFetchedAt = (key: string | null) => (key ? fetchedAt.get(key) ?? null : null);

function useQuery<T>(key: string | null, fetcher: () => Promise<T>, config?: SWRConfiguration<T>) {
  const swr = useSWR<T>(
    key,
    key
      ? async () => {
          const result = await fetcher();
          fetchedAt.set(key, Date.now());
          return result;
        }
      : null,
    { errorRetryCount: 2, ...config },
  );
  const isOffline = !!swr.error && swr.data !== undefined;
  return {
    ...swr,
    isOffline,
    isNetworkError: swr.error instanceof ApiError && swr.error.status === 0,
    updatedAt: lastFetchedAt(key),
    /** True while a background revalidation is running and we already have data (pull-to-refresh spinner). */
    isRefreshing: swr.isValidating && swr.data !== undefined,
  };
}

export const useNews = (source?: string) => useQuery(`news:${source ?? 'all'}`, () => ep.getNews(source), { refreshInterval: 15 * 60_000 });

export const useCveSearch = (keyword: string, limit = 20) =>
  useQuery(keyword.trim() ? `cve:${keyword.trim()}:${limit}` : null, () => ep.searchCves(keyword.trim(), limit), {
    revalidateOnFocus: false,
  });

export const useCve = (id: string) => useQuery(id ? `cve:id:${id}` : null, () => ep.getCveById(id), { revalidateOnFocus: false });

/** Critical CVEs published in the last 14 days, for the Home tab. */
export const useRecentCriticalCves = () =>
  useQuery('cve:recent-critical:14d', () => ep.getRecentCves(14, 'CRITICAL', 20), { refreshInterval: 30 * 60_000 });

/** A recent sample (last 30 days, up to 100) for the Analytics distributions. */
export const useRecentCves = () =>
  useQuery('cve:recent:30d', () => ep.getRecentCves(30, undefined, 100), { refreshInterval: 60 * 60_000 });

export const useGeoIp = (ip: string) => useQuery(ip ? `geoip:${ip}` : null, () => ep.getGeoIp(ip), { revalidateOnFocus: false });
export const useShodan = (ip: string) => useQuery(ip ? `shodan:${ip}` : null, () => ep.getShodan(ip), { revalidateOnFocus: false });
export const useAbuseIpdb = (ip: string) =>
  useQuery(ip ? `abuseipdb:${ip}` : null, () => ep.getAbuseIpdb(ip), { revalidateOnFocus: false, shouldRetryOnError: false });

// abuse.ch APIs return `data: "no_result"` (a string) on empty results; normalise to arrays.
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export const useThreatFoxRecent = () =>
  useQuery('threatfox:recent', () => ep.threatfoxRecent(3).then((r) => ({ ...r, data: arr<(typeof r.data)[number]>(r.data) })), { refreshInterval: 15 * 60_000 });
export const useUrlhausRecent = () =>
  useQuery('urlhaus:recent', () => ep.urlhausRecent().then((r) => ({ ...r, urls: arr<(typeof r.urls)[number]>(r.urls) })), { refreshInterval: 15 * 60_000 });
export const useMalwareRecent = () =>
  useQuery('malware:recent', () => ep.malwareRecent(50).then((r) => ({ ...r, data: arr<(typeof r.data)[number]>(r.data) })), { refreshInterval: 15 * 60_000 });
export const useMitre = () => useQuery('mitre:all', () => ep.getMitre(), { revalidateOnFocus: false, dedupingInterval: 60 * 60_000 });
export const useExploits = (keyword: string) =>
  useQuery(keyword.trim() ? `exploits:${keyword.trim()}` : null, () => ep.searchExploits(keyword.trim()), { revalidateOnFocus: false });
export const useRansomware = () => useQuery('ransomware', () => ep.getRansomware(), { refreshInterval: 30 * 60_000 });
/** EPSS scores for a batch of CVE ids (null key when empty; scores refresh daily upstream). */
export const useEpss = (ids: string[]) => {
  const sorted = [...ids].map((i) => i.toUpperCase()).sort();
  return useQuery(sorted.length ? `epss:${sorted.join(',')}` : null, () => ep.getEpss(sorted), {
    revalidateOnFocus: false,
    dedupingInterval: 6 * 60 * 60_000,
  });
};

export const useKev = () => useQuery('kev', () => ep.getKev(), { refreshInterval: 60 * 60_000 });

/** All CVE ids in the CISA KEV catalog as a Set, for flagging rows cheaply. */
export const useKevIds = () => {
  const swr = useQuery('kev:ids', () => ep.getKevIds(), { refreshInterval: 6 * 60 * 60_000, revalidateOnFocus: false });
  const ids = useMemo(() => new Set(swr.data?.ids ?? []), [swr.data]);
  return { ...swr, ids };
};

export const usePhishing = () => useQuery('phishing', () => ep.getPhishing(), { refreshInterval: 60 * 60_000 });

export interface IocLookupState {
  type: IocType;
  threatfox?: Awaited<ReturnType<typeof ep.threatfoxSearch>>;
  urlhaus?: Awaited<ReturnType<typeof ep.urlhausHost>>;
  abuseipdb?: Awaited<ReturnType<typeof ep.getAbuseIpdb>>;
  malware?: Awaited<ReturnType<typeof ep.malwareHash>>;
  virustotal?: Awaited<ReturnType<typeof ep.getVirusTotal>>;
  errors: string[];
}

/** Fan-out lookup across the abuse.ch / AbuseIPDB / VirusTotal proxies depending on the IOC type. */
export function useIocLookup(query: string) {
  const q = query.trim();
  const type = detectIocType(q);
  return useQuery<IocLookupState>(q && type !== 'unknown' ? `ioc:${type}:${q}` : null, async () => {
    const errors: string[] = [];
    const safe = async <T>(label: string, p: Promise<T>): Promise<T | undefined> => {
      try {
        return await p;
      } catch (e) {
        errors.push(`${label}: ${e instanceof Error ? e.message : 'failed'}`);
        return undefined;
      }
    };
    const host = type === 'url' ? new URL(q.includes('://') ? q : `https://${q}`).hostname : q;
    const [threatfox, urlhaus, abuseipdb, malware, virustotal] = await Promise.all([
      safe('ThreatFox', ep.threatfoxSearch(q)),
      type === 'url' ? safe('URLhaus', ep.urlhausUrl(q.includes('://') ? q : `https://${q}`)) : safe('URLhaus', ep.urlhausHost(host)),
      type === 'ip' ? safe('AbuseIPDB', ep.getAbuseIpdb(q)) : Promise.resolve(undefined),
      type === 'hash' ? safe('MalwareBazaar', ep.malwareHash(q)) : Promise.resolve(undefined),
      type === 'hash' ? safe('VirusTotal', ep.getVirusTotal(q)) : Promise.resolve(undefined),
    ]);
    return {
      type,
      threatfox: threatfox ? { ...threatfox, data: arr(threatfox.data) } : undefined,
      urlhaus: urlhaus ? { ...urlhaus, urls: arr(urlhaus.urls) } : undefined,
      abuseipdb,
      malware: malware ? { ...malware, data: arr(malware.data) } : undefined,
      virustotal,
      errors,
    };
  }, { revalidateOnFocus: false, shouldRetryOnError: false });
}

/** Debounce helper for search inputs. */
export function useDebounced<T>(value: T, ms = 500): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}
