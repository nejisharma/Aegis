import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SWRConfig } from 'swr';
import type { Cache } from 'swr';
import { colors } from '../src/theme/colors';
import { createPersistedCacheProvider, hydrateCache } from '../src/lib/storage';
import { useNotificationRouting } from '../src/notifications/handlers';
import { loadToken } from '../src/notifications/prefs';
import { registerForPush } from '../src/notifications/register';
import { initMonitoring, wrapRoot } from '../src/lib/monitoring';

SplashScreen.preventAutoHideAsync().catch(() => {});
initMonitoring();

function RootLayout() {
  const [cache, setCache] = useState<Cache | null>(null);

  useEffect(() => {
    let mounted = true;
    hydrateCache()
      .then((map) => {
        if (mounted) setCache(createPersistedCacheProvider(map));
      })
      .catch(() => {
        if (mounted) setCache(createPersistedCacheProvider());
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (cache) SplashScreen.hideAsync().catch(() => {});
  }, [cache]);

  // Re-register the push token on every cold start (idempotent upsert) if the user enabled notifications.
  useEffect(() => {
    loadToken().then((t) => {
      if (t) registerForPush().catch(() => {});
    });
  }, []);

  // Keep the native splash visible until the persisted SWR cache is hydrated.
  if (!cache) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SWRConfig
        value={{
          provider: () => cache,
          fetcher: undefined,
          revalidateOnFocus: true,
          dedupingInterval: 5000,
        }}
      >
        <StatusBar style="light" />
        <NotificationRouter />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitleStyle: { color: colors.text },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        </Stack>
      </SWRConfig>
    </GestureHandlerRootView>
  );
}

function NotificationRouter() {
  useNotificationRouting();
  return null;
}

export default wrapRoot(RootLayout);
