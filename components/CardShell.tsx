import { LanguageIcon } from './icons';
import type { SDKId } from '@/lib/types';

interface CardShellProps {
  id: SDKId;
  name: string;
  registry: string;
  packageName: string;
  registryUrl: string;
  repoUrl: string;
  latestVersion: string | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function CardShell({
  id,
  name,
  registry,
  packageName,
  registryUrl,
  repoUrl,
  latestVersion,
  children,
  footer,
}: CardShellProps) {
  return (
    <section className="flex flex-col rounded-xl border border-hairline bg-surface shadow-[var(--shadow-card)]">
      <header className="flex items-start justify-between gap-3 border-b border-hairline p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-raised">
            <LanguageIcon id={id} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink">{name}</h3>
            <p className="truncate text-xs text-ink-muted" title={packageName}>
              {registry} · {packageName}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {latestVersion && (
            <span className="tabular rounded-md bg-surface-raised px-1.5 py-0.5 text-[11px] font-medium text-ink-secondary">
              {latestVersion}
            </span>
          )}
          <a
            href={registryUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`${name} on ${registry}`}
            title={`${name} on ${registry}`}
            className="text-ink-muted transition-colors hover:text-accent"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 4h6v6M20 4l-8.5 8.5M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
            </svg>
          </a>
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`${name} SDK source on GitHub`}
            title={`${name} SDK source on GitHub`}
            className="text-ink-muted transition-colors hover:text-accent"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.7v-2.3c-3.3.7-4-1.6-4-1.6-.6-1.4-1.3-1.8-1.3-1.8-1.1-.7 0-.7 0-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6a4.7 4.7 0 0 1 1.2-3.2 4.3 4.3 0 0 1 .2-3.2s1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.5 18.3 4.8 18.3 4.8a4.3 4.3 0 0 1 .2 3.2 4.7 4.7 0 0 1 1.2 3.2c0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .4.2.8.8.7A12 12 0 0 0 12 .3Z" />
            </svg>
          </a>
        </div>
      </header>

      <div className="flex flex-1 flex-col p-4">{children}</div>

      {footer && (
        <footer className="border-t border-hairline px-4 py-3">{footer}</footer>
      )}
    </section>
  );
}
