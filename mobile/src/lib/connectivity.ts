import { ApiError } from '../api/client';

export type FailureKind = 'network' | 'maintenance' | 'upstream' | 'unknown';

/** Tiny, cache-free endpoints that answer 204 when the internet is reachable. */
const PROBES = ['https://www.gstatic.com/generate_204', 'https://connectivitycheck.gstatic.com/generate_204'];

async function internetReachable(timeoutMs = 4000): Promise<boolean> {
  for (const url of PROBES) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method: 'GET', cache: 'no-store', signal: ctrl.signal });
      if (res.status === 204 || res.ok) return true;
    } catch {
      // try the next probe
    } finally {
      clearTimeout(t);
    }
  }
  return false;
}

/**
 * Decide what to tell the user:
 * - status 0 (timeout / fetch failure): if a public probe answers → our server is down → `maintenance`; else `network`.
 * - 502 / 504 are what our proxy routes return when the *upstream* data source fails → `upstream`.
 * - other 5xx from our server: `maintenance`.
 * - 4xx (bad request, not found, rate limited): `unknown` — it is about this request, not the service.
 */
export async function classifyFailure(error: unknown): Promise<FailureKind> {
  if (!(error instanceof ApiError)) return 'unknown';
  if (error.status === 0) return (await internetReachable()) ? 'maintenance' : 'network';
  if (error.status === 502 || error.status === 504) return 'upstream';
  if (error.status >= 500) return 'maintenance';
  return 'unknown';
}
