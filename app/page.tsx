import { Suspense } from 'react';
import Dashboard from '@/components/Dashboard';
import DashboardSkeleton from '@/components/DashboardSkeleton';
import ThemeToggle from '@/components/ThemeToggle';
import { SendLayerLogo } from '@/components/icons';
import { fetchAllStats } from '@/lib/registries';

/**
 * Rendered per request rather than prerendered at build time.
 *
 * Two reasons, both about where the work happens. First, GITHUB_TOKEN is
 * scoped to the runtime function and deliberately withheld from the build
 * environment (Turbopack snapshots build env vars into its persistent cache,
 * which writes secrets to disk), so only a request-time render can read it.
 * Second, a build-time prerender bakes in whatever the registries happened to
 * answer during the build — including a rate-limited failure — and pins it for
 * the whole revalidate window.
 *
 * The upstream fetches are still cached for an hour, so this stays cheap: a
 * render is five cache reads, not five API calls.
 */
export const dynamic = 'force-dynamic';

/** Streamed separately so the header paints before the registries answer. */
async function Stats() {
  const payload = await fetchAllStats(30);
  return <Dashboard initial={payload} />;
}

export default function Home() {
  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          {/* Logo and toggle share a row at every width, so the toggle never
              orphans onto a line of its own on narrow screens. */}
          <div className="flex items-center justify-between gap-4">
            <SendLayerLogo className="h-[27px] w-[130px] text-ink" />
            <ThemeToggle />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">
            SDK download statistics
          </h1>
          <p className="mt-0.5 max-w-2xl text-sm text-ink-secondary">
            Adoption across the five official SendLayer SDKs, pulled live from each package
            registry.
          </p>
        </header>

        <Suspense fallback={<DashboardSkeleton />}>
          <Stats />
        </Suspense>

        <footer className="mt-10 border-t border-hairline pt-5 text-[11px] leading-relaxed text-ink-muted">
          <p>
            Counts come straight from PyPI, npm, Packagist and RubyGems and are cached for
            one hour. Registries report on their own schedules, so the most recent complete
            day differs slightly between SDKs.
          </p>
        </footer>
      </div>
    </div>
  );
}
