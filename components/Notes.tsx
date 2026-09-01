interface NotesProps {
  source: string;
  notes: string[];
}

/**
 * Provenance is part of the number. Every derived or proxied figure says where
 * it came from, so nobody mistakes a differenced snapshot for a metered count.
 */
export default function Notes({ source, notes }: NotesProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] text-ink-muted">
        <span className="font-medium text-ink-secondary">Source:</span> {source}
      </p>
      {notes.map((note) => (
        <p key={note} className="flex gap-1.5 text-[11px] leading-relaxed text-ink-muted">
          <span aria-hidden className="mt-px shrink-0">
            ⓘ
          </span>
          <span>{note}</span>
        </p>
      ))}
    </div>
  );
}
