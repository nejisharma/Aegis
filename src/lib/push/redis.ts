import { Redis } from '@upstash/redis';
import type { PushPrefs } from './types';

export interface DeviceRecord {
  platform: 'ios' | 'android';
  prefs: PushPrefs;
  updatedAt: string;
}

export const KEYS = {
  devices: 'devices',
  seenCve: 'seen:cve',
  seenNews: 'seen:news',
  seenWatch: 'seen:watch',
  lastDigest: 'last_digest',
} as const;

let client: Redis | null | undefined;

/** Returns the Upstash client, or null (with a one-time warning) when env is not configured. */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn('[push] UPSTASH_REDIS_REST_URL / TOKEN not set; push features disabled');
    client = null;
    return null;
  }
  client = new Redis({ url, token });
  return client;
}

export async function upsertDevice(redis: Redis, token: string, record: DeviceRecord): Promise<void> {
  await redis.hset(KEYS.devices, { [token]: JSON.stringify(record) });
}

export async function removeDevices(redis: Redis, tokens: string[]): Promise<void> {
  if (tokens.length) await redis.hdel(KEYS.devices, ...tokens);
}

export async function getDevices(redis: Redis): Promise<Record<string, DeviceRecord>> {
  const raw = (await redis.hgetall<Record<string, string | DeviceRecord>>(KEYS.devices)) ?? {};
  const out: Record<string, DeviceRecord> = {};
  for (const [token, value] of Object.entries(raw)) {
    try {
      out[token] = typeof value === 'string' ? (JSON.parse(value) as DeviceRecord) : value;
    } catch {
      // skip corrupt entry
    }
  }
  return out;
}

export async function getSeen(redis: Redis, key: string): Promise<Set<string>> {
  const members = await redis.smembers(key);
  return new Set(members);
}

const SEEN_CAP = 2000;

/** Add ids to a seen-set. Past the cap, drop arbitrary extras (a memory guard; sets are unordered). */
export async function addSeen(redis: Redis, key: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await redis.sadd(key, ids[0], ...ids.slice(1));
  const size = await redis.scard(key);
  if (size > SEEN_CAP) await redis.spop(key, size - SEEN_CAP);
}
