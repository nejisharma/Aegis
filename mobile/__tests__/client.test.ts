import { api, ApiError, postJson, API_BASE } from '../src/api/client';

type FetchMock = jest.Mock<Promise<Response>, [RequestInfo | URL, RequestInit?]>;

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe('api()', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns parsed JSON on 200 and prefixes API_BASE', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [1, 2] }));
    const result = await api<{ items: number[] }>('/api/news');
    expect(result).toEqual({ items: [1, 2] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE}/api/news`);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('throws ApiError with status 404 and message from the error body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Not found here' }, 404));
    await expect(api('/api/missing')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'Not found here',
    });
    await expect(api('/api/missing')).rejects.toBeInstanceOf(ApiError);
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('bad json');
      },
    } as unknown as Response);
    await expect(api('/api/x')).rejects.toMatchObject({ status: 502, message: 'Request failed (502)' });
  });

  it('throws ApiError(0, "Request timed out") when fetch rejects with AbortError', async () => {
    const abortErr = new Error('Aborted');
    abortErr.name = 'AbortError';
    fetchMock.mockRejectedValue(abortErr);
    await expect(api('/api/slow')).rejects.toMatchObject({ status: 0, message: 'Request timed out' });
  });

  it('throws ApiError(0, "Network error") on other fetch failures', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    await expect(api('/api/down')).rejects.toMatchObject({ status: 0, message: 'Network error' });
  });

  it('postJson sends a JSON body with Content-Type header', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await postJson('/api/push/register', { token: 'abc' });
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify({ token: 'abc' }));
    expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });
});
