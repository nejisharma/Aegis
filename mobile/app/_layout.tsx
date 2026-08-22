import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SWRConfig } from 'swr';
import type { Cache } from 'swr';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { createPersistedCacheProvider, hydrateCache } from '../src/lib/storage';
import { useNotificationRouting } from '../src/notifications/handlers';
import { loadToken } from '../src/notifications/prefs';
import { registerForPush } from '../src/notifications/register';
import { initMonitoring, wrapRoot } from '../src/lib/monitoring';
import { refreshWidgets } from '../src/widgets/refresh';

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

  // Re-register the push token on every cold start (idempotent upsert) if the user enabled notifications.
  useEffect(() => {
    loadToken().then((t) => {
      if (t) registerForPush().catch(() => {});
    });
  }, []);

  // Push fresh data to any home-screen widgets once the persisted cache is ready.
  useEffect(() => {
    if (cache) refreshWidgets().catch(() => {});
  }, [cache]);

  // Keep the native splash visible until the persisted SWR cache is hydrated.
  if (!cache) return null;

  return (
    <ThemeProvider>
      <ThemedApp cache={cache} />
    </ThemeProvider>
  );
}

function ThemedApp({ cache }: { cache: Cache }) {
  const { colors, isDark } = useTheme();

  // ThemeProvider renders null until the saved mode is loaded, so this only runs once both cache and theme are ready.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

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
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <NotificationRouter />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.accent,
            headerTitleStyle: { color: colors.text },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitle: '',
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
