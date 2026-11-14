/**
 * Shared loading state for dashboard routes: a neutral skeleton in
 * the app tokens, shown while a dashboard loader is pending. One
 * component, used as pendingComponent by the dashboard layout and
 * every dashboard child route with a loader, so navigating the
 * dashboard never flashes a blank page.
 */
export function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="animate-pulse space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-56 max-w-full rounded-lg bg-muted" />
          <div className="h-4 w-72 max-w-full rounded-lg bg-muted" />
        </div>
        <div className="rounded-xl border bg-card p-5 sm:p-6">
          <div className="h-6 w-40 rounded-lg bg-muted" />
          <div className="mt-4 h-4 w-full max-w-md rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-64 max-w-full rounded-lg bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <div className="h-6 w-6 rounded-lg bg-muted" />
              <div className="mt-3 h-4 w-24 rounded-lg bg-muted" />
              <div className="mt-2 h-3 w-16 rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
