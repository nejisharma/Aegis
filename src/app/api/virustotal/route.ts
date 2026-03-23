import { NextRequest, NextResponse } from 'next/server';

const HASH_REGEX = /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const hash = searchParams.get('hash');

  if (!hash || !HASH_REGEX.test(hash)) {
    return NextResponse.json(
      { error: 'Valid file hash is required (MD5, SHA1, or SHA256)' },
      { status: 400 }
    );
  }

  const apiKey = process.env.VT_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'VirusTotal API key not configured',
        message: 'Sign up at https://www.virustotal.com and add VT_API_KEY to .env.local',
        noKey: true,
      },
      { status: 503 }
    );
  }

  try {
    const upstream = await fetch(
      `https://www.virustotal.com/api/v3/files/${encodeURIComponent(hash)}`,
      {
        headers: {
          'x-apikey': apiKey,
          Accept: 'application/json',
        },
      }
    );

    if (!upstream.ok) {
      if (upstream.status === 404) {
        return NextResponse.json(
          { error: 'File hash not found in VirusTotal database' },
          { status: 404 }
        );
      }
      const text = await upstream.text();
      return NextResponse.json(
        { error: `VirusTotal returned ${upstream.status}: ${text}` },
        { status: upstream.status }
      );
    }

    const json = await upstream.json();
    return NextResponse.json(json.data || json, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch VirusTotal data: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    );
  }
}
