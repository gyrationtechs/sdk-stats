import CardShell from './CardShell';
import Notes from './Notes';
import Sparkline from './Sparkline';
import { full } from '@/lib/format';
import type { SDKStats } from '@/lib/types';

/**
 * Go is structurally different from the other four: the module proxy publishes
 * no download counters, so there is no series to plot and nothing to compare
 * against the download SDKs. Rather than fake a number, the card reports repo
 * engagement and says plainly that these are not installs.
 */
export default function GoCard({ sdk }: { sdk: SDKStats }) {
  const repo = sdk.repo;

  return (
    <CardShell
      id={sdk.id}
      name={sdk.name}
      registry={sdk.registry}
      packageName={sdk.packageName}
      registryUrl={sdk.registryUrl}
      repoUrl={sdk.repoUrl}
      latestVersion={sdk.latestVersion}
      footer={<Notes source={sdk.source} notes={sdk.notes} />}
    >
      {sdk.error ? (
        <p className="flex-1 py-6 text-center text-xs text-down">{sdk.error}</p>
      ) : (
        <>
          <p className="mb-4 rounded-lg bg-surface-raised px-3 py-2 text-[11px] leading-relaxed text-ink-secondary">
            No download statistics exist for Go modules — the proxy serves version
            lists only. These are repository signals.
          </p>

          {repo?.trafficAvailable ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-ink-secondary">Clones · 14 days</span>
                  <span className="text-2xl leading-none font-semibold text-ink">
                    {full(repo.clones ?? 0)}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {full(repo.uniqueCloners ?? 0)} unique cloners
                  </span>
                </div>
                {repo.cloneSeries.length > 1 && (
                  <Sparkline
                    points={repo.cloneSeries}
                    color="var(--series-neutral)"
                    className="mt-1"
                  />
                )}
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-hairline">
                <Cell label="Views · 14d" value={repo.views} />
                <Cell label="Unique visitors" value={repo.uniqueViewers} />
                <Cell label="Releases" value={repo.releaseCount} />
              </dl>
            </>
          ) : (
            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-hairline">
              <Cell label="Stars" value={repo?.stars ?? null} />
              <Cell label="Forks" value={repo?.forks ?? null} />
              <Cell label="Releases" value={repo?.releaseCount ?? null} />
            </dl>
          )}

          {repo?.trafficAvailable && (
            <p className="mt-3 flex flex-wrap gap-x-4 text-[11px] text-ink-muted">
              <span>
                <span aria-hidden>★</span> {full(repo.stars)} stars
              </span>
              <span>
                <span aria-hidden>⑂</span> {full(repo.forks)} forks
              </span>
            </p>
          )}

          {sdk.versions.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-medium text-ink-secondary">
                Published versions
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {sdk.versions.map((version) => (
                  <li
                    key={version.number}
                    className="tabular rounded-md bg-surface-raised px-1.5 py-0.5 text-[11px] text-ink-secondary"
                  >
                    {version.number}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </CardShell>
  );
}

function Cell({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex flex-col gap-1 bg-surface p-2.5">
      <dt className="text-[11px] text-ink-muted">{label}</dt>
      <dd className="tabular text-sm font-semibold text-ink">
        {value === null ? '—' : full(value)}
      </dd>
    </div>
  );
}
