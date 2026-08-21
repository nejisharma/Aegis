import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { registerPush, unregisterPush, updatePushPrefs } from '../api/endpoints';
import type { PushPrefs } from '../api/types';
import { loadPrefs, loadToken, savePrefs, saveToken } from './prefs';

export type RegisterStatus = 'registered' | 'denied' | 'unsupported' | 'error';

// Foreground presentation: show banners even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('critical', {
    name: 'Critical CVEs',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#ef4444',
  });
  await Notifications.setNotificationChannelAsync('news', {
    name: 'News digest',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#22d3ee',
  });
}

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? (Constants.easConfig as { projectId?: string } | null)?.projectId;
}

/** Ask for permission, fetch the Expo push token and upsert it on the server. Safe to call on every launch. */
export async function registerForPush(prefs?: PushPrefs): Promise<{ status: RegisterStatus; token?: string; message?: string }> {
  if (!Device.isDevice && Platform.OS === 'ios') return { status: 'unsupported', message: 'Push notifications need a physical iOS device.' };
  try {
    await ensureAndroidChannels();
    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.granted || req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    }
    if (!granted) return { status: 'denied' };

    const id = projectId();
    const { data: token } = await Notifications.getExpoPushTokenAsync(id ? { projectId: id } : undefined);
    const effectivePrefs = prefs ?? (await loadPrefs());
    await registerPush({ token, platform: Platform.OS === 'ios' ? 'ios' : 'android', prefs: effectivePrefs });
    await saveToken(token);
    await savePrefs(effectivePrefs);
    return { status: 'registered', token };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : 'Registration failed' };
  }
}

/** Persist a pref change locally and on the server (re-registers if the token is unknown to the server). */
export async function setPushPref(key: keyof PushPrefs, value: boolean): Promise<PushPrefs> {
  const prefs = { ...(await loadPrefs()), [key]: value };
  await savePrefs(prefs);
  const token = await loadToken();
  if (token) {
    try {
      await updatePushPrefs({ token, prefs });
    } catch {
      await registerForPush(prefs);
    }
  }
  return prefs;
}

export async function disablePush(): Promise<void> {
  const token = await loadToken();
  if (token) {
    try {
      await unregisterPush(token);
    } catch {
      // best effort; the cron prunes dead tokens anyway
    }
  }
  await saveToken(null);
}
