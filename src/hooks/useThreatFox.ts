import useSWR from 'swr';
import type { ThreatFoxResponse } from '@/types/threatfox';

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

export function useThreatFox(
  action: 'recent' | 'search' | null,
  searchTerm?: string,
  days?: number
) {
  const shouldFetch = action !== null && (action === 'recent' || (action === 'search' && !!searchTerm));

  const body = action === 'recent'
    ? { action: 'recent', days: days || 1 }
    : { action: 'search', search_term: searchTerm };

  const key = shouldFetch
    ? ['threatfox', action, searchTerm || '', days || 1]
    : null;

  const { data, error, isLoading, mutate } = useSWR<ThreatFoxResponse>(
    key,
    () => postFetcher<ThreatFoxResponse>('/api/threatfox', body),
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
