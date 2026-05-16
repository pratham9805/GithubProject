/**
 * LoadingSkeleton — Shimmer placeholder for loading states.
 * Use wherever content is being fetched/generated.
 */

export function Skeleton({ className = "", style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ height: "1rem", ...style }}
    />
  );
}

/** Pre-built skeleton layout for a chat message */
export function MessageSkeleton() {
  return (
    <div className="flex gap-3 mb-6">
      <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <Skeleton className="w-3/4" style={{ height: "0.875rem" }} />
        <Skeleton className="w-full" style={{ height: "0.875rem" }} />
        <Skeleton className="w-1/2" style={{ height: "0.875rem" }} />
      </div>
    </div>
  );
}

/** Pre-built skeleton for repo cards in sidebar */
export function RepoCardSkeleton() {
  return (
    <div className="p-3 rounded-xl space-y-2">
      <Skeleton style={{ height: "0.875rem", width: "70%" }} />
      <Skeleton style={{ height: "0.75rem", width: "45%" }} />
    </div>
  );
}

/** Pre-built skeleton for analytics stat cards */
export function StatCardSkeleton() {
  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <Skeleton style={{ height: "0.75rem", width: "50%" }} />
      <Skeleton style={{ height: "1.75rem", width: "60%" }} />
    </div>
  );
}

export default Skeleton;
