import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  rows?: number;
}

export function LoadingSkeleton({ rows = 5 }: LoadingSkeletonProps) {
  const safeRows = Math.max(1, Math.floor(rows));

  return (
    <div className="space-y-6" role="status" aria-label="Loading content">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="h-11 w-11 rounded-full" />
            </div>
            <Skeleton className="mt-5 h-3 w-40" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-4 gap-4 border-b bg-muted/30 p-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-20" />
          ))}
        </div>
        {Array.from({ length: safeRows }, (_, row) => (
          <div
            key={row}
            className="grid grid-cols-4 gap-4 border-b p-4 last:border-b-0"
          >
            {Array.from({ length: 4 }, (_, column) => (
              <Skeleton
                key={column}
                className={column === 0 ? "h-4 w-32" : "h-4 w-24"}
              />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
