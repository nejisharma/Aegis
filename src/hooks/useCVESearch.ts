import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import type { NVDResponse } from '@/types/cve';

export function useCVESearch(keyword: string, limit: number = 20) {
  const key = keyword.trim()
    ? `/api/cve?keyword=${encodeURIComponent(keyword)}&limit=${limit}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<NVDResponse>(
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
