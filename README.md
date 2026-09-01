# SendLayer SDK Statistics

A dashboard tracking adoption of the five official SendLayer SDKs, pulled live from each
package registry. Built with Next.js 16, TypeScript and Tailwind CSS v4.

## What each registry actually publishes

Download data is not uniform across ecosystems, and the dashboard reports each source for
what it is rather than flattening them into one number.

| SDK | Package | Source | Daily history |
| --- | --- | --- | --- |
| Python | `sendlayer` on PyPI | pypistats.org, mirrors excluded | ~180 days |
| Node.js | `sendlayer` on npm | api.npmjs.org download range | up to 18 months |
| PHP | `sendlayer/sendlayer-php` on Packagist | packagist.org daily install counts | ~18 months |
| Ruby | `sendlayer` on RubyGems | RubyGems total + BestGems snapshots | ~300 days |
| Go | `github.com/sendlayer/sendlayer-go` | GitHub traffic + module proxy | none — see below |

### Ruby: daily counts are derived, not metered

RubyGems retired their per-day download endpoint — `/api/v1/versions/{gem}/downloads.json`
now answers `410 This endpoint is not supported anymore` — so their API can only report a
lifetime total. [BestGems](https://bestgems.org) snapshots that total once a day and keeps
roughly 300 days of history, which lets per-day and per-week counts be recovered by
differencing consecutive snapshots:

```
downloads in a week = total_downloads[end] − total_downloads[start − 1]
```

`deriveDailyFromTotals` in `lib/series.ts` does this, spreading any snapshot gap evenly
across the days it spans and clamping decreases (yanked versions, upstream corrections) to
zero. The headline all-time figure still comes from RubyGems directly, so it stays
authoritative even though the trend is derived. Snapshots can lag the live total by a day.

### Go: no download statistics exist

This is a property of the Go ecosystem, not a gap in this dashboard. The module proxy
serves `@v/list` — version names only — and publishes no counters; modules are fetched
through the proxy rather than as release assets, so GitHub's asset counters read zero; and
deps.dev reports no dependents for this module.

The Go card therefore reports **repository signals** (clones, unique cloners, views,
stars, forks, releases), labelled as engagement proxies rather than installs. GitHub's
traffic endpoints require push access on the repository, so they need a `GITHUB_TOKEN`;
without one the card degrades to public counts and the version list instead of failing.

## Comparability

Registries publish on their own schedules — Packagist typically trails npm and PyPI by a
day. Every window is therefore anchored on a **shared** last day: the most recent date
that *all* reporting registries have covered. Without that, per-SDK windows would span
different date ranges and could not legitimately be summed into a total or compared on one
chart. The partial current day is dropped for the same reason (npm reports it as `0`).

## When a registry doesn't answer

pypistats rate-limits bursts, and all five registries are queried concurrently on a
cold cache, so partial failures are normal — especially from shared CI or serverless
egress IPs. The dashboard never renders a missing result as `0`:

- the affected tile shows `—` and "Registry unavailable"
- the total states how many registries actually reported, and names the ones that didn't
- the chart legend marks the series *unavailable* rather than omitting it silently
- `/api/stats` returns `Cache-Control: no-store` for any partial response, so a failure
  can't outlive the rate limit that caused it, and the client re-requests once on mount
  to recover a prerender captured during one

## Setup

```bash
npm install
cp .env.example .env.local   # then add a token, optional
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `GITHUB_TOKEN` | No | Enables the Go card's traffic metrics. Needs push access on `sendlayer/sendlayer-go` (fine-grained: **Administration: Read**). Without it, the card shows stars, forks and versions only. |

**Scope this variable to the runtime only — not to builds.** Turbopack snapshots
build-environment variables into its persistent cache
(`.next/cache/turbopack/*.sst`) so it can invalidate on change, which writes the
token's value to disk and trips Netlify's secrets scanning. It happens whether or
not the application reads the variable, so it cannot be avoided in application
code. On Netlify: Site configuration → Environment variables → the variable's
**Scopes** → untick *Builds*, keep *Functions*.

The page renders per request rather than at build time, so a runtime-only token is
read normally. If a build has already cached the value, the next build restores that
cache and fails again — use **Clear cache and deploy site** once.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

## API

The dashboard's own data is available as JSON.

```
GET /api/stats?days=30            # all SDKs
GET /api/stats/python?days=90     # one SDK
```

`days` accepts `7`, `30`, `90` or `365` and defaults to `30`. Responses are cached for an
hour and served stale-while-revalidating, so a slow registry never blocks a reader.

Each SDK carries `metric: 'downloads' | 'repo-signals'`, a `source` string, and a `notes`
array describing any caveat that applies to its figures — consumers should surface those
rather than treating every number as a metered install count.

## Project structure

```
app/
  api/stats/route.ts        aggregate endpoint
  api/stats/[sdk]/route.ts  single-SDK endpoint
  globals.css               design tokens, light + dark
  layout.tsx                no-flash theme stamp
  page.tsx                  header + streamed dashboard
components/
  Dashboard.tsx             filter state, KPI row, layout
  TrendChart.tsx            multi-series chart, crosshair tooltip
  DataTable.tsx             accessible table twin of the chart
  SDKCard.tsx               per-SDK detail
  GoCard.tsx                repo signals for Go
  icons/                    SendLayer wordmark + language marks
lib/
  registries/               one fetcher per registry
  series.ts                 windows, weekly buckets, total differencing
  presentation.ts           series colour slots
  types.ts                  shared shapes
```

## Design notes

Series colours are a fixed, validated categorical palette: assigned per SDK and never
re-derived from rank, so filtering a series out does not repaint the others. Three of the
light-mode hues fall below 3:1 contrast against the surface, so the chart ships a table
view as its readable equivalent and every series carries its total in the legend. Dark
mode is a separate set of steps chosen for the dark surface, not an inverted light
palette, and both are declared so an explicit theme choice beats the OS setting.
