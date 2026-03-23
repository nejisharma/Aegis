import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import type { GeoIPResult } from '@/types/geoip';

export function useGeoIP(ip: string) {
  const key = ip.trim()
    ? `/api/geoip?ip=${encodeURIComponent(ip)}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<GeoIPResult>(
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
