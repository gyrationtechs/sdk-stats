import { NextResponse } from 'next/server';
import { fetchAllStats, normalizeDays } from '@/lib/registries';

/**
 * Assembled per request rather than cached as a whole. The individual upstream
 * fetches are still cached for an hour, so this is cheap — but it means a
 * registry that was rate-limited earlier gets retried instead of having its
 * failure frozen into a cached response.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const days = normalizeDays(new URL(request.url).searchParams.get('days'));
  const payload = await fetchAllStats(days);
  const degraded = payload.sdks.some((sdk) => sdk.error !== null);

  return NextResponse.json(payload, {
    headers: {
      // Never cache a partial answer: it would outlive the rate limit that
      // caused it. Complete responses are served stale-while-revalidating.
      'Cache-Control': degraded
        ? 'no-store'
        : 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
