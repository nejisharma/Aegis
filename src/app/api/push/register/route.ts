import { NextRequest, NextResponse } from 'next/server';
import { Expo } from 'expo-server-sdk';
import { getRedis, upsertDevice } from '@/lib/push/redis';
import { normalizePrefs } from '@/lib/push/types';

export async function POST(request: NextRequest) {
  let body: { token?: unknown; platform?: unknown; prefs?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { token, platform } = body;
  if (typeof token !== 'string' || !Expo.isExpoPushToken(token)) {
    return NextResponse.json({ error: 'token must be an Expo push token' }, { status: 400 });
  }
  if (platform !== 'ios' && platform !== 'android') {
    return NextResponse.json({ error: 'platform must be ios or android' }, { status: 400 });
  }
  const redis = getRedis();
  if (!redis) return NextResponse.json({ ok: false, skipped: 'no redis' });

  await upsertDevice(redis, token, {
    platform,
    prefs: normalizePrefs(body.prefs),
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}
