export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function retryAfterMs(response: Response, attempt: number): number {
  const header = response.headers.get('Retry-After');
  if (header) {
    const seconds = Number.parseInt(header, 10);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.min(30_000, seconds * 1000);
  }
  return Math.min(16_000, 1000 * 2 ** attempt);
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  options: { retries?: number; retryStatuses?: number[] } = {},
): Promise<Response> {
  const retries = options.retries ?? 4;
  const retryStatuses = options.retryStatuses ?? [429, 502, 503];
  let last = await fetch(url, init);
  for (let attempt = 0; attempt < retries && retryStatuses.includes(last.status); attempt += 1) {
    await sleep(retryAfterMs(last, attempt));
    last = await fetch(url, init);
  }
  return last;
}

export async function mapPool<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const out: R[] = Array.from({ length: items.length });
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await mapper(items[index]!);
    }
  });
  await Promise.all(workers);
  return out;
}
