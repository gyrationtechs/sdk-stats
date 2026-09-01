import { NextResponse } from 'next/server';
import { fetchAllStats, normalizeDays, SDK_ORDER } from '@/lib/registries';
import type { SDKId } from '@/lib/types';

export const revalidate = 3600;

/** Single-SDK access for anyone scripting against the dashboard's own data. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ sdk: string }> },
) {
  const { sdk } = await params;

  if (!SDK_ORDER.includes(sdk as SDKId)) {
    return NextResponse.json(
      { error: `Unknown SDK '${sdk}'. Expected one of: ${SDK_ORDER.join(', ')}.` },
      { status: 404 },
    );
  }

  const days = normalizeDays(new URL(request.url).searchParams.get('days'));
  const payload = await fetchAllStats(days);
  const match = payload.sdks.find((entry) => entry.id === sdk);

  return NextResponse.json(match, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
