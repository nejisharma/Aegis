import { NextResponse } from 'next/server';

export async function GET() {
  // Try OpenPhish first (more reliable, lighter weight)
  try {
    const response = await fetch('https://openphish.com/feed.txt', {
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const text = await response.text();
      const lines = text.trim().split('\n').filter(Boolean);
      const entries = lines.slice(0, 100).map((url, index) => ({
        url: url.trim(),
        id: index + 1,
        source: 'OpenPhish',
      }));

      return NextResponse.json(
        { entries, total: lines.length, source: 'OpenPhish' },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600',
          },
        }
      );
    }
  } catch {
    // OpenPhish failed, try PhishTank
  }

  // Fallback: PhishTank
  try {
    const response = await fetch('https://data.phishtank.com/data/online-valid.json', {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `PhishTank returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const entries = (data as Array<Record<string, unknown>>).slice(0, 100).map((entry) => ({
      url: entry.url as string,
      phish_detail_url: entry.phish_detail_url as string,
      target: entry.target as string,
      submission_time: entry.submission_time as string,
      verified: entry.verified as string,
      source: 'PhishTank',
    }));

    return NextResponse.json(
      { entries, total: data.length, source: 'PhishTank' },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600',
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch phishing data: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    );
  }
}
