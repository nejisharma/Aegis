export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://aegis.neeraj.ca';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type ApiInit = RequestInit & { timeoutMs?: number };

const DEFAULT_TIMEOUT_MS = 10_000;

function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name?: string }).name === 'AbortError'
  );
}

export async function api<T>(path: string, init: ApiInit = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

  const mergedHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  };
  if (rest.body != null && !('Content-Type' in mergedHeaders)) {
    mergedHeaders['Content-Type'] = 'application/json';
  }

  let res: Response;
  try {
    res = await fetch(url, { ...rest, headers: mergedHeaders, signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    if (isAbortError(err)) throw new ApiError(0, 'Request timed out');
    throw new ApiError(0, 'Network error');
  }
  clearTimeout(timer);

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: unknown };
      if (body && typeof body.error === 'string' && body.error) message = body.error;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError(res.status, 'Invalid JSON response');
  }
}

export const postJson = <T>(path: string, body: unknown, init: ApiInit = {}) =>
  api<T>(path, { ...init, method: 'POST', body: JSON.stringify(body) });

export const patchJson = <T>(path: string, body: unknown, init: ApiInit = {}) =>
  api<T>(path, { ...init, method: 'PATCH', body: JSON.stringify(body) });

export const deleteJson = <T>(path: string, body: unknown, init: ApiInit = {}) =>
  api<T>(path, { ...init, method: 'DELETE', body: JSON.stringify(body) });
