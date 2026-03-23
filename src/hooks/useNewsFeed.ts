import useSWR from 'swr';
import { apiClient } from '@/lib/api-client';
import type { NewsItem } from '@/types/news';

interface NewsFeedResponse {
  items: NewsItem[];
  count: number;
}

export function useNewsFeed(source?: string) {
  const key = source
    ? `/api/news?source=${encodeURIComponent(source)}`
    : '/api/news';

  const { data, error, isLoading, mutate } = useSWR<NewsFeedResponse>(
    key,
    apiClient,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      refreshInterval: 300000,
    }
  );

  return {
    items: data?.items || [],
    count: data?.count || 0,
    error,
    isLoading,
    mutate,
  };
}
