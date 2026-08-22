import { NextRequest, NextResponse } from 'next/server';
import { API_URLS } from '@/lib/constants';

const CVE_RE = /^CVE-\d{4}-\d{4,}$/i;
const MAX_IDS = 100;

interface EpssRow {
  cve: string;
  epss: string;
  percentile: string;
  date: string;
}

export interface EpssScore {
  epss: number;
  percentile: number;
  date: string;
}

/** GET /api/epss?cve=CVE-2021-44228,CVE-2024-3400 → { scores: { [id]: { epss, percentile, date } } } */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('cve') ?? '';
  const ids = Array.from(new Set(raw.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)));

  if (!ids.length) {
    return NextResponse.json({ error: 'cve query parameter is required' }, { status: 400 });
  }
  if (ids.length > MAX_IDS) {
    return NextResponse.json({ error: `At most ${MAX_IDS} CVE ids per request` }, { status: 400 });
  }
  const bad = ids.find((id) => !CVE_RE.test(id));
  if (bad) {
    return NextResponse.json({ error: `Invalid CVE id: ${bad}` }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${API_URLS.EPSS}?cve=${ids.join(',')}`, {
      headers: { 'User-Agent': 'AEGIS-Dashboard/1.0', Accept: 'application/json' },
      next: { revalidate: 21600 },
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: `EPSS API returned ${upstream.status}` }, { status: 502 });
    }
    const body = (await upstream.json()) as { data?: EpssRow[] };
    const scores: Record<string, EpssScore> = {};
    for (const row of body.data ?? []) {
      const epss = Number(row.epss);
      const percentile = Number(row.percentile);
      if (!row.cve || Number.isNaN(epss) || Number.isNaN(percentile)) continue;
      scores[row.cve.toUpperCase()] = { epss, percentile, date: row.date };
    }
    return NextResponse.json(
      { scores },
      { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=43200' } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch EPSS data: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    );
  }
}
