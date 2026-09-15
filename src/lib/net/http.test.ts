import { describe, expect, it, vi, afterEach } from 'vitest';
import { fetchWithRetry, retryAfterMs } from './http';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchWithRetry', () => {
  it('reads Retry-After seconds', () => {
    const response = new Response(null, { status: 429, headers: { 'Retry-After': '2' } });
    expect(retryAfterMs(response, 0)).toBe(2000);
  });

  it('retries Steam 429 then succeeds', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 429, headers: { 'Retry-After': '0' } }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const response = await fetchWithRetry('https://steamcommunity.com/inventory/x/440/2', {}, { retries: 2 });
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
