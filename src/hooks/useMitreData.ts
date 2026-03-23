import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import type { MITREData } from '@/types/mitre';

export function useMitreData(type?: 'groups' | 'techniques' | 'tactics' | 'software') {
  const key = type
    ? `/api/mitre?type=${type}`
    : '/api/mitre';

  const { data, error, isLoading, mutate } = useSWR<MITREData>(
    key,
    apiClient,
    {
      dedupingInterval: 600000,
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
