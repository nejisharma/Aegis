import { NextRequest, NextResponse } from 'next/server';
import { API_URLS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const authKey = process.env.ABUSECH_AUTH_KEY;
  if (!authKey) {
    return NextResponse.json(
      { error: 'ABUSECH_AUTH_KEY environment variable is not set. Add it to your .env.local file to use URLhaus API.' },
      { status: 503 }
    );
  }

  let body: { action: string; host?: string; url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  if (!body.action || !['recent', 'host', 'url'].includes(body.action)) {
    return NextResponse.json(
      { error: 'action must be "recent", "host", or "url"' },
      { status: 400 }
    );
  }

  try {
    let upstreamUrl: string;
    let upstreamBody: string;
    const headers: Record<string, string> = {
      'Auth-Key': authKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (body.action === 'recent') {
      upstreamUrl = `${API_URLS.URLHAUS}/urls/recent/`;
      upstreamBody = '';
    } else if (body.action === 'host') {
      if (!body.host) {
        return NextResponse.json(
          { error: 'host is required for host action' },
          { status: 400 }
        );
      }
      upstreamUrl = `${API_URLS.URLHAUS}/host/`;
      upstreamBody = `host=${encodeURIComponent(body.host)}`;
    } else {
      if (!body.url) {
        return NextResponse.json(
          { error: 'url is required for url action' },
          { status: 400 }
        );
      }
      upstreamUrl = `${API_URLS.URLHAUS}/url/`;
      upstreamBody = `url=${encodeURIComponent(body.url)}`;
    }

    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers,
      body: upstreamBody,
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `URLhaus API returned ${upstream.status}` },
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
      { error: `Failed to fetch URLhaus data: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    );
  }
}
