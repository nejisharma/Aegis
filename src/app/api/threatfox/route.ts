import { NextRequest, NextResponse } from 'next/server';
import { API_URLS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const authKey = process.env.ABUSECH_AUTH_KEY;
  if (!authKey) {
    return NextResponse.json(
      { error: 'ABUSECH_AUTH_KEY environment variable is not set. Add it to your .env.local file to use ThreatFox API.' },
      { status: 503 }
    );
  }

  let body: { action: string; days?: number; search_term?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  if (!body.action || !['recent', 'search'].includes(body.action)) {
    return NextResponse.json(
      { error: 'action must be "recent" or "search"' },
      { status: 400 }
    );
  }

  let upstreamBody: Record<string, unknown>;
  if (body.action === 'recent') {
    upstreamBody = { query: 'get_iocs', days: body.days || 1 };
  } else {
    if (!body.search_term) {
      return NextResponse.json(
        { error: 'search_term is required for search action' },
        { status: 400 }
      );
    }
    upstreamBody = { query: 'search_ioc', search_term: body.search_term };
  }

  try {
    const upstream = await fetch(API_URLS.THREATFOX, {
      method: 'POST',
      headers: {
        'Auth-Key': authKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(upstreamBody),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `ThreatFox API returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=600',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch ThreatFox data: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    );
  }
}
