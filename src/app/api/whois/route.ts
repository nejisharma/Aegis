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
    const upstream = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      headers: { Accept: 'application/rdap+json' },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `RDAP lookup returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();

    const registrar =
      data.entities?.find((e: any) => e.roles?.includes('registrar'))?.vcardArray?.[1]?.find(
        (v: any) => v[0] === 'fn'
      )?.[3] ?? null;

    const events = data.events ?? [];
    const getEventDate = (action: string) =>
      events.find((e: any) => e.eventAction === action)?.eventDate ?? null;

    const nameservers = (data.nameservers ?? []).map(
      (ns: any) => ns.ldhName ?? ns.unicodeName ?? null
    ).filter(Boolean);

    const status = data.status ?? [];

    const result = {
      domain: data.ldhName ?? domain,
      registrar,
      createdDate: getEventDate('registration'),
      expiryDate: getEventDate('expiration'),
      updatedDate: getEventDate('last changed'),
      status,
      nameservers,
      rawEvents: events,
    };

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch WHOIS data: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    );
  }
}
