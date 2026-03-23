import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let body: { url?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { url } = body;

  if (!url || typeof url !== 'string') {
    return NextResponse.json(
      { error: 'URL is required in request body' },
      { status: 400 }
    );
  }

  let domain: string;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    domain = parsed.hostname;
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL format' },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(
      `https://urlscan.io/api/v1/search/?q=domain:${encodeURIComponent(domain)}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `urlscan.io returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const json = await upstream.json();
    return NextResponse.json(json.results || [], {
      headers: {
        'Cache-Control': 'public, s-maxage=600',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch urlscan data: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    );
  }
}
