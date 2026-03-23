import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { RSS_FEEDS } from '@/lib/constants';
import type { NewsItem } from '@/types/news';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

function generateId(title: string, source: string): string {
  const hash = `${source}-${title}`.split('').reduce((acc, c) => {
    const h = ((acc << 5) - acc + c.charCodeAt(0)) | 0;
    return h;
  }, 0);
  return `news-${Math.abs(hash).toString(36)}`;
}

interface FeedConfig {
  url: string;
  name: string;
  icon: string;
}

async function fetchFeed(feed: FeedConfig): Promise<NewsItem[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'AEGIS-Dashboard/1.0' },
    });

    if (!res.ok) return [];

    const xml = await res.text();
    const parsed = parser.parse(xml);

    let items: unknown[] = [];

    // RSS 2.0 format
    if (parsed.rss?.channel?.item) {
      items = Array.isArray(parsed.rss.channel.item)
        ? parsed.rss.channel.item
        : [parsed.rss.channel.item];
    }
    // Atom format
    else if (parsed.feed?.entry) {
      items = Array.isArray(parsed.feed.entry)
        ? parsed.feed.entry
        : [parsed.feed.entry];
    }

    return items.map((item: unknown) => {
      const entry = item as Record<string, unknown>;
      const title = (entry.title as string) || 'Untitled';
      const link = typeof entry.link === 'string'
        ? entry.link
        : (entry.link as Record<string, unknown>)?.['@_href'] as string || '';
      const description = stripHtml(
        (entry.description as string) || (entry.summary as string) || (entry.content as string) || ''
      );
      const pubDate = (entry.pubDate as string) || (entry.published as string) || (entry.updated as string) || new Date().toISOString();

      return {
        id: generateId(title, feed.name),
        title: typeof title === 'string' ? title : String(title),
        link,
        description: description.slice(0, 500),
        pubDate,
        source: feed.name,
        sourceIcon: feed.icon,
      };
    });
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sourceFilter = searchParams.get('source');

  try {
    const feeds = Object.values(RSS_FEEDS) as FeedConfig[];
    const results = await Promise.allSettled(feeds.map(fetchFeed));

    let allItems: NewsItem[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allItems = allItems.concat(result.value);
      }
    }

    // Sort by pubDate descending
    allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // Filter by source if requested
    if (sourceFilter) {
      allItems = allItems.filter(
        (item) => item.source.toLowerCase() === sourceFilter.toLowerCase()
      );
    }

    return NextResponse.json({ items: allItems, count: allItems.length }, {
      headers: {
        'Cache-Control': 'public, s-maxage=900',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch news feeds: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 }
    );
  }
}
