import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import type { ShodanInternetDB } from '@/types/shodan';

export function useShodanLookup(ip: string) {
  const key = ip.trim()
    ? `/api/shodan?ip=${encodeURIComponent(ip)}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<ShodanInternetDB>(
    key,
    apiClient,
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
