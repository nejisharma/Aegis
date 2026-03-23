import { NextRequest, NextResponse } from 'next/server';
import { API_URLS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const keyword = searchParams.get('keyword');
  const limit = Math.min(Number(searchParams.get('limit') || 20), 100);
  const startIndex = Number(searchParams.get('startIndex') || 0);

  if (!keyword || keyword.trim() === '') {
    return NextResponse.json(
      { error: 'keyword query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const url = `${API_URLS.NVD_CVE}?keywordSearch=${encodeURIComponent(keyword)}&resultsPerPage=${limit}&startIndex=${startIndex}`;
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'AEGIS-Dashboard/1.0' },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `NVD API returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch CVE data: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    );
  }
}
