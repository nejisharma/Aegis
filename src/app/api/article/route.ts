import { NextRequest, NextResponse } from 'next/server';
import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';
import { RSS_FEEDS } from '@/lib/constants';

// SSRF guard: only the four feed publishers (and their subdomains). feedburner fronts
// The Hacker News, whose article links point at thehackernews.com.
const ALLOWED_HOSTS = [
  ...Object.values(RSS_FEEDS).map((f) => new URL(f.url).hostname.replace(/^www\./, '')),
  'thehackernews.com',
].filter((h) => !h.includes('feedburner'));

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const TIMEOUT_MS = 10_000;

function isAllowed(url: URL): boolean {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  return ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

function sanitize(html: string): string {
  return html
    .replace(/<(script|iframe|style)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|iframe|style)\b[^>]*\/?>/gi, '');
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url') ?? '';
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }
  if (!isAllowed(target)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 400 });
  }

  try {
    const res = await fetch(target.toString(), {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: 'follow',
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream responded ${res.status}` }, { status: 502 });
    }
    const finalUrl = new URL(res.url || target.toString());
    if (!isAllowed(finalUrl)) {
      return NextResponse.json({ error: 'Redirected to a host that is not allowed' }, { status: 400 });
    }

    const { document } = parseHTML(await res.text());
    // Readability resolves relative src/href against the document base.
    const base = document.createElement('base');
    base.setAttribute('href', finalUrl.toString());
    document.head?.appendChild(base);

    const article = new Readability(document as unknown as Document).parse();
    const textContent = article?.textContent?.trim() ?? '';
    if (!article || !textContent) {
      return NextResponse.json({ error: 'Could not extract article content' }, { status: 502 });
    }

    return NextResponse.json(
      {
        title: article.title ?? '',
        byline: article.byline ?? null,
        siteName: article.siteName ?? null,
        excerpt: article.excerpt ?? '',
        textContent,
        contentHtml: sanitize(article.content ?? ''),
        length: article.length ?? textContent.length,
        url: finalUrl.toString(),
        fetchedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=86400' } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch article: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 },
    );
  }
}
