import { NextRequest, NextResponse } from 'next/server';
import { API_URLS } from '@/lib/constants';

const IP_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ip = searchParams.get('ip');

  if (!ip || !IP_REGEX.test(ip)) {
    return NextResponse.json(
      { error: 'Valid IPv4 address is required (e.g., 8.8.8.8)' },
      { status: 400 }
    );
  }

  try {
    // NOTE: ip-api.com free tier requires HTTP, not HTTPS
    const upstream = await fetch(`${API_URLS.IP_API}/${ip}`);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `ip-api.com returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch GeoIP data: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    );
  }
}
