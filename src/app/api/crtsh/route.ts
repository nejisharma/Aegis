import { NextRequest, NextResponse } from 'next/server';

const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const domain = searchParams.get('domain');

  if (!domain || !DOMAIN_REGEX.test(domain)) {
    return NextResponse.json(
      { error: 'Valid domain name is required (e.g., example.com)' },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(
      `https://crt.sh/?q=${encodeURIComponent(`%.${domain}`)}&output=json`,
      {
        headers: { Accept: 'application/json' },
      }
    );

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `crt.sh returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();

    const results = (Array.isArray(data) ? data : [])
      .slice(0, 100)
      .map((entry: any) => ({
        id: entry.id,
        commonName: entry.common_name,
        issuerName: entry.issuer_name,
        notBefore: entry.not_before,
        notAfter: entry.not_after,
        serialNumber: entry.serial_number,
        entryTimestamp: entry.entry_timestamp,
      }));

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch crt.sh data: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    );
  }
}
