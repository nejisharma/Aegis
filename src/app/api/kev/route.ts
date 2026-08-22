import { NextRequest, NextResponse } from 'next/server';
import { API_URLS } from '@/lib/constants';

export interface KevItem {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse: 'Known' | 'Unknown';
  notes: string;
}

interface KevFeed {
  catalogVersion: string;
  dateReleased: string;
  count: number;
  vulnerabilities: Array<Partial<KevItem> & { cveID: string }>;
}

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 2000;

function toItem(v: KevFeed['vulnerabilities'][number]): KevItem {
  return {
    cveID: v.cveID,
    vendorProject: v.vendorProject ?? '',
    product: v.product ?? '',
    vulnerabilityName: v.vulnerabilityName ?? '',
    dateAdded: v.dateAdded ?? '',
    shortDescription: v.shortDescription ?? '',
    requiredAction: v.requiredAction ?? '',
    dueDate: v.dueDate ?? '',
    knownRansomwareCampaignUse: v.knownRansomwareCampaignUse === 'Known' ? 'Known' : 'Unknown',
    notes: v.notes ?? '',
  };
}

/**
 * GET /api/kev?limit=200 → { count, catalogVersion, dateReleased, items } (newest first)
 * GET /api/kev?ids=1    → { ids: string[] } (every CVE id in the catalog)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const idsOnly = searchParams.get('ids') === '1';
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || DEFAULT_LIMIT) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const cacheHeaders = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' };

  try {
    const upstream = await fetch(API_URLS.KEV, {
      headers: { 'User-Agent': 'AEGIS-Dashboard/1.0', Accept: 'application/json' },
      next: { revalidate: 3600 },
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: `CISA KEV feed returned ${upstream.status}` }, { status: 502 });
    }
    const feed = (await upstream.json()) as KevFeed;
    const vulns = Array.isArray(feed.vulnerabilities) ? feed.vulnerabilities : [];

    if (idsOnly) {
      return NextResponse.json({ ids: vulns.map((v) => v.cveID) }, { headers: cacheHeaders });
    }

    const items = vulns
      .map(toItem)
      .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
      .slice(0, limit);
    return NextResponse.json(
      { count: feed.count ?? vulns.length, catalogVersion: feed.catalogVersion, dateReleased: feed.dateReleased, items },
      { headers: cacheHeaders }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch CISA KEV data: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    );
  }
}
