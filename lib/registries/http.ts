/** Cache upstream registry responses for an hour; none of them update faster. */
export const REVALIDATE_SECONDS = 3600;

const USER_AGENT = 'sendlayer-sdk-stats (+https://github.com/sendlayer)';
const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;

export class UpstreamError extends Error {
  constructor(
    readonly url: string,
    readonly status: number,
  ) {
    super(`${status} from ${url}`);
    this.name = 'UpstreamError';
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * pypistats in particular rate-limits bursts, and all five registries are
 * hit concurrently on a cold cache. Retry the transient statuses with backoff
 * so one throttled response doesn't blank a card.
 */
async function request(url: string, init: RequestInit): Promise<Response> {
  let lastStatus = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await fetch(url, {
      ...init,
      headers: { 'User-Agent': USER_AGENT, ...init.headers },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (response.ok) return response;
    lastStatus = response.status;

    if (!RETRY_STATUSES.has(response.status) || attempt === MAX_ATTEMPTS) break;

    const retryAfter = Number(response.headers.get('retry-after'));
    // Jitter keeps five concurrent fetchers from retrying in lockstep and
    // re-tripping the same rate limit.
    const backoff = attempt * 750 + Math.random() * 400;
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoff);
  }

  throw new UpstreamError(url, lastStatus);
}

export async function getJSON<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await request(url, {
    ...init,
    headers: { Accept: 'application/json', ...init.headers },
  });
  return (await response.json()) as T;
}

export async function getText(url: string): Promise<string> {
  const response = await request(url, {});
  return response.text();
}

export function describeError(error: unknown): string {
  if (error instanceof UpstreamError) {
    return error.status === 429
      ? 'Registry rate-limited the request. Try again shortly.'
      : `Upstream returned ${error.status}.`;
  }
  return error instanceof Error ? error.message : 'Unknown error.';
}
