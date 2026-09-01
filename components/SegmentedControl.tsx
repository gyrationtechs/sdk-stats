'use client';

interface Option<T extends string | number> {
  value: T;
  label: string;
  disabled?: boolean;
  /** Shown on hover when the option is unavailable. */
  disabledReason?: string;
}

interface SegmentedControlProps<T extends string | number> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * A radiogroup rather than buttons, so arrow keys move between options and the
 * selected state is announced.
 */
export default function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-medium text-ink-secondary">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="inline-flex rounded-lg border border-hairline bg-surface p-0.5"
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={option.disabled}
              title={option.disabled ? option.disabledReason : undefined}
              onClick={() => onChange(option.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                selected
                  ? 'bg-accent text-accent-ink'
                  : option.disabled
                    ? 'cursor-not-allowed text-ink-muted opacity-50'
                    : 'text-ink-secondary hover:bg-surface-hover'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
