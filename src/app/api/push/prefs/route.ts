import { NextRequest, NextResponse } from 'next/server';
import { getDevices, getRedis, removeDevices, upsertDevice } from '@/lib/push/redis';
import { normalizePrefs } from '@/lib/push/types';

async function readBody(request: NextRequest): Promise<{ token?: unknown; prefs?: unknown } | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function PATCH(request: NextRequest) {
  const body = await readBody(request);
  if (!body || typeof body.token !== 'string') {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }
  const redis = getRedis();
  if (!redis) return NextResponse.json({ ok: false, skipped: 'no redis' });

  const devices = await getDevices(redis);
  const existing = devices[body.token];
  if (!existing) return NextResponse.json({ error: 'Unknown token; register first' }, { status: 404 });

  await upsertDevice(redis, body.token, {
    ...existing,
    prefs: normalizePrefs({ ...existing.prefs, ...((body.prefs as object) ?? {}) }),
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const body = await readBody(request);
  if (!body || typeof body.token !== 'string') {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }
  const redis = getRedis();
  if (!redis) return NextResponse.json({ ok: false, skipped: 'no redis' });
  await removeDevices(redis, [body.token]);
  return NextResponse.json({ ok: true });
}
