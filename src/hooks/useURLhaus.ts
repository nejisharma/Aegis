import useSWR from 'swr';
import type { URLhausResponse } from '@/types/urlhaus';

async function postFetcher<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function useURLhaus(
  action: 'recent' | 'host' | 'url' | null,
  params?: { host?: string; url?: string }
) {
  const shouldFetch = action !== null && (
    action === 'recent' ||
    (action === 'host' && !!params?.host) ||
    (action === 'url' && !!params?.url)
  );

  const body = action === 'recent'
    ? { action: 'recent' }
    : action === 'host'
      ? { action: 'host', host: params?.host }
      : { action: 'url', url: params?.url };

  const key = shouldFetch
    ? ['urlhaus', action, params?.host || '', params?.url || '']
    : null;

  const { data, error, isLoading, mutate } = useSWR<URLhausResponse>(
    key,
    () => postFetcher<URLhausResponse>('/api/urlhaus', body),
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}
