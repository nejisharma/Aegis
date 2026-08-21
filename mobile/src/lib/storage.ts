import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Cache, State } from 'swr';

const CACHE_KEY = 'aegis-swr-cache';
const PREF_PREFIX = 'aegis:';
const FLUSH_DEBOUNCE_MS = 1000;

type Entry = State<unknown, unknown>;
export type CacheMap = Map<string, Entry>;

/** Load the persisted SWR cache from AsyncStorage into a Map. Never throws. */
export async function hydrateCache(): Promise<CacheMap> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return new Map();
    const entries = JSON.parse(raw) as [string, Entry][];
    if (!Array.isArray(entries)) return new Map();
    return new Map(entries);
  } catch {
    return new Map();
  }
}

/**
 * Build an SWR cache provider backed by `map` (typically the result of `hydrateCache()`)
 * that flushes to AsyncStorage, debounced 1 s, on every set/delete.
 * Only entries with resolved `data` are persisted; errors and in-flight state are transient.
 */
export function createPersistedCacheProvider(map: CacheMap = new Map()): Cache {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    timer = null;
    const entries: [string, Entry][] = [];
    for (const [key, value] of map) {
      if (value && value.data !== undefined) entries.push([key, { data: value.data }]);
    }
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entries)).catch(() => {});
  };

  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, FLUSH_DEBOUNCE_MS);
  };

  return {
    keys: () => map.keys(),
    get: (key) => map.get(key),
    set: (key, value) => {
      map.set(key, value);
      schedule();
    },
    delete: (key) => {
      map.delete(key);
      schedule();
    },
  };
}

export async function getPref<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(PREF_PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export async function setPref<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREF_PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore persistence failures
  }
}

export async function removePref(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREF_PREFIX + key);
  } catch {
    // ignore
  }
}
