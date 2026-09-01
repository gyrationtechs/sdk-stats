import { NextResponse } from 'next/server';
import { fetchAllStats, normalizeDays } from '@/lib/registries';

export const revalidate = 3600;

export async function GET(request: Request) {
  const days = normalizeDays(new URL(request.url).searchParams.get('days'));
  const payload = await fetchAllStats(days);

  return NextResponse.json(payload, {
    headers: {
      // Serve stale while revalidating so a cold registry never blocks a reader.
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
