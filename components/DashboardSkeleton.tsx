/** Shown only on the very first load; refetches hold the previous render. */
export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading SDK statistics…</span>
      <div className="skeleton h-[50px] rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-[124px] rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-[380px] rounded-xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-[420px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
