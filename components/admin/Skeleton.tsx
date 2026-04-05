interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

function SkeletonBase({ className = "", style }: SkeletonProps) {
  return <div className={`animate-pulse rounded bg-[var(--border)] ${className}`} style={style} />;
}

export function SkeletonText({ className = "" }: SkeletonProps) {
  return <SkeletonBase className={`h-4 w-3/4 ${className}`} />;
}

export function SkeletonCard({ className = "" }: SkeletonProps) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] ${className}`}>
      <div className="flex items-start justify-between">
        <SkeletonBase className="h-10 w-10 rounded-lg" />
        <SkeletonBase className="h-5 w-12 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <SkeletonBase className="h-3 w-20" />
        <SkeletonBase className="h-7 w-16" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = "" }: SkeletonProps & { rows?: number; cols?: number }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] ${className}`}>
      <div className="border-b border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3.5 flex gap-8">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBase key={`header-${i}`} className="h-3 w-24" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          className="flex gap-8 border-b border-[var(--surface-hover)] px-4 py-3.5 last:border-0"
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <SkeletonBase
              key={`cell-${rowIdx}-${colIdx}`}
              className={`h-4 ${colIdx === 0 ? "w-32" : "w-20"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className = "" }: SkeletonProps) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] ${className}`}>
      <SkeletonBase className="mb-6 h-5 w-48" />
      <div className="flex items-end gap-1 h-[200px]">
        {Array.from({ length: 20 }).map((_, i) => (
          <SkeletonBase
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${20 + Math.random() * 80}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-8 animate-[fadeInUp_0.3s_ease-out]">
      <SkeletonBase className="h-8 w-40" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonChart className="lg:col-span-2" />
        <SkeletonChart />
      </div>
      <SkeletonTable rows={5} cols={4} />
    </div>
  );
}
