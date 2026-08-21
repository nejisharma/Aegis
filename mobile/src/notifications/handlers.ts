import { useEffect } from 'react';
import { useRouter, type Href } from 'expo-router';
import * as Notifications from 'expo-notifications';

/** Map the `data.url` a push carries (aegis://cve/ID, aegis://news) to an in-app route. */
export function routeForPushUrl(url: unknown): Href | null {
  if (typeof url !== 'string') return null;
  const m = url.match(/^aegis:\/\/(.*)$/);
  if (!m) return null;
  const path = m[1].replace(/\/+$/, '');
  if (path === 'news') return '/(tabs)/news';
  const cve = path.match(/^cve\/(CVE-\d{4}-\d{4,})$/i);
  if (cve) return { pathname: '/cve/[id]', params: { id: cve[1].toUpperCase() } };
  return null;
}

/** Navigates when the user taps a notification (cold start or while running). */
export function useNotificationRouting() {
  const router = useRouter();
  const last = Notifications.useLastNotificationResponse();

  useEffect(() => {
    const url = last?.notification.request.content.data?.url;
    const href = routeForPushUrl(url);
    if (href) router.push(href);
  }, [last, router]);
}
