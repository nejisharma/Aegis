import { NextRequest, NextResponse } from 'next/server';

const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const VALID_TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME'] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const domain = searchParams.get('domain');
  const type = (searchParams.get('type') ?? 'A').toUpperCase();

  if (!domain || !DOMAIN_REGEX.test(domain)) {
    return NextResponse.json(
      { error: 'Valid domain name is required (e.g., example.com)' },
      { status: 400 }
    );
  }

  if (!VALID_TYPES.includes(type as any)) {
    return NextResponse.json(
      { error: `Invalid record type. Allowed: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
      {
        headers: { Accept: 'application/dns-json' },
      }
    );

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `DNS lookup returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();

    return NextResponse.json(
      { answers: data.Answer ?? [], status: data.Status, question: data.Question },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300',
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch DNS data: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    );
  }
}
