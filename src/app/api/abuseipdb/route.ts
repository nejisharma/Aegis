import { NextRequest, NextResponse } from 'next/server';

const IP_REGEX = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ip = searchParams.get('ip');

  if (!ip || !IP_REGEX.test(ip)) {
    return NextResponse.json(
      { error: 'Valid IPv4 address is required (e.g., 8.8.8.8)' },
      { status: 400 }
    );
  }

  const apiKey = process.env.ABUSEIPDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'AbuseIPDB API key not configured',
        message: 'Get a free API key at https://www.abuseipdb.com (1,000 requests/day). Add ABUSEIPDB_API_KEY to .env.local',
        noKey: true,
      },
      { status: 503 }
    );
  }

  try {
    const upstream = await fetch(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90&verbose`,
      {
        headers: {
          Key: apiKey,
          Accept: 'application/json',
        },
      }
    );

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.json(
        { error: `AbuseIPDB returned ${upstream.status}: ${text}` },
        { status: upstream.status }
      );
    }

    const json = await upstream.json();
    return NextResponse.json(json.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch AbuseIPDB data: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    );
  }
}
