import { NextRequest, NextResponse } from 'next/server';
import { API_URLS } from '@/lib/constants';
import { nvdHeaders } from '@/lib/nvd';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const keyword = searchParams.get('keyword');
  const limit = Math.min(Number(searchParams.get('limit') || 20), 100);
  const startIndex = Number(searchParams.get('startIndex') || 0);

  // Optional recency window (last N days, max 120 per NVD) and CVSS v3 severity filter.
  const days = Math.min(Number(searchParams.get('days') || 0), 120);
  const severity = (searchParams.get('severity') || '').toUpperCase();
  const hasKeyword = !!keyword && keyword.trim() !== '';

  if (!hasKeyword && !days) {
    return NextResponse.json(
      { error: 'keyword or days query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({ resultsPerPage: String(limit), startIndex: String(startIndex) });
    if (hasKeyword) params.set('keywordSearch', keyword!.trim());
    if (days > 0) {
      const end = new Date();
      const start = new Date(end.getTime() - days * 86_400_000);
      params.set('pubStartDate', start.toISOString());
      params.set('pubEndDate', end.toISOString());
    }
    if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(severity)) params.set('cvssV3Severity', severity);
    const url = `${API_URLS.NVD_CVE}?${params.toString()}`;
    const upstream = await fetch(url, {
      headers: nvdHeaders(),
    });

    if (upstream.status === 404) {
      // NVD answers 404 for queries it cannot match (e.g. very short keywords); treat as "no results".
      return NextResponse.json(
        { resultsPerPage: limit, startIndex, totalResults: 0, vulnerabilities: [] },
        { headers: { 'Cache-Control': 'public, s-maxage=300' } }
      );
    }
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `NVD API returned ${upstream.status}` },
        { status: 502 }
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
